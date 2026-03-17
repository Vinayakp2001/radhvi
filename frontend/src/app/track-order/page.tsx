'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orderId.trim();
    if (!trimmed) {
      setError('Please enter your Order ID');
      return;
    }
    setError('');
    router.push(`/orders/${trimmed}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1 bg-gray-50 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">📦</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Track Your Order</h1>
              <p className="text-gray-500 text-sm">
                Enter your Order ID to see the latest delivery status.
              </p>
            </div>

            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order ID
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={e => { setOrderId(e.target.value); setError(''); }}
                  placeholder="e.g. ORD12345678"
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${error ? 'border-red-400' : 'border-gray-300'}`}
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Track Order
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center space-y-2">
              <p className="text-sm text-gray-500">
                Have an account?{' '}
                <Link href="/login?redirect=/orders" className="text-red-500 font-medium hover:underline">
                  Sign in
                </Link>{' '}
                to see all your orders.
              </p>
              <p className="text-sm text-gray-500">
                Need help?{' '}
                <Link href="/contact" className="text-red-500 font-medium hover:underline">
                  Contact us
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
