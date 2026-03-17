'use client';

import { useState, useEffect } from 'react';

const ANNOUNCEMENTS = [
  '🎉 Free Shipping on orders above ₹999 | Use code: FREESHIP',
  '🌸 Spring Sale is LIVE! Up to 70% off on select gifts',
  '🎁 Holi Special Offers — Celebrate with the perfect gift',
  '⚡ Flash Sale: Limited time deals on premium hampers',
  '🚚 Same-day delivery available in select cities',
  '🎊 New arrivals every week — Shop the latest collections',
];

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('announcement_dismissed');
      if (dismissed === 'true') setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % ANNOUNCEMENTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('announcement_dismissed', 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
      <div className="container-custom">
        <div className="flex items-center justify-between py-2 px-4 md:px-0">
          <div className="flex-1 text-center overflow-hidden">
            <p
              key={current}
              className="text-sm md:text-base font-medium animate-fade-in"
            >
              {ANNOUNCEMENTS[current]}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
            aria-label="Dismiss announcement"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
