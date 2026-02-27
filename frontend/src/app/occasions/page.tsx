import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';
import OccasionCard from '@/components/OccasionCard';
import { apiServices, occasionToCardProps } from '@/lib/api-services';

export const metadata: Metadata = {
  title: 'Shop by Occasion | Radhvi',
  description: 'Find the perfect gift for every occasion - birthdays, anniversaries, weddings, and more.',
};

export default async function OccasionsPage() {
  const occasions = await apiServices.fetchOccasions();

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar message="🎉 Free Shipping on orders above ₹999" />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16 md:py-20">
          <div className="container-custom text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-display">
              Shop by Occasion
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find the perfect gift for every celebration and special moment
            </p>
          </div>
        </section>

        {/* Occasions Grid */}
        <section className="py-16 md:py-20">
          <div className="container-custom">
            {occasions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {occasions.map((occasion) => (
                  <OccasionCard key={occasion.id} {...occasionToCardProps(occasion)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No occasions available at the moment.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
