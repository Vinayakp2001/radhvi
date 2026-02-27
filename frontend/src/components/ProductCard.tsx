'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  id: number;
  slug: string;
  name: string;
  shortDescription: string;
  image: string;
  price: number;
  discountedPrice?: number;
  rating: number;
  reviewCount: number;
  isBestseller: boolean;
  isInWishlist?: boolean;
  onWishlistToggle?: (productId: number) => Promise<void>;
  priority?: boolean; // For LCP optimization
}

export default function ProductCard({
  id,
  slug,
  name,
  shortDescription,
  image,
  price,
  discountedPrice,
  rating,
  reviewCount,
  isBestseller,
  isInWishlist = false,
  onWishlistToggle,
  priority = false,
}: ProductCardProps) {
  const [inWishlist, setInWishlist] = useState(isInWishlist);
  const [isLoading, setIsLoading] = useState(false);

  const discountPercentage = discountedPrice
    ? Math.round(((price - discountedPrice) / price) * 100)
    : 0;

  const finalPrice = discountedPrice || price;
  const savings = discountedPrice ? price - discountedPrice : 0;

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!onWishlistToggle) return;

    setIsLoading(true);
    try {
      await onWishlistToggle(id);
      setInWishlist(!inWishlist);
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/products/${slug}`} className="group block">
      <div className="card overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={image || '/placeholder-product.jpg'}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discountPercentage > 0 && (
              <span className="badge bg-red-500 text-white px-3 py-1 text-sm font-semibold rounded-full shadow-lg">
                Save {discountPercentage}%
              </span>
            )}
            {isBestseller && !discountPercentage && (
              <span className="badge bg-yellow-500 text-white px-3 py-1 text-sm font-semibold rounded-full shadow-lg">
                Bestseller
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistClick}
            disabled={isLoading}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg
              className={`w-5 h-5 transition-colors ${
                inWishlist ? 'fill-red-500 text-red-500' : 'fill-none text-gray-600'
              }`}
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>

          {/* Short Description */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-1">
            {shortDescription}
          </p>

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, index) => (
                  <svg
                    key={index}
                    className={`w-4 h-4 ${
                      index < Math.floor(rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 fill-gray-300'
                    }`}
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {rating.toFixed(1)} ({reviewCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-gray-900">
              ₹{finalPrice.toLocaleString()}
            </span>
            {discountedPrice && (
              <span className="text-sm text-gray-500 line-through">
                ₹{price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Savings */}
          {savings > 0 && (
            <p className="text-sm text-green-600 font-medium">
              You save ₹{savings.toLocaleString()} ({discountPercentage}% off)
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
