'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');

  useEffect(() => {
    // Poll order status — PhonePe webhook updates it server-side
    // Give it a moment then load
    const timer = setTimeout(() => loadOrderDetails(), 1500);
    return () => clearTimeout(timer);
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/${orderId}/`);
      setOrder(response.data);
      if (response.data.payment_status === 'paid') setPaymentStatus('success');
      else if (response.data.payment_status === 'failed') setPaymentStatus('failed');
      else setPaymentStatus('success'); // COD or pending — show success
    } catch {
      // order not found
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-500 border-t-transparent" />
        <p className="text-gray-500 text-sm">Loading order details...</p>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-500 text-sm mb-6">Your payment could not be processed. No amount has been charged.</p>
          <div className="flex gap-3">
            <button onClick={() => router.push('/checkout')} className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-600">
              Try Again
            </button>
            <Link href="/orders" className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium text-center hover:bg-gray-50">
              My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Success Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Order Confirmed</h1>
          <p className="text-gray-500 text-sm mb-4">Thank you for your purchase. We'll start processing your order right away.</p>
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
            <span className="text-xs text-gray-500">Order ID</span>
            <span className="font-semibold text-gray-900 text-sm">{orderId}</span>
          </div>
        </div>

        {/* Order Items */}
        {order?.items?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Items Ordered</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 px-6 py-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product_image
                      ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gray-200" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">₹{item.total_price}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Shipping</span>
                <span>₹{order.shipping_charge}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total Paid</span>
                <span>₹{order.total_amount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Info */}
        {order && (
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Delivery Details</h2>
            </div>
            <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Delivering to</p>
                <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                <p className="text-sm text-gray-600 mt-0.5">{order.shipping_address}</p>
                <p className="text-sm text-gray-600">{order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Estimated delivery</p>
                <p className="text-sm font-medium text-gray-900">3–7 business days</p>
                <p className="text-xs text-gray-500 mt-1">Tracking details will be sent to your email once shipped</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href={`/orders/${orderId}`}
            className="flex-1 bg-red-500 text-white text-center py-3 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          >
            View Order
          </Link>
          <Link
            href="/collections/all"
            className="flex-1 border border-gray-200 text-gray-700 text-center py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
