'use client';

import { useEffect, useState, FormEvent } from 'react';
import { adminApi, AdminCoupon } from '@/lib/admin-api';
import AdminTable from '@/components/admin/AdminTable';
import type { Column } from '@/components/admin/AdminTable';

const EMPTY = {
  code: '', discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '', min_order_amount: '0',
  max_discount_amount: '', valid_from: '', valid_to: '',
  is_active: true, usage_limit: 1,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi.getCoupons({ page_size: 100 });
      setCoupons(res.results);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminApi.createCoupon({
        ...form,
        discount_value: form.discount_value,
        min_order_amount: form.min_order_amount,
        max_discount_amount: form.max_discount_amount || null,
        usage_limit: Number(form.usage_limit),
      });
      setShowForm(false);
      setForm(EMPTY);
      load();
    } catch {
      setError('Failed to create coupon.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon: AdminCoupon) {
    await adminApi.updateCoupon(coupon.id, { is_active: !coupon.is_active });
    load();
  }

  async function handleDelete(id: number) {
    await adminApi.deleteCoupon(id);
    load();
  }

  const columns: Column<AdminCoupon>[] = [
    { key: 'code', label: 'Code', render: c => <span className="font-mono font-semibold text-gray-900">{c.code}</span> },
    {
      key: 'discount', label: 'Discount',
      render: c => <span>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</span>,
    },
    { key: 'min_order_amount', label: 'Min Order', render: c => <span>₹{c.min_order_amount}</span> },
    {
      key: 'validity', label: 'Valid',
      render: c => (
        <span className="text-xs text-gray-500">
          {new Date(c.valid_from).toLocaleDateString('en-IN')} – {new Date(c.valid_to).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      key: 'usage', label: 'Usage',
      render: c => <span className="text-gray-600">{c.used_count} / {c.usage_limit}</span>,
    },
    {
      key: 'is_active', label: 'Active',
      render: c => (
        <button onClick={() => toggleActive(c)}
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {c.is_active ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      key: 'actions', label: '',
      render: c => (
        <button onClick={() => handleDelete(c.id)} className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
          Delete
        </button>
      ),
    },
  ];

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Coupons</h1>
        <button onClick={() => { setShowForm(true); setError(''); }} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
          + Add Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 max-w-lg">
          <h2 className="text-sm font-semibold text-gray-700">New Coupon</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className={inp} placeholder="SAVE20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as 'percentage' | 'fixed' }))} className={inp}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
              <input required type="number" step="0.01" min="0" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
              <input type="number" step="0.01" min="0" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
              <input type="number" step="0.01" min="0" value={form.max_discount_amount} onChange={e => setForm(f => ({ ...f, max_discount_amount: e.target.value }))} className={inp} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
              <input type="number" min="1" value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: Number(e.target.value) }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
              <input required type="datetime-local" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid To *</label>
              <input required type="datetime-local" value={form.valid_to} onChange={e => setForm(f => ({ ...f, valid_to: e.target.value }))} className={inp} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Coupon'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <AdminTable columns={columns} rows={coupons} emptyMessage="No coupons yet." />
      )}
    </div>
  );
}
