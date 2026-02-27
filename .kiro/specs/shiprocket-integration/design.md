# Shiprocket Integration Design Document

## Overview

This document outlines the technical design for integrating Shiprocket API into the Django-based gift e-commerce platform. The integration will provide automated shipping management, real-time rate calculation, order fulfillment tracking, and delivery management capabilities.

### Key Integration Points

- **Order Management**: Automatic synchronization of orders to Shiprocket after payment confirmation
- **Shipping Rates**: Real-time courier service and rate calculation during checkout
- **Label Generation**: Automated shipping label creation and AWB number assignment
- **Tracking**: Real-time shipment status updates and customer tracking interface
- **Webhooks**: Event-driven updates from Shiprocket for order status changes
- **Returns**: Reverse logistics management for returns and exchanges

### Technology Stack

- **Backend**: Django 4.x with Django REST Framework (for webhook endpoints)
- **HTTP Client**: `requests` library for API communication
- **Caching**: Django cache framework (Redis recommended for production)
- **Task Queue**: Celery with Redis broker (for async operations)
- **Database**: Existing SQLite (development) / PostgreSQL (production)

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Django App    │
│                 │
│  ┌───────────┐  │
│  │  Views    │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │ Services  │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │Shiprocket │  │
│  │  Client   │  │
│  └─────┬─────┘  │
│        │        │
└────────┼────────┘
         │
         │ HTTPS
         │
    ┌────▼────┐
    │Shiprocket│
    │   API   │
    └────┬────┘
         │
         │ Webhooks
         │
┌────────▼────────┐
│  Webhook        │
│  Endpoint       │
└─────────────────┘
```

### Component Diagram

```
gift/
├── shipping/
│   ├── __init__.py
│   ├── shiprocket_client.py    # API client wrapper
│   ├── services.py              # Business logic layer
│   ├── webhooks.py              # Webhook handlers
│   ├── tasks.py                 # Celery async tasks
│   ├── models.py                # Shipment models
│   ├── admin.py                 # Admin interface
│   └── utils.py                 # Helper functions
```



## Components and Interfaces

### 1. Shiprocket API Client (`shiprocket_client.py`)

Core wrapper for all Shiprocket API interactions with authentication, error handling, and retry logic.

**Class: ShiprocketClient**

```python
class ShiprocketClient:
    """
    Low-level API client for Shiprocket
    Handles authentication, requests, and error handling
    """
    
    def __init__(self):
        self.base_url = settings.SHIPROCKET_API_URL
        self.email = settings.SHIPROCKET_EMAIL
        self.password = settings.SHIPROCKET_PASSWORD
        self.token = None
        self.token_expiry = None
    
    # Authentication
    def authenticate(self) -> str
    def refresh_token(self) -> str
    def _ensure_authenticated(self) -> None
    
    # Order Management
    def create_order(self, order_data: dict) -> dict
    def get_order(self, order_id: str) -> dict
    def cancel_order(self, order_ids: list) -> dict
    
    # Shipping Rates
    def get_courier_serviceability(self, pickup_pincode: str, 
                                   delivery_pincode: str,
                                   weight: float, 
                                   cod: bool = False,
                                   declared_value: float = 0) -> dict
    
    # Shipment Management
    def create_shipment(self, shipment_data: dict) -> dict
    def generate_awb(self, shipment_id: int, courier_id: int) -> dict
    def generate_label(self, shipment_ids: list) -> dict
    def generate_manifest(self, shipment_ids: list) -> dict
    
    # Tracking
    def track_shipment(self, awb_code: str) -> dict
    def track_by_order_id(self, order_id: str) -> dict
    
    # Returns
    def create_return(self, return_data: dict) -> dict
    
    # Pickup Management
    def schedule_pickup(self, shipment_ids: list) -> dict
    
    # Utility Methods
    def _make_request(self, method: str, endpoint: str, 
                     data: dict = None, params: dict = None) -> dict
    def _handle_error(self, response: requests.Response) -> None
