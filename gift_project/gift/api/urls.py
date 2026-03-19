# API URLs for Next.js Frontend
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, CategoryViewSet, OccasionViewSet,
    TestimonialViewSet, WishlistViewSet, CartViewSet, AddressViewSet,
    register, login, logout, me, guest_checkout,
    initiate_checkout, verify_payment, payment_failed, get_shipping_rates,
    list_orders, get_order_detail, cancel_order, get_order_tracking,
    initiate_refund, check_refund_status, get_configuration_status
)
from gift.payment.phonepe_webhooks import phonepe_webhook
from gift.shipping.webhooks import shiprocket_webhook

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'occasions', OccasionViewSet, basename='occasion')
router.register(r'testimonials', TestimonialViewSet, basename='testimonial')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'addresses', AddressViewSet, basename='address')

urlpatterns = [
    path('', include(router.urls)),
    # Authentication endpoints
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/logout/', logout, name='logout'),
    path('auth/me/', me, name='me'),
    # Checkout endpoints
    path('checkout/initiate/', initiate_checkout, name='initiate-checkout'),
    path('checkout/guest/', guest_checkout, name='guest-checkout'),
    path('checkout/verify-payment/', verify_payment, name='verify-payment'),
    path('checkout/payment-failed/', payment_failed, name='payment-failed'),
    path('checkout/shipping-rates/', get_shipping_rates, name='shipping-rates'),
    # Order endpoints
    path('orders/', list_orders, name='list-orders'),
    path('orders/<str:order_id>/', get_order_detail, name='order-detail'),
    path('orders/<str:order_id>/tracking/', get_order_tracking, name='order-tracking'),
    path('orders/<str:order_id>/cancel/', cancel_order, name='cancel-order'),
    # Refund endpoints
    path('refunds/initiate/', initiate_refund, name='initiate-refund'),
    path('refunds/status/<str:refund_transaction_id>/', check_refund_status, name='check-refund-status'),
    # Admin endpoints
    path('admin/phonepe-status/', get_configuration_status, name='phonepe-config-status'),
    path('admin/', include('gift.api.admin_urls')),
    # Webhook endpoints
    path('webhooks/phonepe/', phonepe_webhook, name='phonepe-webhook'),
    path('webhooks/shiprocket/', shiprocket_webhook, name='shiprocket-webhook'),
]
