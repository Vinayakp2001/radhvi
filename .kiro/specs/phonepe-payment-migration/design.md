# PhonePe Payment Gateway Migration - Design Document

## Overview

This document provides the technical design for migrating from Razorpay to PhonePe payment gateway in the Radhvi Gift Store. The design maintains the existing service-oriented architecture while replacing Razorpay-specific implementations with PhonePe equivalents.

## Architecture

### Current vs New Architecture

```
BEFORE (Razorpay):
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Django API    │    │   Razorpay      │
│   (Next.js)     │◄──►│   RazorpayService│◄──►│   Gateway       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘

AFTER (PhonePe):
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Django API    │    │   PhonePe       │
│   (Next.js)     │◄──►│   PhonePeService│◄──►│   Gateway       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Service Layer Design

The new `PhonePeService` will replace `RazorpayService` with equivalent functionality:

```python
class PhonePeService:
    """
    Service class for PhonePe payment integration
    Handles payment request creation, verification, and status checking
    """
    
    # Core Methods:
    - create_payment_request()    # Replaces create_order()
    - verify_payment()           # Replaces verify_payment_signature()
    - check_payment_status()     # Replaces fetch_payment()
    - initiate_refund()          # Replaces refund_payment()
    - handle_webhook()           # New webhook handler
```

## Components and Interfaces

### 1. PhonePe Service Class

**Location:** `gift/payment/phonepe_service.py`

**Key Components:**

```python
class PhonePeService:
    def __init__(self):
        self.merchant_id = settings.PHONEPE_MERCHANT_ID
        self.salt_key = settings.PHONEPE_SALT_KEY
        self.salt_index = settings.PHONEPE_SALT_INDEX
        self.base_url = settings.PHONEPE_BASE_URL
        
    def create_payment_request(self, amount, order_id, user_info):
        """Create PhonePe payment request"""
        
    def verify_payment(self, transaction_id, merchant_transaction_id):
        """Verify payment using PhonePe status API"""
        
    def generate_checksum(self, payload, endpoint):
        """Generate X-VERIFY header for PhonePe API calls"""
        
    def handle_webhook(self, request_data, x_verify_header):
        """Process PhonePe webhook notifications"""
```

### 2. Database Schema Changes

**Migration:** Replace Razorpay fields with PhonePe equivalents

```python
# OLD (Razorpay fields):
razorpay_order_id = models.CharField(max_length=200, blank=True)
razorpay_payment_id = models.CharField(max_length=200, blank=True)
razorpay_signature = models.CharField(max_length=500, blank=True)

# NEW (PhonePe fields):
phonepe_merchant_transaction_id = models.CharField(max_length=200, blank=True)
phonepe_transaction_id = models.CharField(max_length=200, blank=True)
phonepe_payment_instrument = models.CharField(max_length=100, blank=True)
phonepe_response_code = models.CharField(max_length=50, blank=True)
```

### 3. API Endpoint Updates

**Endpoints to Update:**
- `/api/checkout/initiate/` - Replace Razorpay order creation
- `/api/checkout/verify-payment/` - Replace Razorpay verification
- `/api/checkout/payment-failed/` - Update error handling
- `/api/webhooks/phonepe/` - New webhook endpoint

### 4. Configuration Management

**Settings Structure:**

```python
# PhonePe Configuration
PHONEPE_MERCHANT_ID = os.getenv('PHONEPE_MERCHANT_ID', '')
PHONEPE_SALT_KEY = os.getenv('PHONEPE_SALT_KEY', '')
PHONEPE_SALT_INDEX = os.getenv('PHONEPE_SALT_INDEX', '1')
PHONEPE_BASE_URL = os.getenv('PHONEPE_BASE_URL', 'https://api-preprod.phonepe.com/apis/pg-sandbox')
PHONEPE_REDIRECT_URL = f'{SITE_DOMAIN}/payment/success/'
PHONEPE_CALLBACK_URL = f'{SITE_DOMAIN}/api/webhooks/phonepe/'
```

## Data Models

### Updated Order Model

```python
class Order(models.Model):
    # ... existing fields ...
    
    # PhonePe payment fields (replacing Razorpay)
    phonepe_merchant_transaction_id = models.CharField(
        max_length=200, 
        blank=True, 
        help_text='PhonePe merchant transaction ID'
    )
    phonepe_transaction_id = models.CharField(
        max_length=200, 
        blank=True, 
        help_text='PhonePe transaction ID'
    )
    phonepe_payment_instrument = models.CharField(
        max_length=100, 
        blank=True, 
        help_text='Payment method used (UPI, CARD, etc.)'
    )
    phonepe_response_code = models.CharField(
        max_length=50, 
        blank=True, 
        help_text='PhonePe response code'
    )
    
    # Keep old Razorpay fields for backward compatibility (mark as deprecated)
    razorpay_order_id = models.CharField(
        max_length=200, 
        blank=True, 
        help_text='[DEPRECATED] Razorpay order ID'
    )
    razorpay_payment_id = models.CharField(
        max_length=200, 
        blank=True, 
        help_text='[DEPRECATED] Razorpay payment ID'
    )
    razorpay_signature = models.CharField(
        max_length=500, 
        blank=True, 
        help_text='[DEPRECATED] Razorpay payment signature'
    )
