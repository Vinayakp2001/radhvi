'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';

type Address = { name: string; phone: string; address: string; city: string; state: string; pincode: string; country: string; };

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { state: cartState } = useCart();
  const cart = cartState.cart;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'phonepe' | 'cod'>('cod');
  const [addr, setAddr] = useState<Address>({ name: '', phone: '', address: '', city: '', state: '', pincode: '', country: 'India' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [guestCart, setGuestCart] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('guest_cart') || '[]');
      } catch { return []; }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const gc = localStorage.getItem('guest_cart');
        if (gc) setGuestCart(JSON.parse(gc));
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const gc = typeof window !== 'undefined' ? localStorage.getItem('guest_cart') : null;
    const hasGuestCart = gc && JSON.parse(gc).length > 0;
    const hasCart = cart && cart.items.length > 0;
    // Only redirect if neither logged-in cart nor guest cart has items
    if (!hasCart && !hasGuestCart) {
      router.push('/cart');
      return;
    }
    if (isAuthenticated) fetchSavedAddresses();
  }, [authLoading, cart, isAuthenticated]);

  const fetchSavedAddresses = async () => {
    try {
      const res = await api.get('/addresses/');
      const data = res.data;
      const addresses = Array.isArray(data) ? data : (data.results || []);
      setSavedAddresses(addresses);
      if (addresses.length > 0) {
        const def = addresses.find((a: any) => a.is_default) || addresses[0];
        setSelectedAddressId(def.id);
        setAddr({ name: def.full_name || def.name || '', phone: def.phone || '', address: def.address_line1 || '', city: def.city || '', state: def.state || '', pincode: def.pincode || '', country: def.country || 'India' });
      }
    } catch { }
  };

  const handlePincodeBlur = useCallback(async () => {
    if (!/^\d{6}$/.test(addr.pincode)) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${addr.pincode}`);
      const data = await res.json();
      if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        setAddr(prev => ({ ...prev, city: prev.city || po.District, state: prev.state || po.State }));
      }
    } catch { } finally { setPincodeLoading(false); }
  }, [addr.pincode]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!addr.name.trim()) e.name = 'Required';
    if (addr.phone.replace(/\D/g, '').length < 10) e.phone = 'Valid 10-digit number required';
    if (!addr.address.trim()) e.address = 'Required';
    if (!addr.city.trim()) e.city = 'Required';
    if (!addr.state.trim()) e.state = 'Required';
    if (!/^\d{6}$/.test(addr.pincode)) e.pincode = 'Valid 6-digit pincode required';
    if (!isAuthenticated) {
      if (!email.trim() || !email.includes('@')) e.email = 'Valid email required';
      if (!password || password.length < 6) e.password = 'Min 6 characters';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleOrder = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let res;
      if (isAuthenticated) {
        res = await api.post('/checkout/initiate/', {
          full_name: addr.name, phone: addr.phone, address_line1: addr.address,
          city: addr.city, state: addr.state, pincode: addr.pincode, country: addr.country,
          payment_method: paymentMethod,
          ...(selectedAddressId ? { shipping_address_id: selectedAddressId } : {}),
        });
      } else {
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        res = await api.post('/checkout/guest/', {
          email, password,
          full_name: addr.name, phone: addr.phone, address_line1: addr.address,
          city: addr.city, state: addr.state, pincode: addr.pincode, country: addr.country,
          payment_method: paymentMethod,
          cart_items: guestCart,
        });
        // Auto-login with returned token
        if (res.data.token) {
          localStorage.setItem('auth_token', res.data.token);
          if (res.data.user) localStorage.setItem('user_data', JSON.stringify(res.data.user));
          localStorage.removeItem('guest_cart');
        }
      }
      const { payment_url, order_id } = res.data;
      if (paymentMethod === 'cod') {
        router.push(`/orders/${order_id}/confirmation`);
      } else {
        localStorage.setItem('pending_order_id', order_id);
        window.location.href = payment_url;
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to place order.';
      if (err.response?.status === 503 || (paymentMethod !== 'cod' && err.response?.status >= 500)) {
        alert('Online payment unavailable. Please use Cash on Delivery.');
        setPaymentMethod('cod');
      } else {
        setErrors(prev => ({ ...prev, _form: msg }));
      }
      setLoading(false);
    }
  };

  const guestTotal = guestCart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const total = isAuthenticated ? Number(cart?.total_amount || 0) : guestTotal;
  const inp = (f: string) => `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${errors[f] ? 'border-red-400' : 'border-gray-300'}`;

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-2 border-red-500 border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">

            {/* Step 1: Info + Address */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  {step === 1 ? 'Your Details & Delivery Address' : 'Delivery Address'}
                </h2>
                {step > 1 && <button onClick={() => setStep(1)} className="text-sm text-red-500">Change</button>}
              </div>

              {step === 1 ? (
                <div className="p-6 space-y-4">
                  {/* Account fields for guests */}
                  {!isAuthenticated && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-medium text-blue-800">Create your account (or <button onClick={() => router.push('/login?redirect=/checkout')} className="underline">sign in</button>)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inp('email')} placeholder="your@email.com" />
                          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inp('password')} placeholder="Min 6 characters" />
                          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Saved addresses for logged in users */}
                  {isAuthenticated && savedAddresses.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Select a saved address</p>
                      {savedAddresses.map((a: any) => (
                        <label key={a.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${selectedAddressId === a.id ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                          <input type="radio" checked={selectedAddressId === a.id} onChange={() => { setSelectedAddressId(a.id); setAddr({ name: a.full_name || a.name || '', phone: a.phone || '', address: a.address_line1 || '', city: a.city || '', state: a.state || '', pincode: a.pincode || '', country: a.country || 'India' }); }} className="mt-1 accent-red-500" />
                          <div>
                            <p className="text-sm font-medium">{a.full_name || a.name}</p>
                            <p className="text-xs text-gray-500">{a.address_line1}, {a.city}, {a.state} - {a.pincode}</p>
                          </div>
                        </label>
                      ))}
                      <button onClick={() => setSelectedAddressId(null)} className="text-sm text-red-500">+ Add new address</button>
                    </div>
                  )}

                  {/* Address form */}
                  {(!isAuthenticated || !selectedAddressId) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input name="name" value={addr.name} onChange={e => setAddr(p => ({ ...p, name: e.target.value }))} className={inp('name')} />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                        <input name="phone" value={addr.phone} onChange={e => setAddr(p => ({ ...p, phone: e.target.value }))} className={inp('phone')} />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                        <textarea value={addr.address} onChange={e => setAddr(p => ({ ...p, address: e.target.value }))} rows={2} className={`${inp('address')} resize-none`} />
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                        <div className="relative">
                          <input value={addr.pincode} onChange={e => setAddr(p => ({ ...p, pincode: e.target.value }))} onBlur={handlePincodeBlur} maxLength={6} className={inp('pincode')} />
                          {pincodeLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent" />}
                        </div>
                        {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input value={addr.city} onChange={e => setAddr(p => ({ ...p, city: e.target.value }))} className={inp('city')} />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                        <input value={addr.state} onChange={e => setAddr(p => ({ ...p, state: e.target.value }))} className={inp('state')} />
                        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                      </div>
                    </div>
                  )}

                  <button onClick={() => { if (validate()) setStep(2); }} className="w-full mt-2 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600">
                    Continue to Payment
                  </button>
                </div>
              ) : (
                <div className="px-6 py-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{addr.name} · {addr.phone}</p>
                  <p>{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                  {!isAuthenticated && <p className="text-xs text-gray-400 mt-1">{email}</p>}
                </div>
              )}
            </div>

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Payment Method</h2></div>
                <div className="p-6">
                  {errors._form && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errors._form}</p>}
                  <div className="space-y-2 mb-6">
                    <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${paymentMethod === 'cod' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                      <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-red-500" />
                      <div><p className="text-sm font-medium">Cash on Delivery</p><p className="text-xs text-gray-500">Pay when your order arrives</p></div>
                    </label>
                    <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${paymentMethod === 'phonepe' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                      <input type="radio" checked={paymentMethod === 'phonepe'} onChange={() => setPaymentMethod('phonepe')} className="accent-red-500" />
                      <div><p className="text-sm font-medium">Pay Online</p><p className="text-xs text-amber-600">Currently unavailable — use Cash on Delivery</p></div>
                    </label>
                  </div>
                  <button onClick={handleOrder} disabled={loading} className="w-full bg-red-500 text-white py-3.5 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50">
                    {loading ? 'Processing...' : `Place Order · ₹${total.toFixed(2)}`}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-3">By placing this order, you agree to our Terms & Conditions</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 sticky top-4">
              <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Order Summary</h2></div>
              <div className="p-6">
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {isAuthenticated ? cart?.items.map((item: any) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.product.image_url ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold">₹{Number(item.item_total).toFixed(2)}</p>
                      </div>
                    </div>
                  )) : guestCart.map((item: any, i: number) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>₹{total.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span className={total >= 999 ? 'text-green-600 font-medium' : ''}>
                      {total >= 999 ? 'FREE' : '₹50'}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t"><span>Total</span><span>₹{total >= 999 ? total.toFixed(2) : (total + 50).toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
