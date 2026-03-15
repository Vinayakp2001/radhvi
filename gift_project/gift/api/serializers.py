# API Serializers for Next.js Frontend
from rest_framework import serializers
from gift.models import Product, Category, Occasion, Testimonial, Wishlist, Address, Order, OrderItem


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model"""
    discount_percentage = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'slug', 'name', 'short_description', 'description',
            'price', 'discounted_price', 'image_url', 'images',
            'category', 'is_best_seller', 'is_featured',
            'rating', 'review_count', 'discount_percentage',
            'created_at', 'updated_at'
        ]
    
    def get_discount_percentage(self, obj):
        """Calculate discount percentage"""
        if obj.discounted_price and obj.discounted_price < obj.price:
            return int(((obj.price - obj.discounted_price) / obj.price) * 100)
        return 0
    
    def get_image_url(self, obj):
        """Get first image URL"""
        first_image = obj.images.first()
        if first_image and first_image.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        return None
    
    def get_images(self, obj):
        """Get all product images"""
        request = self.context.get('request')
        images = []
        for product_image in obj.images.all():
            if product_image.image:
                if request:
                    images.append(request.build_absolute_uri(product_image.image.url))
                else:
                    images.append(product_image.image.url)
        return images


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']


class OccasionSerializer(serializers.ModelSerializer):
    """Serializer for Occasion model"""
    image_url = serializers.SerializerMethodField()
    product_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Occasion
        fields = ['id', 'name', 'slug', 'tagline', 'description', 'image_url', 'product_count', 'order']
    
    def get_image_url(self, obj):
        """Get image URL"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class TestimonialSerializer(serializers.ModelSerializer):
    """Serializer for Testimonial model"""
    
    class Meta:
        model = Testimonial
        fields = ['id', 'name', 'city', 'text', 'tag', 'rating', 'created_at']


class WishlistSerializer(serializers.ModelSerializer):
    """Serializer for Wishlist model"""
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'product_id', 'added_at']
        read_only_fields = ['id', 'added_at']
    
    def create(self, validated_data):
        """Create wishlist item"""
        user = self.context['request'].user
        product_id = validated_data['product_id']
        
        # Get or create wishlist item
        wishlist_item, created = Wishlist.objects.get_or_create(
            user=user,
            product_id=product_id
        )
        return wishlist_item


class AddressSerializer(serializers.ModelSerializer):
    """Serializer for Address model"""
    
    class Meta:
        model = Address
        fields = [
            'id', 'full_name', 'phone', 'address_line1', 'address_line2',
            'city', 'state', 'pincode', 'country', 'is_default',
            'address_type', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_pincode(self, value):
        """Validate pincode is 6 digits"""
        import re
        pincode_digits = ''.join(filter(str.isdigit, value))
        if len(pincode_digits) != 6:
            raise serializers.ValidationError("Pincode must be exactly 6 digits")
        return value
    
    def validate_phone(self, value):
        """Validate phone number has at least 10 digits"""
        phone_digits = ''.join(filter(str.isdigit, value))
        if len(phone_digits) < 10:
            raise serializers.ValidationError("Phone number must contain at least 10 digits")
        return value
    
    def create(self, validated_data):
        """Create address for authenticated user"""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


# Payment Serializers
class CheckoutSerializer(serializers.Serializer):
    """Serializer for checkout initiation"""
    shipping_address_id = serializers.IntegerField(required=False, allow_null=True)
    courier_id = serializers.IntegerField(required=False, allow_null=True)
    payment_method = serializers.ChoiceField(choices=['phonepe', 'cod'], default='phonepe')
    
    # Guest checkout fields (if no address_id provided)
    full_name = serializers.CharField(max_length=100, required=False)
    phone = serializers.CharField(max_length=15, required=False)
    address_line1 = serializers.CharField(required=False)
    address_line2 = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False)
    state = serializers.CharField(max_length=100, required=False)
    pincode = serializers.CharField(max_length=10, required=False)
    country = serializers.CharField(max_length=100, required=False, default='India')
    
    def validate(self, data):
        """Validate that either address_id or full address is provided"""
        if not data.get('shipping_address_id'):
            # Guest checkout - validate all address fields are present
            required_fields = ['full_name', 'phone', 'address_line1', 'city', 'state', 'pincode']
            missing_fields = [field for field in required_fields if not data.get(field)]
            
            if missing_fields:
                raise serializers.ValidationError(
                    f"For guest checkout, these fields are required: {', '.join(missing_fields)}"
                )
            
            # Validate pincode
            pincode = data.get('pincode', '')
            pincode_digits = ''.join(filter(str.isdigit, pincode))
            if len(pincode_digits) != 6:
                raise serializers.ValidationError({'pincode': 'Pincode must be exactly 6 digits'})
            
            # Validate phone
            phone = data.get('phone', '')
            phone_digits = ''.join(filter(str.isdigit, phone))
            if len(phone_digits) < 10:
                raise serializers.ValidationError({'phone': 'Phone number must contain at least 10 digits'})
        
        return data


class PaymentVerificationSerializer(serializers.Serializer):
    """Serializer for payment verification"""
    razorpay_order_id = serializers.CharField(max_length=200)
    razorpay_payment_id = serializers.CharField(max_length=200)
    razorpay_signature = serializers.CharField(max_length=500)
    order_id = serializers.CharField(max_length=20)  # Our internal order ID


# Order Serializers
class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for Order Items"""
    product_image = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_price', 'quantity', 'total_price', 'product_image']
        read_only_fields = ['id', 'total_price']
    
    def get_product_image(self, obj):
        """Get product image URL"""
        if obj.product and obj.product.images.exists():
            first_image = obj.product.images.first()
            if first_image and first_image.image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first_image.image.url)
                return first_image.image.url
        return None


class OrderListSerializer(serializers.ModelSerializer):
    """Serializer for Order list view"""
    items_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'status', 'payment_status', 'payment_method',
            'total_amount', 'items_count', 'created_at', 'updated_at'
        ]
        read_only_fields = fields


class OrderDetailSerializer(serializers.ModelSerializer):
    """Serializer for Order detail view with items and shipment"""
    items = OrderItemSerializer(many=True, read_only=True)
    shipment = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'status', 'payment_status', 'payment_method',
            'customer_name', 'customer_email', 'customer_phone',
            'shipping_address', 'shipping_city', 'shipping_state', 
            'shipping_pincode', 'shipping_country',
            'subtotal', 'shipping_charge', 'tax_amount', 'discount_amount', 'total_amount',
            'razorpay_order_id', 'razorpay_payment_id',
            'created_at', 'updated_at', 'items', 'shipment'
        ]
        read_only_fields = fields
    
    def get_shipment(self, obj):
        """Get shipment tracking info if available"""
        try:
            from gift.shipping.models import Shipment
            shipment = Shipment.objects.get(order=obj)
            return {
                'awb_code': shipment.awb_code,
                'courier_name': shipment.courier_name,
                'status': shipment.status,
                'current_status': shipment.current_status,
                'label_url': shipment.label_url,
                'tracking_data': shipment.tracking_data,
                'estimated_delivery_date': shipment.estimated_delivery_date,
                'actual_delivery_date': shipment.actual_delivery_date,
            }
        except:
            return None
