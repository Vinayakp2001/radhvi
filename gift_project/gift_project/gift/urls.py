from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from . import views
from gift.shipping.webhooks import shiprocket_webhook

urlpatterns = [
    # Home & Products
    path('', views.home, name='home'),
    path('products/', views.product_list, name='product_list'),
    path('product/<slug:slug>/', views.product_detail, name='product_detail'),
    path('category/<slug:slug>/', views.product_list, name='category_products'),
    
    # Cart
    path('cart/', views.cart_view, name='cart'),
    path('api/add-to-cart/', views.add_to_cart, name='add_to_cart'),
    path('api/update-cart-item/', views.update_cart_item, name='update_cart_item'),
    path('api/remove-from-cart/', views.remove_from_cart, name='remove_from_cart'),
    path('api/get-cart-count/', views.get_cart_count, name='get_cart_count'),
    
    # Checkout & Orders
    path('checkout/', views.checkout, name='checkout'),
    path('order-success/<str:order_id>/', views.order_success, name='order_success'),
    path('my-orders/', views.order_history, name='order_history'),
    path('order/<str:order_id>/', views.order_detail, name='order_detail'),
    path('order/<str:order_id>/tracking/', views.order_tracking, name='order_tracking'),
    path('order/<str:order_id>/cancel/', views.cancel_order, name='cancel_order'),
    path('order/<str:order_id>/invoice/', views.download_invoice, name='download_invoice'),
    path('order/<str:order_id>/return/', views.start_return, name='start_return'),
    path('order/<str:order_id>/review/', views.write_review_for_order, name='write_review_order'),
    
    # User Account
    path('profile/', views.user_profile, name='profile'),
    path('my-account/', views.user_profile, name='user_profile'),
    path('address-book/', views.address_book, name='address_book'),
    path('change-password/', views.change_password, name='change_password'),
    path('logout/', views.logout_view, name='logout'),
    
    # Authentication URLs - ONLY YOUR CUSTOM VIEWS
    path('login/', views.user_login, name='login'),
    path('register/', views.user_register, name='register'),
    
    # REMOVE THIS LINE: Don't include Django's built-in auth URLs
    # path('accounts/', include('django.contrib.auth.urls')),
    
    # NEW URLs
    path('track-order/', views.track_order, name='track_order'),
    path('compare/', views.compare_products, name='compare'),
    path('notifications/', views.notifications, name='notifications'),
    
    # Wishlist
    path('wishlist/', views.wishlist, name='wishlist'),
    path('api/toggle-wishlist/', views.toggle_wishlist, name='toggle_wishlist'),
    
    # Reviews
    path('product/<int:product_id>/review/', views.add_review, name='add_review'),
    
    # Coupons
    path('api/validate-coupon/', views.validate_coupon, name='validate_coupon'),
    
    # Search
    path('api/search-autocomplete/', views.search_autocomplete, name='search_autocomplete'),
    
    # Static Pages
    path('about/', views.about_us, name='about'),
    path('contact/', views.contact_us, name='contact'),
    path('privacy/', views.privacy_policy, name='privacy'),
    path('terms/', views.terms_conditions, name='terms'),
    path('faq/', views.faq, name='faq'),
    
    # Bulk Orders / B2B
    path('bulk-orders/', views.bulk_orders, name='bulk_orders'),
    path('corporate-gifting/', views.bulk_orders, name='corporate_gifting'),
    
    # Payment
    path('payment/upi/<str:order_id>/', views.process_upi_payment, name='process_upi_payment'),
    
    # Shiprocket Webhook
    path('api/webhooks/shiprocket/', shiprocket_webhook, name='shiprocket_webhook'),
    
    path('login/', views.user_login, name='login'),
    path('accounts/login/', views.user_login, name='login'),  # Add this

    path('register/', views.user_register, name='register'),
    path('accounts/register/', views.user_register, name='register'),  # Optional: if needed

    path('logout/', views.logout_view, name='logout'),
    path('accounts/logout/', views.logout_view, name='logout'),  # Optional: if needed

    path('api/add-to-compare/', views.add_to_compare, name='add_to_compare'),
    path('api/remove-from-compare/', views.remove_from_compare, name='remove_from_compare'),
    path('api/clear-comparison/', views.clear_comparison, name='clear_comparison'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)