'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => { loadOrder(); }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}/`);
      setOrder(res.data);
    } catch { /* not found */ } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this order?')) return;
    setCancelling(true); setCancelError('');
    try {
      await api.post(`/orders/${orderId}/cancel/`);
      await loadOrder();
    } catch (err: any) {
      setCancelError(err.response?.data?.error || 'Failed to cancel order');
    } finally { setCancelling(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-500 border-t-transparent" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Order not found</p>
        <Link href="/orders" className="text-red-500 text-sm font-medium">Back to Orders</Link>
      </div>
    </div>
  );

  const statusLabel = order.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4 w-fit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            My Orders
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Order #{order.order_id}</h1>
              <p className="text-sm text-gray-500 mt-1">Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[order.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            {/* Items */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Items Ordered</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex gap-4 px-6 py-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product_image
                        ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gray-200" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity} × ₹{item.product_price}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 flex-shrink-0">₹{item.total_price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Delivery Address</h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{order.shipping_address}</p>
                <p className="text-sm text-gray-500">{order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}</p>
                <p className="text-sm text-gray-500 mt-1">{order.customer_phone}</p>
              </div>
            </div>

            {/* Shipment */}
            {order.shipment?.awb_code && (
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Shipment</h2>
                  <Link href={`/orders/${orderId}/track`} className="text-sm text-red-500 font-medium hover:text-red-600">Track</Link>
                </div>
                <div className="px-6 py-4 grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500">AWB Number</p><p className="text-sm font-medium text-gray-900 mt-0.5">{order.shipment.awb_code}</p></div>
                  <div><p className="text-xs text-gray-500">Courier</p><p className="text-sm font-medium text-gray-900 mt-0.5">{order.shipment.courier_name || '—'}</p></div>
                  <div><p className="text-xs text-gray-500">Status</p><p className="text-sm font-medium text-gray-900 mt-0.5 capitalize">{order.shipment.status?.replace(/_/g, ' ')}</p></div>
                  {order.shipment.estimated_delivery_date && (
                    <div><p className="text-xs text-gray-500">Est. Delivery</p><p className="text-sm font-medium text-gray-900 mt-0.5">{new Date(order.shipment.estimated_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p></div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price Summary */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Price Details</h2></div>
              <div className="px-6 py-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Shipping</span><span>₹{order.shipping_charge}</span></div>
                {parseFloat(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-₹{order.discount_amount}</span></div>
                )}
                <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-100"><span>Total</span><span>₹{order.total_amount}</span></div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Payment</h2></div>
              <div className="px-6 py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-medium capitalize ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{order.payment_status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium text-gray-900 capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {canCancel && (
              <div>
                {cancelError && <p className="text-red-500 text-xs mb-2">{cancelError}</p>}
                <button onClick={handleCancel} disabled={cancelling}
                  className="w-full border border-red-300 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors">
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
