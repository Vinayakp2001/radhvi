"""
Celery Tasks for Shipping Operations
Async background tasks for Shiprocket integration
"""
import logging
from typing import List, Optional
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from celery import shared_task

from gift.models import Order
from gift.shipping.models import Shipment, ShippingRate
from gift.shipping.services import ShippingService
from gift.shipping.shiprocket_client import ShiprocketError

logger = logging.getLogger('shiprocket')


# ==================== ORDER SYNC TASKS ====================

@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def sync_order_to_shiprocket_task(self, order_id: int) -> dict:
    """
    Async task to sync order to Shiprocket
    
    Args:
        order_id: Order ID to sync
        
    Returns:
        Dictionary with sync result
    """
    logger.info(f"[Task] Starting order sync for order_id={order_id}")
    
    try:
        # Get order
        order = Order.objects.get(id=order_id)
        
        # Check if already synced
        if order.shiprocket_synced and hasattr(order, 'shipment'):
            logger.info(f"[Task] Order {order.order_id} already synced")
            return {
                'success': True,
                'message': 'Order already synced',
                'order_id': order.order_id
            }
        
        # Sync order
        service = ShippingService()
        shipment = service.sync_order_to_shiprocket(order)
        
        logger.info(f"[Task] ✓ Order {order.order_id} synced successfully")
        
        return {
            'success': True,
            'message': 'Order synced successfully',
            'order_id': order.order_id,
            'shiprocket_order_id': shipment.shiprocket_order_id
        }
        
    except Order.DoesNotExist:
        logger.error(f"[Task] Order {order_id} not found")
        return {
            'success': False,
            'error': 'Order not found'
        }
    
    except ShiprocketError as e:
        logger.error(f"[Task] Shiprocket error for order {order_id}: {str(e)}")
        
        # Retry on certain errors
        if 'rate limit' in str(e).lower() or 'timeout' in str(e).lower():
            # Exponential backoff
            retry_delay = 300 * (2 ** self.request.retries)
            raise self.retry(exc=e, countdown=retry_delay)
        
        return {
            'success': False,
            'error': str(e),
            'order_id': order_id
        }
    
    except Exception as e:
        logger.error(f"[Task] Unexpected error for order {order_id}: {str(e)}")
        
        # Retry on unexpected errors
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=300)
        
        return {
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'order_id': order_id
        }


@shared_task
def sync_pending_orders() -> dict:
    """
    Batch task to sync all pending orders
    Runs periodically to retry failed syncs
    
    Returns:
        Dictionary with batch sync results
    """
    logger.info("[Task] Starting batch sync of pending orders")
    
    # Get orders that need syncing
    pending_orders = Order.objects.filter(
        Q(shiprocket_synced=False) | Q(shipment__sync_status='failed'),
        status__in=['confirmed', 'processing'],
        payment_status='paid'
    ).exclude(
        shipment__retry_count__gte=5  # Skip orders that failed 5+ times
    )[:50]  # Limit to 50 orders per batch
    
    results = {
        'total': pending_orders.count(),
        'success': 0,
        'failed': 0,
        'errors': []
    }
    
    for order in pending_orders:
        try:
            service = ShippingService()
            service.sync_order_to_shiprocket(order)
            results['success'] += 1
            logger.info(f"[Task] ✓ Synced order {order.order_id}")
            
        except Exception as e:
            results['failed'] += 1
            results['errors'].append({
                'order_id': order.order_id,
                'error': str(e)
            })
            logger.error(f"[Task] ✗ Failed to sync order {order.order_id}: {str(e)}")
    
    logger.info(f"[Task] Batch sync complete: {results['success']}/{results['total']} successful")
    
    return results



# ==================== TRACKING UPDATE TASKS ====================

