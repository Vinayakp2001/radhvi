# gift/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django import forms
from .models import (
    Product, Category, Brand, ProductImage, ProductAttribute,
    ProductReview, Cart, CartItem, Order, OrderItem,
    Wishlist, Coupon, UserProfile, Address, ReturnRequest,
    Notification, BrowsingHistory, BulkInquiry
)

# Inline classes
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'image_preview', 'is_primary', 'alt_text']
    readonly_fields = ['image_preview']  # इससे पहले image_preview defined नहीं था
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" />', obj.image.url)
        return "-"
    image_preview.short_description = 'Preview'

class ProductAttributeInline(admin.TabularInline):
    model = ProductAttribute
    extra = 1

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ['product', 'product_name', 'product_price', 'quantity', 'total_price']
    can_delete = False
    extra = 0

class AddressInline(admin.TabularInline):
    model = Address
    extra = 0
    readonly_fields = ['full_name', 'phone', 'city']

# Custom admin classes
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'brand', 'price', 'discounted_price', 
                    'stock', 'rating', 'sold_count', 'is_featured', 'is_in_stock']
    list_filter = ['category', 'brand', 'is_featured', 'is_trending', 'is_best_seller']
    search_fields = ['name', 'sku', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['rating', 'review_count', 'sold_count', 'sku', 'image_preview']
    inlines = [ProductImageInline, ProductAttributeInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'short_description')
        }),
        ('Pricing', {
            'fields': ('price', 'discounted_price')
        }),
        ('Inventory', {
            'fields': ('category', 'brand', 'stock', 'sku', 'condition')
        }),
        ('Flags', {
            'fields': ('is_featured', 'is_trending', 'is_best_seller', 
                      'is_deal_of_day', 'is_new_arrival')
        }),
        ('Ratings', {
            'fields': ('rating', 'review_count', 'sold_count')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description')
        }),
        ('Dimensions', {
            'fields': ('weight', 'dimensions')
        }),
    )
    
    def image_preview(self, obj):
        if obj.images.first() and obj.images.first().image:
            return format_html('<img src="{}" width="50" height="50" />', obj.images.first().image.url)
        return "-"
    image_preview.short_description = 'Image'
    
    def is_in_stock(self, obj):
        return obj.is_in_stock
    is_in_stock.boolean = True
    is_in_stock.short_description = 'In Stock'

class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'user', 'customer_name', 'status', 
                    'payment_status', 'total_amount', 'created_at']
    list_filter = ['status', 'payment_status', 'payment_method', 'created_at']
    search_fields = ['order_id', 'customer_name', 'customer_email', 'customer_phone']
    readonly_fields = ['order_id', 'created_at', 'updated_at', 'payment_date']
    inlines = [OrderItemInline]
    fieldsets = (
        ('Order Information', {
            'fields': ('order_id', 'user', 'status', 'created_at', 'updated_at')
        }),
        ('Payment Information', {
            'fields': ('payment_status', 'payment_method', 'transaction_id', 
                      'payment_date')
        }),
        ('Customer Information', {
            'fields': ('customer_name', 'customer_email', 'customer_phone')
        }),
        ('Shipping Address', {
            'fields': ('shipping_address', 'shipping_city', 'shipping_state', 
                      'shipping_pincode', 'shipping_country')
        }),
        ('Price Breakdown', {
            'fields': ('subtotal', 'shipping_charge', 'tax_amount', 
                      'discount_amount', 'total_amount')
        }),
        # Duplicate total_amount हटा दिया - यह पहले से Price Breakdown में है
    )
    
    actions = ['mark_as_shipped', 'mark_as_delivered', 'mark_as_cancelled']
    
    def mark_as_shipped(self, request, queryset):
        queryset.update(status='shipped')
        self.message_user(request, f"{queryset.count()} orders marked as shipped.")
    mark_as_shipped.short_description = "Mark selected orders as shipped"
    
    def mark_as_delivered(self, request, queryset):
        queryset.update(status='delivered')
        self.message_user(request, f"{queryset.count()} orders marked as delivered.")
    mark_as_delivered.short_description = "Mark selected orders as delivered"
    
    def mark_as_cancelled(self, request, queryset):
        queryset.update(status='cancelled')
        self.message_user(request, f"{queryset.count()} orders marked as cancelled.")
    mark_as_cancelled.short_description = "Mark selected orders as cancelled"

# CategoryAdmin moved below with Iconify integration

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'

class CustomUserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline, AddressInline]
    list_display = ['username', 'email', 'first_name', 'last_name', 
                    'date_joined', 'is_staff', 'order_count']
    
    def order_count(self, obj):
        return obj.orders.count()
    order_count.short_description = 'Orders'

class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = ['request_id', 'order', 'user', 'return_type', 
                    'status', 'created_at', 'refund_amount']
    list_filter = ['status', 'return_type', 'reason', 'created_at']
    search_fields = ['request_id', 'order__order_id', 'user__username']
    readonly_fields = ['request_id', 'created_at', 'updated_at']
    actions = ['approve_returns', 'reject_returns']
    
    def approve_returns(self, request, queryset):
        queryset.update(status='approved')
        self.message_user(request, f"{queryset.count()} return requests approved.")
    approve_returns.short_description = "Approve selected returns"
    
    def reject_returns(self, request, queryset):
        queryset.update(status='rejected')
        self.message_user(request, f"{queryset.count()} return requests rejected.")
    reject_returns.short_description = "Reject selected returns"

# Register models
admin.site.register(Product, ProductAdmin)
# Category registered below with Iconify integration
admin.site.register(Brand)
admin.site.register(ProductReview)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderItem)
admin.site.register(Wishlist)
admin.site.register(Coupon)
admin.site.register(UserProfile)
admin.site.register(Address)
admin.site.register(ReturnRequest, ReturnRequestAdmin)
admin.site.register(Notification)
admin.site.register(BrowsingHistory)

# Unregister default User admin and register custom
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


# Bulk Inquiry Admin
@admin.register(BulkInquiry)
class BulkInquiryAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'contact_person', 'inquiry_type', 'quantity', 
                    'status', 'is_new_badge', 'created_at']
    list_filter = ['status', 'inquiry_type', 'created_at']
    search_fields = ['company_name', 'contact_person', 'email', 'phone']
    readonly_fields = ['created_at', 'updated_at', 'is_new']
    
    fieldsets = (
        ('Company Information', {
            'fields': ('company_name', 'contact_person', 'email', 'phone', 'gst_number')
        }),
        ('Inquiry Details', {
            'fields': ('inquiry_type', 'quantity', 'product_interest', 'budget_range', 
                      'delivery_timeline', 'message')
        }),
        ('Status & Tracking', {
            'fields': ('status', 'quoted_amount', 'admin_notes', 'created_at', 'updated_at')
        }),
    )
    
    list_per_page = 25
    date_hierarchy = 'created_at'
    
    def is_new_badge(self, obj):
        if obj.is_new:
            return format_html('<span style="background-color: #28a745; color: white; padding: 3px 10px; border-radius: 3px;">NEW</span>')
        return '-'
    is_new_badge.short_description = 'New'
    
    actions = ['mark_as_contacted', 'mark_as_quoted', 'mark_as_converted']
    
    def mark_as_contacted(self, request, queryset):
        updated = queryset.update(status='contacted')
        self.message_user(request, f'{updated} inquiries marked as contacted.')
    mark_as_contacted.short_description = 'Mark as Contacted'
    
    def mark_as_quoted(self, request, queryset):
        updated = queryset.update(status='quoted')
        self.message_user(request, f'{updated} inquiries marked as quoted.')
    mark_as_quoted.short_description = 'Mark as Quote Sent'
    
    def mark_as_converted(self, request, queryset):
        updated = queryset.update(status='converted')
        self.message_user(request, f'{updated} inquiries marked as converted.')
    mark_as_converted.short_description = 'Mark as Converted'


# Category Admin with Iconify Icon Picker
from .widgets import IconifyIconWidget

class CategoryAdminForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = '__all__'
        widgets = {
            'icon': IconifyIconWidget(),
        }

class CategoryAdmin(admin.ModelAdmin):
    form = CategoryAdminForm
    list_display = ['name', 'icon_preview', 'product_count', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    
    def icon_preview(self, obj):
        if obj.icon:
            # Check if it's an Iconify icon (contains :)
            if ':' in obj.icon:
                return format_html(
                    '<span class="iconify" data-icon="{}" style="font-size: 24px; color: #417690;"></span>',
                    obj.icon
                )
            else:
                # Display emoji as-is
                return format_html('<span style="font-size: 24px;">{}</span>', obj.icon)
        return '-'
    icon_preview.short_description = 'Icon Preview'
    
    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'
    
    class Media:
        js = ('https://code.iconify.design/2/2.2.1/iconify.min.js',)

# Register Category with custom admin
admin.site.register(Category, CategoryAdmin)
