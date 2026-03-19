# Admin serializers — used exclusively by admin_views.py
from rest_framework import serializers
from django.contrib.auth.models import User
from gift.models import (
    Product, Category, Order, OrderItem,
    Coupon, ReturnRequest, BulkInquiry,
)


# ─────────────────────────────────────────────
# Products
# ─────────────────────────────────────────────

class AdminProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    discount_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'short_description', 'description',
            'price', 'discounted_price', 'discount_percentage',
            'category', 'category_name',
            'stock', 'weight', 'dimensions',
            'is_featured', 'is_best_seller', 'is_trending',
            'is_new_arrival', 'is_deal_of_day',
            'rating', 'review_count', 'sold_count',
            'meta_title', 'meta_description',
            'image_url', 'created_at', 'updated_at',
        ]

    def get_image_url(self, obj):
        request = self.context.get('request')
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img and img.image:
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None


# ─────────────────────────────────────────────
# Orders
# ─────────────────────────────────────────────

class AdminOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_price', 'quantity', 'total_price']


class AdminOrderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField()
    items_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'customer_name', 'customer_email', 'customer_phone',
            'status', 'payment_status', 'payment_method',
            'total_amount', 'items_count',
            'shiprocket_synced', 'created_at',
        ]


class AdminOrderDetailSerializer(serializers.ModelSerializer):
    items = AdminOrderItemSerializer(many=True, read_only=True)
    shipment = serializers.SerializerMethodField()
    payment_details = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'status', 'payment_status', 'payment_method',
            'customer_name', 'customer_email', 'customer_phone',
            'shipping_address', 'shipping_city', 'shipping_state',
            'shipping_pincode', 'shipping_country',
            'subtotal', 'shipping_charge', 'tax_amount',
            'discount_amount', 'total_amount',
            'shiprocket_synced', 'shiprocket_sync_error', 'courier_id',
            'created_at', 'updated_at',
            'items', 'shipment', 'payment_details',
        ]

    def get_shipment(self, obj):
        try:
            from gift.shipping.models import Shipment
            s = Shipment.objects.get(order=obj)
            return {
                'awb_code': s.awb_code,
                'courier_name': s.courier_name,
                'status': s.status,
                'tracking_url': f"https://shiprocket.co/tracking/{s.awb_code}" if s.awb_code else None,
                'estimated_delivery_date': s.estimated_delivery_date,
            }
        except Exception:
            return None

    def get_payment_details(self, obj):
        return obj.get_payment_details()


# ─────────────────────────────────────────────
# Categories
# ─────────────────────────────────────────────

class AdminCategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='num_products', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'description', 'is_active', 'product_count']
        read_only_fields = ['slug', 'product_count']


# ─────────────────────────────────────────────
# Coupons
# ─────────────────────────────────────────────

class AdminCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'discount_type', 'discount_value',
            'min_order_amount', 'max_discount_amount',
            'valid_from', 'valid_to',
            'is_active', 'usage_limit', 'used_count',
        ]


# ─────────────────────────────────────────────
# Return Requests
# ─────────────────────────────────────────────

class AdminReturnRequestSerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source='order.order_id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ReturnRequest
        fields = [
            'id', 'request_id', 'order_id', 'username',
            'return_type', 'reason', 'description', 'status',
            'refund_amount', 'pickup_date', 'tracking_number',
            'created_at', 'updated_at',
        ]


# ─────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────

class AdminUserListSerializer(serializers.ModelSerializer):
    order_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'is_staff', 'is_active', 'date_joined', 'order_count']


class AdminUserDetailSerializer(serializers.ModelSerializer):
    orders = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'is_staff', 'is_active', 'date_joined', 'orders']

    def get_orders(self, obj):
        orders = obj.orders.order_by('-created_at')[:20]
        return AdminOrderListSerializer(orders, many=True).data


# ─────────────────────────────────────────────
# Bulk Inquiries
# ─────────────────────────────────────────────

class AdminBulkInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkInquiry
        fields = [
            'id', 'company_name', 'contact_person', 'email', 'phone',
            'inquiry_type', 'quantity', 'product_interest',
            'budget_range', 'delivery_timeline', 'message', 'gst_number',
            'status', 'admin_notes', 'quoted_amount',
            'created_at', 'updated_at',
        ]
