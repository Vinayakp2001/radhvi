'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi, AdminProduct, AdminCategory, ProductImage, ProductSpec, OccasionLink, productImageApi, productSpecApi, productOccasionApi } from '@/lib/admin-api';

const FLAGS = ['is_featured', 'is_best_seller', 'is_trending', 'is_new_arrival', 'is_deal_of_day'] as const;

const EMPTY: Partial<AdminProduct> = {
  name: '', short_description: '', description: '',
  price: '', discounted_price: null,
  category: undefined, stock: 0,
  weight: null, dimensions: '',
  is_featured: false, is_best_seller: false,
  is_trending: false, is_new_arrival: true, is_deal_of_day: false,
  meta_title: '', meta_description: '',
};

const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';
  const productId = isNew ? null : Number(id);

  const [form, setForm] = useState<Partial<AdminProduct>>(EMPTY);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Images
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Specs
  const [specs, setSpecs] = useState<ProductSpec[]>([{ name: '', value: '' }]);
  const [savingSpecs, setSavingSpecs] = useState(false);

  // Occasions
  const [occasions, setOccasions] = useState<OccasionLink[]>([]);
  const [savingOccasions, setSavingOccasions] = useState(false);

  useEffect(() => {
    adminApi.getCategories({ page_size: 100 }).then(r => setCategories(r.results));
    if (!isNew && productId) {
      Promise.all([
        adminApi.getProduct(productId),
        productImageApi.getImages(productId),
        productSpecApi.get(productId),
        productOccasionApi.get(productId),
      ]).then(([product, imgs, sp, occ]) => {
        setForm(product);
        setImages(imgs);
        setSpecs(sp.length ? sp : [{ name: '', value: '' }]);
        setOccasions(occ);
        setLoading(false);
      }).catch(() => { setError('Product not found.'); setLoading(false); });
    }
  }, [id, isNew, productId]);

  function set(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      let savedId = productId;
      if (isNew) {
        const created = await adminApi.createProduct(form);
        savedId = created.id;
        setSuccess('Product created.');
      } else {
        await adminApi.updateProduct(productId!, form);
        setSuccess('Product updated.');
      }

      // Upload new images if any
      if (newFiles.length && savedId) {
        setUploadingImages(true);
        const uploaded = await productImageApi.upload(savedId, newFiles);
        setImages(prev => [...prev, ...uploaded]);
        setNewFiles([]);
        setUploadingImages(false);
      }

      if (isNew && savedId) {
        setTimeout(() => router.push(`/admin/products/${savedId}`), 800);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: unknown } })?.response?.data;
      setError(msg ? JSON.stringify(msg) : 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteImage(imageId: number) {
    await productImageApi.remove(productId!, imageId);
    setImages(prev => prev.filter(i => i.id !== imageId));
  }

  async function handleSetPrimary(imageId: number) {
    await productImageApi.setPrimary(productId!, imageId);
    setImages(prev => prev.map(i => ({ ...i, is_primary: i.id === imageId })));
  }

  async function handleSaveSpecs() {
    if (!productId) return;
    setSavingSpecs(true);
    try {
      const saved = await productSpecApi.save(productId, specs.filter(s => s.name && s.value));
      setSpecs(saved.length ? saved : [{ name: '', value: '' }]);
      setSuccess('Specs saved.');
    } finally {
      setSavingSpecs(false);
    }
  }

  async function handleSaveOccasions() {
    if (!productId) return;
    setSavingOccasions(true);
    try {
      const linkedIds = occasions.filter(o => o.linked).map(o => o.id);
      await productOccasionApi.set(productId, linkedIds);
      setSuccess('Occasions saved.');
    } catch {
      setError('Failed to save occasions.');
    } finally {
      setSavingOccasions(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-700">← Back</button>
        <h1 className="text-xl font-semibold text-gray-900">{isNew ? 'Add Product' : 'Edit Product'}</h1>
      </div>

      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {/* ── Main product form ── */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <Field label="Name *">
          <input required value={form.name ?? ''} onChange={e => set('name', e.target.value)} className={inp} />
        </Field>
        <Field label="Short Description *">
          <input required value={form.short_description ?? ''} onChange={e => set('short_description', e.target.value)} className={inp} />
        </Field>
        <Field label="Description *">
          <textarea required rows={4} value={form.description ?? ''} onChange={e => set('description', e.target.value)} className={inp} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (₹) *">
            <input required type="number" step="0.01" min="0" value={form.price ?? ''} onChange={e => set('price', e.target.value)} className={inp} />
          </Field>
          <Field label="Discounted Price (₹)">
            <input type="number" step="0.01" min="0" value={form.discounted_price ?? ''} onChange={e => set('discounted_price', e.target.value || null)} className={inp} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category *">
            <select required value={form.category ?? ''} onChange={e => set('category', Number(e.target.value))} className={inp}>
              <option value="">Select…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Stock *">
            <input required type="number" min="0" value={form.stock ?? 0} onChange={e => set('stock', Number(e.target.value))} className={inp} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Weight (g)">
            <input type="number" step="0.01" min="0" value={form.weight ?? ''} onChange={e => set('weight', e.target.value || null)} className={inp} />
          </Field>
          <Field label="Dimensions (LxWxH cm)">
            <input value={form.dimensions ?? ''} onChange={e => set('dimensions', e.target.value)} placeholder="20x15x10" className={inp} />
          </Field>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Flags</p>
          <div className="flex flex-wrap gap-3">
            {FLAGS.map(flag => (
              <label key={flag} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={!!form[flag]} onChange={e => set(flag, e.target.checked)} className="rounded" />
                {flag.replace('is_', '').replace(/_/g, ' ')}
              </label>
            ))}
          </div>
        </div>

        <Field label="Meta Title">
          <input value={form.meta_title ?? ''} onChange={e => set('meta_title', e.target.value)} className={inp} />
        </Field>
        <Field label="Meta Description">
          <textarea rows={2} value={form.meta_description ?? ''} onChange={e => set('meta_description', e.target.value)} className={inp} />
        </Field>

        {/* Image upload (included in main form for new products) */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Product Images</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => setNewFiles(Array.from(e.target.files ?? []))}
            className="text-sm text-gray-600"
          />
          {newFiles.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">{newFiles.length} file(s) selected — will upload on save</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving || uploadingImages} className="px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : uploadingImages ? 'Uploading images…' : isNew ? 'Create Product' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-5 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>

      {/* ── Existing images (edit mode only) ── */}
      {!isNew && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Manage Images</h2>
          {images.length === 0 ? (
            <p className="text-sm text-gray-400">No images uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {images.map(img => (
                <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url ?? ''} alt="" className="w-full aspect-square object-cover" />
                  {img.is_primary && (
                    <span className="absolute top-1 left-1 bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded">Primary</span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!img.is_primary && (
                      <button onClick={() => handleSetPrimary(img.id)} className="text-xs bg-white text-gray-900 px-2 py-1 rounded hover:bg-gray-100">
                        Set Primary
                      </button>
                    )}
                    <button onClick={() => handleDeleteImage(img.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Upload more images</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async e => {
                const files = Array.from(e.target.files ?? []);
                if (!files.length || !productId) return;
                setUploadingImages(true);
                const uploaded = await productImageApi.upload(productId, files);
                setImages(prev => [...prev, ...uploaded]);
                setUploadingImages(false);
                e.target.value = '';
              }}
              className="text-sm text-gray-600"
            />
            {uploadingImages && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
          </div>
        </div>
      )}

      {/* ── Specifications (edit mode only) ── */}
      {!isNew && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Specifications</h2>
          <div className="space-y-2">
            {specs.map((spec, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  placeholder="e.g. Material"
                  value={spec.name}
                  onChange={e => setSpecs(prev => prev.map((s, j) => j === i ? { ...s, name: e.target.value } : s))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <input
                  placeholder="e.g. Cotton"
                  value={spec.value}
                  onChange={e => setSpecs(prev => prev.map((s, j) => j === i ? { ...s, value: e.target.value } : s))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  onClick={() => setSpecs(prev => prev.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-600 text-lg leading-none px-1"
                >×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSpecs(prev => [...prev, { name: '', value: '' }])}
              className="text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
            >
              + Add Row
            </button>
            <button
              type="button"
              onClick={handleSaveSpecs}
              disabled={savingSpecs}
              className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {savingSpecs ? 'Saving…' : 'Save Specs'}
            </button>
          </div>
        </div>
      )}

      {/* ── Occasion linking (edit mode only) ── */}
      {!isNew && occasions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Link to Occasions</h2>
          <div className="grid grid-cols-2 gap-2">
            {occasions.map(occ => (
              <label key={occ.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={occ.linked}
                  onChange={e => setOccasions(prev => prev.map(o => o.id === occ.id ? { ...o, linked: e.target.checked } : o))}
                  className="rounded"
                />
                {occ.name}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSaveOccasions}
            disabled={savingOccasions}
            className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {savingOccasions ? 'Saving…' : 'Save Occasions'}
          </button>
        </div>
      )}
    </div>
  );
}
