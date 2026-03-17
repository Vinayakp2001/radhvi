'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const SLIDES = [
  { id: 1, image: '/images/hero/slider-1.jpeg', alt: 'Love can\'t be hidden — it reflects in every gift' },
  { id: 2, image: '/images/hero/slider-2.jpeg', alt: 'Surprise Them Like Never Before' },
  { id: 3, image: '/images/hero/slider-3.jpeg', alt: 'Elegance in every swing, Grace in every step' },
  { id: 4, image: '/images/hero/slider-4.jpeg', alt: 'Find the Perfect Gift for Every Occasion' },
  { id: 5, image: '/images/hero/slider-5.jpeg', alt: 'Ek Bouquet, Hazaar Jazbaat' },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const prev = () => setCurrent(p => (p - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setCurrent(p => (p + 1) % SLIDES.length);

  return (
    <section className="relative w-full overflow-hidden">
      {/* Slides — first slide sets height, rest are absolute on top */}
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`transition-opacity duration-700 ${index === 0 ? 'relative' : 'absolute inset-0'}`}
          style={{ opacity: index === current ? 1 : 0, zIndex: index === current ? 1 : 0 }}
        >
          <Link href="/collections/all" className="block w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt={slide.alt}
              className="w-full h-auto block"
              loading={index === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          </Link>
        </div>
      ))}

      {/* Prev arrow */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full w-9 h-9 flex items-center justify-center shadow transition-colors"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next arrow */}
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full w-9 h-9 flex items-center justify-center shadow transition-colors"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-2 bg-red-500' : 'w-2 h-2 bg-white/70 hover:bg-white'}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
