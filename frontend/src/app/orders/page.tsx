'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/orders');
      return;
    }
    loadOrders();
  }, [isAuthenticated, page]);

  const loadOrders = async () => {
    try {
      const response = await api.get(`/api/orders/?page=${page}`);
      setOrders(response.data.results || response.data);
      setHasMore(!!response.data.next);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here!
            </p>
            <Link
              href="/"
              className="inline-block bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 font-semibold"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.order_id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="font-bold text-lg">{order.order_id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-bold text-red-500">₹{order.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <p className="font-medium capitalize">{order.payment_status}</p>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="flex gap-2 overflow-x-auto">
                  {order.items?.slice(0, 4).map((item: any, index: number) => (
                    <img
                      key={index}
                      src={item.product_image || '/placeholder.png'}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ))}
                  {order.items?.length > 4 && (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {order.items?.length || 0} item(s)
                  </p>
                  <span className="text-red-500 font-semibold">View Details →</span>
                </div>
              </Link>
            ))}

            {/* Pagination */}
            {(page > 1 || hasMore) && (
              <div className="flex justify-center gap-4 mt-8">
                {page > 1 && (
                  <button
                    onClick={() => setPage(page - 1)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ← Previous
                  </button>
                )}
                {hasMore && (
                  <button
                    onClick={() => setPage(page + 1)}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Next →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
