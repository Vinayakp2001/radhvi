'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminApi, AdminProduct } from '@/lib/admin-api';
import AdminTable from '@/components/admin/AdminTable';
import type { Column } from '@/components/admin/AdminTable';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getProducts({ search, page, page_size: PAGE_SIZE });
      setProducts(res.results);
      setCount(res.count);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  async function toggleFlag(product: AdminProduct, flag: keyof AdminProduct) {
    setTogglingId(product.id);
    try {
      const updated = await adminApi.updateProduct(product.id, { [flag]: !product[flag] });
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    await adminApi.deleteProduct(deleteId);
    setDeleteId(null);
    load();
  }

  const columns: Column<AdminProduct>[] = [
    {
      key: 'name',
      label: 'Product',
      render: (p: AdminProduct) => (
        <div>
          <p className="font-medium text-gray-900">{p.name}</p>
          <p className="text-xs text-gray-400">{p.sku}</p>
        </div>
      ),
    },
    {
      key: 'category_name',
      label: 'Category',
      render: (p: AdminProduct) => <span className="text-gray-600">{p.category_name}</span>,
    },
    {
      key: 'price',
      label: 'Price',
      render: (p: AdminProduct) => (
        <div>
          <span className="font-medium">₹{Number(p.price).toLocaleString('en-IN')}</span>
          {p.discounted_price && (
            <span className="text-xs text-green-600 ml-1">→ ₹{Number(p.discounted_price).toLocaleString('en-IN')}</span>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (p: AdminProduct) => (
        <span className={p.stock === 0 ? 'text-red-600 font-semibold' : p.stock < 5 ? 'text-orange-500 font-semibold' : 'text-gray-700'}>
          {p.stock}
        </span>
      ),
    },
    {
      key: 'flags',
      label: 'Flags',
      render: (p: AdminProduct) => (
        <div className="flex gap-1 flex-wrap">
          {(['is_featured', 'is_best_seller', 'is_trending', 'is_new_arrival'] as const).map(flag => (
            <button
              key={flag}
              disabled={togglingId === p.id}
              onClick={() => toggleFlag(p, flag)}
              className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${
                p[flag]
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
              }`}
              title={flag.replace('is_', '').replace('_', ' ')}
            >
              {flag.replace('is_', '').replace('_', ' ')}
            </button>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (p: AdminProduct) => (
        <div className="flex gap-2">
          <Link
            href={`/admin/products/${p.id}`}
            className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={() => setDeleteId(p.id)}
            className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Products <span className="text-gray-400 font-normal text-base">({count})</span></h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Add Product
        </Link>
      </div>

      <input
        type="search"
        placeholder="Search by name or SKU…"
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <AdminTable columns={columns} rows={products} emptyMessage="No products found." />
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40">Prev</button>
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40">Next</button>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this product? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
