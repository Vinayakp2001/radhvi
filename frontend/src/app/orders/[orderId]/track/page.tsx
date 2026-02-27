'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function OrderTrackingPage() {
  const params = useParams();
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

  const getTrackingSteps = () => {
    const steps = [
      { status: 'confirmed', label: 'Order Confirmed', icon: '✓', date: order?.created_at },
      { status: 'picked_up', label: 'Picked Up', icon: '📦', date: null },
      { status: 'in_transit', label: 'In Transit', icon: '🚚', date: null },
      { status: 'out_for_delivery', label: 'Out for Delivery', icon: '🏃', date: null },
      { status: 'delivered', label: 'Delivered', icon: '🎉', date: order?.shipment?.actual_delivery_date }
    ];

    const currentStatusIndex = steps.findIndex(s => s.status === order?.shipment?.status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentStatusIndex,
      active: index === currentStatusIndex
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!order || !order.shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">
            {!order ? 'Order not found' : 'Tracking information not available yet'}
          </p>
          <Link href="/orders" className="text-red-500 hover:text-red-600 mt-4 inline-block">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const trackingSteps = getTrackingSteps();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/orders/${orderId}`} className="text-red-500 hover:text-red-600 mb-4 inline-block">
            ← Back to Order Details
          </Link>
          <h1 className="text-3xl font-bold">Track Your Order</h1>
          <p className="text-gray-600 mt-1">Order ID: {order.order_id}</p>
        </div>

        {/* Tracking Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">AWB Code</p>
              <p className="font-bold text-lg">{order.shipment.awb_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Courier Partner</p>
              <p className="font-bold text-lg">{order.shipment.courier_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Delivery</p>
              <p className="font-bold text-lg">
                {order.shipment.estimated_delivery_date 
                  ? new Date(order.shipment.estimated_delivery_date).toLocaleDateString()
                  : 'TBD'}
              </p>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-6">Shipment Status</h2>
          
          <div className="relative">
            {trackingSteps.map((step, index) => (
              <div key={step.status} className="flex items-start mb-8 last:mb-0">
                {/* Timeline Line */}
                {index < trackingSteps.length - 1 && (
                  <div className={`absolute left-6 top-12 w-0.5 h-16 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`} style={{ marginTop: '-0.5rem' }} />
                )}
                
                {/* Icon */}
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : step.active
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.icon}
                </div>
                
                {/* Content */}
                <div className="ml-6 flex-1">
                  <p className={`font-semibold text-lg ${
                    step.completed ? 'text-green-600' : step.active ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  {step.date && (
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(step.date).toLocaleString()}
                    </p>
                  )}
                  {step.active && !step.completed && (
                    <p className="text-sm text-blue-600 mt-1">In Progress...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tracking Scans */}
        {order.shipment.tracking_data && order.shipment.tracking_data.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Tracking History</h2>
            <div className="space-y-3">
              {order.shipment.tracking_data.map((scan: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-semibold">{scan.status || scan.activity}</p>
                  <p className="text-sm text-gray-600">{scan.location}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(scan.timestamp || scan.date).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery Address */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Delivery Address</h2>
          <div className="text-gray-700">
            <p className="font-semibold">{order.customer_name}</p>
            <p className="mt-2">{order.shipping_address}</p>
            <p>{order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}</p>
            <p className="mt-2">Phone: {order.customer_phone}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href={`/orders/${orderId}`}
            className="flex-1 border border-gray-300 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-50 font-semibold"
          >
            View Order Details
          </Link>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 font-semibold"
          >
            Download Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