@shared_task(bind=True, max_retries=2, default_retry_delay=600)
def update_shipment_tracking_task(self, shipment_id: int) -> dict:
    """
    Async task to update tracking for a single shipment
    
    Args:
        shipment_id: Shipment ID to update
        
    Returns:
        Dictionary with update result
    """
    logger.info(f"[Task] Updating tracking for shipment_id={shipment_id}")
    
    try:
        # Get shipment
        shipment = Shipment.objects.get(id=shipment_id)
        
        # Skip if already delivered or cancelled
        if shipment.status in ['delivered', 'cancelled']:
            logger.info(f"[Task] Shipment {shipment.shiprocket_order_id} is {shipment.status}, skipping")
            return {
                'success': True,
                'message': f'Shipment already {shipment.status}',
                'status': shipment.status
            }
        
        # Update tracking
        service = ShippingService()
        tracking_data = service.get_tracking_info(shipment, force_refresh=True)
        
        logger.info(f"[Task] ✓ Tracking updated for {shipment.shiprocket_order_id}: {tracking_data.get('status')}")
        
        return {
            'success': True,
            'message': 'Tracking updated successfully',
            'shiprocket_order_id': shipment.shiprocket_order_id,
            'status': tracking_data.get('status')
        }
        
    except Shipment.DoesNotExist:
        logger.error(f"[Task] Shipment {shipment_id} not found")
        return {
            'success': False,
            'error': 'Shipment not found'
        }
    
    except ShiprocketError as e:
        logger.error(f"[Task] Tracking update failed for shipment {shipment_id}: {str(e)}")
        
        # Retry on rate limit or timeout
        if 'rate limit' in str(e).lower() or 'timeout' in str(e).lower():
            if self.request.retries < self.max_retries:
                raise self.retry(exc=e, countdown=600)
        
        return {
            'success': False,
            'error': str(e)
        }
    
    except Exception as e:
        logger.error(f"[Task] Unexpected error updating shipment {shipment_id}: {str(e)}")
        return {
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }


@shared_task
def update_all_shipments_tracking() -> dict:
    """
    Batch task to update tracking for all active shipments
    Runs periodically (every 2 hours)
    
    Returns:
        Dictionary with batch update results
    """
    logger.info("[Task] Starting batch tracking update for all active shipments")
    
    # Get active shipments (not delivered or cancelled)
    active_shipments = Shipment.objects.filter(
        status__in=['pending', 'ready_to_ship', 'picked_up', 'in_transit', 'out_for_delivery'],
        awb_code__isnull=False
    ).exclude(
        awb_code=''
    )[:100]  # Limit to 100 shipments per batch
    
    results = {
        'total': active_shipments.count(),
        'success': 0,
        'failed': 0,
        'delivered': 0,
        'errors': []
    }
    
    service = ShippingService()
    
    for shipment in active_shipments:
        try:
            tracking_data = service.get_tracking_info(shipment, force_refresh=True)
            results['success'] += 1
            
            if tracking_data.get('status') == 'delivered':
                results['delivered'] += 1
            
            logger.info(f"[Task] ✓ Updated {shipment.shiprocket_order_id}: {tracking_data.get('status')}")
            
        except Exception as e:
            results['failed'] += 1
            results['errors'].append({
                'shipment_id': shipment.id,
                'shiprocket_order_id': shipment.shiprocket_order_id,
                'error': str(e)
            })
            logger.error(f"[Task] ✗ Failed to update {shipment.shiprocket_order_id}: {str(e)}")
    
    logger.info(f"[Task] Batch tracking update complete: {results['success']}/{results['total']} successful, {results['delivered']} delivered")
    
    return results



# ==================== BATCH OPERATIONS TASKS ====================

@shared_task
def generate_shipping_labels_batch(shipment_ids: List[int]) -> dict:
    """
    Batch task to generate shipping labels for multiple shipments
    
    Args:
        shipment_ids: List of shipment IDs
        
    Returns:
        Dictionary with generation results
    """
    logger.info(f"[Task] Generating labels for {len(shipment_ids)} shipments")
    
    results = {
        'total': len(shipment_ids),
        'success': 0,
        'failed': 0,
        'errors': []
    }
    
    service = ShippingService()
    
    for shipment_id in shipment_ids:
        try:
            shipment = Shipment.objects.get(id=shipment_id)
            
            # Skip if no shipment ID
            if not shipment.shiprocket_shipment_id:
                results['failed'] += 1
                results['errors'].append({
                    'shipment_id': shipment_id,
                    'error': 'No Shiprocket shipment ID'
                })
                continue
            
            # Generate label
            label_url = service.generate_shipping_label(shipment)
            
            if label_url:
                results['success'] += 1
                logger.info(f"[Task] ✓ Label generated for shipment {shipment_id}")
            else:
                results['failed'] += 1
                results['errors'].append({
                    'shipment_id': shipment_id,
                    'error': 'No label URL returned'
                })
            
        except Shipment.DoesNotExist:
            results['failed'] += 1
            results['errors'].append({
                'shipment_id': shipment_id,
                'error': 'Shipment not found'
            })
            
        except Exception as e:
            results['failed'] += 1
            results['errors'].append({
                'shipment_id': shipment_id,
                'error': str(e)
            })
            logger.error(f"[Task] ✗ Label generation failed for shipment {shipment_id}: {str(e)}")
    
    logger.info(f"[Task] Batch label generation complete: {results['success']}/{results['total']} successful")
    
    return results


