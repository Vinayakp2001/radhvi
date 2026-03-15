# gift/middleware.py

import time
from django.utils import timezone
from django.shortcuts import redirect
from django.contrib import messages
from django.utils.deprecation import MiddlewareMixin
from .models import BrowsingHistory, Cart

class BrowsingHistoryMiddleware(MiddlewareMixin):
    """Track user browsing history"""
    def process_view(self, request, view_func, view_args, view_kwargs):
        if request.user.is_authenticated and 'product' in view_kwargs:
            product_slug = view_kwargs.get('product')
            from .models import Product
            
            try:
                product = Product.objects.get(slug=product_slug)
                # Check if already viewed recently (within 1 hour)
                one_hour_ago = timezone.now() - timezone.timedelta(hours=1)
                
                existing = BrowsingHistory.objects.filter(
                    user=request.user,
                    product=product,
                    viewed_at__gte=one_hour_ago
                ).exists()
                
                if not existing:
                    BrowsingHistory.objects.create(
                        user=request.user,
                        product=product
                    )
                    
                    # Keep only last 100 records per user
                    records = BrowsingHistory.objects.filter(
                        user=request.user
                    ).order_by('-viewed_at')
                    
                    if records.count() > 100:
                        records[100:].delete()
                        
            except Product.DoesNotExist:
                pass
        
        return None

class CartMiddleware(MiddlewareMixin):
    """Ensure cart exists for users and guests"""
    def process_request(self, request):
        if not hasattr(request, 'cart'):
            from .views import get_or_create_cart
            request.cart = get_or_create_cart(request)
        return None

class TimezoneMiddleware(MiddlewareMixin):
    """Set timezone based on user preference"""
    def process_request(self, request):
        if request.user.is_authenticated:
            # You can store user's timezone in profile
            timezone.activate('Asia/Kolkata')  # Default to Indian timezone
        return None