```

## Error Handling

### Exception Hierarchy

```python
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
```

### Error Response Mapping

```python
PHONEPE_ERROR_CODES = {
    'PAYMENT_ERROR': 'Payment processing failed',
    'PAYMENT_DECLINED': 'Payment was declined by bank',
    'INSUFFICIENT_FUNDS': 'Insufficient funds in account',
    'TRANSACTION_TIMEOUT': 'Transaction timed out',
    'INVALID_REQUEST': 'Invalid payment request',
    'MERCHANT_ERROR': 'Merchant configuration error',
}
```

## Testing Strategy

### 1. Unit Tests

**Test Coverage:**
- PhonePe service methods
- Payment request creation
- Signature verification
- Webhook processing
- Error handling scenarios

### 2. Integration Tests

**Test Scenarios:**
- End-to-end payment flow
- Webhook notification handling
- Refund processing
- Error recovery mechanisms

### 3. API Tests

**Endpoint Testing:**
- Payment initiation API
- Payment verification API
- Webhook endpoint
- Error response validation

### 4. Database Migration Tests

**Migration Validation:**
- Schema migration success
- Data preservation
- Backward compatibility
- Performance impact

## Security Considerations

### 1. Checksum Generation

PhonePe uses SHA256 HMAC for request authentication:

```python
def generate_checksum(self, payload, endpoint):
    """
    Generate X-VERIFY header for PhonePe API
    Format: SHA256(base64(payload) + endpoint + salt_key) + ### + salt_index
    """
    base64_payload = base64.b64encode(payload.encode()).decode()
    string_to_hash = base64_payload + endpoint + self.salt_key
    sha256_hash = hashlib.sha256(string_to_hash.encode()).hexdigest()
    return f"{sha256_hash}###{self.salt_index}"
```

### 2. Webhook Verification

```python
def verify_webhook_signature(self, response_body, x_verify_header):
    """
    Verify webhook signature from PhonePe
    """
    expected_checksum = self.generate_checksum(response_body, "/pg/v1/status")
    return hmac.compare_digest(expected_checksum, x_verify_header)
```

### 3. Data Encryption

- Store sensitive PhonePe credentials in environment variables
- Use Django's encryption for storing transaction details
- Implement proper access controls for payment data

## Performance Considerations

### 1. API Response Times

- PhonePe API calls should complete within 30 seconds
- Implement timeout handling for all external calls
- Use connection pooling for better performance

### 2. Database Optimization

- Index PhonePe transaction fields for faster lookups
- Implement proper database connection management
- Use database transactions for payment operations

### 3. Caching Strategy

- Cache PhonePe configuration settings
- Implement Redis caching for payment status checks
- Use appropriate cache invalidation strategies

## Migration Strategy

### Phase 1: Preparation
1. Create PhonePe service class
2. Add new database fields
3. Update configuration settings
4. Implement unit tests

### Phase 2: Integration
1. Update API endpoints
2. Implement webhook handling
3. Add error handling
4. Create integration tests

### Phase 3: Migration
1. Run database migration
2. Deploy new code
3. Update environment variables
4. Test in staging environment

### Phase 4: Deployment
1. Deploy to production
2. Monitor payment flows
3. Validate transaction processing
4. Update documentation

## Monitoring and Logging

### 1. Payment Metrics

- Payment success/failure rates
- Average payment processing time
- Error frequency by type
- Refund processing metrics

### 2. Logging Strategy

```python
# Payment processing logs
logger.info(f"PhonePe payment initiated: {merchant_transaction_id}")
logger.info(f"Payment verification successful: {transaction_id}")
logger.error(f"Payment failed: {error_code} - {error_message}")

# Webhook processing logs
logger.info(f"Webhook received: {transaction_id}")
logger.warning(f"Webhook signature verification failed")
```

### 3. Alerting

- Set up alerts for payment failures
- Monitor webhook processing errors
- Track unusual payment patterns
- Alert on configuration issues

## Rollback Plan

### Emergency Rollback

If critical issues arise:

1. **Immediate Actions:**
   - Revert to previous deployment
   - Restore Razorpay configuration
   - Update DNS/load balancer settings

2. **Data Recovery:**
   - Restore database from backup
   - Reconcile any pending transactions
   - Update payment status manually if needed

3. **Communication:**
   - Notify stakeholders
   - Update status page
   - Communicate with customers if needed

### Gradual Rollback

For non-critical issues:

1. **Feature Flags:**
   - Use feature flags to switch between gateways
   - Gradually migrate traffic
   - Monitor performance metrics

2. **A/B Testing:**
   - Split traffic between Razorpay and PhonePe
   - Compare success rates
   - Make data-driven decisions

## Documentation Updates

### 1. API Documentation

- Update payment API documentation
- Add PhonePe-specific examples
- Document error codes and responses
- Update integration guides

### 2. Deployment Documentation

- Update environment setup guides
- Document configuration requirements
- Add troubleshooting guides
- Update monitoring procedures

### 3. Developer Documentation

- Update code comments
- Add PhonePe integration examples
- Document testing procedures
- Update architecture diagrams