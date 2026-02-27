'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';
import Link from 'next/link';
import Image from 'next/image';
import { wishlistAPI, WishlistItem } from '@/lib/wishlist';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state: authState } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to initialize
    if (authState.loading) {
      return;
    }

    if (!authState.isAuthenticated) {
      router.push('/login?redirect=/wishlist');
      return;
    }

    const loadWishlist = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading wishlist...');
        const items = await wishlistAPI.getWishlist();
        console.log('Wishlist API response:', items);
        console.log('Is array?', Array.isArray(items));
        // Ensure items is always an array
        setWishlistItems(Array.isArray(items) ? items : []);
      } catch (err: any) {
        console.error('Wishlist error:', err);
        console.error('Error response:', err.response?.data);
        setError(err.response?.data?.error || 'Failed to load wishlist');
        setWishlistItems([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };
    
    loadWishlist();
  }, [authState.isAuthenticated, authState.loading, router]);

  const handleRemove = async (productId: number) => {
    try {
      await wishlistAPI.removeFromWishlist(productId);
      setWishlistItems((items) => items.filter((item) => item.product.id !== productId));
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  if (authState.loading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar message="🎉 Free Shipping on orders above ₹999" />
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading wishlist...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar message="🎉 Free Shipping on orders above ₹999" />
      <Header />

      <main className="flex-1 bg-gray-50 py-12">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {wishlistItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg
                className="w-24 h-24 mx-auto mb-6 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-6">
                Save your favorite items here to buy them later.
              </p>
              <Link href="/collections/all" className="btn btn-primary px-8 py-3 inline-block">
                Explore Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.isArray(wishlistItems) && wishlistItems.map((item, index) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden group">
                  <Link href={`/products/${item.product.slug}`} className="block relative aspect-square">
                    {item.product.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        priority={index < 4}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    {item.product.discounted_price && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                        {Math.round(((parseFloat(item.product.price) - parseFloat(item.product.discounted_price)) / parseFloat(item.product.price)) * 100)}% OFF
                      </div>
                    )}
                  </Link>
                  <div className="p-4">
                    <Link href={`/products/${item.product.slug}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 hover:text-primary-600 line-clamp-2">
                        {item.product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-3">
                      {item.product.discounted_price ? (
                        <>
                          <span className="text-lg font-bold text-primary-600">
                            ₹{item.product.discounted_price}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            ₹{item.product.price}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          ₹{item.product.price}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(item.product.id)}
                      className="w-full btn btn-outline text-sm py-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
