'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi, AdminReturn } from '@/lib/admin-api';
import StatusBadge from '@/components/admin/StatusBadge';

const STATUSES = ['pending', 'approved', 'rejected', 'picked_up', 'refunded', 'completed'];

export default function AdminReturnDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const router = useRouter();
  const [ret, setRet] = useState<AdminReturn | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getReturn(Number(requestId))
      .then(r => { setRet(r); setNewStatus(r.status); })
      .catch(() => setError('Return request not found.'));
  }, [requestId]);

  async function handleSave() {
    if (!ret) return;
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const updated = await adminApi.updateReturnStatus(ret.id, newStatus);
      setRet(prev => prev ? { ...prev, status: updated.status } : prev);
      setSuccess('Status updated.');
    } catch {
      setError('Failed to update status.');
    } finally {
      setSaving(false);
    }
  }

  if (error && !ret) return <p className="text-red-500 text-sm">{error}</p>;
  if (!ret) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-700">← Back</button>
        <h1 className="text-xl font-semibold text-gray-900">Return {ret.request_id}</h1>
        <StatusBadge status={ret.status} />
      </div>

      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Details</h2>
        <Row label="Order ID" value={ret.order_id} />
        <Row label="Customer" value={ret.username} />
        <Row label="Type" value={ret.return_type} />
        <Row label="Reason" value={ret.reason.replace(/_/g, ' ')} />
        {ret.refund_amount && <Row label="Refund Amount" value={`₹${ret.refund_amount}`} />}
        {ret.pickup_date && <Row label="Pickup Date" value={ret.pickup_date} />}
        {ret.tracking_number && <Row label="Tracking #" value={ret.tracking_number} />}
        <Row label="Created" value={new Date(ret.created_at).toLocaleString('en-IN')} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Description</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{ret.description}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h2>
        <div className="flex items-center gap-3">
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
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
