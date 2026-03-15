"""
Django management command to set up Valentine's Day category
Usage: python manage.py setup_valentine_category
"""

from django.core.management.base import BaseCommand
from gift.models import Category


class Command(BaseCommand):
    help = 'Creates or updates the Valentine\'s Day category'

    def handle(self, *args, **options):
        self.stdout.write('Setting up Valentine\'s Day category...')
        
        # Create or update Valentine's category
        category, created = Category.objects.get_or_create(
            slug='valentines',
            defaults={
                'name': "Valentine's Special",
                'icon': '💝',  # Heart emoji
                'is_active': True,
                'description': 'Express your love with our exclusive Valentine\'s Day collection. Premium gifts that speak from the heart.',
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Created new Valentine\'s category: {category.name}'
                )
            )
        else:
            # Update existing category
            category.name = "Valentine's Special"
            category.icon = '💝'
            category.is_active = True
            category.description = 'Express your love with our exclusive Valentine\'s Day collection. Premium gifts that speak from the heart.'
            category.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Updated existing Valentine\'s category: {category.name}'
                )
            )
        
        self.stdout.write('')
        self.stdout.write('Category details:')
        self.stdout.write(f'  Name: {category.name}')
        self.stdout.write(f'  Slug: {category.slug}')
        self.stdout.write(f'  Icon: {category.icon}')
        self.stdout.write(f'  Active: {category.is_active}')
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(
                '✓ Valentine\'s category is ready!'
            )
        )
        self.stdout.write('')
        self.stdout.write('Next steps:')
        self.stdout.write('  1. Go to Django admin: http://localhost:8000/admin/')
        self.stdout.write('  2. Add products to the Valentine\'s Special category')
        self.stdout.write('  3. The Valentine\'s campaign will automatically show these products')
