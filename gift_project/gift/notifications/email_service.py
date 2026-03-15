"""
Email Service for Order Notifications
Handles sending order confirmation, shipping, and delivery emails
"""
import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


class EmailService:
    """
    Service class for sending order-related emails
    """
    
    def __init__(self):
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@radhvigifts.com')
        self.frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    
    def _send_email(self, subject, template_name, context, recipient_email):
        """
        Generic method to send HTML emails
        
        Args:
            subject: Email subject
            template_name: HTML template name
            context: Template context data
            recipient_email: Recipient email address
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Add frontend URL to context
            context['frontend_url'] = self.frontend_url
            
            # Render HTML content
            html_content = render_to_string(f'emails/{template_name}', context)
            
            # Create plain text version
            text_content = strip_tags(html_content)
            
            # Create email message
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=self.from_email,
                to=[recipient_email]
            )
            
            # Attach HTML version
            email.attach_alternative(html_content, "text/html")
            
            # Send email
            email.send()
            
            logger.info(f"✓ Email sent successfully to {recipient_email}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"✗ Failed to send email to {recipient_email}: {str(e)}")
            return False
    
    def send_order_confirmation_email(self, order):
        """
        Send order confirmation email after successful payment
        
        Args:
            order: Order instance
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Order Confirmation - {order.order_id} | Radhvi Gift Shop"
        
        context = {
            'order': order,
            'customer_name': order.customer_name,
        }
        
        return self._send_email(
            subject=subject,
            template_name='order_confirmation.html',
            context=context,
            recipient_email=order.customer_email
        )
    
    def send_order_shipped_email(self, order, shipment):
        """
        Send order shipped email when AWB is generated
        
        Args:
            order: Order instance
            shipment: Shipment instance
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Your Order is On Its Way! - {order.order_id} | Radhvi Gift Shop"
        
        context = {
            'order': order,
            'shipment': shipment,
            'customer_name': order.customer_name,
        }
        
        return self._send_email(
            subject=subject,
            template_name='order_shipped.html',
            context=context,
            recipient_email=order.customer_email
        )
    
    def send_order_delivered_email(self, order, shipment):
        """
        Send order delivered email when package is delivered
        
        Args:
            order: Order instance
            shipment: Shipment instance
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Package Delivered! 🎉 - {order.order_id} | Radhvi Gift Shop"
        
        context = {
            'order': order,
            'shipment': shipment,
            'customer_name': order.customer_name,
        }
        
        return self._send_email(
            subject=subject,
            template_name='order_delivered.html',
            context=context,
            recipient_email=order.customer_email
        )
    
    def send_order_cancelled_email(self, order, reason=None):
        """
        Send order cancellation email
        
        Args:
            order: Order instance
            reason: Cancellation reason (optional)
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Order Cancelled - {order.order_id} | Radhvi Gift Shop"
        
        # Create simple cancellation email content
        context = {
            'order': order,
            'customer_name': order.customer_name,
            'reason': reason or 'Cancelled as requested',
        }
        
        # For now, use a simple template (can be enhanced later)
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; border-bottom: 2px solid #dc3545; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="color: #e74c3c;">🎁 Radhvi Gift Shop</h1>
                <h2>Order Cancelled</h2>
            </div>
            
            <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Order Cancellation Notice</h3>
                <p><strong>Order ID:</strong> {order.order_id}</p>
                <p><strong>Reason:</strong> {context['reason']}</p>
                <p><strong>Amount:</strong> ₹{order.total_amount}</p>
            </div>
            
            <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>What's Next?</h3>
                <p>• If payment was made, refund will be processed within 5-7 business days</p>
                <p>• You'll receive a separate email confirmation for the refund</p>
                <p>• Feel free to place a new order anytime</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{self.frontend_url}" style="background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Continue Shopping</a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
                <p>Questions? Contact us at support@radhvigifts.com</p>
                <p>© 2024 Radhvi Gift Shop. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        try:
            email = EmailMultiAlternatives(
                subject=subject,
                body=strip_tags(html_content),
                from_email=self.from_email,
                to=[order.customer_email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send()
            
            logger.info(f"✓ Cancellation email sent to {order.customer_email}")
            return True
            
        except Exception as e:
            logger.error(f"✗ Failed to send cancellation email: {str(e)}")
            return False
    
    def send_bulk_notification(self, orders, template_name, subject_template):
        """
        Send bulk notifications to multiple orders
        
        Args:
            orders: List of Order instances
            template_name: Email template name
            subject_template: Subject template string
            
        Returns:
            dict: Results with success/failure counts
        """
        results = {'success': 0, 'failed': 0, 'errors': []}
        
        for order in orders:
            try:
                subject = subject_template.format(order_id=order.order_id)
                context = {'order': order, 'customer_name': order.customer_name}
                
                if self._send_email(subject, template_name, context, order.customer_email):
                    results['success'] += 1
                else:
                    results['failed'] += 1
                    
            except Exception as e:
                results['failed'] += 1
                results['errors'].append(f"Order {order.order_id}: {str(e)}")
        
        logger.info(f"Bulk email results: {results['success']} sent, {results['failed']} failed")
        return results


# Convenience functions for easy import
def send_order_confirmation(order):
    """Send order confirmation email"""
    service = EmailService()
    return service.send_order_confirmation_email(order)


def send_order_shipped(order, shipment):
    """Send order shipped email"""
    service = EmailService()
    return service.send_order_shipped_email(order, shipment)


def send_order_delivered(order, shipment):
    """Send order delivered email"""
    service = EmailService()
    return service.send_order_delivered_email(order, shipment)


def send_order_cancelled(order, reason=None):
    """Send order cancelled email"""
    service = EmailService()
    return service.send_order_cancelled_email(order, reason)
