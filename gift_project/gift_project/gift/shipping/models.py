"""
Shipping Models
Database models for shipment tracking and management
"""
from django.db import models
from django.utils import timezone
from gift.models import Order


class Shipment(models.Model):
    """
    Represents a shipment created in Shiprocket
    Tracks the complete lifecycle of order fulfillment
    """
    
    # Relations
    order = models.OneToOneField(
        Order, 
        on_delete=models.CASCADE, 
        related_name='shipment',
        help_text='Associated order'
    )
    
    # Shiprocket IDs
    shiprocket_order_id = models.CharField(
        max_length=50, 
        unique=True,
        help_text='Shiprocket order ID'
    )
    shiprocket_shipment_id = models.CharField(
        max_length=50, 
        blank=True,
        help_text='Shiprocket shipment ID'
    )
    awb_code = models.CharField(
        max_length=50, 
        blank=True, 
        db_index=True,
        help_text='Air Waybill tracking number'
    )
    
    # Courier Information
    courier_id = models.IntegerField(
        null=True, 
        blank=True,
        help_text='Shiprocket courier company ID'
    )
    courier_name = models.CharField(
        max_length=100, 
        blank=True,
        help_text='Courier company name'
    )
    
    # Shipping Details
    pickup_scheduled_date = models.DateTimeField(
        null=True, 
        blank=True,
        help_text='Scheduled pickup date and time'
    )
    estimated_delivery_date = models.DateField(
        null=True, 
        blank=True,
        help_text='Estimated delivery date'
    )
    actual_delivery_date = models.DateTimeField(
        null=True, 
        blank=True,
        help_text='Actual delivery date and time'
    )
    
    # Status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('ready_to_ship', 'Ready to Ship'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('rto', 'Return to Origin'),
    ]
    status = models.CharField(
        max_length=50, 
        default='pending',
        choices=STATUS_CHOICES,
        help_text='Current shipment status'
    )
    current_status = models.CharField(
        max_length=100, 
        blank=True,
        help_text='Detailed status from courier'
    )
    
    # Documents
    label_url = models.URLField(
        blank=True,
        help_text='Shipping label PDF URL'
    )
    manifest_url = models.URLField(
        blank=True,
        help_text='Manifest PDF URL'
    )
    invoice_url = models.URLField(
        blank=True,
        help_text='Invoice PDF URL'
    )
    
    # Tracking
    last_tracking_update = models.DateTimeField(
        null=True, 
        blank=True,
        help_text='Last time tracking was updated'
    )
    tracking_data = models.JSONField(
        default=dict, 
        blank=True,
        help_text='Complete tracking history'
    )
    
    # Metadata
    SYNC_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('synced', 'Synced'),
        ('failed', 'Failed'),
    ]
    sync_status = models.CharField(
        max_length=20, 
        default='pending',
        choices=SYNC_STATUS_CHOICES,
        help_text='Sync status with Shiprocket'
    )
    error_message = models.TextField(
        blank=True,
        help_text='Error message if sync failed'
    )
    retry_count = models.IntegerField(
        default=0,
        help_text='Number of sync retry attempts'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['awb_code']),
            models.Index(fields=['status']),
            models.Index(fields=['sync_status']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Shipment'
        verbose_name_plural = 'Shipments'
    
    def __str__(self):
        return f"Shipment {self.shiprocket_order_id} - {self.order.order_id}"
    
    @property
    def is_delivered(self):
        """Check if shipment is delivered"""
        return self.status == 'delivered'
    
    @property
    def is_in_transit(self):
        """Check if shipment is in transit"""
        return self.status in ['picked_up', 'in_transit', 'out_for_delivery']
    
    @property
    def can_track(self):
        """Check if shipment can be tracked"""
        return bool(self.awb_code)
    
    @property
    def tracking_url(self):
        """Get tracking URL"""
        if self.awb_code:
            return f"/orders/track/{self.order.order_id}/"
        return None



class ShippingRate(models.Model):
    """
    Cached shipping rates for faster checkout
    Reduces API calls to Shiprocket
    """
    
    # Location Details
    pickup_pincode = models.CharField(
        max_length=10,
        help_text='Pickup pincode'
    )
    delivery_pincode = models.CharField(
        max_length=10,
        help_text='Delivery pincode'
    )
    weight = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        help_text='Package weight in kg'
    )
    
    # Courier Details
    courier_id = models.IntegerField(
        help_text='Shiprocket courier company ID'
    )
    courier_name = models.CharField(
        max_length=100,
        help_text='Courier company name'
    )
    rate = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text='Shipping rate in INR'
    )
    estimated_delivery_days = models.IntegerField(
        help_text='Estimated delivery time in days'
    )
    cod_available = models.BooleanField(
        default=False,
        help_text='Cash on Delivery available'
    )
    
    # Additional Info
    rating = models.FloatField(
        default=0.0,
        help_text='Courier rating'
    )
    
    # Cache metadata
    cached_at = models.DateTimeField(
        auto_now=True,
        help_text='When this rate was cached'
    )
    expires_at = models.DateTimeField(
        help_text='When this cache expires'
    )
    
    class Meta:
        indexes = [
            models.Index(fields=['pickup_pincode', 'delivery_pincode', 'weight']),
            models.Index(fields=['expires_at']),
        ]
        verbose_name = 'Shipping Rate'
        verbose_name_plural = 'Shipping Rates'
    
    def __str__(self):
        return f"{self.courier_name} - {self.delivery_pincode} - ₹{self.rate}"
    
    @property
    def is_expired(self):
        """Check if cache is expired"""
        return timezone.now() > self.expires_at
    
    @classmethod
    def get_cached_rates(cls, pickup_pincode, delivery_pincode, weight):
        """Get cached rates if available and not expired"""
        now = timezone.now()
        return cls.objects.filter(
            pickup_pincode=pickup_pincode,
            delivery_pincode=delivery_pincode,
            weight=weight,
            expires_at__gt=now
        ).order_by('rate')
    
    @classmethod
    def clear_expired(cls):
        """Clear expired cache entries"""
        now = timezone.now()
        return cls.objects.filter(expires_at__lte=now).delete()



