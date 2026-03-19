'use client';

import { useEffect, useState } from 'react';
import { occasionAdminApi, AdminOccasion } from '@/lib/admin-api';

export default function AdminOccasionsPage() {
  const [occasions, setOccasions] = useState<AdminOccasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', tagline: '', is_active: true, order: 0 });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  async function load() {
    setLoading(true);
    const data = await occasionAdminApi.list();
    setOccasions(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(occ: AdminOccasion) {
    setEditId(occ.id);
    setEditForm({ name: occ.name, tagline: occ.tagline, is_active: occ.is_active, order: occ.order });
    setImageFile(null);
    setSuccess('');
  }

  async function handleSave() {
    if (!editId) return;
    setSaving(true);
    const fd = new FormData();
    fd.append('name', editForm.name);
    fd.append('tagline', editForm.tagline);
    fd.append('is_active', String(editForm.is_active));
    fd.append('order', String(editForm.order));
    if (imageFile) fd.append('image', imageFile);

    await occasionAdminApi.update(editId, fd);
    setSuccess('Occasion updated.');
    setEditId(null);
    load();
    setSaving(false);
  }

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900';

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">Occasions</h1>
      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

      {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {occasions.map(occ => (
            <div key={occ.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {occ.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={occ.image_url} alt={occ.name} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No image</div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-900">{occ.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${occ.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {occ.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{occ.tagline}</p>
                <button
                  onClick={() => openEdit(occ)}
                  className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 w-full"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit panel */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Edit Occasion</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tagline</label>
              <input value={editForm.tagline} onChange={e => setEditForm(f => ({ ...f, tagline: e.target.value }))} className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label>
                <input type="number" value={editForm.order} onChange={e => setEditForm(f => ({ ...f, order: Number(e.target.value) }))} className={inp} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                  Active
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} className="text-sm text-gray-600" />
              {imageFile && <p className="text-xs text-gray-400 mt-1">{imageFile.name}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditId(null)} className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
