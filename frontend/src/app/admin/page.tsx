'use client';

import { useEffect, useState } from 'react';
import { adminApi, DashboardStats } from '@/lib/admin-api';
import StatCard from '@/components/admin/StatCard';
import StatusBadge from '@/components/admin/StatusBadge';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getDashboard()
      .then(setStats)
      .catch(() => setError('Failed to load dashboard data.'));
  }, []);

  if (error) return <p className="text-red-500 text-sm">{error}</p>;
  if (!stats) return <p className="text-gray-400 text-sm">Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={stats.total_orders} icon="📦" />
        <StatCard
          label="Total Revenue"
          value={`₹${Number(stats.total_revenue).toLocaleString('en-IN')}`}
          icon="💰"
          sub="from paid orders"
        />
        <StatCard label="Products" value={stats.total_products} icon="🎁" />
        <StatCard label="Pending Orders" value={stats.pending_orders} icon="⏳" />
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Pending Returns</p>
          <p className="text-3xl font-bold text-orange-800 mt-1">{stats.pending_returns}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Pending Inquiries</p>
          <p className="text-3xl font-bold text-blue-800 mt-1">{stats.pending_inquiries}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Orders</h2>
          {stats.recent_orders.length === 0 ? (
            <p className="text-sm text-gray-400">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recent_orders.map(order => (
                <div key={order.order_id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{order.order_id}</span>
                    <span className="text-gray-400 ml-2">{order.customer_name}</span>
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

        {/* Low stock */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Low Stock Products</h2>
          {stats.low_stock_products.length === 0 ? (
            <p className="text-sm text-gray-400">All products are well stocked.</p>
          ) : (
            <div className="space-y-3">
              {stats.low_stock_products.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{p.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{p.sku}</span>
                  </div>
                  <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
