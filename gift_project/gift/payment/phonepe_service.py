"""
PhonePe Payment Service
Handles payment request creation, verification, and status checking
"""
import hashlib
import hmac
import base64
import json
import requests
import logging
from django.conf import settings
from decimal import Decimal
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)


class PhonePeError(Exception):
    """Base exception for PhonePe errors"""
    pass


class PaymentInitiationError(PhonePeError):
    """Payment request creation failed"""
    pass


class PaymentVerificationError(PhonePeError):
    """Payment verification failed"""
    pass


class WebhookVerificationError(PhonePeError):
    """Webhook signature verification failed"""
    pass


class RefundError(PhonePeError):
    """Refund processing failed"""
    pass


class PhonePeService:
    """
    Service class for PhonePe payment integration
    Handles payment request creation, verification, and status checking
    """
    
    def __init__(self):
        """Initialize PhonePe service with configuration"""
        self.merchant_id = settings.PHONEPE_MERCHANT_ID
        self.salt_key = settings.PHONEPE_SALT_KEY
        self.salt_index = settings.PHONEPE_SALT_INDEX
        self.base_url = settings.PHONEPE_BASE_URL
        self.redirect_url = settings.PHONEPE_REDIRECT_URL
        self.callback_url = settings.PHONEPE_CALLBACK_URL
        
        # Validate configuration
        self._validate_configuration()
        
        # API endpoints
        self.pay_endpoint = "/pg/v1/pay"
        self.status_endpoint = "/pg/v1/status"
        self.refund_endpoint = "/pg/v1/refund"
        
        # Request timeout
        self.timeout = 30
        
        logger.info("PhonePe service initialized")
    
    def _validate_configuration(self):
        """
        Validate PhonePe configuration settings
        
        Raises:
            PhonePeError: If configuration is invalid
        """
        required_settings = {
            'PHONEPE_MERCHANT_ID': self.merchant_id,
            'PHONEPE_SALT_KEY': self.salt_key,
            'PHONEPE_SALT_INDEX': self.salt_index,
            'PHONEPE_BASE_URL': self.base_url,
        }
        
        # Check for missing required settings
        missing_settings = []
        for setting_name, setting_value in required_settings.items():
            if not setting_value or setting_value in ['', 'your_key_here']:
                missing_settings.append(setting_name)
        
        if missing_settings:
            error_msg = f"Missing or invalid PhonePe configuration: {', '.join(missing_settings)}"
            logger.error(error_msg)
            raise PhonePeError(error_msg)
        
        # Validate merchant ID format (allow test merchant ID)
        if not self.merchant_id.startswith(('PGTESTPAYUAT', 'PG')):
            logger.warning(f"Unusual merchant ID format: {self.merchant_id}")
        
        # Validate salt index
        try:
            salt_index_int = int(self.salt_index)
            if salt_index_int < 1:
                raise ValueError("Salt index must be >= 1")
        except ValueError as e:
            error_msg = f"Invalid salt index: {self.salt_index} - {str(e)}"
            logger.error(error_msg)
            raise PhonePeError(error_msg)
        
        # Validate base URL
        if not self.base_url.startswith(('https://api.phonepe.com', 'https://api-preprod.phonepe.com')):
            logger.warning(f"Unusual base URL: {self.base_url}")
        
        logger.info("✓ PhonePe configuration validated successfully")
    
    def generate_checksum(self, payload, endpoint):
        """
        Generate X-VERIFY header for PhonePe API calls
        Format: SHA256(base64(payload) + endpoint + salt_key) + ### + salt_index
        
        Args:
            payload: JSON payload as string
            endpoint: API endpoint path
            
        Returns:
            String: Checksum in format "hash###salt_index"
        """
        try:
            # Encode payload to base64
            base64_payload = base64.b64encode(payload.encode()).decode()
            
            # Create string to hash
            string_to_hash = base64_payload + endpoint + self.salt_key
            
            # Generate SHA256 hash
            sha256_hash = hashlib.sha256(string_to_hash.encode()).hexdigest()
            
            # Return checksum with salt index
            checksum = f"{sha256_hash}###{self.salt_index}"
            
            logger.debug(f"Generated checksum for endpoint: {endpoint}")
            return checksum
            
        except Exception as e:
            logger.error(f"Error generating checksum: {str(e)}")
            raise PhonePeError(f"Checksum generation failed: {str(e)}")
    
    def make_api_request(self, endpoint, payload, method='POST'):
        """
        Make authenticated API request to PhonePe
        
        Args:
            endpoint: API endpoint path
            payload: Request payload as dictionary
            method: HTTP method (POST, GET)
            
        Returns:
            Dictionary: API response
            
        Raises:
            PhonePeError: If API request fails
        """
        try:
            # Convert payload to JSON string
            payload_json = json.dumps(payload)
            
            # Generate checksum
            checksum = self.generate_checksum(payload_json, endpoint)
            
            # Prepare headers
            headers = {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'accept': 'application/json'
            }
            
            # Full URL
            url = f"{self.base_url}{endpoint}"
            
            logger.info(f"Making {method} request to: {url}")
            
            # Make request
            if method == 'POST':
                response = requests.post(
                    url, 
                    data=payload_json, 
                    headers=headers, 
                    timeout=self.timeout
                )
            else:
                response = requests.get(
                    url, 
                    headers=headers, 
                    timeout=self.timeout
                )
            
            # Log response status
            logger.info(f"PhonePe API response status: {response.status_code}")
            
            # Parse response
            response_data = response.json()
            
            # Check if request was successful
            if response.status_code == 200:
                return response_data
            else:
                error_msg = response_data.get('message', 'Unknown error')
                logger.error(f"PhonePe API error: {error_msg}")
                raise PhonePeError(f"API request failed: {error_msg}")
                
        except requests.exceptions.Timeout:
            logger.error("PhonePe API request timed out")
            raise PhonePeError("Request timed out")
        
        except requests.exceptions.ConnectionError:
            logger.error("Failed to connect to PhonePe API")
            raise PhonePeError("Connection error")
        
        except json.JSONDecodeError:
            logger.error("Invalid JSON response from PhonePe API")
            raise PhonePeError("Invalid response format")
        
        except Exception as e:
            logger.error(f"Unexpected error in API request: {str(e)}")
            raise PhonePeError(f"API request failed: {str(e)}")
    
    def create_payment_request(self, amount, order_id, user_info):
        """
        Create PhonePe payment request
        
        Args:
            amount: Payment amount in rupees (Decimal)
            order_id: Unique order identifier
            user_info: Dictionary with user details (name, email, phone)
            
        Returns:
            Dictionary: Payment request response with redirect URL
            
        Raises:
            PaymentInitiationError: If payment request creation fails
        """
        try:
            # Convert amount to paise (PhonePe uses smallest currency unit)
            amount_paise = int(Decimal(str(amount)) * 100)
            
            # Generate unique merchant transaction ID
            merchant_transaction_id = f"MT{order_id}_{int(datetime.now().timestamp())}"
            
            # Prepare payment request payload
            payload = {
                "merchantId": self.merchant_id,
                "merchantTransactionId": merchant_transaction_id,
                "merchantUserId": f"USER_{user_info.get('user_id', 'GUEST')}",
                "amount": amount_paise,
                "redirectUrl": f"{settings.SITE_DOMAIN}/orders/{order_id}/confirmation",
                "redirectMode": "POST",
                "callbackUrl": self.callback_url,
                "mobileNumber": user_info.get('phone', ''),
                "paymentInstrument": {
                    "type": "PAY_PAGE"
                }
            }
            
            logger.info(f"Creating PhonePe payment request for order: {order_id}, amount: ₹{amount}")
            
            # Make API request
            response = self.make_api_request(self.pay_endpoint, payload)
            
            # Check response success
            if response.get('success'):
                payment_url = response['data']['instrumentResponse']['redirectInfo']['url']
                
                logger.info(f"✓ PhonePe payment request created: {merchant_transaction_id}")
                
                return {
                    'success': True,
                    'merchant_transaction_id': merchant_transaction_id,
                    'payment_url': payment_url,
                    'amount': amount_paise,
                    'order_id': order_id
                }
            else:
                error_msg = response.get('message', 'Payment request failed')
                logger.error(f"✗ PhonePe payment request failed: {error_msg}")
                raise PaymentInitiationError(error_msg)
                
        except PaymentInitiationError:
            raise
        except Exception as e:
            logger.error(f"✗ Unexpected error creating payment request: {str(e)}")
            raise PaymentInitiationError(f"Failed to create payment request: {str(e)}")
    
    def verify_payment(self, merchant_transaction_id):
        """
        Verify payment status using PhonePe status API
        
        Args:
            merchant_transaction_id: Merchant transaction ID
            
        Returns:
            Dictionary: Payment verification result
            
        Raises:
            PaymentVerificationError: If verification fails
        """
        try:
            # Prepare status check endpoint
            status_endpoint = f"{self.status_endpoint}/{self.merchant_id}/{merchant_transaction_id}"
            
            logger.info(f"Verifying payment: {merchant_transaction_id}")
            
            # Make status check request (GET request with empty payload)
            response = self.make_api_request(status_endpoint, {}, method='GET')
            
            # Parse response
            if response.get('success'):
                payment_data = response['data']
                
                verification_result = {
                    'success': True,
                    'transaction_id': payment_data.get('transactionId'),
                    'merchant_transaction_id': payment_data.get('merchantTransactionId'),
                    'amount': payment_data.get('amount'),
                    'state': payment_data.get('state'),
                    'response_code': payment_data.get('responseCode'),
                    'payment_instrument': payment_data.get('paymentInstrument', {}).get('type'),
                    'merchant_id': payment_data.get('merchantId')
                }
                
                # Check if payment is successful
                if payment_data.get('state') == 'COMPLETED':
                    logger.info(f"✓ Payment verification successful: {merchant_transaction_id}")
                    verification_result['payment_status'] = 'SUCCESS'
                elif payment_data.get('state') == 'FAILED':
                    logger.warning(f"✗ Payment failed: {merchant_transaction_id}")
                    verification_result['payment_status'] = 'FAILED'
                else:
                    logger.info(f"⏳ Payment pending: {merchant_transaction_id}")
                    verification_result['payment_status'] = 'PENDING'
                
                return verification_result
            else:
                error_msg = response.get('message', 'Verification failed')
                logger.error(f"✗ Payment verification failed: {error_msg}")
                raise PaymentVerificationError(error_msg)
                
        except PaymentVerificationError:
            raise
        except Exception as e:
            logger.error(f"✗ Error verifying payment: {str(e)}")
            raise PaymentVerificationError(f"Verification error: {str(e)}")
    
    def check_payment_status(self, merchant_transaction_id):
        """
        Check payment status (alias for verify_payment for compatibility)
        
        Args:
            merchant_transaction_id: Merchant transaction ID
            
        Returns:
            Dictionary: Payment status information
        """
        return self.verify_payment(merchant_transaction_id)
    
    def verify_webhook_signature(self, response_body, x_verify_header):
        """
        Verify webhook signature from PhonePe
        
        Args:
            response_body: Raw webhook response body
            x_verify_header: X-VERIFY header from webhook
            
        Returns:
            Boolean: True if signature is valid
            
        Raises:
            WebhookVerificationError: If verification fails
        """
        try:
            # Generate expected checksum
            expected_checksum = self.generate_checksum(response_body, self.status_endpoint)
            
            # Compare checksums
            if hmac.compare_digest(expected_checksum, x_verify_header):
                logger.info("✓ Webhook signature verified")
                return True
            else:
                logger.warning("✗ Webhook signature verification failed")
                raise WebhookVerificationError("Invalid webhook signature")
                
        except Exception as e:
            logger.error(f"✗ Error verifying webhook signature: {str(e)}")
            raise WebhookVerificationError(f"Signature verification error: {str(e)}")
    
    def handle_webhook(self, request_data, x_verify_header):
        """
        Process PhonePe webhook notifications
        
        Args:
            request_data: Webhook request data
            x_verify_header: X-VERIFY header for signature verification
            
        Returns:
            Dictionary: Processed webhook data
            
        Raises:
            WebhookVerificationError: If webhook processing fails
        """
        try:
            # Verify webhook signature
            self.verify_webhook_signature(json.dumps(request_data), x_verify_header)
            
            # Extract payment information
            response_data = request_data.get('response', {})
            
            webhook_result = {
                'merchant_transaction_id': response_data.get('merchantTransactionId'),
                'transaction_id': response_data.get('transactionId'),
                'amount': response_data.get('amount'),
                'state': response_data.get('state'),
                'response_code': response_data.get('responseCode'),
                'payment_instrument': response_data.get('paymentInstrument', {}).get('type')
            }
            
            logger.info(f"✓ Webhook processed: {webhook_result['merchant_transaction_id']}")
            return webhook_result
            
        except WebhookVerificationError:
            raise
        except Exception as e:
            logger.error(f"✗ Error processing webhook: {str(e)}")
            raise WebhookVerificationError(f"Webhook processing error: {str(e)}")
    
    def initiate_refund(self, transaction_id, refund_amount=None, reason=None):
        """
        Initiate refund for a PhonePe transaction
        
        Args:
            transaction_id: Original PhonePe transaction ID
            refund_amount: Refund amount in paise (None for full refund)
            reason: Reason for refund
            
        Returns:
            Dictionary: Refund initiation result
            
        Raises:
            RefundError: If refund initiation fails
        """
        try:
            # Generate unique refund transaction ID
            refund_transaction_id = f"RF{transaction_id}_{int(datetime.now().timestamp())}"
            
            # Prepare refund request payload
            payload = {
                "merchantId": self.merchant_id,
                "merchantTransactionId": refund_transaction_id,
                "originalTransactionId": transaction_id,
                "callbackUrl": self.callback_url
            }
            
            # Add refund amount if specified (for partial refunds)
            if refund_amount:
                payload["amount"] = int(refund_amount)
            
            # Add reason if provided
            if reason:
                payload["merchantOrderId"] = reason[:50]  # Limit reason length
            
            logger.info(f"Initiating PhonePe refund for transaction: {transaction_id}")
            
            # Make refund API request
            response = self.make_api_request(self.refund_endpoint, payload)
            
            # Check response success
            if response.get('success'):
                refund_data = response.get('data', {})
                
                logger.info(f"✓ PhonePe refund initiated: {refund_transaction_id}")
                
                return {
                    'success': True,
                    'refund_transaction_id': refund_transaction_id,
                    'original_transaction_id': transaction_id,
                    'state': refund_data.get('state', 'PENDING'),
                    'response_code': refund_data.get('responseCode'),
                    'amount': refund_amount,
                }
            else:
                error_msg = response.get('message', 'Refund initiation failed')
                logger.error(f"✗ PhonePe refund failed: {error_msg}")
                raise RefundError(error_msg)
                
        except RefundError:
            raise
        except Exception as e:
            logger.error(f"✗ Unexpected error initiating refund: {str(e)}")
            raise RefundError(f"Failed to initiate refund: {str(e)}")
    
    def check_refund_status(self, refund_transaction_id):
        """
        Check status of a PhonePe refund
        
        Args:
            refund_transaction_id: Refund transaction ID
            
        Returns:
            Dictionary: Refund status information
            
        Raises:
            RefundError: If status check fails
        """
        try:
            # Prepare status check endpoint for refund
            status_endpoint = f"{self.status_endpoint}/{self.merchant_id}/{refund_transaction_id}"
            
            logger.info(f"Checking refund status: {refund_transaction_id}")
            
            # Make status check request
            response = self.make_api_request(status_endpoint, {}, method='GET')
            
            # Parse response
            if response.get('success'):
                refund_data = response['data']
                
                status_result = {
                    'success': True,
                    'refund_transaction_id': refund_data.get('merchantTransactionId'),
                    'original_transaction_id': refund_data.get('originalTransactionId'),
                    'amount': refund_data.get('amount'),
                    'state': refund_data.get('state'),
                    'response_code': refund_data.get('responseCode'),
                }
                
                # Determine refund status
                if refund_data.get('state') == 'COMPLETED':
                    logger.info(f"✓ Refund completed: {refund_transaction_id}")
                    status_result['refund_status'] = 'SUCCESS'
                elif refund_data.get('state') == 'FAILED':
                    logger.warning(f"✗ Refund failed: {refund_transaction_id}")
                    status_result['refund_status'] = 'FAILED'
                else:
                    logger.info(f"⏳ Refund pending: {refund_transaction_id}")
                    status_result['refund_status'] = 'PENDING'
                
                return status_result
            else:
                error_msg = response.get('message', 'Refund status check failed')
                logger.error(f"✗ Refund status check failed: {error_msg}")
                raise RefundError(error_msg)
                
        except RefundError:
            raise
        except Exception as e:
            logger.error(f"✗ Error checking refund status: {str(e)}")
            raise RefundError(f"Refund status check error: {str(e)}")


