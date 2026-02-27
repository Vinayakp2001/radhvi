'use client';

import { useState, useEffect } from 'react';

interface HeroSlide {
  id: number;
  image: string;
  alt: string;
}

const defaultSlides: HeroSlide[] = [
  {
    id: 1,
    image: '/images/hero/slider-1.jpeg',
    alt: 'Luxury Romance Bouquet',
  },
  {
    id: 2,
    image: '/images/hero/slider-2.jpeg',
    alt: 'Turn Memories Into a Beautiful Surprise',
  },
  {
    id: 3,
    image: '/images/hero/slider-3.jpeg',
    alt: 'Luxury Wrapped in Love',
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const slides = defaultSlides;

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section 
      className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="relative w-full h-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt={slide.alt}
              className={`absolute inset-0 w-full h-full object-cover ${
                index === currentSlide ? 'animate-ken-burns' : ''
              }`}
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'low'}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className={`absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 
              bg-white/90 hover:bg-primary-600 hover:text-white
              w-12 h-12 md:w-14 md:h-14 rounded-full 
              flex items-center justify-center
              shadow-lg transition-all duration-300
              ${isHovered ? 'opacity-100' : 'opacity-0 md:opacity-0'}
            `}
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className={`absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 
              bg-white/90 hover:bg-primary-600 hover:text-white
              w-12 h-12 md:w-14 md:h-14 rounded-full 
              flex items-center justify-center
              shadow-lg transition-all duration-300
              ${isHovered ? 'opacity-100' : 'opacity-0 md:opacity-0'}
            `}
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-12 md:w-16 bg-primary-600'
                  : 'w-8 md:w-10 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes kenBurns {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.1);
          }
        }

        :global(.animate-ken-burns) {
          animation: kenBurns 8s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
