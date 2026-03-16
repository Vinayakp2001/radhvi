'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';

const STEPS = [
  { number: 1, title: 'Delivery Address' },
  { number: 2, title: 'Shipping Method' },
  { number: 3, title: 'Payment' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { state: cartState, clearCart } = useCart();
  const cart = cartState.cart;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [shippingAddress, setShippingAddress] = useState({
    name: '', phone: '', address: '', city: '', state: '', pincode: '', country: 'India',
  });

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login?redirect=/checkout'); return; }
    if (!cart || cart.items.length === 0) { router.push('/cart'); return; }
    fetchSavedAddresses();
  }, [isAuthenticated, authLoading, cart]);

  const fetchSavedAddresses = async () => {
    try {
      const response = await api.get('/addresses/');
      const data = response.data;
      const addresses = Array.isArray(data) ? data : (data.results || []);
      setSavedAddresses(addresses);
      if (addresses.length === 0) setShowNewAddressForm(true);
    } catch {
      setShowNewAddressForm(true);
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleAddressSelect = (addr: any) => {
    setSelectedAddressId(addr.id);
    setShippingAddress({
      name: addr.full_name || addr.name || '',
      phone: addr.phone || '',
      address: addr.address_line1 || addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      country: addr.country || 'India',
    });
    setShowNewAddressForm(false);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateAddress = () => {
    const newErrors: Record<string, string> = {};
    if (!shippingAddress.name.trim()) newErrors.name = 'Full name is required';
    if (!shippingAddress.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(shippingAddress.phone.replace(/\D/g, '').slice(-10))) newErrors.phone = 'Enter a valid 10-digit phone number';
    if (!shippingAddress.address.trim()) newErrors.address = 'Address is required';
    if (!shippingAddress.city.trim()) newErrors.city = 'City is required';
    if (!shippingAddress.state.trim()) newErrors.state = 'State is required';
    if (!shippingAddress.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(shippingAddress.pincode)) newErrors.pincode = 'Enter a valid 6-digit pincode';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressSubmit = async () => {
    if (!validateAddress()) return;
    setRatesLoading(true);
    try {
      const response = await api.post('/checkout/shipping-rates/', {
        delivery_pincode: shippingAddress.pincode,
        cod: false,
      });
      setShippingRates(response.data.rates || []);
      setCurrentStep(2);
    } catch (error: any) {
      setErrors({ pincode: error.response?.data?.error || 'Could not fetch shipping rates for this pincode' });
    } finally {
      setRatesLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const checkoutData = {
        full_name: shippingAddress.name,
        phone: shippingAddress.phone,
        address_line1: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country || 'India',
        courier_id: selectedShipping?.courier_id,
        payment_method: 'phonepe',
      };
      const response = await api.post('/checkout/initiate/', checkoutData);
      const { payment_url, order_id } = response.data;
      localStorage.setItem('pending_order_id', order_id);
      window.location.href = payment_url;
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to initiate checkout. Please try again.');
      setLoading(false);
    }
  };

  const orderSummary = {
    subtotal: cart?.total_amount || 0,
    shipping: selectedShipping?.rate || 0,
    total: (cart?.total_amount || 0) + (selectedShipping?.rate || 0),
  };

  if (authLoading || addressesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            {STEPS.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                    currentStep > step.number
                      ? 'bg-red-500 border-red-500 text-white'
                      : currentStep === step.number
                      ? 'border-red-500 text-red-500 bg-white'
                      : 'border-gray-300 text-gray-400 bg-white'
                  }`}>
                    {currentStep > step.number ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step.number}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                  }`}>{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${currentStep > step.number ? 'bg-red-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">

            {/* Step 1: Delivery Address */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Delivery Address</h2>
                {currentStep > 1 && (
                  <button onClick={() => setCurrentStep(1)} className="text-sm text-red-500 hover:text-red-600 font-medium">
                    Change
                  </button>
                )}
              </div>

              {currentStep === 1 ? (
                <div className="p-6">
                  {/* Saved Addresses */}
                  {savedAddresses.length > 0 && !showNewAddressForm && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-500 mb-3">Select a saved address</p>
                      <div className="space-y-2">
                        {savedAddresses.map((addr) => (
                          <label
                            key={addr.id}
                            className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedAddressId === addr.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="saved_address"
                              checked={selectedAddressId === addr.id}
                              onChange={() => handleAddressSelect(addr)}
                              className="mt-1 accent-red-500"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{addr.full_name || addr.name}</p>
                              <p className="text-sm text-gray-500">{addr.phone}</p>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {addr.address_line1 || addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(null); }}
                        className="mt-3 text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add new address
                      </button>
                    </div>
                  )}

                  {/* Address Form */}
                  {(showNewAddressForm || savedAddresses.length === 0) && (
                    <div>
                      {savedAddresses.length > 0 && (
                        <button
                          onClick={() => setShowNewAddressForm(false)}
                          className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Back to saved addresses
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                          <input type="text" name="name" value={shippingAddress.name} onChange={handleAddressChange}
                            placeholder="Enter your full name"
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.name ? 'border-red-400' : 'border-gray-300'}`} />
                          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                          <input type="tel" name="phone" value={shippingAddress.phone} onChange={handleAddressChange}
                            placeholder="10-digit mobile number"
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.phone ? 'border-red-400' : 'border-gray-300'}`} />
                          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                          <textarea name="address" value={shippingAddress.address} onChange={handleAddressChange}
                            placeholder="House no., building, street, area"
                            rows={2}
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${errors.address ? 'border-red-400' : 'border-gray-300'}`} />
                          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                          <input type="text" name="city" value={shippingAddress.city} onChange={handleAddressChange}
                            placeholder="City"
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.city ? 'border-red-400' : 'border-gray-300'}`} />
                          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                          <input type="text" name="state" value={shippingAddress.state} onChange={handleAddressChange}
                            placeholder="State"
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.state ? 'border-red-400' : 'border-gray-300'}`} />
                          {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
                          <input type="text" name="pincode" value={shippingAddress.pincode} onChange={handleAddressChange}
                            placeholder="6-digit pincode" maxLength={6}
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.pincode ? 'border-red-400' : 'border-gray-300'}`} />
                          {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleAddressSubmit}
                    disabled={ratesLoading || (!shippingAddress.name && !selectedAddressId)}
                    className="w-full mt-6 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {ratesLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Fetching shipping rates...
                      </span>
                    ) : 'Continue to Shipping'}
                  </button>
                </div>
              ) : (
                <div className="px-6 py-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{shippingAddress.name} &middot; {shippingAddress.phone}</p>
                  <p className="mt-0.5">{shippingAddress.address}, {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}</p>
                </div>
              )}
            </div>

            {/* Step 2: Shipping Method */}
            {currentStep >= 2 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Shipping Method</h2>
                  {currentStep > 2 && (
                    <button onClick={() => setCurrentStep(2)} className="text-sm text-red-500 hover:text-red-600 font-medium">
                      Change
                    </button>
                  )}
                </div>

                {currentStep === 2 ? (
                  <div className="p-6">
                    {shippingRates.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-gray-500 text-sm">No delivery options available for this pincode.</p>
                        <button onClick={() => setCurrentStep(1)} className="mt-3 text-sm text-red-500 hover:text-red-600 font-medium">
                          Change delivery address
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {shippingRates.map((courier: any, index: number) => (
                          <label
                            key={index}
                            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedShipping?.courier_id === courier.courier_id
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="shipping_method"
                              checked={selectedShipping?.courier_id === courier.courier_id}
                              onChange={() => setSelectedShipping(courier)}
                              className="accent-red-500"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{courier.courier_name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Estimated delivery in {courier.estimated_delivery_days} days
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900">₹{courier.rate}</p>
                          </label>
                        ))}
                      </div>
                    )}

                    {shippingRates.length > 0 && (
                      <button
                        onClick={() => { if (selectedShipping) setCurrentStep(3); }}
                        disabled={!selectedShipping}
                        className="w-full mt-6 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Continue to Payment
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="px-6 py-4 text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{selectedShipping?.courier_name}</p>
                    <p className="mt-0.5">Delivery in {selectedShipping?.estimated_delivery_days} days &middot; ₹{selectedShipping?.rate}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Payment</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Secure Payment via PhonePe</p>
                      <p className="text-xs text-gray-500 mt-0.5">UPI, Cards, Net Banking, Wallets accepted</p>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full bg-red-500 text-white py-3.5 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Redirecting to payment...
                      </span>
                    ) : `Pay ₹${orderSummary.total.toFixed(2)}`}
                  </button>

                  <p className="text-xs text-gray-400 text-center mt-3">
                    By placing this order, you agree to our Terms & Conditions
                  </p>
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
                          : <div className="w-full h-full bg-gray-200" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">₹{item.item_total}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{orderSummary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span>{selectedShipping ? `₹${orderSummary.shipping.toFixed(2)}` : '—'}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>₹{orderSummary.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
