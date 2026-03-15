# gift/signals.py

from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.db.models import Sum, Avg
from .models import (
    Product, ProductReview, Order, OrderItem,
    UserProfile, Notification, Cart
)

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create user profile when new user is created"""
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save user profile when user is saved"""
    if hasattr(instance, 'profile'):
        instance.profile.save()

@receiver(post_save, sender=ProductReview)
def update_product_rating(sender, instance, created, **kwargs):
    """Update product rating when review is added/updated"""
    if instance.product:
        # Calculate new average rating
        reviews = ProductReview.objects.filter(product=instance.product)
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        review_count = reviews.count()
        
        # Update product
        instance.product.rating = avg_rating
        instance.product.review_count = review_count
        instance.product.save()

@receiver(post_save, sender=Order)
def create_order_notification(sender, instance, created, **kwargs):
    """Create notification for order status changes"""
    if created:
        # Order placed notification
        Notification.objects.create(
            user=instance.user,
            notification_type='order',
            title='Order Placed',
            message=f'Your order #{instance.order_id} has been placed successfully.',
            related_id=instance.order_id,
            link=f'/order/{instance.order_id}/'
        )
    else:
        # Order status changed notification
        Notification.objects.create(
            user=instance.user,
            notification_type='order',
            title=f'Order {instance.get_status_display()}',
            message=f'Your order #{instance.order_id} is now {instance.get_status_display().lower()}.',
            related_id=instance.order_id,
            link=f'/order/{instance.order_id}/'
        )

@receiver(pre_save, sender=Order)
def check_stock_on_order(sender, instance, **kwargs):
    """Check stock before saving order"""
    if instance.pk:  # Only for existing orders
        old_order = Order.objects.get(pk=instance.pk)
        
        # If order is being cancelled, restore stock
        if old_order.status != 'cancelled' and instance.status == 'cancelled':
            for item in instance.items.all():
                item.product.stock += item.quantity
                item.product.sold_count -= item.quantity
                item.product.save()
        
        # If order is being uncancelled, deduct stock
        elif old_order.status == 'cancelled' and instance.status != 'cancelled':
            for item in instance.items.all():
                if item.product.stock >= item.quantity:
                    item.product.stock -= item.quantity
                    item.product.sold_count += item.quantity
                    item.product.save()
                else:
                    raise ValueError(f"Insufficient stock for {item.product.name}")

@receiver(post_save, sender=Cart)
def merge_cart_on_login(sender, instance, created, **kwargs):
    """Merge guest cart with user cart on login"""
    if instance.user and instance.session_key:
        # Find guest cart for this user
        from .models import CartItem
        
        try:
            guest_cart = Cart.objects.get(
                session_key=instance.session_key,
                user__isnull=True
            )
            
            # Merge cart items
            for item in guest_cart.items.all():
                # Check if item already exists in user cart
                existing_item = instance.items.filter(product=item.product).first()
                
                if existing_item:
                    existing_item.quantity += item.quantity
                    existing_item.save()
                else:
                    # Move item to user cart
                    item.cart = instance
                    item.save()
            
            # Delete guest cart
            guest_cart.delete()
            
        except Cart.DoesNotExist:
            pass