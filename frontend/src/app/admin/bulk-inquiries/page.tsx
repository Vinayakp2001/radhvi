'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminApi, AdminBulkInquiry } from '@/lib/admin-api';
import AdminTable from '@/components/admin/AdminTable';
import StatusBadge from '@/components/admin/StatusBadge';
import type { Column } from '@/components/admin/AdminTable';

const STATUSES = ['', 'pending', 'contacted', 'quoted', 'converted', 'rejected'];

export default function AdminBulkInquiriesPage() {
  const [inquiries, setInquiries] = useState<AdminBulkInquiry[]>([]);
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
      const res = await adminApi.getBulkInquiries(params);
      setInquiries(res.results);
      setCount(res.count);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<AdminBulkInquiry>[] = [
    {
      key: 'company_name', label: 'Company',
      render: i => (
        <div>
          <p className="font-medium text-gray-900">{i.company_name}</p>
          <p className="text-xs text-gray-400">{i.contact_person}</p>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: i => <span className="text-sm text-gray-600">{i.email}</span> },
    { key: 'quantity', label: 'Qty', render: i => <span className="text-gray-700">{i.quantity}</span> },
    { key: 'inquiry_type', label: 'Type', render: i => <span className="text-xs text-gray-500 capitalize">{i.inquiry_type.replace(/_/g, ' ')}</span> },
    { key: 'status', label: 'Status', render: i => <StatusBadge status={i.status} /> },
    { key: 'created_at', label: 'Date', render: i => <span className="text-xs text-gray-400">{new Date(i.created_at).toLocaleDateString('en-IN')}</span> },
    {
      key: 'actions', label: '',
      render: i => (
        <Link href={`/admin/bulk-inquiries/${i.id}`} className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          View
        </Link>
      ),
    },
  ];

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Bulk Inquiries <span className="text-gray-400 font-normal text-base">({count})</span></h1>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <AdminTable columns={columns} rows={inquiries} emptyMessage="No bulk inquiries yet." />
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
