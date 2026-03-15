from django.core.management.base import BaseCommand
from django.core.files import File
from gift.models import Product, ProductImage
import os
from pathlib import Path

class Command(BaseCommand):
    help = 'Link static images to products in database'

    def handle(self, *args, **kwargs):
        # Get products
        earring = Product.objects.filter(slug='premium-oxidized-earring-collection').first()
        roses = Product.objects.filter(slug='luxury-80-red-roses-bouquet').first()
        
        if not earring:
            self.stdout.write(self.style.ERROR('Earring product not found!'))
            return
        
        if not roses:
            self.stdout.write(self.style.ERROR('Roses product not found!'))
            return
        
        # Base path to static images
        base_path = Path('gift/static/images/deals')
        
        # Add earring images
        self.stdout.write('Adding earring images...')
        for i in range(1, 3):  # earring-set-1.jpg, earring-set-2.jpg
            img_path = base_path / f'earring-set-{i}.jpg'
            if img_path.exists():
                with open(img_path, 'rb') as f:
                    ProductImage.objects.create(
                        product=earring,
                        image=File(f, name=f'earring-set-{i}.jpg'),
                        is_primary=(i == 1),
                        alt_text=f'Premium Earring Set - View {i}'
                    )
                self.stdout.write(self.style.SUCCESS(f'✓ Added earring image {i}'))
            else:
                self.stdout.write(self.style.WARNING(f'✗ Image not found: {img_path}'))
        
        # Add roses images
        self.stdout.write('Adding roses images...')
        for i in range(1, 7):  # roses-1.jpg to roses-6.jpg
            img_path = base_path / f'roses-{i}.jpg'
            if img_path.exists():
                with open(img_path, 'rb') as f:
                    ProductImage.objects.create(
                        product=roses,
                        image=File(f, name=f'roses-{i}.jpg'),
                        is_primary=(i == 1),
                        alt_text=f'80 Roses Bouquet - View {i}'
                    )
                self.stdout.write(self.style.SUCCESS(f'✓ Added roses image {i}'))
            else:
                self.stdout.write(self.style.WARNING(f'✗ Image not found: {img_path}'))
        
        self.stdout.write(self.style.SUCCESS('\n✓ All images linked successfully!'))
        self.stdout.write('Run check_images.py again to verify.')
