"""
Django Admin Configuration for Shipping Models
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from gift.shipping.models import Shipment, ShippingRate, WebhookLog
from gift.shipping.services import ShippingService


# ==================== SHIPMENT ADMIN ====================

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    """Admin interface for Shipment model"""
    
    list_display = [
        'shiprocket_order_id',
        'order_link',
        'awb_code',
        'courier_name',
        'status_badge',
        'sync_status_badge',
        'created_at',
    ]
    
    list_filter = [
        'status',
        'sync_status',
        'courier_name',
        'created_at',
    ]
    
    search_fields = [
        'shiprocket_order_id',
        'awb_code',
        'order__order_id',
        'order__customer_name',
        'order__customer_email',
    ]
    
    readonly_fields = [
        'order',
        'shiprocket_order_id',
        'shiprocket_shipment_id',
        'awb_code',
        'courier_id',
        'courier_name',
        'created_at',
        'updated_at',
        'last_tracking_update',
        'tracking_data_display',
        'label_link',
    ]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order', 'shiprocket_order_id', 'shiprocket_shipment_id')
        }),
        ('Courier Details', {
            'fields': ('courier_id', 'courier_name', 'awb_code')
        }),
        ('Status', {
            'fields': ('status', 'current_status', 'sync_status', 'error_message')
        }),
        ('Dates', {
            'fields': (
                'pickup_scheduled_date',
                'estimated_delivery_date',
                'actual_delivery_date',
                'last_tracking_update',
            )
        }),
        ('Documents', {
            'fields': ('label_link', 'manifest_url', 'invoice_url')
        }),
        ('Tracking', {
            'fields': ('tracking_data_display',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('retry_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = [
        'sync_to_shiprocket',
        'generate_labels',
        'update_tracking',
        'mark_as_delivered',
    ]
    
    def order_link(self, obj):
        """Link to order detail"""
        url = reverse('admin:gift_order_changelist') + f'?order_id={obj.order.order_id}'
        return format_html('<a href="{}">{}</a>', url, obj.order.order_id)
    order_link.short_description = 'Order'
    
    def status_badge(self, obj):
        """Display status with color badge"""
        colors = {
            'pending': 'gray',
            'ready_to_ship': 'blue',
            'picked_up': 'cyan',
            'in_transit': 'orange',
            'out_for_delivery': 'purple',
            'delivered': 'green',
            'cancelled': 'red',
            'rto': 'darkred',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def sync_status_badge(self, obj):
        """Display sync status with color badge"""
        colors = {
            'pending': 'orange',
            'synced': 'green',
            'failed': 'red',
        }
        color = colors.get(obj.sync_status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_sync_status_display()
        )
    sync_status_badge.short_description = 'Sync Status'
    
    def tracking_data_display(self, obj):
        """Display tracking data in formatted way"""
        if not obj.tracking_data:
            return 'No tracking data'
        
        import json
        return format_html('<pre>{}</pre>', json.dumps(obj.tracking_data, indent=2))
    tracking_data_display.short_description = 'Tracking Data'
    
    def label_link(self, obj):
        """Display label download link"""
        if obj.label_url:
            return format_html('<a href="{}" target="_blank">Download Label</a>', obj.label_url)
        return 'No label generated'
    label_link.short_description = 'Shipping Label'
    
    # Admin Actions
    
    def sync_to_shiprocket(self, request, queryset):
        """Sync selected orders to Shiprocket"""
        service = ShippingService()
        success_count = 0
        error_count = 0
        
        for shipment in queryset:
            try:
                service.sync_order_to_shiprocket(shipment.order)
                success_count += 1
            except Exception as e:
                error_count += 1
                self.message_user(request, f'Error syncing {shipment.order.order_id}: {str(e)}', level='error')
        
        if success_count:
            self.message_user(request, f'Successfully synced {success_count} orders')
        if error_count:
            self.message_user(request, f'Failed to sync {error_count} orders', level='warning')
    
    sync_to_shiprocket.short_description = 'Sync to Shiprocket'
    
    def generate_labels(self, request, queryset):
        """Generate labels for selected shipments"""
        service = ShippingService()
        success_count = 0
        error_count = 0
        
        for shipment in queryset:
            try:
                if shipment.shiprocket_shipment_id:
                    service.generate_shipping_label(shipment)
                    success_count += 1
                else:
                    error_count += 1
            except Exception as e:
                error_count += 1
                self.message_user(request, f'Error generating label for {shipment.shiprocket_order_id}: {str(e)}', level='error')
        
        if success_count:
            self.message_user(request, f'Successfully generated {success_count} labels')
        if error_count:
            self.message_user(request, f'Failed to generate {error_count} labels', level='warning')
    
    generate_labels.short_description = 'Generate Shipping Labels'
    
    def update_tracking(self, request, queryset):
        """Update tracking for selected shipments"""
        service = ShippingService()
        success_count = 0
        error_count = 0
        
        for shipment in queryset:
            try:
                if shipment.awb_code:
                    service.get_tracking_info(shipment, force_refresh=True)
                    success_count += 1
                else:
                    error_count += 1
            except Exception as e:
                error_count += 1
                self.message_user(request, f'Error updating tracking for {shipment.shiprocket_order_id}: {str(e)}', level='error')
        
        if success_count:
            self.message_user(request, f'Successfully updated tracking for {success_count} shipments')
        if error_count:
            self.message_user(request, f'Failed to update {error_count} shipments', level='warning')
    
    update_tracking.short_description = 'Update Tracking Information'
    
    def mark_as_delivered(self, request, queryset):
        """Mark selected shipments as delivered"""
        count = queryset.update(status='delivered')
        self.message_user(request, f'Marked {count} shipments as delivered')
    
    mark_as_delivered.short_description = 'Mark as Delivered'


# ==================== SHIPPING RATE ADMIN ====================

@admin.register(ShippingRate)
class ShippingRateAdmin(admin.ModelAdmin):
    """Admin interface for ShippingRate model"""
    
    list_display = [
        'courier_name',
        'pickup_pincode',
        'delivery_pincode',
        'weight',
        'rate',
        'estimated_delivery_days',
        'cod_available',
        'cached_at',
        'is_expired',
    ]
    
    list_filter = [
        'cod_available',
        'cached_at',
    ]
    
    search_fields = [
        'courier_name',
        'pickup_pincode',
        'delivery_pincode',
    ]
    
    readonly_fields = ['cached_at']
    
    actions = ['clear_expired_rates']
    
    def clear_expired_rates(self, request, queryset):
        """Clear expired rate cache entries"""
        deleted_count, _ = ShippingRate.clear_expired()
        self.message_user(request, f'Cleared {deleted_count} expired rate entries')
    
    clear_expired_rates.short_description = 'Clear Expired Rates'


# ==================== WEBHOOK LOG ADMIN ====================

@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    """Admin interface for WebhookLog model"""
    
    list_display = [
        'event_type',
        'order_id',
        'awb_code',
        'processed_badge',
        'created_at',
    ]
    
    list_filter = [
        'event_type',
        'processed',
        'created_at',
    ]
    
    search_fields = [
        'event_type',
        'order_id',
        'awb_code',
        'ip_address',
    ]
    
    readonly_fields = [
        'event_type',
        'payload_display',
        'processed',
        'error_message',
        'order_id',
        'awb_code',
        'ip_address',
        'user_agent',
        'created_at',
    ]
    
    fieldsets = (
        ('Event Information', {
            'fields': ('event_type', 'order_id', 'awb_code')
        }),
        ('Processing Status', {
            'fields': ('processed', 'error_message')
        }),
        ('Request Details', {
            'fields': ('ip_address', 'user_agent', 'created_at')
        }),
        ('Payload', {
            'fields': ('payload_display',),
            'classes': ('collapse',)
        }),
    )
    
    def processed_badge(self, obj):
        """Display processed status with badge"""
        if obj.processed:
            return format_html('<span style="color: green;">✓ Processed</span>')
        return format_html('<span style="color: red;">✗ Failed</span>')
    processed_badge.short_description = 'Status'
    
    def payload_display(self, obj):
        """Display payload in formatted way"""
        import json
        return format_html('<pre>{}</pre>', json.dumps(obj.payload, indent=2))
    payload_display.short_description = 'Webhook Payload'
    
    def has_add_permission(self, request):
        """Disable adding webhook logs manually"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Disable editing webhook logs"""
        return False
