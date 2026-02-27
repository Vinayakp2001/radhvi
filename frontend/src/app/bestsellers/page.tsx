import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';
import ProductCard from '@/components/ProductCard';
import { apiServices, productToCardProps } from '@/lib/api-services';

export const metadata: Metadata = {
  title: 'Bestsellers | Radhvi',
  description: 'Shop our most popular gifts - customer favorites and top-rated products.',
};

export default async function BestsellersPage() {
  const bestsellers = await apiServices.fetchBestsellers(20);

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar message="🎉 Free Shipping on orders above ₹999" />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16 md:py-20">
          <div className="container-custom text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-display">
              Bestsellers
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our most loved gifts, chosen by customers like you
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16 md:py-20">
          <div className="container-custom">
            {bestsellers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {bestsellers.map((product) => (
                  <ProductCard key={product.id} {...productToCardProps(product)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No bestsellers available at the moment.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
