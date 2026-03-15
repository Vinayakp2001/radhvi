"""
Shiprocket Webhook Handler
Receives and processes webhook events from Shiprocket
"""
import logging
import hmac
import hashlib
import json
from typing import Dict, Optional
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings
from django.utils import timezone

from gift.shipping.models import Shipment, WebhookLog
from gift.shipping.services import ShippingService
from gift.notifications.email_service import send_order_shipped, send_order_delivered

logger = logging.getLogger('shiprocket')


# ==================== WEBHOOK ENDPOINT ====================

@csrf_exempt
@require_POST
def shiprocket_webhook(request):
    """
    Main webhook endpoint for Shiprocket events
    Receives POST requests from Shiprocket with shipment updates
    
    Returns:
        JsonResponse with processing status
    """
    logger.info("[Webhook] Received webhook request")
    
    try:
        # Parse payload
        payload = json.loads(request.body.decode('utf-8'))
        
        # Get event type
        event_type = _get_event_type(payload)
        
        # Log webhook
        webhook_log = WebhookLog.log_webhook(
            event_type=event_type,
            payload=payload,
            ip_address=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        logger.info(f"[Webhook] Event type: {event_type}")
        
        # Verify signature if configured
        if settings.SHIPROCKET_WEBHOOK_SECRET:
            if not _verify_signature(request, payload):
                logger.warning("[Webhook] Signature verification failed")
                webhook_log.error_message = "Signature verification failed"
                webhook_log.save()
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid signature'
                }, status=401)
        
        # Process webhook
        handler = WebhookHandler()
        result = handler.process_webhook(event_type, payload)
        
        # Update webhook log
        if result.get('success'):
            webhook_log.processed = True
            webhook_log.order_id = result.get('order_id', '')
            webhook_log.awb_code = result.get('awb_code', '')
        else:
            webhook_log.error_message = result.get('error', 'Processing failed')
        
        webhook_log.save()
        
        logger.info(f"[Webhook] Processing complete: {result.get('message')}")
        
        return JsonResponse({
            'status': 'success' if result.get('success') else 'error',
            'message': result.get('message', 'Webhook processed')
        })
        
    except json.JSONDecodeError as e:
        logger.error(f"[Webhook] Invalid JSON payload: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON payload'
        }, status=400)
    
    except Exception as e:
        logger.error(f"[Webhook] Unexpected error: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error'
        }, status=500)


# ==================== HELPER FUNCTIONS ====================

def _get_event_type(payload: Dict) -> str:
    """
    Extract event type from webhook payload
    
    Args:
        payload: Webhook payload dictionary
        
    Returns:
        Event type string
    """
    # Shiprocket sends different payload structures
    # Try to identify event type from payload
    
    if 'shipment_status' in payload:
        return 'shipment_status_update'
    elif 'order_status' in payload:
        return 'order_status_update'
    elif 'awb' in payload or 'awb_code' in payload:
        return 'awb_assigned'
    elif 'delivered' in str(payload).lower():
        return 'delivery_completed'
    elif 'return' in str(payload).lower():
        return 'return_initiated'
    else:
        return 'unknown'


def _verify_signature(request, payload: Dict) -> bool:
    """
    Verify webhook signature using HMAC
    
    Args:
        request: Django request object
        payload: Webhook payload
        
    Returns:
        True if signature is valid
    """
    try:
        # Get signature from header
        signature = request.META.get('HTTP_X_SHIPROCKET_SIGNATURE', '')
        
        if not signature:
            logger.warning("[Webhook] No signature in request")
            return False
        
        # Calculate expected signature
        secret = settings.SHIPROCKET_WEBHOOK_SECRET.encode('utf-8')
        payload_str = json.dumps(payload, separators=(',', ':')).encode('utf-8')
        expected_signature = hmac.new(secret, payload_str, hashlib.sha256).hexdigest()
        
        # Compare signatures
        return hmac.compare_digest(signature, expected_signature)
        
    except Exception as e:
        logger.error(f"[Webhook] Signature verification error: {str(e)}")
        return False


