import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';
import SkeletonLoader from '@/components/SkeletonLoader';
import { apiServices, productToCardProps } from '@/lib/api-services';
import type { Metadata } from 'next';

interface CollectionPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    search?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await apiServices.fetchCategories().then(cats => 
    cats.find(cat => cat.slug === slug)
  );

  if (!category) {
    return {
      title: 'Collection Not Found | Radhvi',
      description: 'The requested collection could not be found.',
    };
  }

  return {
    title: `${category.name} - Premium Gift Collection | Radhvi`,
    description: category.description || `Browse our ${category.name.toLowerCase()} collection.`,
    keywords: `${category.name.toLowerCase()}, gifts, premium collection`,
  };
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const { search, sort = 'name' } = resolvedSearchParams;
  
  const categories = await apiServices.fetchCategories();
  const category = categories.find(cat => cat.slug === slug);
  
  // Also check occasions for this slug
  let occasionName = '';
  if (!category) {
    const occasions = await apiServices.fetchOccasions();
    const occasion = occasions.find(o => o.slug === slug);
    if (occasion) {
      occasionName = occasion.name;
    } else {
      notFound();
    }
  }

  const products = category ? await apiServices.fetchProducts({
    category: slug,
    search,
    ordering: sort,
    limit: 24,
  }) : [];

  const displayName = category?.name || occasionName || slug;

  const sortOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: '-name', label: 'Name (Z-A)' },
    { value: 'price', label: 'Price (Low to High)' },
    { value: '-price', label: 'Price (High to Low)' },
    { value: '-created_at', label: 'Newest First' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1 bg-gray-50">
        <section className="bg-white border-b">
          <div className="container-custom py-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <a href="/" className="hover:text-primary-600">Home</a>
              <span>/</span>
              <a href="/collections/all" className="hover:text-primary-600">Collections</a>
              <span>/</span>
              <span className="text-gray-900 font-medium">{displayName}</span>
            </nav>
          </div>
        </section>

        <section className="bg-white border-b">
          <div className="container-custom py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {displayName}
                </h1>
                <p className="text-gray-600">
                  {search ? `Search results for "${search}"` : category?.description || `Browse our ${displayName.toLowerCase()} collection`}
                </p>
              </div>
              
              <div className="w-full md:w-96">
                <SearchBar placeholder={`Search ${displayName.toLowerCase()}...`} className="w-full" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container-custom">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <p className="text-gray-600 mb-4 sm:mb-0">
                Showing {products.length} products
              </p>
              
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                <select 
                  id="sort"
                  defaultValue={sort}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Suspense fallback={<SkeletonLoader type="product" count={12} />}>
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      {...productToCardProps(product)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-7xl mb-6">🎁</div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Coming Soon!
                  </h3>
                  <p className="text-gray-500 mb-2 max-w-md mx-auto">
                    We're curating the perfect {displayName} gifts just for you.
                  </p>
                  <p className="text-gray-400 text-sm mb-8">
                    Check back soon — something special is on its way.
                  </p>
                  <a href="/collections/all" className="inline-block bg-red-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors">
                    Browse All Products
                  </a>
                </div>
              )}
            </Suspense>

            {products.length > 0 && categories.length > 1 && (
              <section className="mt-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Other Collections</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {categories
                    .filter(cat => cat.slug !== slug)
                    .slice(0, 6)
                    .map((cat) => (
                      <a
                        key={cat.id}
                        href={`/collections/${cat.slug}`}
                        className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
                      >
                        <h3 className="font-medium text-gray-900 text-sm">{cat.name}</h3>
                      </a>
                    ))
                  }
                </div>
              </section>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
