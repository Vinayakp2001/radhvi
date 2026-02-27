'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function AccountPage() {
  const { state, logout } = useAuth();
  const router = useRouter();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, delivered: 0 });
  const [loadingOrders, setLoadingOrders] = useState(true);

  const handleSignIn = () => {
    router.push('/login');
  };

  const handleCreateAccount = () => {
    router.push('/register');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  useEffect(() => {
    if (state.isAuthenticated) {
      loadOrders();
    }
  }, [state.isAuthenticated]);
  
  const loadOrders = async () => {
    try {
      const response = await api.get('/api/orders/?page=1');
      const orders = response.data.results || response.data;
      setRecentOrders(orders.slice(0, 3)); // Get first 3 orders
      
      // Calculate stats
      const stats = {
        total: orders.length,
        pending: orders.filter((o: any) => o.status === 'pending' || o.status === 'confirmed').length,
        delivered: orders.filter((o: any) => o.status === 'delivered').length
      };
      setOrderStats(stats);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoadingOrders(false);
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

  if (state.loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar message="🎉 Free Shipping on orders above ₹999" />
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar message="🎉 Free Shipping on orders above ₹999" />
        <Header />

        <main className="flex-1 bg-gray-50 py-12">
          <div className="container-custom max-w-md">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-center mb-8">
                <svg
                  className="w-20 h-20 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Radhvi</h1>
                <p className="text-gray-600">Sign in to access your account</p>
              </div>

              <div className="space-y-4">
                <button onClick={handleSignIn} className="w-full btn btn-primary py-3">
                  Sign In
                </button>
                <button onClick={handleCreateAccount} className="w-full btn btn-secondary py-3">
                  Create Account
                </button>
              </div>

              <div className="mt-6 text-center">
                <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm">
                  Continue as Guest
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar message="🎉 Free Shipping on orders above ₹999" />
      <Header />

      <main className="flex-1 bg-gray-50 py-12">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Account Info */}
              <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Account Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Name</label>
                    <p className="font-medium">
                      {state.user?.first_name} {state.user?.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-medium">{state.user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Username</label>
                    <p className="font-medium">{state.user?.username}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <Link
                  href="/orders"
                  className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    <span className="font-medium">My Orders</span>
                  </div>
                </Link>
                
                <Link
                  href="/account/addresses"
                  className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="font-medium">Manage Addresses</span>
                  </div>
                </Link>

                <Link
                  href="/wishlist"
                  className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span className="font-medium">My Wishlist</span>
                  </div>
                </Link>

                <Link
                  href="/cart"
                  className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    <span className="font-medium">My Cart</span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span className="font-medium text-red-600">Logout</span>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Order Statistics */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{orderStats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">{orderStats.pending}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⏳</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Delivered</p>
                    <p className="text-3xl font-bold text-green-600">{orderStats.delivered}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Orders</h2>
                <Link href="/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View All →
                </Link>
              </div>
              
              {loadingOrders ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : recentOrders.length === 0 ? (
                <div>
                  <p className="text-gray-600 text-center py-8">No orders yet. Start shopping!</p>
                  <div className="text-center">
                    <Link href="/collections/all" className="btn btn-primary px-6 py-2 inline-block">
                      Browse Products
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.order_id}`}
                      className="block border rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">Order #{order.order_id}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">{order.items?.length || 0} item(s)</p>
                        <p className="font-bold text-primary-600">₹{order.total_amount}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