# PhonePe error code mapping
PHONEPE_ERROR_CODES = {
    'PAYMENT_ERROR': 'Payment processing failed',
    'PAYMENT_DECLINED': 'Payment was declined by bank',
    'INSUFFICIENT_FUNDS': 'Insufficient funds in account',
    'TRANSACTION_TIMEOUT': 'Transaction timed out',
    'INVALID_REQUEST': 'Invalid payment request',
    'MERCHANT_ERROR': 'Merchant configuration error',
    'AUTHENTICATION_FAILED': 'Authentication failed',
    'BAD_REQUEST': 'Invalid request parameters',
    'INTERNAL_SERVER_ERROR': 'PhonePe server error',
    'TRANSACTION_NOT_FOUND': 'Transaction not found',
}


def get_error_message(error_code):
    """
    Get user-friendly error message for PhonePe error code
    
    Args:
        error_code: PhonePe error code
        
    Returns:
        String: User-friendly error message
    """
    return PHONEPE_ERROR_CODES.get(error_code, 'Payment processing failed')


def validate_phonepe_configuration():
    """
    Validate PhonePe configuration at startup
    
    Returns:
        Dictionary: Configuration status and details
    """
    try:
        # Try to initialize PhonePe service
        service = PhonePeService()
        
        return {
            'status': 'valid',
            'message': 'PhonePe configuration is valid',
            'merchant_id': service.merchant_id,
            'base_url': service.base_url,
            'environment': 'sandbox' if 'preprod' in service.base_url else 'production'
        }
        
    except PhonePeError as e:
        return {
            'status': 'invalid',
            'message': str(e),
            'merchant_id': None,
            'base_url': None,
            'environment': None
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': f'Configuration check failed: {str(e)}',
            'merchant_id': None,
            'base_url': None,
            'environment': None
        }


def get_phonepe_configuration_status():
    """
    Get current PhonePe configuration status for admin/debugging
    
    Returns:
        Dictionary: Configuration details (safe for display)
    """
    from django.conf import settings
    
    try:
        config_status = validate_phonepe_configuration()
        
        return {
            'service': 'PhonePe Payment Gateway',
            'status': config_status['status'],
            'message': config_status['message'],
            'merchant_id': config_status.get('merchant_id', 'Not configured'),
            'environment': config_status.get('environment', 'Unknown'),
            'base_url': config_status.get('base_url', 'Not configured'),
            'redirect_url': getattr(settings, 'PHONEPE_REDIRECT_URL', 'Not configured'),
            'callback_url': getattr(settings, 'PHONEPE_CALLBACK_URL', 'Not configured'),
            'payment_gateway_selection': getattr(settings, 'PAYMENT_GATEWAY', 'Not configured'),
        }
        
    except Exception as e:
        return {
            'service': 'PhonePe Payment Gateway',
            'status': 'error',
            'message': f'Status check failed: {str(e)}',
            'merchant_id': 'Error',
            'environment': 'Error',
            'base_url': 'Error',
            'redirect_url': 'Error',
            'callback_url': 'Error',
            'payment_gateway_selection': 'Error',
        }