def _get_client_ip(request) -> Optional[str]:
    """
    Get client IP address from request
    
    Args:
        request: Django request object
        
    Returns:
        IP address string or None
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip



# ==================== WEBHOOK HANDLER CLASS ====================

class WebhookHandler:
    """
    Handles different types of webhook events from Shiprocket
    """
    
    def __init__(self):
        """Initialize webhook handler"""
        self.service = ShippingService()
    
    def process_webhook(self, event_type: str, payload: Dict) -> Dict:
        """
        Route webhook to appropriate handler based on event type
        
        Args:
            event_type: Type of webhook event
            payload: Webhook payload data
            
        Returns:
            Dictionary with processing result
        """
        logger.info(f"[Webhook] Processing {event_type} event")
        
        # Route to appropriate handler
        handlers = {
            'shipment_status_update': self.handle_shipment_status_update,
            'order_status_update': self.handle_order_status_update,
            'awb_assigned': self.handle_awb_assigned,
            'delivery_completed': self.handle_delivery_completed,
            'return_initiated': self.handle_return_initiated,
        }
        
        handler = handlers.get(event_type, self.handle_unknown_event)
        
        try:
            return handler(payload)
        except Exception as e:
            logger.error(f"[Webhook] Handler error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': f'Failed to process {event_type}'
            }
    
    def handle_shipment_status_update(self, payload: Dict) -> Dict:
        """
        Handle shipment status update webhook
        
        Args:
            payload: Webhook payload
            
        Returns:
            Processing result
        """
        logger.info("[Webhook] Handling shipment status update")
        
        try:
            # Extract shipment info
            awb_code = payload.get('awb', payload.get('awb_code', ''))
            status = payload.get('shipment_status', payload.get('status', ''))
            current_status = payload.get('current_status', '')
            
            if not awb_code:
                return {
                    'success': False,
                    'error': 'No AWB code in payload'
                }
            
            # Find shipment
            try:
                shipment = Shipment.objects.get(awb_code=awb_code)
            except Shipment.DoesNotExist:
                logger.warning(f"[Webhook] Shipment not found for AWB: {awb_code}")
                return {
                    'success': False,
                    'error': f'Shipment not found for AWB: {awb_code}'
                }
            
            # Update shipment status
            old_status = shipment.status
            
            # Map Shiprocket status to our status
            status_map = {
                'PICKED UP': 'picked_up',
                'IN TRANSIT': 'in_transit',
                'OUT FOR DELIVERY': 'out_for_delivery',
                'DELIVERED': 'delivered',
                'CANCELLED': 'cancelled',
                'RTO': 'rto',
            }
            
            new_status = status_map.get(status.upper(), shipment.status)
            
            shipment.status = new_status
            shipment.current_status = current_status or status
            shipment.last_tracking_update = timezone.now()
            
            # Update tracking data
            if 'tracking_data' in payload:
                shipment.tracking_data = payload['tracking_data']
            
            shipment.save()
            
            # Update order status
            order = shipment.order
            if new_status == 'delivered':
                order.status = 'delivered'
                order.save(update_fields=['status'])
            elif new_status in ['in_transit', 'out_for_delivery']:
                if order.status != 'delivered':
                    order.status = 'shipped'
                    order.save(update_fields=['status'])
            
            logger.info(f"[Webhook] ✓ Shipment {awb_code} updated: {old_status} → {new_status}")
            
            # Send notification if status changed
            if old_status != new_status:
                self._send_customer_notification(shipment, new_status)
                
                # Send email notifications for key status changes
                if new_status == 'picked_up' and shipment.awb_code:
                    try:
                        send_order_shipped(shipment.order, shipment)
                        logger.info(f"[Webhook] ✓ Shipped email sent for order {shipment.order.order_id}")
                    except Exception as e:
                        logger.warning(f"[Webhook] Failed to send shipped email: {str(e)}")
                
                elif new_status == 'delivered':
                    try:
                        send_order_delivered(shipment.order, shipment)
                        logger.info(f"[Webhook] ✓ Delivered email sent for order {shipment.order.order_id}")
                    except Exception as e:
                        logger.warning(f"[Webhook] Failed to send delivered email: {str(e)}")
            
            return {
                'success': True,
                'message': f'Shipment status updated to {new_status}',
                'order_id': order.order_id,
                'awb_code': awb_code
            }
            
        except Exception as e:
            logger.error(f"[Webhook] Error updating shipment status: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def handle_order_status_update(self, payload: Dict) -> Dict:
        """
        Handle order status update webhook
        
        Args:
            payload: Webhook payload
            
        Returns:
            Processing result
        """
        logger.info("[Webhook] Handling order status update")
        
        try:
            order_id = payload.get('order_id', '')
            status = payload.get('order_status', payload.get('status', ''))
            
            if not order_id:
                return {
                    'success': False,
                    'error': 'No order ID in payload'
                }
            
            # Find shipment by Shiprocket order ID
            try:
                shipment = Shipment.objects.get(shiprocket_order_id=str(order_id))
            except Shipment.DoesNotExist:
                logger.warning(f"[Webhook] Shipment not found for order: {order_id}")
                return {
                    'success': False,
                    'error': f'Shipment not found for order: {order_id}'
                }
            
            # Update based on status
            logger.info(f"[Webhook] Order {order_id} status: {status}")
            
            return {
                'success': True,
                'message': f'Order status processed: {status}',
                'order_id': shipment.order.order_id
            }
            
        except Exception as e:
            logger.error(f"[Webhook] Error updating order status: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def handle_awb_assigned(self, payload: Dict) -> Dict:
        """
        Handle AWB assignment webhook
        
        Args:
            payload: Webhook payload
            
        Returns:
            Processing result
        """
        logger.info("[Webhook] Handling AWB assignment")
        
        try:
            order_id = payload.get('order_id', '')
            awb_code = payload.get('awb', payload.get('awb_code', ''))
            
            if not order_id or not awb_code:
                return {
                    'success': False,
                    'error': 'Missing order ID or AWB code'
                }
            
            # Find and update shipment
            try:
                shipment = Shipment.objects.get(shiprocket_order_id=str(order_id))
                shipment.awb_code = awb_code
                shipment.status = 'ready_to_ship'
                shipment.save()
                
                logger.info(f"[Webhook] ✓ AWB {awb_code} assigned to order {order_id}")
                
                return {
                    'success': True,
                    'message': 'AWB assigned successfully',
                    'order_id': shipment.order.order_id,
                    'awb_code': awb_code
                }
                
            except Shipment.DoesNotExist:
                logger.warning(f"[Webhook] Shipment not found for order: {order_id}")
                return {
                    'success': False,
                    'error': f'Shipment not found for order: {order_id}'
                }
            
        except Exception as e:
            logger.error(f"[Webhook] Error assigning AWB: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def handle_delivery_completed(self, payload: Dict) -> Dict:
        """
        Handle delivery completed webhook
        
        Args:
            payload: Webhook payload
            
        Returns:
            Processing result
        """
        logger.info("[Webhook] Handling delivery completion")
        
        try:
            awb_code = payload.get('awb', payload.get('awb_code', ''))
            
            if not awb_code:
                return {
                    'success': False,
                    'error': 'No AWB code in payload'
                }
            
            # Find and update shipment
            try:
                shipment = Shipment.objects.get(awb_code=awb_code)
                shipment.status = 'delivered'
                shipment.actual_delivery_date = timezone.now()
                shipment.save()
                
                # Update order
                order = shipment.order
                order.status = 'delivered'
                order.save(update_fields=['status'])
                
                logger.info(f"[Webhook] ✓ Delivery completed for AWB {awb_code}")
                
                # Send delivery notification email
                try:
                    send_order_delivered(order, shipment)
                    logger.info(f"[Webhook] ✓ Delivered email sent for order {order.order_id}")
                except Exception as e:
                    logger.warning(f"[Webhook] Failed to send delivered email: {str(e)}")
                
                # Send in-app notification
                self._send_customer_notification(shipment, 'delivered')
                
                return {
                    'success': True,
                    'message': 'Delivery completed',
                    'order_id': order.order_id,
                    'awb_code': awb_code
                }
                
            except Shipment.DoesNotExist:
                logger.warning(f"[Webhook] Shipment not found for AWB: {awb_code}")
                return {
                    'success': False,
                    'error': f'Shipment not found for AWB: {awb_code}'
                }
            
        except Exception as e:
            logger.error(f"[Webhook] Error processing delivery: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def handle_return_initiated(self, payload: Dict) -> Dict:
        """
        Handle return initiated webhook
        
        Args:
            payload: Webhook payload
            
        Returns:
            Processing result
        """
        logger.info("[Webhook] Handling return initiation")
        
        try:
            order_id = payload.get('order_id', '')
            
            if not order_id:
                return {
                    'success': False,
                    'error': 'No order ID in payload'
                }
            
            logger.info(f"[Webhook] Return initiated for order {order_id}")
            
            # Additional return handling logic can be added here
            
            return {
                'success': True,
                'message': 'Return initiated',
                'order_id': order_id
            }
            
        except Exception as e:
            logger.error(f"[Webhook] Error processing return: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def handle_unknown_event(self, payload: Dict) -> Dict:
        """
        Handle unknown webhook events
        
        Args:
            payload: Webhook payload
            
        Returns:
            Processing result
        """
        logger.warning(f"[Webhook] Unknown event type, payload: {payload}")
        
        return {
            'success': True,
            'message': 'Unknown event type, logged for review'
        }
    
    def _send_customer_notification(self, shipment: Shipment, status: str) -> None:
        """
        Send notification to customer about shipment status change
        
        Args:
            shipment: Shipment instance
            status: New status
        """
        try:
            from gift.models import Notification
            
            order = shipment.order
            user = order.user
            
            # Create notification messages
            messages = {
                'picked_up': f'Your order {order.order_id} has been picked up and is on its way!',
                'in_transit': f'Your order {order.order_id} is in transit.',
                'out_for_delivery': f'Your order {order.order_id} is out for delivery today!',
                'delivered': f'Your order {order.order_id} has been delivered. Thank you for shopping with us!',
            }
            
            message = messages.get(status)
            
            if message:
                Notification.objects.create(
                    user=user,
                    notification_type='shipment',
                    title=f'Order {status.replace("_", " ").title()}',
                    message=message,
                    related_id=order.order_id,
                    link=f'/orders/{order.order_id}/'
                )
                
                logger.info(f"[Webhook] Notification sent to user {user.username}")
            
        except Exception as e:
            logger.error(f"[Webhook] Failed to send notification: {str(e)}")