```

**Key Features:**
- Token-based authentication with automatic refresh
- Exponential backoff retry logic for failed requests
- Comprehensive error handling with custom exceptions
- Request/response logging for debugging
- Rate limiting protection



### 2. Service Layer (`services.py`)

Business logic layer that orchestrates Shiprocket operations with the Django application.

**Class: ShippingService**

```python
class ShippingService:
    """
    High-level service for shipping operations
    Integrates Shiprocket with Django models
    """
    
    def __init__(self):
        self.client = ShiprocketClient()
    
    # Order Synchronization
    def sync_order_to_shiprocket(self, order: Order) -> Shipment
    def update_order_in_shiprocket(self, order: Order) -> bool
    
    # Rate Calculation
    def get_shipping_rates(self, cart: Cart, pincode: str) -> list
    def calculate_best_rate(self, rates: list, preference: str = 'cost') -> dict
    
    # Shipment Creation
    def create_shipment_for_order(self, order: Order, 
                                  courier_id: int = None) -> Shipment
    def generate_shipping_label(self, shipment: Shipment) -> str
    
    # Tracking
    def get_tracking_info(self, shipment: Shipment) -> dict
    def update_shipment_status(self, shipment: Shipment) -> bool
    
    # Returns
    def create_return_shipment(self, return_request: ReturnRequest) -> dict
    
    # Cancellation
    def cancel_shipment(self, shipment: Shipment) -> bool
    
    # Utility
    def _prepare_order_payload(self, order: Order) -> dict
    def _prepare_shipment_payload(self, order: Order) -> dict
    def _calculate_package_weight(self, order: Order) -> float
    def _get_package_dimensions(self, order: Order) -> dict
```

**Key Responsibilities:**
- Transform Django models to Shiprocket API format
- Handle business logic and validation
- Manage database transactions
- Cache frequently accessed data
- Trigger notifications and webhooks



### 3. Webhook Handler (`webhooks.py`)

Processes real-time updates from Shiprocket via webhooks.

**Views and Handlers**

```python
@csrf_exempt
def shiprocket_webhook(request):
    """
    Main webhook endpoint for Shiprocket events
    URL: /api/webhooks/shiprocket/
    """
    # Verify webhook signature
    # Parse payload
    # Route to appropriate handler
    # Return 200 OK

class WebhookHandler:
    """Processes different webhook event types"""
    
    def handle_order_status_update(self, payload: dict) -> None
    def handle_shipment_status_update(self, payload: dict) -> None
    def handle_pickup_scheduled(self, payload: dict) -> None
    def handle_delivery_completed(self, payload: dict) -> None
    def handle_return_initiated(self, payload: dict) -> None
    
    def _verify_signature(self, request: HttpRequest) -> bool
    def _send_customer_notification(self, order: Order, status: str) -> None
```

**Webhook Events Handled:**
- Order status changes (confirmed, cancelled)
- Shipment status updates (picked up, in transit, out for delivery)
- Delivery confirmation
- Return/RTO (Return to Origin) updates
- Pickup scheduling confirmations



### 4. Async Tasks (`tasks.py`)

Celery tasks for background processing to avoid blocking user requests.

```python
@shared_task(bind=True, max_retries=3)
def sync_order_to_shiprocket_task(self, order_id: int):
    """Async task to sync order to Shiprocket"""
    
@shared_task
def update_shipment_tracking_task(shipment_id: int):
    """Fetch and update tracking information"""
    
@shared_task
def generate_shipping_labels_batch(shipment_ids: list):
    """Generate labels for multiple shipments"""
    
@shared_task
def refresh_shipping_rates_cache():
    """Periodic task to refresh cached shipping rates"""
    
@shared_task
def sync_pending_orders():
    """Retry failed order synchronizations"""
```

**Task Scheduling:**
- Immediate: Order sync after payment confirmation
- Periodic: Tracking updates every 2 hours
- Periodic: Rate cache refresh every 6 hours
- Periodic: Retry failed syncs every 30 minutes



## Data Models

### New Models (`shipping/models.py`)

**1. Shipment Model**

```python
class Shipment(models.Model):
    """Represents a shipment created in Shiprocket"""
    
    # Relations
    order = models.OneToOneField(Order, on_delete=models.CASCADE, 
                                 related_name='shipment')
    
    # Shiprocket IDs
    shiprocket_order_id = models.CharField(max_length=50, unique=True)
    shiprocket_shipment_id = models.CharField(max_length=50, blank=True)
    awb_code = models.CharField(max_length=50, blank=True, db_index=True)
    
    # Courier Information
    courier_id = models.IntegerField(null=True, blank=True)
    courier_name = models.CharField(max_length=100, blank=True)
    
    # Shipping Details
    pickup_scheduled_date = models.DateTimeField(null=True, blank=True)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=50, default='pending')
    current_status = models.CharField(max_length=100, blank=True)
    
    # Documents
    label_url = models.URLField(blank=True)
    manifest_url = models.URLField(blank=True)
    invoice_url = models.URLField(blank=True)
    
    # Tracking
    last_tracking_update = models.DateTimeField(null=True, blank=True)
    tracking_data = models.JSONField(default=dict, blank=True)
    
    # Metadata
    sync_status = models.CharField(max_length=20, default='pending',
                                   choices=[
                                       ('pending', 'Pending'),
                                       ('synced', 'Synced'),
                                       ('failed', 'Failed'),
                                   ])
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['awb_code']),
            models.Index(fields=['status']),
            models.Index(fields=['sync_status']),
        ]
