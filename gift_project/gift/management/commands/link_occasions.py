"""
Management command to link products to occasions based on intelligent mapping.
Run: python manage.py link_occasions
"""
from django.core.management.base import BaseCommand
from gift.models import Product, Occasion


class Command(BaseCommand):
    help = 'Link products to occasions based on product names and themes'

    def handle(self, *args, **kwargs):
        # Occasion slug -> product IDs mapping
        MAPPINGS = {
            'birthday': [54, 53, 52, 51, 49, 48, 47, 46, 45, 44, 42, 41, 40, 38, 37, 36, 35, 34, 33, 32],
            'anniversary': [54, 53, 51, 50, 48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 36, 34, 33, 32],
            'wedding': [54, 53, 47, 46, 45, 43, 41, 40, 39, 38, 36, 33, 32],
            'valentines-day': [54, 53, 52, 51, 50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 39, 37, 36, 34, 33, 32],
            'diwali': [51, 47, 46, 45, 42, 40, 38, 35, 34, 33, 32],
            'raksha-bandhan': [52, 51, 49, 48, 44, 42, 37, 35, 34, 32],
        }

        for slug, product_ids in MAPPINGS.items():
            try:
                occasion = Occasion.objects.get(slug=slug)
            except Occasion.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Occasion not found: {slug}'))
                continue

            products = Product.objects.filter(id__in=product_ids)
            occasion.products.set(products)
            self.stdout.write(self.style.SUCCESS(
                f'✓ {occasion.name}: linked {products.count()} products'
            ))

        self.stdout.write(self.style.SUCCESS('\nDone! All occasion-product links applied.'))
