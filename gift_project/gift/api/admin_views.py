# Admin API Views — staff-only endpoints for the Next.js admin panel
from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from django_filters.rest_framework import DjangoFilterBackend

from gift.models import (
    Product, Category, Order, OrderItem,
    Coupon, ReturnRequest, BulkInquiry,
)
from .admin_serializers import (
    AdminProductSerializer,
    AdminOrderListSerializer,
    AdminOrderDetailSerializer,
    AdminCategorySerializer,
    AdminCouponSerializer,
    AdminReturnRequestSerializer,
    AdminUserListSerializer,
    AdminUserDetailSerializer,
    AdminBulkInquirySerializer,
)


class AdminPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ─────────────────────────────────────────────
# Dashboard
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard(request):
    """Aggregated store stats for the admin dashboard."""
    total_orders = Order.objects.count()
    total_revenue = Order.objects.filter(
        payment_status='paid'
    ).aggregate(rev=Sum('total_amount'))['rev'] or 0

    total_products = Product.objects.count()
    pending_orders = Order.objects.filter(status='pending').count()
    pending_returns = ReturnRequest.objects.filter(status='pending').count()
    pending_inquiries = BulkInquiry.objects.filter(status='pending').count()

    recent_orders = Order.objects.select_related('user').order_by('-created_at')[:5]
    recent_orders_data = AdminOrderListSerializer(recent_orders, many=True).data

    low_stock = Product.objects.filter(stock__lt=5).order_by('stock')[:10]
    low_stock_data = [
        {'id': p.id, 'name': p.name, 'sku': p.sku, 'stock': p.stock}
        for p in low_stock
    ]

    return Response({
        'total_orders': total_orders,
        'total_revenue': float(total_revenue),
        'total_products': total_products,
        'pending_orders': pending_orders,
        'pending_returns': pending_returns,
        'pending_inquiries': pending_inquiries,
        'recent_orders': recent_orders_data,
        'low_stock_products': low_stock_data,
    })


# ─────────────────────────────────────────────
# Products
# ─────────────────────────────────────────────

class AdminProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').order_by('-created_at')
    serializer_class = AdminProductSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_featured', 'is_best_seller', 'is_trending', 'is_new_arrival']
    search_fields = ['name', 'sku']
    ordering_fields = ['name', 'price', 'stock', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        low_stock = self.request.query_params.get('low_stock')
        if low_stock == 'true':
            qs = qs.filter(stock__lt=5)
        return qs


# ─────────────────────────────────────────────
# Orders
# ─────────────────────────────────────────────

class AdminOrderViewSet(viewsets.GenericViewSet):
    queryset = Order.objects.select_related('user').order_by('-created_at')
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'payment_status', 'payment_method']
    search_fields = ['order_id', 'customer_name', 'customer_email']

    def list(self, request):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(AdminOrderListSerializer(page, many=True).data)
        return Response(AdminOrderListSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        try:
            order = Order.objects.prefetch_related('items__product__images').get(order_id=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminOrderDetailSerializer(order, context={'request': request}).data)

    def partial_update(self, request, pk=None):
        try:
            order = Order.objects.get(order_id=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        allowed = {'status', 'payment_status'}
        data = {k: v for k, v in request.data.items() if k in allowed}
        for field, value in data.items():
            setattr(order, field, value)
        order.save(update_fields=list(data.keys()))
        return Response(AdminOrderListSerializer(order).data)


# ─────────────────────────────────────────────
# Categories
# ─────────────────────────────────────────────

class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.annotate(num_products=Count('products')).order_by('name')
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


# ─────────────────────────────────────────────
# Coupons
# ─────────────────────────────────────────────

class AdminCouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.order_by('-valid_from')
    serializer_class = AdminCouponSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active', 'discount_type']
    search_fields = ['code']


# ─────────────────────────────────────────────
# Return Requests
# ─────────────────────────────────────────────

class AdminReturnRequestViewSet(viewsets.GenericViewSet):
    queryset = ReturnRequest.objects.select_related('order', 'user').order_by('-created_at')
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'return_type']
    search_fields = ['request_id', 'order__order_id', 'user__username']

    def list(self, request):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(AdminReturnRequestSerializer(page, many=True).data)
        return Response(AdminReturnRequestSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        try:
            obj = ReturnRequest.objects.select_related('order', 'user').get(pk=pk)
        except ReturnRequest.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminReturnRequestSerializer(obj).data)

    def partial_update(self, request, pk=None):
        try:
            obj = ReturnRequest.objects.get(pk=pk)
        except ReturnRequest.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        if new_status:
            obj.status = new_status
            obj.save(update_fields=['status'])
        return Response(AdminReturnRequestSerializer(obj).data)


# ─────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────

class AdminUserViewSet(viewsets.GenericViewSet):
    queryset = User.objects.annotate(order_count=Count('orders')).order_by('-date_joined')
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']

    def list(self, request):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(AdminUserListSerializer(page, many=True).data)
        return Response(AdminUserListSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        try:
            user = User.objects.prefetch_related('orders').get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminUserDetailSerializer(user, context={'request': request}).data)


# ─────────────────────────────────────────────
# Bulk Inquiries
# ─────────────────────────────────────────────

class AdminBulkInquiryViewSet(viewsets.GenericViewSet):
    queryset = BulkInquiry.objects.order_by('-created_at')
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'inquiry_type']
    search_fields = ['company_name', 'contact_person', 'email']

    def list(self, request):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(AdminBulkInquirySerializer(page, many=True).data)
        return Response(AdminBulkInquirySerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        try:
            obj = BulkInquiry.objects.get(pk=pk)
        except BulkInquiry.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminBulkInquirySerializer(obj).data)

    def partial_update(self, request, pk=None):
        try:
            obj = BulkInquiry.objects.get(pk=pk)
        except BulkInquiry.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        allowed = {'status', 'admin_notes', 'quoted_amount'}
        for field in allowed:
            if field in request.data:
                setattr(obj, field, request.data[field])
        obj.save()
        return Response(AdminBulkInquirySerializer(obj).data)


