from django.core.management.base import BaseCommand
from gift.models import Product, Category, ProductImage, Order, OrderItem, Cart, CartItem

class Command(BaseCommand):
    help = 'Delete all products and categories except roses and earring deal products'

    def handle(self, *args, **kwargs):
        # Product names to keep
        keep_products = [
            'Premium Oxidized Earring Collection',
            'Luxury 80 Red Roses Bouquet'
        ]
        
        # Get products to keep
        products_to_keep = Product.objects.filter(name__in=keep_products)
        keep_ids = list(products_to_keep.values_list('id', flat=True))
        
        self.stdout.write(f"Keeping {len(keep_ids)} products: {', '.join(keep_products)}")
        
        # Get products to delete
        products_to_delete = Product.objects.exclude(id__in=keep_ids)
        delete_ids = list(products_to_delete.values_list('id', flat=True))
        
        # Delete related order items first
        order_items = OrderItem.objects.filter(product_id__in=delete_ids)
        order_item_count = order_items.count()
        order_items.delete()
        self.stdout.write(f"✓ Deleted {order_item_count} order items")
        
        # Delete related cart items
        cart_items = CartItem.objects.filter(product_id__in=delete_ids)
        cart_item_count = cart_items.count()
        cart_items.delete()
        self.stdout.write(f"✓ Deleted {cart_item_count} cart items")
        
        # Now delete the products
        product_count = products_to_delete.count()
        products_to_delete.delete()
        
        self.stdout.write(self.style.SUCCESS(f'✓ Deleted {product_count} products'))
        
        # Delete all categories (since deal products don't need categories)
        category_count = Category.objects.count()
        Category.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS(f'✓ Deleted {category_count} categories'))
        
        # Show remaining products
        remaining = Product.objects.all()
        self.stdout.write(f"\nRemaining products ({remaining.count()}):")
        for product in remaining:
            self.stdout.write(f"  - {product.name} (₹{product.price})")
        
        self.stdout.write(self.style.SUCCESS('\n✓ Cleanup complete!'))
