'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminApi, AdminOrder } from '@/lib/admin-api';
import AdminTable from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import type { Column } from '@/components/admin/AdminTable';

const ORDER_STATUSES = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES = ['', 'pending', 'paid', 'failed', 'refunded'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: PAGE_SIZE };
      if (status) params.status = status;
      if (paymentStatus) params.payment_status = paymentStatus;
      if (search) params.search = search;
      const res = await adminApi.getOrders(params);
      setOrders(res.results);
      setCount(res.count);
    } finally {
      setLoading(false);
    }
  }, [page, status, paymentStatus, search]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<AdminOrder>[] = [
    {
      key: 'order_id',
      label: 'Order ID',
      render: o => (
        <Link href={`/admin/orders/${o.order_id}`} className="font-medium text-gray-900 hover:underline">
          {o.order_id}
        </Link>
      ),
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: o => (
        <div>
          <p className="font-medium text-gray-800">{o.customer_name}</p>
          <p className="text-xs text-gray-400">{o.customer_email}</p>
        </div>
      ),
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: o => <span>₹{Number(o.total_amount).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: o => <StatusBadge status={o.payment_status} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: o => <StatusBadge status={o.status} />,
    },
    {
      key: 'shiprocket_synced',
      label: 'Shiprocket',
      render: o => (
        <span className={`text-xs ${o.shiprocket_synced ? 'text-green-600' : 'text-gray-400'}`}>
          {o.shiprocket_synced ? '✓ Synced' : '—'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: o => <span className="text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString('en-IN')}</span>,
    },
  ];

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">
        Orders <span className="text-gray-400 font-normal text-base">({count})</span>
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search order ID or customer…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-64"
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {ORDER_STATUSES.map(s => (
            <option key={s} value={s}>{s || 'All statuses'}</option>
          ))}
        </select>
        <select
          value={paymentStatus}
          onChange={e => { setPaymentStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {PAYMENT_STATUSES.map(s => (
            <option key={s} value={s}>{s || 'All payment statuses'}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <AdminTable columns={columns} rows={orders} emptyMessage="No orders found." />
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40">Prev</button>
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
