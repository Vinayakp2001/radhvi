'use client';

import Link from 'next/link';
import Image from 'next/image';

interface OccasionCardProps {
  slug: string;
  name: string;
  tagline: string;
  image: string;
  productCount?: number;
}

export default function OccasionCard({
  slug,
  name,
  tagline,
  image,
  productCount,
}: OccasionCardProps) {
  return (
    <Link href={`/collections/${slug}`} className="group block">
      <div className="card overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary-50 to-secondary-50">
          <Image
            src={image || '/placeholder-occasion.jpg'}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Product Count Badge */}
          {productCount !== undefined && productCount > 0 && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
              <span className="text-sm font-semibold text-gray-900">
                {productCount} {productCount === 1 ? 'Gift' : 'Gifts'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Occasion Name */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>

          {/* Tagline */}
          <p className="text-sm text-gray-600 mb-4">
            {tagline}
          </p>

          {/* CTA */}
          <div className="inline-flex items-center gap-2 text-primary-600 font-medium group-hover:gap-3 transition-all">
            <span>Explore Collection</span>
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
