'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi, AdminOrderDetail } from '@/lib/admin-api';
import StatusBadge from '@/components/admin/StatusBadge';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getOrder(orderId)
      .then(o => {
        setOrder(o);
        setNewStatus(o.status);
        setNewPaymentStatus(o.payment_status);
      })
      .catch(() => setError('Order not found.'));
  }, [orderId]);

  async function handleSave() {
    if (!order) return;
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const updated = await adminApi.updateOrderStatus(orderId, {
        status: newStatus,
        payment_status: newPaymentStatus,
      });
      setOrder(prev => prev ? { ...prev, status: updated.status, payment_status: updated.payment_status } : prev);
      setSuccess('Order updated.');
    } catch {
      setError('Failed to update order.');
    } finally {
      setSaving(false);
    }
  }

  if (error && !order) return <p className="text-red-500 text-sm">{error}</p>;
  if (!order) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-700">← Back</button>
        <h1 className="text-xl font-semibold text-gray-900">Order {order.order_id}</h1>
        <StatusBadge status={order.status} />
        <StatusBadge status={order.payment_status} />
      </div>

      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer */}
        <Section title="Customer">
          <Row label="Name" value={order.customer_name} />
          <Row label="Email" value={order.customer_email} />
          <Row label="Phone" value={order.customer_phone} />
        </Section>

        {/* Shipping */}
        <Section title="Shipping Address">
          <p className="text-sm text-gray-700">{order.shipping_address}</p>
          <p className="text-sm text-gray-700">{order.shipping_city}, {order.shipping_state} {order.shipping_pincode}</p>
          <p className="text-sm text-gray-700">{order.shipping_country}</p>
        </Section>

        {/* Amounts */}
        <Section title="Amounts">
          <Row label="Subtotal" value={`₹${Number(order.subtotal).toLocaleString('en-IN')}`} />
          <Row label="Shipping" value={`₹${Number(order.shipping_charge).toLocaleString('en-IN')}`} />
          <Row label="Tax" value={`₹${Number(order.tax_amount).toLocaleString('en-IN')}`} />
          <Row label="Discount" value={`-₹${Number(order.discount_amount).toLocaleString('en-IN')}`} />
          <Row label="Total" value={`₹${Number(order.total_amount).toLocaleString('en-IN')}`} bold />
        </Section>

        {/* Payment */}
        <Section title="Payment">
          <Row label="Method" value={order.payment_method} />
          {order.payment_details && Object.entries(order.payment_details as Record<string, string>).map(([k, v]) =>
            v ? <Row key={k} label={k.replace(/_/g, ' ')} value={String(v)} /> : null
          )}
        </Section>
      </div>

      {/* Shipment */}
      {order.shipment && (
        <Section title="Shipment">
          <Row label="AWB Code" value={order.shipment.awb_code} />
          <Row label="Courier" value={order.shipment.courier_name} />
          <Row label="Status" value={order.shipment.status} />
          {order.shipment.tracking_url && (
            <a href={order.shipment.tracking_url} target="_blank" rel="noreferrer"
              className="text-sm text-blue-600 hover:underline">
              Track shipment →
            </a>
          )}
          {order.shipment.estimated_delivery_date && (
            <Row label="Est. Delivery" value={order.shipment.estimated_delivery_date} />
          )}
        </Section>
      )}

      {/* Shiprocket sync */}
      <div className="text-sm text-gray-500">
        Shiprocket: {order.shiprocket_synced
          ? <span className="text-green-600 font-medium">Synced</span>
          : <span className="text-orange-500">Not synced {order.shiprocket_sync_error && `— ${order.shiprocket_sync_error}`}</span>
        }
      </div>

      {/* Order items */}
      <Section title="Items">
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.product_name} × {item.quantity}</span>
              <span className="text-gray-600">₹{Number(item.total_price).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Status update */}
      <Section title="Update Status">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Order Status</label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
            <select
              value={newPaymentStatus}
              onChange={e => setNewPaymentStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500 capitalize">{label}</span>
      <span className={bold ? 'font-semibold text-gray-900' : 'text-gray-700'}>{value}</span>
    </div>
  );
}
