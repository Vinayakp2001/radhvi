"""
Razorpay Payment Service
Handles payment order creation and verification
"""
import razorpay
import hmac
import hashlib
import logging
from django.conf import settings
from decimal import Decimal

logger = logging.getLogger(__name__)


class RazorpayError(Exception):
    """Base exception for Razorpay errors"""
    pass


class PaymentVerificationError(RazorpayError):
    """Payment verification failed"""
    pass


class RazorpayService:
    """
    Service class for Razorpay payment integration
    Handles order creation and payment verification
    """
    
    def __init__(self):
        """Initialize Razorpay client"""
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.currency = settings.RAZORPAY_CURRENCY
        self.timeout = settings.RAZORPAY_PAYMENT_TIMEOUT
        
        # Initialize Razorpay client
        self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
        self.client.set_app_details({
            "title": "Radhvi Gift Shop",
            "version": "1.0"
        })
    
    def create_order(self, amount, currency=None, receipt=None, notes=None):
        """
        Create a Razorpay order
        
        Args:
            amount: Amount in rupees (will be converted to paise)
            currency: Currency code (default: INR)
            receipt: Receipt/Order ID for reference
            notes: Additional notes dictionary
            
        Returns:
            Dictionary with order details including order_id
            
        Raises:
            RazorpayError: If order creation fails
        """
        try:
            # Convert amount to paise (Razorpay uses smallest currency unit)
            amount_paise = int(Decimal(str(amount)) * 100)
            
            # Prepare order data
            order_data = {
                'amount': amount_paise,
                'currency': currency or self.currency,
                'payment_capture': 1,  # Auto capture payment
            }
            
            if receipt:
                order_data['receipt'] = receipt
            
            if notes:
                order_data['notes'] = notes
            
            # Create order via Razorpay API
            logger.info(f"Creating Razorpay order for amount: ₹{amount}")
            razorpay_order = self.client.order.create(data=order_data)
            
            logger.info(f"✓ Razorpay order created: {razorpay_order['id']}")
            
            return {
                'id': razorpay_order['id'],
                'amount': razorpay_order['amount'],
                'amount_paid': razorpay_order['amount_paid'],
                'amount_due': razorpay_order['amount_due'],
                'currency': razorpay_order['currency'],
                'receipt': razorpay_order.get('receipt'),
                'status': razorpay_order['status'],
                'created_at': razorpay_order['created_at'],
            }
            
        except razorpay.errors.BadRequestError as e:
            logger.error(f"✗ Razorpay bad request: {str(e)}")
            raise RazorpayError(f"Invalid request: {str(e)}")
        
        except razorpay.errors.ServerError as e:
            logger.error(f"✗ Razorpay server error: {str(e)}")
            raise RazorpayError(f"Server error: {str(e)}")
        
        except Exception as e:
            logger.error(f"✗ Unexpected error creating Razorpay order: {str(e)}")
            raise RazorpayError(f"Failed to create order: {str(e)}")
    
    def verify_payment_signature(self, razorpay_order_id, razorpay_payment_id, razorpay_signature):
        """
        Verify payment signature to ensure payment authenticity
        
        Args:
            razorpay_order_id: Razorpay order ID
            razorpay_payment_id: Razorpay payment ID
            razorpay_signature: Signature from Razorpay
            
        Returns:
            True if signature is valid
            
        Raises:
            PaymentVerificationError: If signature verification fails
        """
        try:
            # Generate expected signature
            message = f"{razorpay_order_id}|{razorpay_payment_id}"
            expected_signature = hmac.new(
                self.key_secret.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            if hmac.compare_digest(expected_signature, razorpay_signature):
                logger.info(f"✓ Payment signature verified for order: {razorpay_order_id}")
                return True
            else:
                logger.warning(f"✗ Payment signature mismatch for order: {razorpay_order_id}")
                raise PaymentVerificationError("Payment signature verification failed")
                
        except Exception as e:
            logger.error(f"✗ Error verifying payment signature: {str(e)}")
            raise PaymentVerificationError(f"Signature verification error: {str(e)}")
    
    def fetch_payment(self, payment_id):
        """
        Fetch payment details from Razorpay
        
        Args:
            payment_id: Razorpay payment ID
            
        Returns:
            Payment details dictionary
            
        Raises:
            RazorpayError: If fetch fails
        """
        try:
            logger.info(f"Fetching payment details: {payment_id}")
            payment = self.client.payment.fetch(payment_id)
            
            return {
                'id': payment['id'],
                'order_id': payment.get('order_id'),
                'amount': payment['amount'],
                'currency': payment['currency'],
                'status': payment['status'],
                'method': payment.get('method'),
                'email': payment.get('email'),
                'contact': payment.get('contact'),
                'created_at': payment['created_at'],
            }
            
        except razorpay.errors.BadRequestError as e:
            logger.error(f"✗ Payment not found: {payment_id}")
            raise RazorpayError(f"Payment not found: {str(e)}")
        
        except Exception as e:
            logger.error(f"✗ Error fetching payment: {str(e)}")
            raise RazorpayError(f"Failed to fetch payment: {str(e)}")
    
    def fetch_order(self, order_id):
        """
        Fetch order details from Razorpay
        
        Args:
            order_id: Razorpay order ID
            
        Returns:
            Order details dictionary
            
        Raises:
            RazorpayError: If fetch fails
        """
        try:
            logger.info(f"Fetching order details: {order_id}")
            order = self.client.order.fetch(order_id)
            
            return {
                'id': order['id'],
                'amount': order['amount'],
                'amount_paid': order['amount_paid'],
                'amount_due': order['amount_due'],
                'currency': order['currency'],
                'receipt': order.get('receipt'),
                'status': order['status'],
                'attempts': order['attempts'],
                'created_at': order['created_at'],
            }
            
        except razorpay.errors.BadRequestError as e:
            logger.error(f"✗ Order not found: {order_id}")
            raise RazorpayError(f"Order not found: {str(e)}")
        
        except Exception as e:
            logger.error(f"✗ Error fetching order: {str(e)}")
            raise RazorpayError(f"Failed to fetch order: {str(e)}")
    
    def refund_payment(self, payment_id, amount=None, notes=None):
        """
        Initiate refund for a payment
        
        Args:
            payment_id: Razorpay payment ID
            amount: Refund amount in paise (None for full refund)
            notes: Additional notes dictionary
            
        Returns:
            Refund details dictionary
            
        Raises:
            RazorpayError: If refund fails
        """
        try:
            refund_data = {}
            
            if amount:
                refund_data['amount'] = amount
            
            if notes:
                refund_data['notes'] = notes
            
            logger.info(f"Initiating refund for payment: {payment_id}")
            refund = self.client.payment.refund(payment_id, refund_data)
            
            logger.info(f"✓ Refund initiated: {refund['id']}")
            
            return {
                'id': refund['id'],
                'payment_id': refund['payment_id'],
                'amount': refund['amount'],
                'currency': refund['currency'],
                'status': refund['status'],
                'created_at': refund['created_at'],
            }
            
        except razorpay.errors.BadRequestError as e:
            logger.error(f"✗ Refund failed: {str(e)}")
            raise RazorpayError(f"Refund failed: {str(e)}")
        
        except Exception as e:
            logger.error(f"✗ Error initiating refund: {str(e)}")
            raise RazorpayError(f"Failed to initiate refund: {str(e)}")
