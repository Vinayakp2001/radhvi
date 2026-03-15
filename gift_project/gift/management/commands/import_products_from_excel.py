"""
Django management command to import products from Excel file with multiple images.

Usage:
    python manage.py import_products_from_excel <excel_file_path> <images_folder_path> [--category <category_name>]

Example:
    python manage.py import_products_from_excel products.xlsx C:/images/products --category "Gift Hampers"
"""

import os
import pandas as pd
from django.core.management.base import BaseCommand, CommandError
from django.core.files import File
from django.utils.text import slugify
from gift.models import Product, Category, ProductImage


class Command(BaseCommand):
    help = 'Import products from Excel file with multiple images per product'

    def add_arguments(self, parser):
        parser.add_argument(
            'excel_file',
            type=str,
            help='Path to Excel file containing product data'
        )
        parser.add_argument(
            'images_folder',
            type=str,
            help='Path to folder containing product images'
        )
        parser.add_argument(
            '--category',
            type=str,
            default='Uncategorized',
            help='Category name for imported products (default: Uncategorized)'
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip products that already exist (by name)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview import without saving to database'
        )

    def handle(self, *args, **options):
        excel_file = options['excel_file']
        images_folder = options['images_folder']
        category_name = options['category']
        skip_existing = options['skip_existing']
        dry_run = options['dry_run']

        # Validate files and folders
        if not os.path.exists(excel_file):
            raise CommandError(f'Excel file not found: {excel_file}')
        
        if not os.path.exists(images_folder):
            raise CommandError(f'Images folder not found: {images_folder}')

        # Read Excel file
        self.stdout.write(self.style.SUCCESS(f'\n📊 Reading Excel file: {excel_file}'))
        try:
            df = pd.read_excel(excel_file)
        except Exception as e:
            raise CommandError(f'Error reading Excel file: {str(e)}')

        # Validate required columns
        required_columns = ['name', 'description', 'price', 'image_files', 'product_description']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise CommandError(f'Missing required columns: {", ".join(missing_columns)}')

        # Get or create category
        if not dry_run:
            category, created = Category.objects.get_or_create(
                name=category_name,
                defaults={
                    'slug': slugify(category_name),
                    'description': f'Products in {category_name} category'
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ Created category: {category_name}'))
            else:
                self.stdout.write(self.style.WARNING(f'📁 Using existing category: {category_name}'))

        # Statistics
        stats = {
            'total': len(df),
            'created': 0,
            'skipped': 0,
            'errors': 0,
            'images_added': 0
        }

        # Process each row
        self.stdout.write(self.style.SUCCESS(f'\n🚀 Processing {stats["total"]} products...\n'))
        
        for index, row in df.iterrows():
            try:
                product_name = str(row['name']).strip()
                
                # Skip empty rows
                if pd.isna(product_name) or not product_name:
                    continue

                self.stdout.write(f'\n📦 Processing: {product_name}')

                # Check if product exists
                if skip_existing and not dry_run:
                    if Product.objects.filter(name=product_name).exists():
                        self.stdout.write(self.style.WARNING(f'   ⏭️  Skipped (already exists)'))
                        stats['skipped'] += 1
                        continue

                # Extract data
                short_description = str(row['description']).strip() if pd.notna(row['description']) else ''
                
                # Handle price - convert "Nill", "null", empty, or invalid values to 0.0
                try:
                    price_value = str(row['price']).strip().lower()
                    if price_value in ['nill', 'nil', 'null', 'none', '', 'nan']:
                        price = 0.0
                    else:
                        price = float(row['price'])
                except (ValueError, AttributeError):
                    price = 0.0
                
                description = str(row['product_description']).strip() if pd.notna(row['product_description']) else short_description
                
                # Parse image files (comma-separated)
                image_files_str = str(row['image_files']).strip() if pd.notna(row['image_files']) else ''
                image_files = [img.strip() for img in image_files_str.split(',') if img.strip()]

                if dry_run:
                    self.stdout.write(f'   📝 Name: {product_name}')
                    self.stdout.write(f'   💰 Price: ₹{price}')
                    self.stdout.write(f'   📄 Description: {short_description[:50]}...')
                    self.stdout.write(f'   🖼️  Images: {len(image_files)} files')
                    for img in image_files:
                        img_path = os.path.join(images_folder, img)
                        exists = '✅' if os.path.exists(img_path) else '❌'
                        self.stdout.write(f'      {exists} {img}')
                    stats['created'] += 1
                    continue

                # Create product
                product = Product.objects.create(
                    name=product_name,
                    slug=slugify(product_name),
                    short_description=short_description,
                    description=description,
                    price=price,
                    category=category,
                    stock=100  # Default stock
                )

                self.stdout.write(self.style.SUCCESS(f'   ✅ Created product'))

                # Process images
                images_added = 0
                for img_index, img_filename in enumerate(image_files):
                    img_path = os.path.join(images_folder, img_filename)
                    
                    if not os.path.exists(img_path):
                        self.stdout.write(self.style.WARNING(f'      ⚠️  Image not found: {img_filename}'))
                        continue

                    try:
                        with open(img_path, 'rb') as img_file:
                            # First image becomes the main product image
                            if img_index == 0:
                                product.image.save(img_filename, File(img_file), save=True)
                                self.stdout.write(f'      🖼️  Set main image: {img_filename}')
                            
                            # Create ProductImage entry for all images
                            product_image = ProductImage.objects.create(
                                product=product,
                                is_primary=(img_index == 0)
                            )
                            
                            # Reopen file for ProductImage
                            with open(img_path, 'rb') as img_file2:
                                product_image.image.save(img_filename, File(img_file2), save=True)
                            
                            images_added += 1
                            self.stdout.write(f'      ✅ Added image {img_index + 1}: {img_filename}')
                    
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'      ❌ Error with image {img_filename}: {str(e)}'))

                stats['created'] += 1
                stats['images_added'] += images_added
                self.stdout.write(self.style.SUCCESS(f'   ✨ Product created with {images_added} images'))

            except Exception as e:
                stats['errors'] += 1
                self.stdout.write(self.style.ERROR(f'   ❌ Error: {str(e)}'))
                continue

        # Print summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('📊 IMPORT SUMMARY'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'Total rows processed: {stats["total"]}')
        self.stdout.write(self.style.SUCCESS(f'✅ Products created: {stats["created"]}'))
        if stats['skipped'] > 0:
            self.stdout.write(self.style.WARNING(f'⏭️  Products skipped: {stats["skipped"]}'))
        if stats['errors'] > 0:
            self.stdout.write(self.style.ERROR(f'❌ Errors: {stats["errors"]}'))
        if not dry_run:
            self.stdout.write(self.style.SUCCESS(f'🖼️  Total images added: {stats["images_added"]}'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\n⚠️  DRY RUN - No data was saved to database'))
            self.stdout.write(self.style.WARNING('Remove --dry-run flag to actually import products'))
        else:
            self.stdout.write(self.style.SUCCESS('\n✨ Import completed successfully!'))
