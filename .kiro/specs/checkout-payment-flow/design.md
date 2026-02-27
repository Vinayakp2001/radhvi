# Design Document: Checkout and Payment Flow

## Overview

This design document outlines the architecture and implementation approach for the checkout and payment system. The solution integrates Razorpay payment gateway with Django backend and Next.js frontend to provide a seamless purchase experience.

## Architecture

### System Components

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Next.js   │─────▶│    Django    │─────▶│  Razorpay   │
│   Frontend  │◀─────│   Backend    │◀─────│   Gateway   │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐      ┌──────────────┐
│  LocalStorage│      │  PostgreSQL  │
│   (Token)   │      │  (Orders DB) │
└─────────────┘      └──────────────┘
```

### Data Flow

1. User initiates checkout from cart
2. Frontend validates cart and user authentication
3. User enters/selects shipping address
4. Frontend sends order creation request to Django
5. Django creates order with "Pending" status
6. Django initiates Razorpay payment
7. Frontend displays Razorpay payment modal
8. User completes payment
9. Razorpay sends webhook to Django
10. Django verifies payment and updates order status
11. Frontend redirects to confirmation page

## Components and Interfaces

### Backend Models

#### Address Model
```python
class Address(models.Model):
    user = ForeignKey(User)
    full_name = CharField(max_length=200)
    phone = CharField(max_length=15)
    address_line1 = CharField(max_length=255)
    address_line2 = CharField(max_length=255, blank=True)
    city = CharField(max_length=100)
    state = CharField(max_length=100)
    pincode = CharField(max_length=10)
    is_default = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
```

#### Order Model
```python
class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('payment_confirmed', 'Payment Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    order_id = CharField(max_length=50, unique=True)
    user = ForeignKey(User)
    
    # Shipping Info
    shipping_address = ForeignKey(Address)
    
    # Order Details
    subtotal = DecimalField(max_digits=10, decimal_places=2)
    shipping_charge = DecimalField(max_digits=10, decimal_places=2)
    tax = DecimalField(max_digits=10, decimal_places=2)
    discount = DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = DecimalField(max_digits=10, decimal_places=2)
    
    # Payment Info
    payment_method = CharField(max_length=50)
    payment_id = CharField(max_length=200, blank=True)
    payment_status = CharField(max_length=50)
    razorpay_order_id = CharField(max_length=200, blank=True)
    razorpay_payment_id = CharField(max_length=200, blank=True)
    razorpay_signature = CharField(max_length=500, blank=True)
    
    # Status
    status = CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

#### OrderItem Model
```python
class OrderItem(models.Model):
    order = ForeignKey(Order, related_name='items')
    product = ForeignKey(Product)
    quantity = IntegerField()
    price = DecimalField(max_digits=10, decimal_places=2)
    total = DecimalField(max_digits=10, decimal_places=2)
```

### Backend API Endpoints

#### Address Management
- `GET /api/addresses/` - List user addresses
- `POST /api/addresses/` - Create new address
- `PUT /api/addresses/{id}/` - Update address
- `DELETE /api/addresses/{id}/` - Delete address
- `POST /api/addresses/{id}/set_default/` - Set as default

#### Checkout
- `POST /api/checkout/initiate/` - Create order and initiate payment
  - Request: `{cart_items, shipping_address_id, coupon_code?}`
  - Response: `{order_id, razorpay_order_id, amount, currency, key}`

- `POST /api/checkout/verify/` - Verify payment
  - Request: `{order_id, razorpay_payment_id, razorpay_signature}`
  - Response: `{success, order_id, message}`

- `POST /api/checkout/webhook/` - Razorpay webhook handler

#### Orders
- `GET /api/orders/` - List user orders
- `GET /api/orders/{order_id}/` - Get order details
- `POST /api/orders/{order_id}/cancel/` - Cancel order

### Frontend Pages

#### Checkout Page (`/checkout`)
```typescript
interface CheckoutPageState {
  cart: Cart;
  addresses: Address[];
  selectedAddress: Address | null;
  paymentMethod: string;
  loading: boolean;
  error: string | null;
}

Components:
- CheckoutSummary (cart items, totals)
- AddressSelector (select/add address)
- PaymentSection (payment method selection)
- PlaceOrderButton
```

#### Order Confirmation Page (`/orders/[orderId]/confirmation`)
```typescript
interface ConfirmationPageProps {
  order: Order;
}

Components:
- OrderSummary
- DeliveryInfo
- PaymentInfo
- ContinueShoppingButton
```

#### Orders Page (`/account/orders`)
```typescript
interface OrdersPageState {
  orders: Order[];
  loading: boolean;
  filter: 'all' | 'pending' | 'delivered';
}

Components:
- OrderList
- OrderCard
- OrderFilters
```

### Frontend Services

#### Checkout Service
```typescript
class CheckoutService {
  async initiateCheckout(data: CheckoutData): Promise<RazorpayOrder>
  async verifyPayment(data: PaymentVerification): Promise<Order>
  async getAddresses(): Promise<Address[]>
  async saveAddress(address: Address): Promise<Address>
}
```

#### Razorpay Integration
```typescript
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}
```

## Data Models

### Order Flow State Machine

```
┌─────────┐
│ Pending │
└────┬────┘
     │
     ▼
┌──────────────────┐
│ Payment Confirmed│
└────┬─────────────┘
     │
     ▼
┌────────────┐
│ Processing │
└────┬───────┘
     │
     ▼
┌─────────┐
│ Shipped │
└────┬────┘
     │
     ▼
┌───────────┐
│ Delivered │
└───────────┘

(Cancelled can happen from any state)
```

## Error Handling

### Payment Failures
- Network errors: Retry mechanism with exponential backoff
- Payment declined: Display user-friendly message, allow retry
- Signature verification failure: Log error, mark order as failed
- Webhook failures: Implement retry queue

### Order Creation Failures
- Database errors: Rollback transaction, notify user
- Inventory issues: Check stock before order creation
- Address validation: Validate before payment initiation

## Testing Strategy

### Unit Tests
- Order model methods
- Payment verification logic
- Address validation
- Price calculations

### Integration Tests
- Checkout flow end-to-end
- Payment gateway integration
- Webhook handling
- Order status transitions

### Frontend Tests
- Checkout form validation
- Payment modal integration
- Order confirmation display
- Error state handling

## Security Considerations

1. **Payment Security**
   - Use HTTPS for all transactions
   - Verify Razorpay signatures
   - Never store card details
   - Implement CSRF protection

2. **Order Security**
   - Validate user owns the cart
   - Verify order amounts match cart
   - Prevent duplicate orders
   - Rate limit checkout attempts

3. **Data Protection**
   - Encrypt sensitive data at rest
   - Sanitize user inputs
   - Implement proper authentication
   - Log security events

## Performance Optimization

1. **Database**
   - Index order_id, user_id, status fields
   - Use select_related for order items
   - Implement database connection pooling

2. **Frontend**
   - Lazy load Razorpay script
   - Cache address list
   - Optimize checkout page bundle size
   - Implement loading states

3. **API**
   - Implement response caching where appropriate
   - Use pagination for order lists
   - Optimize database queries

## Razorpay Configuration

### Environment Variables
```
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
```

### Webhook Events
- `payment.captured` - Payment successful
- `payment.failed` - Payment failed
- `order.paid` - Order paid

## Deployment Considerations

1. Configure Razorpay webhooks in production
2. Set up proper error monitoring (Sentry)
3. Configure email service for order confirmations
4. Set up backup payment gateway (optional)
5. Implement order export for fulfillment
