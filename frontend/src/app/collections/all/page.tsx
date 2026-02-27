import { Suspense } from 'react';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductGrid from '@/components/ProductGrid';
import SearchBar from '@/components/SearchBar';
import SkeletonLoader from '@/components/SkeletonLoader';
import { apiServices } from '@/lib/api-services';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Products - Premium Gifts Collection | Radhvi',
  description: 'Browse our complete collection of premium gifts. Find the perfect gift for any occasion.',
  keywords: 'all products, gift collection, premium gifts, online shopping',
};

interface SearchParams {
  search?: string;
  category?: string;
  sort?: string;
}

interface CollectionsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const resolvedSearchParams = await searchParams;
  const { search, category, sort = 'name' } = resolvedSearchParams;
  
  const products = await apiServices.fetchProducts({
    search,
    category,
    ordering: sort,
    limit: 24,
  });

  const categories = await apiServices.fetchCategories();

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
          <div className="container-custom py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  All Products
                </h1>
                <p className="text-gray-600">
                  {search ? `Search results for "${search}"` : 'Browse our complete collection'}
                </p>
              </div>
              
              <div className="w-full md:w-96">
                <SearchBar placeholder="Search products..." className="w-full" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container-custom">
            <div className="flex flex-col lg:flex-row gap-8">
              <aside className="lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                  <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
                  
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3">Categories</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="radio" name="category" value="" defaultChecked={!category} className="mr-2" />
                        <span className="text-sm">All Categories</span>
                      </label>
                      {categories.map((cat) => (
                        <label key={cat.id} className="flex items-center">
                          <input type="radio" name="category" value={cat.slug} defaultChecked={category === cat.slug} className="mr-2" />
                          <span className="text-sm">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3">Price Range</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Under ₹500</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">₹500 - ₹1000</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">₹1000 - ₹2000</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Above ₹2000</span>
                      </label>
                    </div>
                  </div>
                </div>
              </aside>

              <div className="flex-1">
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
                    <ProductGrid products={products} />
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No products found
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {search ? `No products match "${search}"` : 'No products available'}
                      </p>
                    </div>
                  )}
                </Suspense>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
