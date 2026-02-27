'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

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

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancelling(true);
    try {
      await api.post(`/api/orders/${orderId}/cancel/`);
      alert('Order cancelled successfully');
      loadOrderDetails();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const canCancelOrder = (status: string) => {
    return ['pending', 'confirmed'].includes(status);
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
          <Link href="/orders" className="text-red-500 hover:text-red-600 mt-4 inline-block">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/orders" className="text-red-500 hover:text-red-600 mb-4 inline-block">
            ← Back to Orders
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">Order Details</h1>
              <p className="text-gray-600 mt-1">Order ID: {order.order_id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <img
                      src={item.product_image || '/placeholder.png'}
                      alt={item.product_name}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{item.product_name}</p>
                      <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Price: ₹{item.price} each</p>
                      <p className="text-lg font-bold text-red-500 mt-2">₹{item.total_price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
              <div className="text-gray-700">
                <p className="font-semibold text-lg">{order.customer_name}</p>
                <p className="mt-2">{order.shipping_address}</p>
                <p>{order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}</p>
                <p>{order.shipping_country}</p>
                <p className="mt-2">Phone: {order.customer_phone}</p>
                {order.customer_email && (
                  <p>Email: {order.customer_email}</p>
                )}
              </div>
            </div>

            {/* Shipment Tracking */}
            {order.shipment && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Shipment Tracking</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">AWB Code:</span>
                    <span className="font-semibold">{order.shipment.awb_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Courier:</span>
                    <span className="font-semibold">{order.shipment.courier_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold capitalize">{order.shipment.status.replace('_', ' ')}</span>
                  </div>
                  {order.shipment.estimated_delivery_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Delivery:</span>
                      <span className="font-semibold">
                        {new Date(order.shipment.estimated_delivery_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                <Link
                  href={`/orders/${orderId}/track`}
                  className="mt-4 block text-center bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 font-semibold"
                >
                  Track Shipment
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span>₹{order.shipping_charge}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-₹{order.discount_amount}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-red-500">₹{order.total_amount}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Payment Info</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold capitalize ${
                    order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {order.payment_status}
                  </span>
                </div>
                {order.razorpay_payment_id && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-mono text-xs">{order.razorpay_payment_id.slice(0, 20)}...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {canCancelOrder(order.status) && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 disabled:bg-gray-300 font-semibold"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