# ─────────────────────────────────────────────
# Product Images
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def product_images(request, product_id):
    """List all images for a product."""
    from gift.models import ProductImage
    images = ProductImage.objects.filter(product_id=product_id).order_by('-is_primary', 'id')
    data = [
        {
            'id': img.id,
            'url': request.build_absolute_uri(img.image.url) if img.image else None,
            'is_primary': img.is_primary,
            'alt_text': img.alt_text,
        }
        for img in images
    ]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def upload_product_image(request, product_id):
    """Upload one or more images for a product."""
    from gift.models import ProductImage
    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    files = request.FILES.getlist('images')
    if not files:
        return Response({'error': 'No images provided'}, status=status.HTTP_400_BAD_REQUEST)

    created = []
    for f in files:
        img = ProductImage.objects.create(product=product, image=f)
        created.append({
            'id': img.id,
            'url': request.build_absolute_uri(img.image.url),
            'is_primary': img.is_primary,
        })

    return Response(created, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_product_image(request, product_id, image_id):
    """Delete a product image."""
    from gift.models import ProductImage
    try:
        img = ProductImage.objects.get(pk=image_id, product_id=product_id)
    except ProductImage.DoesNotExist:
        return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
    img.image.delete(save=False)
    img.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def set_primary_image(request, product_id, image_id):
    """Set an image as the primary product image."""
    from gift.models import ProductImage
    try:
        img = ProductImage.objects.get(pk=image_id, product_id=product_id)
    except ProductImage.DoesNotExist:
        return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
    ProductImage.objects.filter(product_id=product_id, is_primary=True).update(is_primary=False)
    img.is_primary = True
    img.save(update_fields=['is_primary'])
    return Response({'id': img.id, 'is_primary': True})


# ─────────────────────────────────────────────
# Product Specifications
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def product_specs(request, product_id):
    """List all attributes/specs for a product."""
    from gift.models import ProductAttribute
    specs = ProductAttribute.objects.filter(product_id=product_id)
    return Response([{'id': s.id, 'name': s.name, 'value': s.value} for s in specs])


@api_view(['POST'])
@permission_classes([IsAdminUser])
def save_product_specs(request, product_id):
    """Replace all specs for a product with the provided list."""
    from gift.models import ProductAttribute
    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    specs = request.data.get('specs', [])  # [{name, value}]
    ProductAttribute.objects.filter(product=product).delete()
    created = []
    for s in specs:
        if s.get('name') and s.get('value'):
            attr = ProductAttribute.objects.create(product=product, name=s['name'], value=s['value'])
            created.append({'id': attr.id, 'name': attr.name, 'value': attr.value})
    return Response(created)


# ─────────────────────────────────────────────
# Product ↔ Occasion linking
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def product_occasions(request, product_id):
    """Get all occasions and which ones this product is linked to."""
    from gift.models import Occasion
    all_occasions = Occasion.objects.all().order_by('order', 'name')
    # Link via category name matching (existing logic) OR direct M2M if exists
    # We'll use a simple approach: store linked occasion IDs in product attributes
    # Actually check if there's a direct relation
    try:
        product = Product.objects.get(pk=product_id)
        linked_ids = list(product.occasions.values_list('id', flat=True))
    except (Product.DoesNotExist, AttributeError):
        linked_ids = []

    return Response([
        {'id': o.id, 'name': o.name, 'slug': o.slug, 'linked': o.id in linked_ids}
        for o in all_occasions
    ])


@api_view(['POST'])
@permission_classes([IsAdminUser])
def set_product_occasions(request, product_id):
    """Set which occasions a product is linked to."""
    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    occasion_ids = request.data.get('occasion_ids', [])
    try:
        product.occasions.set(occasion_ids)
        return Response({'occasion_ids': occasion_ids})
    except AttributeError:
        return Response({'error': 'Product-Occasion relation not set up'}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
# Occasions (admin)
# ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_occasions(request):
    """List all occasions."""
    from gift.models import Occasion
    occasions = Occasion.objects.all().order_by('order', 'name')
    data = [
        {
            'id': o.id, 'name': o.name, 'slug': o.slug,
            'tagline': o.tagline, 'is_active': o.is_active,
            'order': o.order,
            'image_url': request.build_absolute_uri(o.image.url) if o.image else None,
        }
        for o in occasions
    ]
    return Response(data)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_occasion(request, occasion_id):
    """Update occasion details and/or image."""
    from gift.models import Occasion
    try:
        occasion = Occasion.objects.get(pk=occasion_id)
    except Occasion.DoesNotExist:
        return Response({'error': 'Occasion not found'}, status=status.HTTP_404_NOT_FOUND)

    for field in ['name', 'tagline', 'description', 'is_active', 'order']:
        if field in request.data:
            setattr(occasion, field, request.data[field])

    if 'image' in request.FILES:
        occasion.image = request.FILES['image']

    occasion.save()
    return Response({
        'id': occasion.id, 'name': occasion.name, 'slug': occasion.slug,
        'tagline': occasion.tagline, 'is_active': occasion.is_active,
        'image_url': request.build_absolute_uri(occasion.image.url) if occasion.image else None,
    })
