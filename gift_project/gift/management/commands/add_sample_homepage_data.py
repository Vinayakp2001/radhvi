# Management command to add sample data for homepage
from django.core.management.base import BaseCommand
from gift.models import Occasion, Testimonial


class Command(BaseCommand):
    help = 'Add sample occasions and testimonials for homepage'

    def handle(self, *args, **kwargs):
        self.stdout.write('Adding sample data for homepage...\n')
        
        # Create Occasions
        occasions_data = [
            {
                'name': 'Birthday',
                'slug': 'birthday',
                'tagline': 'Make birthdays unforgettable',
                'description': 'Find the perfect gift to celebrate their special day',
                'order': 1,
            },
            {
                'name': 'Anniversary',
                'slug': 'anniversary',
                'tagline': 'Celebrate love and togetherness',
                'description': 'Romantic gifts for your special someone',
                'order': 2,
            },
            {
                'name': 'Wedding',
                'slug': 'wedding',
                'tagline': 'Perfect gifts for the big day',
                'description': 'Thoughtful presents for the happy couple',
                'order': 3,
            },
            {
                'name': "Valentine's Day",
                'slug': 'valentines-day',
                'tagline': 'Express your love',
                'description': 'Romantic gifts to show you care',
                'order': 4,
            },
            {
                'name': 'Diwali',
                'slug': 'diwali',
                'tagline': 'Festival of lights celebration',
                'description': 'Traditional and modern gifts for Diwali',
                'order': 5,
            },
            {
                'name': 'Raksha Bandhan',
                'slug': 'raksha-bandhan',
                'tagline': 'Celebrate sibling bond',
                'description': 'Special gifts for your brother or sister',
                'order': 6,
            },
        ]
        
        occasions_created = 0
        for data in occasions_data:
            occasion, created = Occasion.objects.get_or_create(
                slug=data['slug'],
                defaults=data
            )
            if created:
                occasions_created += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created occasion: {occasion.name}'))
            else:
                self.stdout.write(f'  Occasion already exists: {occasion.name}')
        
        # Create Testimonials
        testimonials_data = [
            {
                'name': 'Priya Sharma',
                'city': 'Mumbai',
                'text': 'Amazing quality and fast delivery! The birthday gift I ordered was beautifully packaged and my friend loved it.',
                'tag': 'Birthday Gift',
                'rating': 5,
                'order': 1,
            },
            {
                'name': 'Rahul Verma',
                'city': 'Delhi',
                'text': 'Perfect anniversary gift! My wife was so happy. The roses were fresh and the presentation was excellent.',
                'tag': 'Anniversary Gift',
                'rating': 5,
                'order': 2,
            },
            {
                'name': 'Anjali Patel',
                'city': 'Bangalore',
                'text': 'Ordered bulk gifts for our wedding. Great service and beautiful products. Highly recommended!',
                'tag': 'Wedding Gift',
                'rating': 5,
                'order': 3,
            },
            {
                'name': 'Vikram Singh',
                'city': 'Pune',
                'text': 'Best gift shop for all occasions. Quality products at reasonable prices. Will order again!',
                'tag': 'Diwali Gift',
                'rating': 5,
                'order': 4,
            },
            {
                'name': 'Sneha Reddy',
                'city': 'Hyderabad',
                'text': 'Loved the Valentine\'s Day hamper! Everything was perfect from ordering to delivery.',
                'tag': 'Valentine Gift',
                'rating': 5,
                'order': 5,
            },
            {
                'name': 'Arjun Mehta',
                'city': 'Chennai',
                'text': 'Excellent customer service. They helped me choose the perfect gift for my sister\'s birthday.',
                'tag': 'Birthday Gift',
                'rating': 5,
                'order': 6,
            },
        ]
        
        testimonials_created = 0
        for data in testimonials_data:
            testimonial, created = Testimonial.objects.get_or_create(
                name=data['name'],
                city=data['city'],
                defaults=data
            )
            if created:
                testimonials_created += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created testimonial: {testimonial.name} - {testimonial.city}'))
            else:
                self.stdout.write(f'  Testimonial already exists: {testimonial.name}')
        
        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'\n✓ Sample data added successfully!'))
        self.stdout.write(f'  Occasions created: {occasions_created}/{len(occasions_data)}')
        self.stdout.write(f'  Testimonials created: {testimonials_created}/{len(testimonials_data)}')
        self.stdout.write('\n' + '='*50)
        self.stdout.write('\nNote: Occasion images need to be added through Django admin.')
        self.stdout.write('Go to: http://localhost:8000/admin/gift/occasion/\n')
