import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { apiServices, productToCardProps } from '@/lib/api-services';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Arrivals | Radhvi',
  description: 'Discover the latest additions to our gift collection. Fresh picks for every occasion.',
};

export default async function NewArrivalsPage() {
  let products: Awaited<ReturnType<typeof apiServices.fetchProducts>> = [];
  try {
    products = await apiServices.fetchProducts({ is_new_arrival: true } as any);
  } catch {
    products = [];
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-red-50 to-pink-50 py-14">
          <div className="container-custom text-center">
            <span className="inline-block bg-red-100 text-red-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Just In
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              New Arrivals
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Fresh additions to our collection — thoughtfully curated for every occasion.
            </p>
          </div>
        </section>

        {/* Products */}
        <section className="py-14 bg-white">
          <div className="container-custom">
            {products.length > 0 ? (
              <>
                <p className="text-sm text-gray-500 mb-8">{products.length} products</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      {...productToCardProps(product)}
                      priority={index < 4}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎁</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  New arrivals coming soon
                </h2>
                <p className="text-gray-500 mb-8">
                  We're adding fresh products. Check back soon!
                </p>
                <Link
                  href="/collections/all"
                  className="inline-block bg-red-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Browse All Products
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
