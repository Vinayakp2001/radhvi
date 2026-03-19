'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, AdminUserDetail } from '@/lib/admin-api';
import StatusBadge from '@/components/admin/StatusBadge';

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getUserDetail(Number(userId))
      .then(setUser)
      .catch(() => setError('User not found.'));
  }, [userId]);

  if (error) return <p className="text-red-500 text-sm">{error}</p>;
  if (!user) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-700">← Back</button>
        <h1 className="text-xl font-semibold text-gray-900">{user.first_name} {user.last_name}</h1>
        {user.is_staff && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Staff</span>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Profile</h2>
        <Row label="Username" value={`@${user.username}`} />
        <Row label="Email" value={user.email} />
        <Row label="Joined" value={new Date(user.date_joined).toLocaleDateString('en-IN')} />
        <Row label="Status" value={user.is_active ? 'Active' : 'Inactive'} />
        <Row label="Total Orders" value={String(user.orders.length)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Order History</h2>
        {user.orders.length === 0 ? (
          <p className="text-sm text-gray-400">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {user.orders.map(order => (
              <div key={order.order_id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-0">
                <div className="flex items-center gap-3">
                  <Link href={`/admin/orders/${order.order_id}`} className="font-medium text-gray-900 hover:underline">
                    {order.order_id}
                  </Link>
                  <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}
