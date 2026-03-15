"""
PhonePe Webhook Handler
Processes webhook notifications from PhonePe payment gateway
"""
import json
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View

from gift.models import Order
from gift.payment.phonepe_service import PhonePeService, WebhookVerificationError

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def phonepe_webhook(request):
    """
    Handle PhonePe webhook notifications
    
    POST /api/webhooks/phonepe/
    Headers:
        X-VERIFY: Signature for verification
    Body: JSON with payment status update
    """
    try:
        # Get request data
        x_verify_header = request.headers.get('X-VERIFY', '')
        
        if not x_verify_header:
            logger.warning("PhonePe webhook received without X-VERIFY header")
            return JsonResponse(
                {'error': 'Missing X-VERIFY header'}, 
                status=400
            )
        
        # Parse request body
        try:
            webhook_data = json.loads(request.body.decode('utf-8'))
        except json.JSONDecodeError:
            logger.error("Invalid JSON in PhonePe webhook")
            return JsonResponse(
                {'error': 'Invalid JSON'}, 
                status=400
            )
        
        logger.info(f"PhonePe webhook received: {webhook_data}")
        
        # Initialize PhonePe service
        phonepe_service = PhonePeService()
        
        # Process webhook
        try:
            processed_data = phonepe_service.handle_webhook(
                webhook_data, 
                x_verify_header
            )
            
            # Find the order
            merchant_transaction_id = processed_data['merchant_transaction_id']
            
            try:
                order = Order.objects.get(
                    phonepe_merchant_transaction_id=merchant_transaction_id
                )
                
                # Update order based on webhook data
                update_order_from_webhook(order, processed_data)
                
                logger.info(f"✓ Order updated from webhook: {order.order_id}")
                
                return JsonResponse({
                    'status': 'success',
                    'message': 'Webhook processed successfully',
                    'order_id': order.order_id
                })
                
            except Order.DoesNotExist:
                logger.error(f"Order not found for merchant_transaction_id: {merchant_transaction_id}")
                return JsonResponse(
                    {'error': 'Order not found'}, 
                    status=404
                )
                
        except WebhookVerificationError as e:
            logger.error(f"Webhook verification failed: {str(e)}")
            return JsonResponse(
                {'error': 'Webhook verification failed'}, 
                status=401
            )
            
    except Exception as e:
        logger.error(f"Error processing PhonePe webhook: {str(e)}")
        return JsonResponse(
            {'error': 'Internal server error'}, 
            status=500
        )


def update_order_from_webhook(order, webhook_data):
    """
    Update order status based on PhonePe webhook data
    
    Args:
        order: Order instance to update
        webhook_data: Processed webhook data from PhonePe
    """
    try:
        # Update PhonePe payment details
        order.phonepe_transaction_id = webhook_data.get('transaction_id', '')
        order.phonepe_response_code = webhook_data.get('response_code', '')
        order.phonepe_payment_instrument = webhook_data.get('payment_instrument', '')
        
        # Update payment status based on webhook state
        webhook_state = webhook_data.get('state', '').upper()
        
        if webhook_state == 'COMPLETED':
            # Payment successful
            order.payment_status = 'paid'
            order.status = 'confirmed'
            
            # Set payment date if not already set
            if not order.payment_date:
                from django.utils import timezone
                order.payment_date = timezone.now()
            
            # Update transaction ID
            if webhook_data.get('transaction_id'):
                order.transaction_id = webhook_data['transaction_id']
            
            logger.info(f"✓ Payment confirmed via webhook: {order.order_id}")
            
            # Trigger Shiprocket sync for confirmed orders
            try:
                from gift.shipping.tasks import sync_order_to_shiprocket_task
                sync_order_to_shiprocket_task.delay(order.id)
                logger.info(f"Shiprocket sync triggered for order: {order.order_id}")
            except Exception as e:
                logger.warning(f"Could not trigger Shiprocket sync: {str(e)}")
                
        elif webhook_state == 'FAILED':
            # Payment failed
            order.payment_status = 'failed'
            order.status = 'cancelled'
            
            logger.info(f"✗ Payment failed via webhook: {order.order_id}")
            
        elif webhook_state == 'PENDING':
            # Payment still pending
            order.payment_status = 'pending'
            order.status = 'pending'
            
            logger.info(f"⏳ Payment pending via webhook: {order.order_id}")
            
        else:
            # Unknown state
            logger.warning(f"Unknown webhook state: {webhook_state} for order: {order.order_id}")
        
        # Save order
        order.save()
        
        # Send notification to user (optional)
        send_payment_notification(order, webhook_state)
        
    except Exception as e:
        logger.error(f"Error updating order from webhook: {str(e)}")
        raise


def send_payment_notification(order, payment_state):
    """
    Send notification to user about payment status update
    
    Args:
        order: Order instance
        payment_state: Payment state from webhook
    """
    try:
        from gift.models import Notification
        
        # Create notification based on payment state
        if payment_state == 'COMPLETED':
            notification_title = "Payment Successful"
            notification_message = f"Your payment for order {order.order_id} has been confirmed. Your order is being processed."
            notification_type = 'payment'
            
        elif payment_state == 'FAILED':
            notification_title = "Payment Failed"
            notification_message = f"Payment for order {order.order_id} has failed. Please try again or contact support."
            notification_type = 'payment'
            
        else:
            # Don't send notification for pending state
            return
        
        # Create notification
        Notification.objects.create(
            user=order.user,
            notification_type=notification_type,
            title=notification_title,
            message=notification_message,
            related_id=order.order_id,
            link=f'/orders/{order.order_id}/'
        )
        
        logger.info(f"Notification sent to user {order.user.username} for order {order.order_id}")
        
    except Exception as e:
        logger.error(f"Error sending payment notification: {str(e)}")
        # Don't raise exception as this is not critical


# Alternative class-based view (if needed)
@method_decorator(csrf_exempt, name='dispatch')
class PhonePeWebhookView(View):
    """
    Class-based view for PhonePe webhooks
    """
    
    def post(self, request):
        """Handle POST request for webhook"""
        return phonepe_webhook(request)
    
    def get(self, request):
        """Handle GET request (for webhook verification)"""
        return HttpResponse("PhonePe Webhook Endpoint", status=200)


# Webhook status endpoint for debugging
def webhook_status(request):
    """
    Simple status endpoint to verify webhook is working
    
    GET /api/webhooks/phonepe/status/
    """
    return JsonResponse({
        'status': 'active',
        'service': 'PhonePe Webhook Handler',
        'version': '1.0'
    })