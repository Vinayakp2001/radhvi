# gift/management/commands/generate_dummy_data.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from faker import Faker
import random
from decimal import Decimal
from gift.models import (
    Category, Brand, Product, ProductImage,
    ProductReview, ProductAttribute
)

fake = Faker()

class Command(BaseCommand):
    help = 'Generate dummy data for testing'
    
    def handle(self, *args, **kwargs):
        self.stdout.write('Generating dummy data...')
        
        # Create categories
        categories_data = [
            {'name': 'Birthday Gifts', 'icon': '🎂'},
            {'name': 'Anniversary Gifts', 'icon': '💝'},
            {'name': 'Wedding Gifts', 'icon': '💒'},
            {'name': 'Festival Gifts', 'icon': '🎉'},
            {'name': 'Corporate Gifts', 'icon': '💼'},
            {'name': 'Personalized Gifts', 'icon': '🖋️'},
            {'name': 'Home Decor', 'icon': '🏠'},
            {'name': 'Jewelry', 'icon': '💎'},
            {'name': 'Electronics', 'icon': '📱'},
            {'name': 'Fashion', 'icon': '👗'},
        ]
        
        categories = []
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'icon': cat_data['icon'],
                    'description': fake.text(max_nb_chars=200)
                }
            )
            categories.append(category)
            self.stdout.write(f'Created category: {category.name}')
        
        # Create brands
        brands_data = [
            {'name': 'GiftCraft'},
            {'name': 'ArtisanGifts'},
            {'name': 'PremiumGifts'},
            {'name': 'DesiGifts'},
            {'name': 'GlobalGifts'},
        ]
        
        brands = []
        for brand_data in brands_data:
            brand, created = Brand.objects.get_or_create(
                name=brand_data['name'],
                defaults={
                    'description': fake.text(max_nb_chars=200)
                }
            )
            brands.append(brand)
            self.stdout.write(f'Created brand: {brand.name}')
        
        # Create products
        for i in range(50):
            category = random.choice(categories)
            brand = random.choice(brands)
            
            product = Product.objects.create(
                name=fake.catch_phrase(),
                description=fake.text(max_nb_chars=500),
                short_description=fake.sentence(nb_words=10),
                price=Decimal(random.randint(100, 5000)),
                category=category,
                brand=brand,
                stock=random.randint(0, 100),
                is_featured=random.choice([True, False]),
                is_trending=random.choice([True, False]),
                is_best_seller=random.choice([True, False]),
                weight=Decimal(random.uniform(100, 2000)),
                dimensions=f"{random.randint(5, 50)}x{random.randint(5, 50)}x{random.randint(5, 50)} cm"
            )
            
            # Add discounted price for some products
            if random.choice([True, False]):
                discount_percent = random.randint(10, 50)
                product.discounted_price = product.price * (1 - discount_percent/100)
                product.save()
            
            # Add product attributes
            attributes = [
                {'name': 'Color', 'value': random.choice(['Red', 'Blue', 'Green', 'Black', 'White', 'Gold'])},
                {'name': 'Material', 'value': random.choice(['Wood', 'Metal', 'Glass', 'Ceramic', 'Plastic'])},
                {'name': 'Size', 'value': random.choice(['Small', 'Medium', 'Large'])},
            ]
            
            for attr_data in attributes:
                ProductAttribute.objects.create(
                    product=product,
                    name=attr_data['name'],
                    value=attr_data['value']
                )
            
            self.stdout.write(f'Created product: {product.name}')
        
        # Create a test user if not exists
        try:
            user = User.objects.get(username='testuser')
        except User.DoesNotExist:
            user = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='testpass123'
            )
            self.stdout.write('Created test user: testuser / testpass123')
        
        self.stdout.write(self.style.SUCCESS('Dummy data generation completed!'))