```

**2. ShippingRate Model (Cache)**

```python
class ShippingRate(models.Model):
    """Cached shipping rates for faster checkout"""
    
    pickup_pincode = models.CharField(max_length=10)
    delivery_pincode = models.CharField(max_length=10)
    weight = models.DecimalField(max_digits=8, decimal_places=2)
    
    courier_id = models.IntegerField()
    courier_name = models.CharField(max_length=100)
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_delivery_days = models.IntegerField()
    cod_available = models.BooleanField(default=False)
    
    # Cache metadata
    cached_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        indexes = [
            models.Index(fields=['pickup_pincode', 'delivery_pincode', 'weight']),
        ]
```

**3. WebhookLog Model**

```python
class WebhookLog(models.Model):
    """Log all webhook events for debugging"""
    
    event_type = models.CharField(max_length=50)
    payload = models.JSONField()
    processed = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
```

### Modified Existing Models

**Order Model Extensions**

Add these fields to existing `Order` model:

```python
# Add to Order model
shiprocket_synced = models.BooleanField(default=False)
shiprocket_sync_error = models.TextField(blank=True)
```

**Product Model Extensions**

Ensure these fields exist (already present):
- `weight` (in grams)
- `dimensions` (LxWxH in cm)



## API Integration Details

### Authentication Flow

```
1. Application starts
2. ShiprocketClient initializes
3. On first API call:
   - POST /v1/external/auth/login
   - Credentials: email + password
   - Response: { "token": "...", "expires_in": 864000 }
4. Store token in memory/cache
5. Include token in all subsequent requests:
   - Header: Authorization: Bearer {token}
6. On 401 error: refresh token and retry
```

### Order Sync Payload

```json
{
  "order_id": "ORD00001234",
  "order_date": "2026-02-11 14:30:00",
  "pickup_location": "Primary",
  "channel_id": "",
  "comment": "Handle with care",
  "billing_customer_name": "John Doe",
  "billing_last_name": "",
  "billing_address": "123 Main St",
  "billing_address_2": "Apt 4B",
  "billing_city": "Mumbai",
  "billing_pincode": "400001",
  "billing_state": "Maharashtra",
  "billing_country": "India",
  "billing_email": "john@example.com",
  "billing_phone": "9876543210",
  "shipping_is_billing": true,
  "order_items": [
    {
      "name": "Gift Box Premium",
      "sku": "GIFT12345678",
      "units": 2,
      "selling_price": "999.00",
      "discount": "100.00",
      "tax": "",
      "hsn": ""
    }
  ],
  "payment_method": "Prepaid",
  "shipping_charges": "50.00",
  "giftwrap_charges": "0",
  "transaction_charges": "0",
  "total_discount": "100.00",
  "sub_total": "1998.00",
  "length": "20",
  "breadth": "15",
  "height": "10",
  "weight": "1.5"
}
```

### Rate Calculation Request

```json
{
  "pickup_postcode": "110001",
  "delivery_postcode": "400001",
  "weight": "1.5",
  "cod": 0,
  "declared_value": 1998
}
```

### Rate Calculation Response

```json
{
  "data": {
    "available_courier_companies": [
      {
        "courier_company_id": 12,
        "courier_name": "Delhivery Surface",
        "rate": 45.50,
        "estimated_delivery_days": "3-5",
        "cod": 1,
        "rating": 4.5
      },
      {
        "courier_company_id": 24,
        "courier_name": "Blue Dart",
        "rate": 85.00,
        "estimated_delivery_days": "1-2",
        "cod": 1,
        "rating": 4.8
      }
    ]
  }
}
```

### Tracking Response

```json
{
  "tracking_data": {
    "track_status": 1,
    "shipment_status": "Delivered",
    "shipment_track": [
      {
        "id": 1,
        "awb_code": "1234567890",
        "courier_company_id": 12,
        "shipment_status": "Picked Up",
        "current_timestamp": "2026-02-11 10:30:00",
        "edd": "2026-02-14",
        "scans": [
          {
            "date": "2026-02-11 10:30:00",
            "activity": "Shipment picked up",
            "location": "Mumbai Hub"
          },
          {
            "date": "2026-02-11 18:45:00",
            "activity": "In transit",
            "location": "Delhi Hub"
          }
        ]
      }
    ]
  }
}
```



## Integration Workflows

### 1. Order Placement Flow

```
Customer completes checkout
         ↓
