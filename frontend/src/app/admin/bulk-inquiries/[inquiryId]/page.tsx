'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi, AdminBulkInquiry } from '@/lib/admin-api';
import StatusBadge from '@/components/admin/StatusBadge';

const STATUSES = ['pending', 'contacted', 'quoted', 'converted', 'rejected'];

export default function AdminBulkInquiryDetailPage() {
  const { inquiryId } = useParams<{ inquiryId: string }>();
  const router = useRouter();
  const [inquiry, setInquiry] = useState<AdminBulkInquiry | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getBulkInquiry(Number(inquiryId))
      .then(i => {
        setInquiry(i);
        setNewStatus(i.status);
        setAdminNotes(i.admin_notes);
        setQuotedAmount(i.quoted_amount ?? '');
      })
      .catch(() => setError('Inquiry not found.'));
  }, [inquiryId]);

  async function handleSave() {
    if (!inquiry) return;
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const updated = await adminApi.updateInquiryStatus(inquiry.id, {
        status: newStatus,
        admin_notes: adminNotes,
        quoted_amount: quotedAmount || undefined,
      });
      setInquiry(prev => prev ? { ...prev, ...updated } : prev);
      setSuccess('Inquiry updated.');
    } catch {
      setError('Failed to update inquiry.');
    } finally {
      setSaving(false);
    }
  }

  if (error && !inquiry) return <p className="text-red-500 text-sm">{error}</p>;
  if (!inquiry) return <p className="text-sm text-gray-400">Loading…</p>;

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900';

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-700">← Back</button>
        <h1 className="text-xl font-semibold text-gray-900">{inquiry.company_name}</h1>
        <StatusBadge status={inquiry.status} />
      </div>

      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Contact</h2>
        <Row label="Contact Person" value={inquiry.contact_person} />
        <Row label="Email" value={inquiry.email} />
        <Row label="Phone" value={inquiry.phone} />
        {inquiry.gst_number && <Row label="GST" value={inquiry.gst_number} />}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Inquiry Details</h2>
        <Row label="Type" value={inquiry.inquiry_type.replace(/_/g, ' ')} />
        <Row label="Quantity" value={String(inquiry.quantity)} />
        <Row label="Budget Range" value={inquiry.budget_range || '—'} />
        <Row label="Delivery Timeline" value={inquiry.delivery_timeline || '—'} />
        <Row label="Submitted" value={new Date(inquiry.created_at).toLocaleString('en-IN')} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Product Interest</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.product_interest}</p>
      </div>

      {inquiry.message && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Additional Message</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.message}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Update Inquiry</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className={inp}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quoted Amount (₹)</label>
            <input type="number" step="0.01" min="0" value={quotedAmount} onChange={e => setQuotedAmount(e.target.value)} className={inp} placeholder="Optional" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Admin Notes</label>
          <textarea rows={3} value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className={inp} placeholder="Internal notes…" />
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500 capitalize">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}
