'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminApi, AdminReturn } from '@/lib/admin-api';
import AdminTable from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import type { Column } from '@/components/admin/AdminTable';

const STATUSES = ['', 'pending', 'approved', 'rejected', 'picked_up', 'refunded', 'completed'];

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<AdminReturn[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: PAGE_SIZE };
      if (status) params.status = status;
      const res = await adminApi.getReturns(params);
      setReturns(res.results);
      setCount(res.count);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<AdminReturn>[] = [
    { key: 'request_id', label: 'Request ID', render: r => <span className="font-mono text-sm font-medium text-gray-900">{r.request_id}</span> },
    { key: 'order_id', label: 'Order', render: r => <span className="text-gray-700">{r.order_id}</span> },
    { key: 'username', label: 'Customer', render: r => <span className="text-gray-700">{r.username}</span> },
    { key: 'return_type', label: 'Type', render: r => <span className="capitalize text-gray-600">{r.return_type}</span> },
    { key: 'reason', label: 'Reason', render: r => <span className="text-gray-500 text-xs">{r.reason.replace(/_/g, ' ')}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: 'Date', render: r => <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</span> },
    {
      key: 'actions', label: '',
      render: r => (
        <Link href={`/admin/returns/${r.id}`} className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          View
        </Link>
      ),
    },
  ];

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Returns <span className="text-gray-400 font-normal text-base">({count})</span></h1>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <AdminTable columns={columns} rows={returns} emptyMessage="No return requests." />
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