Payment confirmed
         ↓
Order created in database
         ↓
Trigger: sync_order_to_shiprocket_task (async)
         ↓
ShippingService.sync_order_to_shiprocket()
         ↓
ShiprocketClient.create_order()
         ↓
Create Shipment record
         ↓
Update Order.shiprocket_synced = True
         ↓
Send confirmation email to customer
```

### 2. Shipping Rate Calculation Flow (Checkout)

```
Customer enters pincode
         ↓
Check cache for rates
         ↓
Cache hit? → Return cached rates
         ↓
Cache miss:
  ↓
  Calculate cart weight & dimensions
  ↓
  ShiprocketClient.get_courier_serviceability()
  ↓
  Cache rates (15 min TTL)
  ↓
  Return rates to frontend
         ↓
Display courier options with prices
         ↓
Customer selects courier
         ↓
Update order with selected courier_id
```

### 3. Shipment Creation Flow

```
Admin clicks "Create Shipment"
         ↓
ShippingService.create_shipment_for_order()
         ↓
ShiprocketClient.create_shipment()
         ↓
ShiprocketClient.generate_awb()
         ↓
ShiprocketClient.generate_label()
         ↓
Update Shipment record:
  - awb_code
  - label_url
  - status = 'ready_to_ship'
         ↓
Update Order.status = 'processing'
         ↓
Notify customer with tracking number
```

### 4. Tracking Update Flow

```
Periodic Task (every 2 hours)
         ↓
Get all active shipments
         ↓
For each shipment:
  ↓
  ShiprocketClient.track_shipment(awb)
  ↓
  Parse tracking data
  ↓
  Update Shipment.tracking_data
  ↓
  If status changed:
    ↓
    Update Order.status
    ↓
    Send notification to customer
    ↓
    If delivered:
      ↓
      Mark shipment as complete
      ↓
      Trigger review request email
```

### 5. Webhook Processing Flow

```
Shiprocket sends webhook
         ↓
POST /api/webhooks/shiprocket/
         ↓
Verify signature
         ↓
Log webhook in WebhookLog
         ↓
Parse event type
         ↓
Route to handler:
  - order_status_update
  - shipment_status_update
  - delivery_completed
  - return_initiated
         ↓
Update database
         ↓
Send customer notification
         ↓
Return 200 OK
```

### 6. Return Creation Flow

```
Customer requests return
         ↓
Create ReturnRequest in database
         ↓
Admin approves return
         ↓
ShippingService.create_return_shipment()
         ↓
ShiprocketClient.create_return()
         ↓
Schedule pickup
         ↓
Update ReturnRequest with tracking
         ↓
Notify customer with pickup details
```



## Error Handling

### Error Categories and Strategies

**1. Authentication Errors (401)**
- Strategy: Automatic token refresh and retry
- Max retries: 2
- Fallback: Log error, notify admin

**2. Rate Limiting (429)**
- Strategy: Exponential backoff
- Wait times: 1s, 2s, 4s, 8s
- Max retries: 4
- Fallback: Queue for later processing

**3. Validation Errors (400)**
- Strategy: Log detailed error, no retry
- Action: Store error in Shipment.error_message
- Notification: Alert admin for manual review

**4. Server Errors (500, 502, 503)**
- Strategy: Retry with exponential backoff
- Max retries: 3
- Fallback: Queue for background retry task

**5. Network Errors (Timeout, Connection)**
- Strategy: Retry immediately once, then queue
- Timeout: 30 seconds for standard calls, 60s for label generation
- Fallback: Background task retry

**6. Business Logic Errors**
- Invalid pincode: Show user-friendly error
- Out of serviceability: Offer alternative pincodes or contact support
- Insufficient stock: Prevent order creation
- Missing product dimensions: Use default values from settings

### Error Logging

```python
class ShiprocketError(Exception):
    """Base exception for Shiprocket errors"""
    pass

class AuthenticationError(ShiprocketError):
    """Authentication failed"""
    pass

class RateLimitError(ShiprocketError):
    """Rate limit exceeded"""
    pass

class ValidationError(ShiprocketError):
    """Invalid data provided"""
    pass

class ServiceabilityError(ShiprocketError):
    """Delivery not available to pincode"""
    pass
