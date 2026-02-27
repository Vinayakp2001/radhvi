# Checkout & Payment System - Setup and Configuration Guide

## Overview
This guide covers the setup, configuration, security measures, and deployment preparation for the complete checkout and payment system.

---

## 1. Environment Configuration

### Django Backend Configuration

**File:** `gift_project/gift_project/settings.py`

Add the following configurations:

```python
# Razorpay Configuration
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'your_test_key_id')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'your_test_key_secret')

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'your-email@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', 'your-app-password')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@radhvigifts.com')

# Frontend URL (for emails and redirects)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Security Settings
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False') == 'True'
SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False') == 'True'
CSRF_COOKIE_SECURE = os.environ.get('CSRF_COOKIE_SECURE', 'False') == 'True'
```

### Next.js Frontend Configuration

**File:** `frontend/.env.local`

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# Optional: Analytics, etc.
```

---

## 2. Security Measures

### Rate Limiting

Install Django rate limiting:
```bash
pip install django-ratelimit
```

Add to payment endpoints in `gift/api/views.py`:
```python
from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='10/h', method='POST')
def checkout_initiate(request):
    # existing code
    pass
```

### CSRF Protection

Already enabled in Django. Ensure frontend sends CSRF token:
```typescript
// In frontend API calls
headers: {
  'X-CSRFToken': getCookie('csrftoken'),
}
```

### Input Validation

All serializers have validation. Additional checks:
- Pincode: 6 digits
- Phone: 10 digits
- Email: Valid format
- Amount: Positive numbers only

### Payment Security

- Razorpay signature verification implemented
- No sensitive data stored in frontend
- Payment IDs logged for audit trail
- Failed payments tracked

---

## 3. Testing Checklist

### Backend API Testing

**Razorpay Integration:**
```bash
# Test order creation
curl -X POST http://localhost:8000/api/checkout/initiate/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_address": {
      "name": "Test User",
      "phone": "9876543210",
      "address": "123 Test St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "courier_id": 1,
    "shipping_charge": 50
  }'
```

**Address API:**
```bash
# List addresses
curl http://localhost:8000/api/addresses/ \
  -H "Authorization: Token YOUR_TOKEN"

# Create address
curl -X POST http://localhost:8000/api/addresses/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "9876543210",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  }'
```

**Orders API:**
```bash
# List orders
curl http://localhost:8000/api/orders/ \
  -H "Authorization: Token YOUR_TOKEN"

# Get order details
curl http://localhost:8000/api/orders/ORDER_ID/ \
  -H "Authorization: Token YOUR_TOKEN"
```

### Frontend Testing

**Manual Test Flow:**
1. Add products to cart
2. Go to checkout
3. Enter/select shipping address
4. Select shipping method
5. Review order summary
6. Click "Place Order"
7. Complete Razorpay payment (use test cards)
8. Verify redirect to confirmation page
9. Check order in "My Orders"
10. Verify email received

**Razorpay Test Cards:**
- Success: 4111 1111 1111 1111
- Failure: 4111 1111 1111 1234
- CVV: Any 3 digits
- Expiry: Any future date

### Email Testing

**Test Email Sending:**
```python
# Django shell
python manage.py shell

from gift.models import Order
from gift.notifications.email_service import send_order_confirmation

order = Order.objects.first()
send_order_confirmation(order)
```

---

## 4. Error Handling

### Common Issues and Solutions

**Issue: Razorpay module not found**
```bash
pip install razorpay
```

**Issue: Email not sending**
- Check SMTP credentials
- Enable "Less secure app access" for Gmail
- Use App Password for Gmail (recommended)

**Issue: CORS errors**
- Verify CORS_ALLOWED_ORIGINS in Django settings
- Check frontend API_URL configuration

**Issue: Payment verification fails**
- Verify Razorpay key and secret
- Check signature calculation
- Ensure order_id matches

**Issue: Shipping rates not loading**
- Verify Shiprocket credentials
- Check pincode serviceability
- Ensure cart has items with weight

---

## 5. Deployment Preparation

### Pre-Deployment Checklist

**Backend:**
- [ ] Set DEBUG = False
- [ ] Configure ALLOWED_HOSTS
- [ ] Set up production database
- [ ] Configure static files (collectstatic)
- [ ] Set up Celery for async tasks
- [ ] Configure Redis for Celery
- [ ] Set up proper logging
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Configure email service (SendGrid/AWS SES)

**Frontend:**
- [ ] Set production API_URL
- [ ] Configure production Razorpay keys
- [ ] Enable production build optimizations
- [ ] Set up CDN for static assets
- [ ] Configure error tracking (Sentry)
- [ ] Set up analytics
- [ ] Enable HTTPS
- [ ] Configure proper meta tags

### Environment Variables

**Production Backend (.env):**
```env
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

