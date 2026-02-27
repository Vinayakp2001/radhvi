'use client';

import { useState, useEffect } from 'react';

interface AnnouncementBarProps {
  message?: string;
  dismissible?: boolean;
  storageKey?: string;
}

export default function AnnouncementBar({
  message = '🎉 Free Shipping on orders above ₹999 | Use code: FREESHIP',
  dismissible = true,
  storageKey = 'announcement_dismissed',
}: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if announcement was previously dismissed
    if (dismissible && typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem(storageKey);
      if (dismissed === 'true') {
        setIsVisible(false);
      }
    }
  }, [dismissible, storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
      <div className="container-custom">
        <div className="flex items-center justify-between py-2 px-4 md:px-0">
          {/* Message */}
          <div className="flex-1 text-center">
            <p className="text-sm md:text-base font-medium">
              {message}
            </p>
          </div>

          {/* Dismiss Button */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Dismiss announcement"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
