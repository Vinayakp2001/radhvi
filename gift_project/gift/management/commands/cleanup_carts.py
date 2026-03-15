"""
Management command to clean up duplicate and fallback carts
Usage: python manage.py cleanup_carts [--all]
"""

from django.core.management.base import BaseCommand
from gift.models import Cart, CartItem

class Command(BaseCommand):
    help = 'Clean up duplicate and fallback carts'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Delete ALL carts and cart items (fresh start)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🧹 Starting cart cleanup...'))
        
        if options['all']:
            # Delete everything
            item_count = CartItem.objects.count()
            cart_count = Cart.objects.count()
            
            CartItem.objects.all().delete()
            Cart.objects.all().delete()
            
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted ALL {cart_count} carts'))
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted ALL {item_count} cart items'))
            self.stdout.write(self.style.WARNING('\n⚠️  Fresh start! All carts cleared.'))
        else:
            # 1. Delete all fallback carts
            fallback_carts = Cart.objects.filter(session_key='fallback')
            fallback_count = fallback_carts.count()
            fallback_carts.delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {fallback_count} fallback carts'))
            
            # 2. Delete empty carts (no items)
            empty_carts = []
            for cart in Cart.objects.all():
                if cart.items.count() == 0:
                    empty_carts.append(cart.id)
            
            empty_count = len(empty_carts)
            Cart.objects.filter(id__in=empty_carts).delete()
            self.stdout.write(self.style.SUCCESS(f'✓ Deleted {empty_count} empty carts'))
            
            # 3. Show remaining carts
            remaining = Cart.objects.count()
            self.stdout.write(self.style.SUCCESS(f'\n📊 Summary:'))
            self.stdout.write(f'   Total carts remaining: {remaining}')
            self.stdout.write(f'   User carts: {Cart.objects.filter(user__isnull=False).count()}')
            self.stdout.write(f'   Guest carts: {Cart.objects.filter(user__isnull=True).count()}')
            self.stdout.write(f'   Total cart items: {CartItem.objects.count()}')
            
            if remaining > 0:
                self.stdout.write(self.style.WARNING(f'\n⚠️  {remaining} carts still exist with items'))
                self.stdout.write(self.style.WARNING('   Run with --all flag to delete everything:'))
                self.stdout.write(self.style.WARNING('   python manage.py cleanup_carts --all'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Cart cleanup completed!'))
