'use client';

import { useEffect, useState, FormEvent } from 'react';
import { adminApi, AdminCategory } from '@/lib/admin-api';
import AdminTable from '@/components/admin/AdminTable';
import type { Column } from '@/components/admin/AdminTable';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const EMPTY = { name: '', icon: '🎁', description: '', is_active: true };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi.getCategories({ page_size: 100 });
      setCategories(res.results);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(EMPTY);
    setEditId(null);
    setShowForm(true);
    setError('');
  }

  function openEdit(cat: AdminCategory) {
    setForm({ name: cat.name, icon: cat.icon, description: cat.description, is_active: cat.is_active });
    setEditId(cat.id);
    setShowForm(true);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await adminApi.updateCategory(editId, form);
      } else {
        await adminApi.createCategory(form);
      }
      setShowForm(false);
      load();
    } catch {
      setError('Failed to save category.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cat: AdminCategory) {
    await adminApi.updateCategory(cat.id, { is_active: !cat.is_active });
    load();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await adminApi.deleteCategory(deleteId);
    setDeleteId(null);
    load();
  }

  const columns: Column<AdminCategory>[] = [
    { key: 'icon', label: 'Icon', render: c => <span className="text-xl">{c.icon}</span> },
    { key: 'name', label: 'Name', render: c => <span className="font-medium text-gray-900">{c.name}</span> },
    { key: 'product_count', label: 'Products', render: c => <span className="text-gray-600">{c.product_count}</span> },
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
        <div className="flex gap-2">
          <button onClick={() => openEdit(c)} className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Edit</button>
          <button onClick={() => setDeleteId(c.id)} className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
          + Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 max-w-md">
          <h2 className="text-sm font-semibold text-gray-700">{editId ? 'Edit Category' : 'New Category'}</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
            <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
            Active
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50">
              {saving ? 'Saving…' : editId ? 'Save' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <AdminTable columns={columns} rows={categories} emptyMessage="No categories yet." />
      )}

      {deleteId && (
        <ConfirmDialog
          message="Delete this category? Products in this category will be affected."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
