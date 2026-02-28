'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from './ProductCard';
import { wishlistAPI } from '@/lib/wishlist';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: number;
  slug: string;
  name: string;
  short_description: string;
  image_url: string;
  price: string;
  discounted_price?: string;
  rating: number;
  review_count: number;
  is_best_seller: boolean;
}

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const [wishlistItems, setWishlistItems] = useState<Set<number>>(new Set());
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleWishlistToggle = async (productId: number) => {
    if (!isAuthenticated) {
      alert('Please login to add items to wishlist');
      router.push('/login');
      return;
    }

    try {
      const isInWishlist = wishlistItems.has(productId);
      
      if (isInWishlist) {
        await wishlistAPI.removeFromWishlist(productId);
        setWishlistItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      } else {
        await wishlistAPI.addToWishlist(productId);
        setWishlistItems(prev => new Set(prev).add(productId));
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      throw error;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          slug={product.slug}
          name={product.name}
          shortDescription={product.short_description}
          image={product.image_url}
          price={parseFloat(product.price)}
          discountedPrice={product.discounted_price ? parseFloat(product.discounted_price) : undefined}
          rating={product.rating}
          reviewCount={product.review_count}
          isBestseller={product.is_best_seller}
          isInWishlist={wishlistItems.has(product.id)}
          onWishlistToggle={handleWishlistToggle}
        />
      ))}
    </div>
  );
}
