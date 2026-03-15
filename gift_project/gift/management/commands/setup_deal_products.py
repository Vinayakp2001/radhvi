"""
Management command to set up hot deal products
"""
from django.core.management.base import BaseCommand
from gift.models import Product, Category
from decimal import Decimal


class Command(BaseCommand):
    help = 'Sets up hot deal products (earrings and roses)'

    def handle(self, *args, **options):
        self.stdout.write('Setting up hot deal products...')
        
        # Get or create a default category
        category, created = Category.objects.get_or_create(
            slug='special-deals',
            defaults={
                'name': 'Special Deals',
                'icon': '🔥',
                'description': 'Hot deals and special offers',
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created category: {category.name}'))
        else:
            self.stdout.write(f'  Category already exists: {category.name}')
        
        # Create Earring Product
        earring_product, created = Product.objects.get_or_create(
            slug='premium-oxidized-earring-collection',
            defaults={
                'name': 'Premium Oxidized Earring Collection',
                'description': '''Exquisite set of 16 pairs of handcrafted oxidized earrings. 
                
This stunning collection features:
- 16 unique designer pairs with intricate patterns
- Premium oxidized silver finish that won't tarnish
- Handcrafted by skilled artisans
- Perfect for traditional and contemporary looks
- Suitable for all occasions - weddings, parties, festivals
- Comes in an elegant gift box packaging
- Hypoallergenic and skin-friendly materials

Each pair is carefully crafted to ensure the highest quality and durability. 
The collection includes a variety of styles from classic jhumkas to modern geometric designs, 
giving you endless options to match your outfits.

Perfect gift for yourself or your loved ones!''',
                'short_description': 'Exquisite set of 16 pairs of handcrafted oxidized earrings. Perfect for every occasion - from traditional to contemporary looks. Premium quality with intricate designs.',
                'price': Decimal('1699.00'),
                'discounted_price': Decimal('999.00'),
                'category': category,
                'stock': 50,
                'sku': 'EARRING-SET-16',
                'rating': 4.8,
                'review_count': 127,
                'sold_count': 89,
                'is_featured': True,
                'is_trending': True,
                'is_best_seller': True,
                'is_new_arrival': False,
                'weight': Decimal('150.00'),
                'dimensions': '15x10x5 cm',
                'meta_title': 'Premium Oxidized Earring Collection - 16 Pairs | Radhvi',
                'meta_description': 'Get 16 pairs of premium handcrafted oxidized earrings at 41% OFF. Perfect for all occasions. Free shipping & elegant gift box included.'
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created product: {earring_product.name}'))
            self.stdout.write(f'  Price: ₹{earring_product.price} → ₹{earring_product.discounted_price}')
            self.stdout.write(f'  Discount: 41% OFF')
        else:
            self.stdout.write(self.style.WARNING(f'  Product already exists: {earring_product.name}'))
        
        # Create Roses Product
        roses_product, created = Product.objects.get_or_create(
            slug='luxury-80-red-roses-bouquet',
            defaults={
                'name': 'Luxury 80 Red Roses Bouquet',
                'description': '''Stunning arrangement of 80 premium red roses in elegant black wrapping.

This magnificent bouquet features:
- 80 fresh, premium quality red roses
- Elegant black and gold wrapping with intricate design
- Fresh baby's breath accent for added elegance
- Grand size: 30 inches (height) x 28 inches (width)
- Same day delivery available
- Comes with a personalized message card
- Professionally arranged by expert florists

Perfect for:
- Expressing deep love and affection
- Marriage proposals
- Anniversaries and special celebrations
- Apologies and making up
- Grand romantic gestures
- Valentine's Day, birthdays, and special occasions

Each rose is hand-selected for its beauty, freshness, and vibrant color. 
The bouquet is carefully arranged to create a stunning visual impact that will 
leave your loved one speechless.

This is not just a bouquet - it's an unforgettable experience!''',
                'short_description': 'Stunning arrangement of 80 premium red roses in elegant black wrapping with baby\'s breath. Perfect for expressing deep love and making unforgettable moments. Grand size: 30" x 28".',
                'price': Decimal('2999.00'),
                'discounted_price': None,
                'category': category,
                'stock': 25,
                'sku': 'ROSES-80-LUXURY',
                'rating': 4.9,
                'review_count': 234,
                'sold_count': 156,
                'is_featured': True,
                'is_trending': True,
                'is_best_seller': True,
                'is_new_arrival': False,
                'weight': Decimal('2500.00'),
                'dimensions': '76x71x30 cm (30x28x12 inches)',
                'meta_title': 'Luxury 80 Red Roses Bouquet - Grand Romantic Gesture | Radhvi',
                'meta_description': 'Express your love with 80 premium red roses in elegant black wrapping. Same day delivery available. Perfect for proposals, anniversaries & special moments.'
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created product: {roses_product.name}'))
            self.stdout.write(f'  Price: ₹{roses_product.price}')
        else:
            self.stdout.write(self.style.WARNING(f'  Product already exists: {roses_product.name}'))
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('Setup complete!'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write('')
        self.stdout.write('Products created:')
        self.stdout.write(f'  1. {earring_product.name} (₹999 - 41% OFF)')
        self.stdout.write(f'  2. {roses_product.name} (₹2,999)')
        self.stdout.write('')
        self.stdout.write('Next steps:')
        self.stdout.write('  1. Upload product images in Django admin')
        self.stdout.write('  2. Visit your website to see the hot deal sections')
        self.stdout.write('  3. Test the "Add to Cart" functionality')
        self.stdout.write('')
