'use client';

import { useState, useEffect, useRef } from 'react';
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
  priority?: boolean;
}

// Deterministic discount % based on product id (so it doesn't change on re-render)
const DISCOUNT_TIERS = [40, 45, 50, 55, 60, 65, 70];
function getDiscount(id: number) {
  return DISCOUNT_TIERS[id % DISCOUNT_TIERS.length];
}

// Deterministic timer seed: hours between 1–23 based on id
function getTimerSeed(id: number): number {
  const hours = (id % 23) + 1;
  return hours * 3600 + ((id * 7) % 3600); // hours + some minutes
}

function useCountdown(id: number) {
  const key = `timer_end_${id}`;
  const initRef = useRef(false);
  const [seconds, setSeconds] = useState<number>(0);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let endTime: number;
    const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (stored) {
      endTime = parseInt(stored);
    } else {
      endTime = Date.now() + getTimerSeed(id) * 1000;
      if (typeof window !== 'undefined') localStorage.setItem(key, String(endTime));
    }

    const tick = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) {
        // Reset timer
        const newEnd = Date.now() + getTimerSeed(id) * 1000;
        if (typeof window !== 'undefined') localStorage.setItem(key, String(newEnd));
        endTime = newEnd;
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [id, key]);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return { h, m, s };
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
  const { h, m, s } = useCountdown(id);

  // Use discountedPrice if provided, otherwise treat price as sell price and calculate MRP
  const sellPrice = discountedPrice || price;
  const discountPct = discountedPrice
    ? Math.round(((price - discountedPrice) / price) * 100)
    : getDiscount(id);
  const mrp = discountedPrice ? price : Math.round(sellPrice / (1 - discountPct / 100));
  const savings = mrp - sellPrice;

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onWishlistToggle) return;
    setIsLoading(true);
    try {
      await onWishlistToggle(id);
      setInWishlist(!inWishlist);
    } catch {}
    finally { setIsLoading(false); }
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <Link href={`/products/${slug}`} className="group block">
      <div className="card overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={image || '/placeholder-product.jpg'}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className="bg-red-500 text-white px-2.5 py-0.5 text-xs font-bold rounded-full shadow">
              {discountPct}% OFF
            </span>
            {isBestseller && (
              <span className="bg-yellow-500 text-white px-2.5 py-0.5 text-xs font-bold rounded-full shadow">
                Bestseller
              </span>
            )}
          </div>
          <button
            onClick={handleWishlistClick}
            disabled={isLoading}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg className={`w-5 h-5 ${inWishlist ? 'fill-red-500 text-red-500' : 'fill-none text-gray-600'}`} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">{name}</h3>
          <p className="text-xs text-gray-500 mb-2 line-clamp-1">{shortDescription}</p>

          {rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}`} viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)} ({reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-bold text-gray-900">₹{sellPrice.toLocaleString()}</span>
            <span className="text-sm text-gray-400 line-through">₹{mrp.toLocaleString()}</span>
          </div>
          <p className="text-xs text-green-600 font-medium mb-2">You save ₹{savings.toLocaleString()} ({discountPct}% off)</p>

          {/* Countdown Timer */}
          <div className="flex items-center gap-1 mt-1">
            <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-gray-500">Offer ends in</span>
            <span className="text-xs font-bold text-red-500">{pad(h)}:{pad(m)}:{pad(s)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
