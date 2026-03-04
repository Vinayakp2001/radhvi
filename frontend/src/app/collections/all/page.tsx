import { Suspense } from 'react';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductGrid from '@/components/ProductGrid';
import SearchBar from '@/components/SearchBar';
import SkeletonLoader from '@/components/SkeletonLoader';
import ProductFilters from '@/components/ProductFilters';
import ProductSort from '@/components/ProductSort';
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
  price_range?: string;
  page?: string;
}

interface CollectionsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const resolvedSearchParams = await searchParams;
  const { search, category, sort = 'name', price_range, page = '1' } = resolvedSearchParams;
  
  const currentPage = parseInt(page);
  const limit = 12;
  const offset = (currentPage - 1) * limit;
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/products/?${new URLSearchParams({
    ...(search && { search }),
    ...(category && { category }),
    ordering: sort,
    limit: limit.toString(),
    offset: offset.toString(),
    ...(price_range && { price_range }),
  })}`, {
    cache: 'no-store', // Disable caching for pagination
  });  
  const data = await response.json();
  const products = data.results || [];
  const totalCount = data.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

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
                <ProductFilters categories={categories} currentCategory={category} />
              </aside>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <p className="text-gray-600 mb-4 sm:mb-0">
                    Showing {products.length > 0 ? offset + 1 : 0}-{Math.min(offset + products.length, totalCount)} of {totalCount} products
                  </p>
                  
                  <ProductSort currentSort={sort} options={sortOptions} />
                </div>

                <Suspense fallback={<SkeletonLoader type="product" count={12} />}>
                  {products.length > 0 ? (
                    <>
                      <ProductGrid products={products} />
                      
                      {totalPages > 1 && (
                        <div className="mt-8 flex justify-center items-center gap-2">
                          {currentPage > 1 && (
                            <a
                              href={`/collections/all?${new URLSearchParams({
                                ...(search && { search }),
                                ...(category && { category }),
                                sort,
                                ...(price_range && { price_range }),
                                page: (currentPage - 1).toString(),
                              })}`}
                              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              Previous
                            </a>
                          )}
                          
                          <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <a
                                key={pageNum}
                                href={`/collections/all?${new URLSearchParams({
                                  ...(search && { search }),
                                  ...(category && { category }),
                                  sort,
                                  ...(price_range && { price_range }),
                                  page: pageNum.toString(),
                                })}`}
                                className={`px-4 py-2 border rounded-md transition-colors ${
                                  pageNum === currentPage
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </a>
                            ))}
                          </div>
                          
                          {currentPage < totalPages && (
                            <a
                              href={`/collections/all?${new URLSearchParams({
                                ...(search && { search }),
                                ...(category && { category }),
                                sort,
                                ...(price_range && { price_range }),
                                page: (currentPage + 1).toString(),
                              })}`}
                              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              Next
                            </a>
                          )}
                        </div>
                      )}
                    </>
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