DATABASE_URL=postgresql://user:pass@host:5432/dbname

RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_live_secret

EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your_sendgrid_api_key
DEFAULT_FROM_EMAIL=orders@yourdomain.com

FRONTEND_URL=https://yourdomain.com

SHIPROCKET_EMAIL=your@email.com
SHIPROCKET_PASSWORD=your_password

CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

**Production Frontend (.env.production):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
```

### Deployment Commands

**Backend (Django):**
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start Gunicorn
gunicorn gift_project.wsgi:application --bind 0.0.0.0:8000

# Start Celery worker
celery -A gift_project worker -l info

# Start Celery beat (for scheduled tasks)
celery -A gift_project beat -l info
```

**Frontend (Next.js):**
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

---

## 6. Monitoring and Logging

### Key Metrics to Monitor

**Payment Metrics:**
- Payment success rate
- Payment failure reasons
- Average order value
- Payment processing time

**Order Metrics:**
- Orders per day/week/month
- Order status distribution
- Average delivery time
- Cancellation rate

**System Metrics:**
- API response times
- Error rates
- Email delivery rate
- Database query performance

### Logging Configuration

**Django Logging:**
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/checkout.log',
        },
        'payment_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/payments.log',
        },
    },
    'loggers': {
        'gift.payment': {
            'handlers': ['payment_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'gift.notifications': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

---

## 7. Backup and Recovery

### Database Backups

**Automated Backup Script:**
```bash
#!/bin/bash
# backup_db.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump dbname > backups/db_backup_$DATE.sql
# Keep only last 7 days
find backups/ -name "db_backup_*.sql" -mtime +7 -delete
```

**Cron Job:**
```bash
0 2 * * * /path/to/backup_db.sh
```

### Recovery Procedures

**Restore Database:**
```bash
psql dbname < backups/db_backup_YYYYMMDD_HHMMSS.sql
```

---

## 8. Performance Optimization

### Database Optimization

**Add Indexes:**
```python
# In models.py
class Order(models.Model):
    # ... fields ...
    
    class Meta:
        indexes = [
            models.Index(fields=['order_id']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status', 'payment_status']),
        ]
```

### Caching

**Redis Caching:**
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}

# Cache shipping rates
from django.core.cache import cache

def get_shipping_rates(pincode):
    cache_key = f'shipping_rates_{pincode}'
    rates = cache.get(cache_key)
    
    if not rates:
        rates = fetch_from_shiprocket(pincode)
        cache.set(cache_key, rates, 3600)  # Cache for 1 hour
    
    return rates
```

---

## 9. Support and Maintenance

### Customer Support Tools

**Admin Actions:**
- View order details
- Track shipments
- Resend confirmation emails
- Process refunds
- Cancel orders

**Support Queries:**
```sql
-- Find orders by customer email
SELECT * FROM gift_order WHERE customer_email = 'customer@email.com';

-- Find failed payments
SELECT * FROM gift_order WHERE payment_status = 'failed';

-- Orders pending shipment
SELECT * FROM gift_order WHERE status = 'confirmed' AND id NOT IN (SELECT order_id FROM gift_shipment);
```

### Maintenance Tasks

**Weekly:**
- Review error logs
- Check payment success rates
- Monitor email delivery
- Review failed orders

**Monthly:**
- Database optimization
- Clear old logs
- Review and update dependencies
- Security audit

---

## 10. Troubleshooting Guide

### Payment Issues

**Symptom:** Payment verification fails
**Solution:**
1. Check Razorpay signature calculation
2. Verify order_id matches
3. Check Razorpay dashboard for payment status
4. Review payment logs

**Symptom:** Razorpay modal doesn't open
**Solution:**
1. Verify Razorpay SDK loaded
2. Check browser console for errors
3. Verify key_id is correct
4. Check CORS settings

### Email Issues

**Symptom:** Emails not sending
**Solution:**
1. Check SMTP credentials
2. Verify email templates exist
3. Check email logs
4. Test with Django shell

### Shipping Issues

**Symptom:** Shipping rates not loading
**Solution:**
1. Verify Shiprocket credentials
2. Check pincode serviceability
3. Ensure cart has items
4. Review Shiprocket API logs

---

## Summary

This guide covers all aspects of setting up, securing, testing, and deploying the checkout and payment system. Follow each section carefully to ensure a smooth production deployment.

**Key Points:**
- Always test in development first
- Use environment variables for sensitive data
- Monitor payment success rates
- Keep backups of database
- Log all payment transactions
- Test email notifications
- Verify Razorpay integration thoroughly

For additional support, refer to:
- Razorpay Documentation: https://razorpay.com/docs/
- Shiprocket API Docs: https://apidocs.shiprocket.in/
- Django Documentation: https://docs.djangoproject.com/