@shared_task
def create_shipments_batch(order_ids: List[int]) -> dict:
    """
    Batch task to create shipments for multiple orders
    
    Args:
        order_ids: List of order IDs
        
    Returns:
        Dictionary with creation results
    """
    logger.info(f"[Task] Creating shipments for {len(order_ids)} orders")
    
    results = {
        'total': len(order_ids),
        'success': 0,
        'failed': 0,
        'errors': []
    }
    
    service = ShippingService()
    
    for order_id in order_ids:
        try:
            order = Order.objects.get(id=order_id)
            
            # Create shipment
            shipment = service.create_shipment_for_order(order)
            
            results['success'] += 1
            logger.info(f"[Task] ✓ Shipment created for order {order.order_id}, AWB: {shipment.awb_code}")
            
        except Order.DoesNotExist:
            results['failed'] += 1
            results['errors'].append({
                'order_id': order_id,
                'error': 'Order not found'
            })
            
        except Exception as e:
            results['failed'] += 1
            results['errors'].append({
                'order_id': order_id,
                'error': str(e)
            })
            logger.error(f"[Task] ✗ Shipment creation failed for order {order_id}: {str(e)}")
    
    logger.info(f"[Task] Batch shipment creation complete: {results['success']}/{results['total']} successful")
    
    return results


@shared_task
def cleanup_expired_rates() -> dict:
    """
    Periodic task to clean up expired shipping rate cache
    Runs every 6 hours
    
    Returns:
        Dictionary with cleanup results
    """
    logger.info("[Task] Starting cleanup of expired shipping rates")
    
    try:
        deleted_count, _ = ShippingRate.clear_expired()
        
        logger.info(f"[Task] ✓ Cleaned up {deleted_count} expired rate entries")
        
        return {
            'success': True,
            'deleted_count': deleted_count,
            'message': f'Cleaned up {deleted_count} expired rates'
        }
        
    except Exception as e:
        logger.error(f"[Task] ✗ Rate cleanup failed: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


@shared_task
def retry_failed_shipments() -> dict:
    """
    Periodic task to retry failed shipment syncs
    Runs every 30 minutes
    
    Returns:
        Dictionary with retry results
    """
    logger.info("[Task] Starting retry of failed shipments")
    
    # Get failed shipments that haven't exceeded retry limit
    failed_shipments = Shipment.objects.filter(
        sync_status='failed',
        retry_count__lt=5,
        order__status__in=['confirmed', 'processing']
    )[:20]  # Limit to 20 per batch
    
    results = {
        'total': failed_shipments.count(),
        'success': 0,
        'failed': 0,
        'errors': []
    }
    
    service = ShippingService()
    
    for shipment in failed_shipments:
        try:
            order = shipment.order
            
            # Try to sync again
            service.sync_order_to_shiprocket(order)
            
            results['success'] += 1
            logger.info(f"[Task] ✓ Retry successful for order {order.order_id}")
            
        except Exception as e:
            # Increment retry count
            shipment.retry_count += 1
            shipment.error_message = str(e)
            shipment.save(update_fields=['retry_count', 'error_message'])
            
            results['failed'] += 1
            results['errors'].append({
                'order_id': shipment.order.order_id,
                'retry_count': shipment.retry_count,
                'error': str(e)
            })
            logger.error(f"[Task] ✗ Retry failed for order {shipment.order.order_id} (attempt {shipment.retry_count}): {str(e)}")
    
    logger.info(f"[Task] Retry complete: {results['success']}/{results['total']} successful")
    
    return results
