'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';

type Address = {
  name: string; phone: string; address: string;
  city: string; state: string; pincode: string; country: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { state: cartState } = useCart();
  const cart = cartState.cart;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'phonepe' | 'cod'>('cod');
  const [addr, setAddr] = useState<Address>({
    name: '', phone: '', address: '', city: '', state: '', pincode: '', country: 'India'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!cart || cart.items.length === 0) router.push('/cart');
  }, [authLoading, cart]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddr(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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
    } catch {} finally { setPincodeLoading(false); }
  }, [addr.pincode]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!addr.name.trim()) e.name = 'Required';
    if (!addr.phone.trim() || addr.phone.replace(/\D/g, '').length < 10) e.phone = 'Valid 10-digit number required';
    if (!addr.address.trim()) e.address = 'Required';
    if (!addr.city.trim()) e.city = 'Required';
    if (!addr.state.trim()) e.state = 'Required';
    if (!/^\d{6}$/.test(addr.pincode)) e.pincode = 'Valid 6-digit pincode required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const fetchRates = async () => {
    setRatesLoading(true);
    try {
      const res = await api.post('/checkout/shipping-rates/', { delivery_pincode: addr.pincode, cod: paymentMethod === 'cod' });
      const rates = res.data.rates || [];
      setShippingRates(rates);
      if (rates.length > 0) setSelectedShipping(rates[0]);
    } catch { setShippingRates([]); } finally { setRatesLoading(false); }
  };

  const handleContinue = async () => {
    if (!validate()) return;
    await fetchRates();
    setStep(2);
  };

  const handleOrder = async () => {
    setLoading(true);
    try {
      const res = await api.post('/checkout/initiate/', {
        full_name: addr.name, phone: addr.phone, address_line1: addr.address,
        city: addr.city, state: addr.state, pincode: addr.pincode, country: addr.country,
        courier_id: selectedShipping?.courier_id, payment_method: paymentMethod
      });
      if (paymentMethod === 'cod') {
        router.push(`/orders/${res.data.order_id}/confirmation`);
      } else {
        localStorage.setItem('pending_order_id', res.data.order_id);
        window.location.href = res.data.payment_url;
      }
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Failed to place order.';
      if (e.response?.status === 503 || (paymentMethod !== 'cod' && e.response?.status >= 500)) {
        alert('Online payment unavailable. Please use Cash on Delivery.');
        setPaymentMethod('cod');
      } else { alert(msg); }
      setLoading(false);
    }
  };

  const total = Number(cart?.total_amount || 0) + Number(selectedShipping?.rate || 0);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-500 border-t-transparent" />
    </div>
  );

  const inp = (f: string) => `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${errors[f] ? 'border-red-400' : 'border-gray-300'}`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">

            {/* Step 1: Address */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Delivery Address</h2>
                {step > 1 && <button onClick={() => setStep(1)} className="text-sm text-red-500">Change</button>}
              </div>
              {step === 1 ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input name="name" value={addr.name} onChange={handleChange} className={inp('name')} />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input name="phone" value={addr.phone} onChange={handleChange} className={inp('phone')} />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                      <textarea name="address" value={addr.address} onChange={handleChange} rows={2} className={`${inp('address')} resize-none`} />
                      {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                      <div className="relative">
                        <input name="pincode" value={addr.pincode} onChange={handleChange} onBlur={handlePincodeBlur} maxLength={6} className={inp('pincode')} />
                        {pincodeLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent" />}
                      </div>
                      {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input name="city" value={addr.city} onChange={handleChange} className={inp('city')} />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                      <input name="state" value={addr.state} onChange={handleChange} className={inp('state')} />
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>
                  </div>
                  <button onClick={handleContinue} disabled={ratesLoading} className="w-full mt-6 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 disabled:opacity-50">
                    {ratesLoading ? 'Fetching rates...' : 'Continue to Payment'}
                  </button>
                </div>
              ) : (
                <div className="px-6 py-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{addr.name} · {addr.phone}</p>
                  <p>{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                </div>
              )}
            </div>

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Payment Method</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-2 mb-6">
                    <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${paymentMethod === 'cod' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                      <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-red-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Cash on Delivery</p>
                        <p className="text-xs text-gray-500">Pay when your order arrives</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${paymentMethod === 'phonepe' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                      <input type="radio" checked={paymentMethod === 'phonepe'} onChange={() => setPaymentMethod('phonepe')} className="accent-red-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Pay Online</p>
                        <p className="text-xs text-amber-600">Currently unavailable — please use Cash on Delivery</p>
                      </div>
                    </label>
                  </div>
                  <button onClick={handleOrder} disabled={loading} className="w-full bg-red-500 text-white py-3.5 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50">
                    {loading ? 'Processing...' : paymentMethod === 'cod' ? `Place Order · ₹${total.toFixed(2)}` : `Pay ₹${total.toFixed(2)}`}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-3">By placing this order, you agree to our Terms & Conditions</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 sticky top-4">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Order Summary</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {cart?.items.map((item: any) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.product.image_url
                          ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-gray-200" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-gray-900">₹{Number(item.item_total).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>₹{Number(cart?.total_amount || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm text-gray-600"><span>Shipping</span><span>{selectedShipping ? `₹${Number(selectedShipping.rate).toFixed(2)}` : '—'}</span></div>
                  <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
