'use client';

import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';

export default function CartPage() {
  const { state, updateQuantity, removeItem, refreshCart } = useCart();

  useEffect(() => {
    refreshCart();
  }, []);

  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    try {
      await updateQuantity(cartItemId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      await removeItem(cartItemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar message="🎉 Free Shipping on orders above ₹999" />
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cart...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const cartItems = state.cart?.items || [];
  const isEmpty = cartItems.length === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar message="🎉 Free Shipping on orders above ₹999" />
      <Header />

      <main className="flex-1 bg-gray-50 py-12">
        <div className="container-custom">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{state.error}</p>
            </div>
          )}

          {isEmpty ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg
                className="w-24 h-24 mx-auto mb-6 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Link href="/collections/all" className="btn btn-primary px-8 py-3 inline-block">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Cart Items ({state.cart?.total_items})</h2>
                    <div className="space-y-4">
                      {cartItems.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                            {item.product.image_url ? (
                              <Image
                                src={item.product.image_url}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                                priority={index === 0}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{item.product.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {item.product.discounted_price ? (
                                <>
                                  <span className="text-lg font-bold text-primary-600">
                                    ₹{item.product.discounted_price}
                                  </span>
                                  <span className="text-sm text-gray-500 line-through">
                                    ₹{item.product.price}
                                  </span>
                                </>
                              ) : (
                                <span className="text-lg font-bold text-gray-900">
                                  ₹{item.product.price}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">₹{item.item_total.toFixed(2)}</div>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-700 text-sm mt-1"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                  <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span>Subtotal ({state.cart?.total_items} items)</span>
                      <span>₹{state.cart?.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-green-600">
                        {(state.cart?.total_amount || 0) >= 999 ? 'Free' : '₹50'}
                      </span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>
                        ₹{((state.cart?.total_amount || 0) + ((state.cart?.total_amount || 0) >= 999 ? 0 : 50)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Link href="/checkout" className="w-full btn btn-primary py-3 mb-3 block text-center">
                    Proceed to Checkout
                  </Link>
                  <Link href="/collections/all" className="block text-center text-primary-600 hover:text-primary-700">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
