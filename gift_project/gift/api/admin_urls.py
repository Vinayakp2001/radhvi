# Admin API URL configuration
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import (
    admin_dashboard,
    AdminProductViewSet,
    AdminOrderViewSet,
    AdminCategoryViewSet,
    AdminCouponViewSet,
    AdminReturnRequestViewSet,
    AdminUserViewSet,
    AdminBulkInquiryViewSet,
    product_images, upload_product_image, delete_product_image, set_primary_image,
    product_specs, save_product_specs,
    product_occasions, set_product_occasions,
    list_occasions, update_occasion,
)

router = DefaultRouter()
router.register(r'products', AdminProductViewSet, basename='admin-product')
router.register(r'categories', AdminCategoryViewSet, basename='admin-category')
router.register(r'coupons', AdminCouponViewSet, basename='admin-coupon')

urlpatterns = [
    path('dashboard/', admin_dashboard, name='admin-dashboard'),
    path('', include(router.urls)),
    # Orders — custom lookup by order_id string
    path('orders/', AdminOrderViewSet.as_view({'get': 'list'}), name='admin-order-list'),
    path('orders/<str:pk>/', AdminOrderViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update'}), name='admin-order-detail'),
    # Returns
    path('returns/', AdminReturnRequestViewSet.as_view({'get': 'list'}), name='admin-return-list'),
    path('returns/<int:pk>/', AdminReturnRequestViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update'}), name='admin-return-detail'),
    # Users
    path('users/', AdminUserViewSet.as_view({'get': 'list'}), name='admin-user-list'),
    path('users/<int:pk>/', AdminUserViewSet.as_view({'get': 'retrieve'}), name='admin-user-detail'),
    # Bulk Inquiries
    path('bulk-inquiries/', AdminBulkInquiryViewSet.as_view({'get': 'list'}), name='admin-inquiry-list'),
    path('bulk-inquiries/<int:pk>/', AdminBulkInquiryViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update'}), name='admin-inquiry-detail'),
    # Product images
    path('products/<int:product_id>/images/', product_images, name='admin-product-images'),
    path('products/<int:product_id>/images/upload/', upload_product_image, name='admin-upload-image'),
    path('products/<int:product_id>/images/<int:image_id>/delete/', delete_product_image, name='admin-delete-image'),
    path('products/<int:product_id>/images/<int:image_id>/set-primary/', set_primary_image, name='admin-set-primary'),
    # Product specs
    path('products/<int:product_id>/specs/', product_specs, name='admin-product-specs'),
    path('products/<int:product_id>/specs/save/', save_product_specs, name='admin-save-specs'),
    # Product occasions
    path('products/<int:product_id>/occasions/', product_occasions, name='admin-product-occasions'),
    path('products/<int:product_id>/occasions/set/', set_product_occasions, name='admin-set-occasions'),
    # Occasions
    path('occasions/', list_occasions, name='admin-occasions-list'),
    path('occasions/<int:occasion_id>/', update_occasion, name='admin-occasion-update'),
]
