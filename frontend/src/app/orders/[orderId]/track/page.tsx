'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const TRACKING_STEPS = [
  { status: 'confirmed', label: 'Order Confirmed' },
  { status: 'picked_up', label: 'Picked Up' },
  { status: 'in_transit', label: 'In Transit' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'delivered', label: 'Delivered' },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      const [orderRes, trackRes] = await Promise.allSettled([
        api.get(`/orders/${orderId}/`),
        api.get(`/orders/${orderId}/tracking/`),
      ]);
      if (orderRes.status === 'fulfilled') setOrder(orderRes.value.data);
      if (trackRes.status === 'fulfilled') setTracking(trackRes.value.data);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    const shipmentStatus = order?.shipment?.status || tracking?.status;
    const idx = TRACKING_STEPS.findIndex(s => s.status === shipmentStatus);
    return idx === -1 ? 0 : idx;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Order not found</p>
          <Link href="/orders" className="text-red-500 hover:text-red-600 text-sm font-medium">Back to Orders</Link>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();
  const shipment = order.shipment;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <Link href={`/orders/${orderId}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Order
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Track Order</h1>
          <p className="text-sm text-gray-500 mt-1">Order #{order.order_id}</p>
        </div>

        {/* Shipment Info */}
        {shipment?.awb_code ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">AWB Number</p>
                <p className="text-sm font-semibold text-gray-900">{shipment.awb_code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Courier</p>
                <p className="text-sm font-semibold text-gray-900">{shipment.courier_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Est. Delivery</p>
                <p className="text-sm font-semibold text-gray-900">
                  {shipment.estimated_delivery_date
                    ? new Date(shipment.estimated_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : '3–7 days'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <p className="text-sm text-gray-500">Tracking information will be available once your order is shipped.</p>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-6">Shipment Status</h2>
          <div className="space-y-0">
            {TRACKING_STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              return (
                <div key={step.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : isActive
                        ? 'border-red-500 bg-white'
                        : 'border-gray-200 bg-white'
                    }`}>
                      {isCompleted ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-red-500' : 'bg-gray-300'}`} />
                      )}
                    </div>
                    {index < TRACKING_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pb-8 last:pb-0 pt-1">
                    <p className={`text-sm font-medium ${isCompleted || isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-red-500 mt-0.5">In progress</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tracking History */}
        {tracking?.scans?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Tracking History</h2>
            <div className="space-y-3">
              {tracking.scans.map((scan: any, index: number) => (
                <div key={index} className="flex gap-3 text-sm">
                  <div className="w-1 bg-gray-200 rounded-full flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{scan.activity || scan.status}</p>
                    {scan.location && <p className="text-gray-500 text-xs mt-0.5">{scan.location}</p>}
                    <p className="text-gray-400 text-xs mt-0.5">{scan.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery Address */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Delivery Address</h2>
          <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{order.shipping_address}</p>
          <p className="text-sm text-gray-500">{order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}</p>
          <p className="text-sm text-gray-500 mt-1">{order.customer_phone}</p>
        </div>
      </div>
    </div>
  );
}