class WebhookLog(models.Model):
    """
    Log all webhook events for debugging and audit
    """
    
    # Event Details
    event_type = models.CharField(
        max_length=50,
        help_text='Type of webhook event'
    )
    payload = models.JSONField(
        help_text='Complete webhook payload'
    )
    
    # Processing Status
    processed = models.BooleanField(
        default=False,
        help_text='Whether webhook was processed successfully'
    )
    error_message = models.TextField(
        blank=True,
        help_text='Error message if processing failed'
    )
    
    # Related Objects
    order_id = models.CharField(
        max_length=50,
        blank=True,
        help_text='Related order ID if applicable'
    )
    awb_code = models.CharField(
        max_length=50,
        blank=True,
        help_text='Related AWB code if applicable'
    )
    
    # Metadata
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='Source IP address'
    )
    user_agent = models.TextField(
        blank=True,
        help_text='User agent string'
    )
    
    # Timestamp
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='When webhook was received'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event_type']),
            models.Index(fields=['processed']),
            models.Index(fields=['order_id']),
            models.Index(fields=['awb_code']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Webhook Log'
        verbose_name_plural = 'Webhook Logs'
    
    def __str__(self):
        status = "✓" if self.processed else "✗"
        return f"{status} {self.event_type} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    @classmethod
    def log_webhook(cls, event_type, payload, order_id='', awb_code='', 
                    ip_address=None, user_agent=''):
        """Create a webhook log entry"""
        return cls.objects.create(
            event_type=event_type,
            payload=payload,
            order_id=order_id,
            awb_code=awb_code,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @classmethod
    def get_recent_logs(cls, limit=50):
        """Get recent webhook logs"""
        return cls.objects.all()[:limit]
    
    @classmethod
    def get_failed_logs(cls):
        """Get failed webhook processing logs"""
        return cls.objects.filter(processed=False)