```

### Logging Configuration

```python
LOGGING = {
    'loggers': {
        'shiprocket': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'handlers': {
        'file': {
            'filename': 'logs/shiprocket.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
        },
    },
}
```



## Configuration

### Settings Configuration (`settings.py`)

```python
# ============================================================================
# SHIPROCKET CONFIGURATION
# ============================================================================

# API Credentials (use environment variables in production)
SHIPROCKET_EMAIL = os.getenv('SHIPROCKET_EMAIL', '')
SHIPROCKET_PASSWORD = os.getenv('SHIPROCKET_PASSWORD', '')
SHIPROCKET_API_URL = 'https://apiv2.shiprocket.in/v1/external'

# Test/Production Mode
SHIPROCKET_TEST_MODE = DEBUG  # Use test credentials in development

# Pickup Location
SHIPROCKET_PICKUP_LOCATION = 'Primary'  # Must match Shiprocket account

# Default Package Settings
SHIPROCKET_DEFAULT_WEIGHT = 0.5  # kg (if product weight missing)
SHIPROCKET_DEFAULT_DIMENSIONS = {
    'length': 20,  # cm
    'breadth': 15,  # cm
    'height': 10,  # cm
}

# Courier Preferences
SHIPROCKET_COURIER_PREFERENCE = 'cost'  # Options: 'cost', 'speed', 'rating'
SHIPROCKET_PREFERRED_COURIERS = []  # List of courier IDs to prefer

# Rate Calculation
SHIPROCKET_RATE_CACHE_TTL = 900  # 15 minutes
SHIPROCKET_ENABLE_COD = True

# Webhook Configuration
SHIPROCKET_WEBHOOK_SECRET = os.getenv('SHIPROCKET_WEBHOOK_SECRET', '')
SHIPROCKET_WEBHOOK_URL = f'{SITE_DOMAIN}/api/webhooks/shiprocket/'

# Retry Configuration
SHIPROCKET_MAX_RETRIES = 3
SHIPROCKET_RETRY_DELAY = 2  # seconds
SHIPROCKET_TIMEOUT = 30  # seconds

# Background Tasks
SHIPROCKET_TRACKING_UPDATE_INTERVAL = 7200  # 2 hours
SHIPROCKET_RATE_CACHE_REFRESH_INTERVAL = 21600  # 6 hours

# Notifications
SHIPROCKET_NOTIFY_ON_SYNC_FAILURE = True
SHIPROCKET_ADMIN_EMAIL = 'admin@giftshop.com'

# Logging
SHIPROCKET_LOG_REQUESTS = DEBUG
SHIPROCKET_LOG_RESPONSES = DEBUG
```

### Environment Variables (`.env`)

```bash
# Shiprocket Credentials
SHIPROCKET_EMAIL=your-email@example.com
SHIPROCKET_PASSWORD=your-secure-password
SHIPROCKET_WEBHOOK_SECRET=your-webhook-secret

# Optional: Override defaults
SHIPROCKET_PICKUP_LOCATION=Primary
SHIPROCKET_COURIER_PREFERENCE=cost
```

### Celery Configuration

```python
# Celery Beat Schedule
CELERY_BEAT_SCHEDULE = {
    'update-shipment-tracking': {
        'task': 'gift.shipping.tasks.update_all_shipments_tracking',
        'schedule': crontab(minute='*/120'),  # Every 2 hours
    },
    'refresh-shipping-rates-cache': {
        'task': 'gift.shipping.tasks.refresh_shipping_rates_cache',
        'schedule': crontab(hour='*/6'),  # Every 6 hours
    },
    'retry-failed-syncs': {
        'task': 'gift.shipping.tasks.sync_pending_orders',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
}
```



## Testing Strategy

### Unit Tests

**Test Coverage Areas:**
1. ShiprocketClient methods
   - Authentication flow
   - API request/response handling
   - Error handling and retries
   - Token refresh logic

2. ShippingService methods
   - Order payload preparation
   - Rate calculation logic
   - Shipment creation workflow
   - Data transformation

3. Webhook handlers
   - Signature verification
   - Event routing
   - Database updates
   - Notification triggers

**Mock Strategy:**
- Mock all external API calls using `responses` library
- Use fixtures for API response data
- Test both success and failure scenarios

### Integration Tests

**Test Scenarios:**
1. End-to-end order sync
2. Rate calculation with real pincodes
3. Shipment creation and label generation
4. Webhook processing
5. Tracking updates

**Test Environment:**
- Use Shiprocket test/sandbox environment
- Separate test database
- Mock email notifications

### Manual Testing Checklist

- [ ] Order sync after payment confirmation
- [ ] Rate calculation at checkout
- [ ] Shipment creation from admin
- [ ] Label PDF generation and download
- [ ] Tracking page displays correct information
- [ ] Webhook updates order status
- [ ] Return creation workflow
- [ ] Error handling for invalid pincodes
- [ ] COD vs Prepaid order handling
- [ ] Multi-item order weight calculation



## Security Considerations

### API Credentials
- Store credentials in environment variables, never in code
- Use Django's `SECRET_KEY` for encrypting sensitive data
- Rotate credentials periodically
- Use separate credentials for test and production

### Webhook Security
- Verify webhook signatures using HMAC
- Validate webhook source IP (if Shiprocket provides IP whitelist)
- Log all webhook attempts for audit
- Rate limit webhook endpoint to prevent abuse

### Data Privacy
- Do not log sensitive customer data (full addresses, phone numbers)
- Mask PII in logs and error messages
- Comply with data retention policies
- Secure label PDFs (require authentication to download)

### API Rate Limiting
- Implement client-side rate limiting
- Use exponential backoff for retries
- Queue requests during high traffic
- Monitor API usage to avoid hitting limits

### Error Messages
- Do not expose internal errors to customers
- Sanitize error messages before displaying
- Log detailed errors server-side only
- Provide generic user-friendly messages



## Performance Optimization

### Caching Strategy

**1. Shipping Rates Cache**
- Cache key: `shipping_rate:{pickup_pin}:{delivery_pin}:{weight}`
- TTL: 15 minutes
- Backend: Redis (production) / LocMem (development)
- Invalidation: Automatic expiry

**2. Authentication Token Cache**
- Cache key: `shiprocket_auth_token`
- TTL: Based on token expiry (typically 10 days)
- Backend: Redis
- Invalidation: On 401 error

**3. Tracking Data Cache**
- Cache key: `shipment_tracking:{awb_code}`
- TTL: 30 minutes
- Backend: Redis
- Invalidation: On webhook update

### Database Optimization

**Indexes:**
```python
# Shipment model indexes
- awb_code (for tracking lookups)
- status (for filtering active shipments)
- sync_status (for retry queries)
- created_at (for date range queries)

# ShippingRate model indexes
- (pickup_pincode, delivery_pincode, weight) composite
```

**Query Optimization:**
- Use `select_related()` for order-shipment queries
- Use `prefetch_related()` for order items
- Limit tracking history to last 30 days
- Archive old shipment data

### Async Processing

**Background Tasks:**
- Order sync (immediate, async)
- Tracking updates (periodic, async)
- Label generation (async for bulk operations)
- Webhook processing (sync, but fast)

**Task Priorities:**
- High: Order sync, webhook processing
- Medium: Tracking updates
- Low: Cache refresh, cleanup tasks

### API Call Optimization

**Batch Operations:**
- Generate labels for multiple shipments in one call
- Bulk tracking updates
- Batch webhook processing

**Request Pooling:**
- Reuse HTTP connections
- Connection pooling with `requests.Session()`
- Keep-alive connections



## Admin Interface

### Django Admin Customization

**Shipment Admin**

```python
@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ['order', 'awb_code', 'courier_name', 'status', 
                    'sync_status', 'created_at']
    list_filter = ['status', 'sync_status', 'courier_name', 'created_at']
    search_fields = ['awb_code', 'order__order_id', 'shiprocket_order_id']
    readonly_fields = ['shiprocket_order_id', 'shiprocket_shipment_id', 
                       'awb_code', 'created_at', 'updated_at']
    
    actions = ['sync_to_shiprocket', 'generate_labels', 'update_tracking',
               'download_labels']
    
    fieldsets = [
        ('Order Information', {
            'fields': ['order', 'sync_status', 'error_message']
        }),
        ('Shiprocket Details', {
            'fields': ['shiprocket_order_id', 'shiprocket_shipment_id', 
                      'awb_code', 'courier_id', 'courier_name']
        }),
        ('Shipping Details', {
            'fields': ['status', 'pickup_scheduled_date', 
                      'estimated_delivery_date', 'actual_delivery_date']
        }),
        ('Documents', {
            'fields': ['label_url', 'manifest_url', 'invoice_url']
        }),
        ('Tracking', {
            'fields': ['last_tracking_update', 'tracking_data']
        }),
    ]
    
    def sync_to_shiprocket(self, request, queryset):
        """Bulk sync orders to Shiprocket"""
        
    def generate_labels(self, request, queryset):
        """Generate shipping labels"""
        
    def update_tracking(self, request, queryset):
        """Update tracking information"""
        
    def download_labels(self, request, queryset):
        """Download labels as ZIP"""
```

**Order Admin Enhancement**

Add inline for Shipment in Order admin:

```python
class ShipmentInline(admin.StackedInline):
    model = Shipment
    extra = 0
    readonly_fields = ['shiprocket_order_id', 'awb_code', 'label_url']
    can_delete = False
```

### Custom Admin Views

**Shipping Dashboard**
- URL: `/admin/shipping/dashboard/`
- Displays:
  - Pending syncs count
  - Active shipments count
  - Failed syncs requiring attention
  - Recent tracking updates
  - Courier performance metrics

**Bulk Operations Page**
- URL: `/admin/shipping/bulk-operations/`
- Features:
  - Bulk order sync
  - Bulk label generation
  - Bulk tracking update
  - Export shipment data



## User Interface Updates

### Checkout Page Enhancements

**Shipping Rate Selection**

```html
<!-- Display courier options -->
<div class="shipping-options">
    <h4>Select Shipping Method</h4>
    {% for rate in shipping_rates %}
    <div class="shipping-option">
        <input type="radio" name="courier_id" value="{{ rate.courier_id }}" 
               data-rate="{{ rate.rate }}" required>
        <div class="courier-info">
            <strong>{{ rate.courier_name }}</strong>
            <span class="delivery-time">{{ rate.estimated_delivery_days }} days</span>
            <span class="price">₹{{ rate.rate }}</span>
        </div>
    </div>
    {% endfor %}
</div>
```

**Pincode Serviceability Check**

```javascript
// Real-time pincode validation
$('#pincode').on('blur', function() {
    const pincode = $(this).val();
    if (pincode.length === 6) {
        checkServiceability(pincode);
    }
});

function checkServiceability(pincode) {
    $.ajax({
        url: '/api/shipping/check-serviceability/',
        data: { pincode: pincode },
        success: function(response) {
            if (response.serviceable) {
                showShippingRates(response.rates);
            } else {
                showError('Delivery not available to this pincode');
            }
        }
    });
}
```

### Order Tracking Page

**Enhanced Tracking Display**

```html
<div class="tracking-container">
    <div class="tracking-header">
        <h2>Track Your Order</h2>
        <p>Order ID: {{ order.order_id }}</p>
        <p>AWB: {{ shipment.awb_code }}</p>
    </div>
    
    <div class="tracking-timeline">
        {% for scan in tracking_scans %}
        <div class="tracking-event {% if forloop.first %}active{% endif %}">
            <div class="event-icon">
                <i class="fas fa-{{ scan.icon }}"></i>
            </div>
            <div class="event-details">
                <h4>{{ scan.activity }}</h4>
                <p class="location">{{ scan.location }}</p>
                <p class="timestamp">{{ scan.date|date:"d M Y, h:i A" }}</p>
            </div>
        </div>
        {% endfor %}
    </div>
    
    <div class="estimated-delivery">
        <p>Estimated Delivery: <strong>{{ shipment.estimated_delivery_date|date:"d M Y" }}</strong></p>
    </div>
</div>
```

### Admin Order Detail Page

**Shipment Actions**

```html
<div class="shipment-actions">
    {% if not order.shipment %}
    <button class="btn btn-primary" onclick="createShipment({{ order.id }})">
        Create Shipment
    </button>
    {% else %}
    <a href="{{ order.shipment.label_url }}" class="btn btn-secondary" target="_blank">
        Download Label
    </a>
    <button class="btn btn-info" onclick="updateTracking({{ order.shipment.id }})">
        Update Tracking
    </button>
    {% endif %}
</div>
```



## Deployment Considerations

### Prerequisites

**Python Packages:**
```bash
pip install requests==2.31.0
pip install celery==5.3.4
pip install redis==5.0.1
pip install django-celery-beat==2.5.0
```

**System Requirements:**
- Redis server (for caching and Celery broker)
- Celery worker process
- Celery beat scheduler (for periodic tasks)

### Deployment Steps

**1. Install Dependencies**
```bash
pip install -r requirements.txt
```

**2. Configure Environment Variables**
```bash
# Add to .env or environment
export SHIPROCKET_EMAIL="your-email@example.com"
export SHIPROCKET_PASSWORD="your-password"
export SHIPROCKET_WEBHOOK_SECRET="your-secret"
```

**3. Run Migrations**
```bash
python manage.py makemigrations shipping
python manage.py migrate
```

**4. Configure Webhook in Shiprocket Dashboard**
- Login to Shiprocket account
- Go to Settings → Webhooks
- Add webhook URL: `https://yourdomain.com/api/webhooks/shiprocket/`
- Select events to subscribe
- Save webhook secret

**5. Start Background Services**
```bash
# Start Redis
redis-server

# Start Celery worker
celery -A gift_project worker -l info

# Start Celery beat
celery -A gift_project beat -l info
```

**6. Test Integration**
- Create test order
- Verify sync to Shiprocket
- Check webhook reception
- Test tracking updates

### Production Checklist

- [ ] Environment variables configured
- [ ] Redis server running and secured
- [ ] Celery workers running with supervisor/systemd
- [ ] Celery beat scheduler running
- [ ] Webhook URL accessible via HTTPS
- [ ] Webhook secret configured
- [ ] Shiprocket credentials verified
- [ ] Pickup location configured in Shiprocket
- [ ] Test order synced successfully
- [ ] Monitoring and alerting configured
- [ ] Log rotation configured
- [ ] Backup strategy for shipment data

### Monitoring

**Key Metrics to Monitor:**
- Order sync success rate
- API response times
- Failed sync count
- Webhook processing time
- Celery queue length
- Cache hit rate

**Alerting Rules:**
- Alert if sync failure rate > 5%
- Alert if API response time > 10s
- Alert if Celery queue > 100 tasks
- Alert if webhook endpoint returns errors



## Migration Strategy

### Phase 1: Setup and Testing (Week 1)
- Install dependencies
- Create models and migrations
- Implement ShiprocketClient
- Setup test environment
- Unit tests for client

### Phase 2: Core Integration (Week 2)
- Implement ShippingService
- Order sync functionality
- Rate calculation
- Admin interface
- Integration tests

### Phase 3: Advanced Features (Week 3)
- Webhook integration
- Tracking updates
- Celery tasks
- Label generation
- Return management

### Phase 4: UI Integration (Week 4)
- Checkout page updates
- Tracking page
- Admin enhancements
- Customer notifications
- End-to-end testing

### Phase 5: Production Deployment (Week 5)
- Production configuration
- Data migration (if needed)
- Monitoring setup
- Go-live
- Post-deployment monitoring

### Rollback Plan

If issues occur after deployment:
1. Disable Shiprocket sync via feature flag
2. Revert to manual shipping process
3. Fix issues in staging
4. Re-deploy with fixes

### Feature Flags

```python
# settings.py
SHIPROCKET_ENABLED = os.getenv('SHIPROCKET_ENABLED', 'False') == 'True'
SHIPROCKET_AUTO_SYNC = os.getenv('SHIPROCKET_AUTO_SYNC', 'False') == 'True'
SHIPROCKET_SHOW_RATES = os.getenv('SHIPROCKET_SHOW_RATES', 'False') == 'True'
```

This allows gradual rollout:
1. Enable integration but manual sync only
2. Enable auto-sync for new orders
3. Enable rate calculation at checkout
4. Full rollout



## Appendix

### API Endpoints Reference

**Shiprocket API Endpoints Used:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | Authenticate and get token |
| `/orders/create/adhoc` | POST | Create order in Shiprocket |
| `/courier/serviceability` | GET | Check courier availability and rates |
| `/shipments/create/forward-shipment` | POST | Create shipment |
| `/courier/assign/awb` | POST | Generate AWB number |
| `/shipments/label` | POST | Generate shipping label |
| `/courier/track/awb/{awb}` | GET | Track shipment by AWB |
| `/orders/cancel` | POST | Cancel order |
| `/orders/create/return` | POST | Create return order |

### Database Schema Diagram

```
┌─────────────┐
│    Order    │
│             │
│ - order_id  │
│ - status    │
│ - ...       │
└──────┬──────┘
       │ 1:1
       │
┌──────▼──────────────┐
│     Shipment        │
│                     │
│ - shiprocket_order_id
│ - awb_code          │
│ - courier_name      │
│ - status            │
│ - label_url         │
│ - tracking_data     │
└─────────────────────┘

┌─────────────────────┐
│   ShippingRate      │
│   (Cache)           │
│                     │
│ - pickup_pincode    │
│ - delivery_pincode  │
│ - weight            │
│ - courier_id        │
│ - rate              │
│ - cached_at         │
└─────────────────────┘

┌─────────────────────┐
│   WebhookLog        │
│                     │
│ - event_type        │
│ - payload           │
│ - processed         │
│ - created_at        │
└─────────────────────┘
```

### Useful Resources

- **Shiprocket API Documentation**: https://apidocs.shiprocket.in/
- **Shiprocket Dashboard**: https://app.shiprocket.in/
- **Support**: support@shiprocket.com
- **Developer Forum**: https://community.shiprocket.in/

### Glossary

- **AWB**: Air Waybill - Unique tracking number for shipment
- **COD**: Cash on Delivery
- **RTO**: Return to Origin - When delivery fails and package returns
- **NDR**: Non-Delivery Report - When delivery attempt fails
- **Manifest**: Document listing all shipments for pickup
- **Serviceability**: Whether delivery is available to a pincode
- **Forward Shipment**: Regular customer delivery
- **Reverse Shipment**: Return pickup from customer

