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

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      const response = await api.get(`/api/orders/${orderId}/`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Order not found</p>
          <Link href="/" className="text-red-500 hover:text-red-600 mt-4 inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-4">
            Thank you for your order. We've received your payment and will start processing your order soon.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-600">Order ID</p>
            <p className="text-2xl font-bold text-red-500">{order.order_id}</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Order Details</h2>
          
          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                <img
                  src={item.product_image || '/placeholder.png'}
                  alt={item.product_name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-semibold">{item.product_name}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  <p className="text-sm font-semibold text-red-500">₹{item.total_price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span>₹{order.shipping_charge}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-₹{order.discount_amount}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-red-500">₹{order.total_amount}</span>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
          <div className="text-gray-700">
            <p className="font-semibold">{order.customer_name}</p>
            <p>{order.shipping_address}</p>
            <p>{order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}</p>
            <p className="mt-2">Phone: {order.customer_phone}</p>
          </div>
        </div>

        {/* Estimated Delivery */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">📦</span>
            <div>
              <p className="font-semibold text-blue-900">Estimated Delivery</p>
              <p className="text-blue-700 mt-1">
                Your order will be delivered within 3-7 business days
              </p>
              <p className="text-sm text-blue-600 mt-2">
                You'll receive tracking information via email once your order is shipped
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href={`/orders/${orderId}`}
            className="flex-1 bg-red-500 text-white text-center py-3 rounded-lg hover:bg-red-600 font-semibold"
          >
            Track Order
          </Link>
          <Link
            href="/"
            className="flex-1 border border-gray-300 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-50 font-semibold"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
