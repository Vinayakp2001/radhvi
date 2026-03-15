# gift/context_processors.py

from .models import Category, Cart, CartItem
from django.contrib.auth.models import AnonymousUser

# gift/context_processors.py

def cart_context(request):
    """Global cart context - FIXED VERSION"""
    from decimal import Decimal
    
    cart_items_count = 0
    cart_total = Decimal('0.00')
    
    try:
        # Get cart using the same logic as views
        if request.user.is_authenticated:
            cart = Cart.objects.filter(user=request.user).first()
        else:
            # Ensure session exists
            if not request.session.session_key:
                request.session.create()
                request.session.save()
            
            session_key = request.session.session_key
            cart = Cart.objects.filter(session_key=session_key, user=None).first()
        
        if cart:
            cart_items_count = cart.total_items
            cart_total = cart.subtotal
        
        print(f"Cart Context - Items: {cart_items_count}, Total: {cart_total}")
        
    except Exception as e:
        print(f"Error in cart_context: {e}")
    
    return {
        'cart_items_count': cart_items_count,
        'cart_total': cart_total,
    }

def wishlist_context(request):
    """Global wishlist context for all templates"""
    wishlist_count = 0
    if request.user.is_authenticated:
        wishlist_count = request.user.wishlist.count()
    
    return {
        'wishlist_count': wishlist_count,
    }

def categories_context(request):
    """Global categories for all templates"""
    categories = Category.objects.filter(is_active=True)[:8]
    return {
        'categories': categories,
    }

def campaign_context(request):
    """
    Add active campaign data to all template contexts.
    Checks if Valentine's campaign is enabled and within date range.
    """
    from django.conf import settings
    from datetime import datetime, date
    
    # Get campaign configuration from settings
    campaign_config = getattr(settings, 'VALENTINE_CAMPAIGN', {})
    
    # Check if campaign is enabled
    is_active = campaign_config.get('enabled', False)
    
    if is_active:
        # Check date range if dates are provided
        start_date_str = campaign_config.get('start_date')
        end_date_str = campaign_config.get('end_date')
        
        if start_date_str and end_date_str:
            try:
                today = date.today()
                start = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                
                # Campaign is only active if today is within date range
                is_active = start <= today <= end
                
            except (ValueError, TypeError) as e:
                # If date parsing fails, disable campaign
                print(f"Campaign date parsing error: {e}")
                is_active = False
    
    # Return campaign data only if active
    return {
        'valentine_campaign': campaign_config if is_active else None,
        'campaign_active': is_active,
    }