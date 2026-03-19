'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminApi, AdminUser } from '@/lib/admin-api';
import AdminTable from '@/components/admin/AdminTable';
import type { Column } from '@/components/admin/AdminTable';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      const res = await adminApi.getUsers(params);
      setUsers(res.results);
      setCount(res.count);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<AdminUser>[] = [
    {
      key: 'username', label: 'User',
      render: u => (
        <div>
          <p className="font-medium text-gray-900">{u.first_name} {u.last_name}</p>
          <p className="text-xs text-gray-400">@{u.username}</p>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: u => <span className="text-gray-600 text-sm">{u.email}</span> },
    { key: 'order_count', label: 'Orders', render: u => <span className="text-gray-700">{u.order_count}</span> },
    {
      key: 'is_staff', label: 'Role',
      render: u => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_staff ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          {u.is_staff ? 'Staff' : 'Customer'}
        </span>
      ),
    },
    { key: 'date_joined', label: 'Joined', render: u => <span className="text-xs text-gray-400">{new Date(u.date_joined).toLocaleDateString('en-IN')}</span> },
    {
      key: 'actions', label: '',
      render: u => (
        <Link href={`/admin/users/${u.id}`} className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          View
        </Link>
      ),
    },
  ];

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">Users <span className="text-gray-400 font-normal text-base">({count})</span></h1>

      <input type="search" placeholder="Search by name, username or email…" value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <AdminTable columns={columns} rows={users} emptyMessage="No users found." />
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
