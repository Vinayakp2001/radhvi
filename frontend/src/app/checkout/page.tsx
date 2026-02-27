'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';
import Script from 'next/script';

export default function CheckoutPage() {
  const router = useRouter();
  const { state: authState } = useAuth();
  const { state: cartState, clearCart } = useCart();
  
  const user = authState.user;
  const isAuthenticated = authState.isAuthenticated;
  const cart = cartState.cart;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  // Form data
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });
  
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }
    
    if (!cart || cart.items.length === 0) {
      router.push('/cart');
      return;
    }
    
    fetchSavedAddresses();
  }, [isAuthenticated, cart]);
  
  const fetchSavedAddresses = async () => {
    try {
      const response = await api.get('/api/addresses/');
      setSavedAddresses(response.data);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };
  
  const handleAddressSelect = (address: any) => {
    setShippingAddress({
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country || 'India'
    });
    setShowNewAddressForm(false);
  };
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };
  
  const handleAddressSubmit = async () => {
    // Validate
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address || 
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      alert('Please fill all required fields');
      return;
    }
    
    // Fetch shipping rates
    setLoading(true);
    try {
      const response = await api.post('/api/checkout/shipping-rates/', {
        delivery_pincode: shippingAddress.pincode,
        cod: false
      });
      setShippingRates(response.data.couriers || []);
      setCurrentStep(2);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to fetch shipping rates');
    } finally {
      setLoading(false);
    }
  };
  
  const handleShippingSelect = (courier: any) => {
    setSelectedShipping(courier);
  };
  
  const handleShippingSubmit = () => {
    if (!selectedShipping) {
      alert('Please select a shipping method');
      return;
    }
    setCurrentStep(3);
  };

  
  const handlePlaceOrder = async () => {
    if (!razorpayLoaded) {
      alert('Payment system is loading. Please wait...');
      return;
    }
    
    setLoading(true);
    
    try {
      const checkoutData = {
        shipping_address: shippingAddress,
        courier_id: selectedShipping.courier_company_id,
        shipping_charge: selectedShipping.rate
      };
      
      const response = await api.post('/api/checkout/initiate/', checkoutData);
      const { razorpay_order_id, order_id, amount } = response.data;
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: 'INR',
        name: 'Radhvi Gift Shop',
        description: `Order #${order_id}`,
        order_id: razorpay_order_id,
        handler: async function (response: any) {
          await verifyPayment(response, order_id);
        },
        prefill: {
          name: shippingAddress.name,
          email: user?.email || '',
          contact: shippingAddress.phone
        },
        theme: {
          color: '#EF4444'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            handlePaymentFailure(order_id, 'Payment cancelled by user');
          }
        }
      };
      
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.error || 'Failed to initiate checkout');
      setLoading(false);
    }
  };
  
  const verifyPayment = async (paymentResponse: any, orderId: string) => {
    try {
      const verifyData = {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature
      };
      
      await api.post('/api/checkout/verify-payment/', verifyData);
      clearCart();
      router.push(`/orders/${orderId}/confirmation`);
      
    } catch (error: any) {
      console.error('Payment verification error:', error);
      alert('Payment verification failed. Please contact support.');
      setLoading(false);
    }
  };
  
  const handlePaymentFailure = async (orderId: string, reason: string) => {
    try {
      await api.post('/api/checkout/payment-failed/', {
        order_id: orderId,
        reason: reason
      });
    } catch (error) {
      console.error('Failed to log payment failure:', error);
    }
  };
  
  const steps = [
    { number: 1, title: 'Shipping Address', icon: '📍' },
    { number: 2, title: 'Shipping Method', icon: '🚚' },
    { number: 3, title: 'Payment', icon: '💳' }
  ];
  
  const orderSummary = {
    subtotal: cart?.total_amount || 0,
    shipping: selectedShipping?.rate || 0,
    total: (cart?.total_amount || 0) + (selectedShipping?.rate || 0)
  };


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />
      
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                    currentStep >= step.number 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.icon}
                  </div>
                  <span className="text-sm mt-2">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-4 ${
                    currentStep > step.number ? 'bg-red-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              
              {currentStep === 1 && (
                <div>
                  <h2 className="text-xl font-bold mb-6">Shipping Address</h2>
                  
                  {isAuthenticated && savedAddresses.length > 0 && !showNewAddressForm && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Select Saved Address</h3>
                      <div className="space-y-3">
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => handleAddressSelect(addr)}
                            className={`p-4 border rounded-lg cursor-pointer hover:border-red-500 ${
                              shippingAddress.pincode === addr.pincode ? 'border-red-500 bg-red-50' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold">{addr.name}</p>
                                <p className="text-sm text-gray-600">{addr.phone}</p>
                                <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                                <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowNewAddressForm(true)}
                        className="mt-4 text-red-500 hover:text-red-600"
                      >
                        + Add New Address
                      </button>
                    </div>
                  )}
                  
                  {(!isAuthenticated || savedAddresses.length === 0 || showNewAddressForm) && (
                    <div>
                      {showNewAddressForm && (
                        <button
                          onClick={() => setShowNewAddressForm(false)}
                          className="mb-4 text-red-500 hover:text-red-600"
                        >
                          ← Back to Saved Addresses
                        </button>
                      )}
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Full Name *</label>
                            <input
                              type="text"
                              name="name"
                              value={shippingAddress.name}
                              onChange={handleAddressChange}
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Phone Number *</label>
                            <input
                              type="tel"
                              name="phone"
                              value={shippingAddress.phone}
                              onChange={handleAddressChange}
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Address *</label>
                          <textarea
                            name="address"
                            value={shippingAddress.address}
                            onChange={handleAddressChange}
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">City *</label>
                            <input
                              type="text"
                              name="city"
                              value={shippingAddress.city}
                              onChange={handleAddressChange}
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">State *</label>
                            <input
                              type="text"
                              name="state"
                              value={shippingAddress.state}
                              onChange={handleAddressChange}
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Pincode *</label>
                            <input
                              type="text"
                              name="pincode"
                              value={shippingAddress.pincode}
                              onChange={handleAddressChange}
                              maxLength={6}
                              className="w-full px-4 py-2 border rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleAddressSubmit}
                    disabled={loading}
                    className="w-full mt-6 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 disabled:bg-gray-300"
                  >
                    {loading ? 'Loading...' : 'Continue to Shipping'}
                  </button>
                </div>
              )}

              
              {currentStep === 2 && (
                <div>
                  <h2 className="text-xl font-bold mb-6">Select Shipping Method</h2>
                  
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading shipping options...</p>
                    </div>
                  ) : shippingRates.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 font-semibold">Delivery not available to this pincode</p>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="mt-4 text-red-500 hover:text-red-600"
                      >
                        ← Change Address
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="space-y-4">
                        {shippingRates.map((courier: any, index: number) => (
                          <div
                            key={index}
                            onClick={() => handleShippingSelect(courier)}
                            className={`p-4 border rounded-lg cursor-pointer hover:border-red-500 ${
                              selectedShipping?.courier_company_id === courier.courier_company_id ? 'border-red-500 bg-red-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-lg">{courier.courier_name}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Estimated Delivery: {courier.estimated_delivery_days} days
                                  {courier.cod_charges > 0 && (
                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">COD Available</span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-2xl font-bold text-red-500">₹{courier.rate}</p>
                                {courier.cod_charges > 0 && (
                                  <p className="text-xs text-gray-500">+ ₹{courier.cod_charges} COD charges</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-4 mt-6">
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={handleShippingSubmit}
                          disabled={!selectedShipping}
                          className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 disabled:bg-gray-300"
                        >
                          Continue to Payment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {currentStep === 3 && (
                <div>
                  <h2 className="text-xl font-bold mb-6">Payment</h2>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold mb-3">Order Review</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-600">Shipping To:</p>
                        <p className="font-medium">{shippingAddress.name}</p>
                        <p className="text-gray-600">{shippingAddress.address}, {shippingAddress.city}</p>
                        <p className="text-gray-600">{shippingAddress.state} - {shippingAddress.pincode}</p>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <p className="text-gray-600">Shipping Method:</p>
                        <p className="font-medium">{selectedShipping?.courier_name}</p>
                        <p className="text-gray-600">Delivery in {selectedShipping?.estimated_delivery_days} days</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🔒</span>
                      <div>
                        <p className="font-semibold text-blue-900">Secure Payment</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Your payment information is encrypted and secure. Powered by Razorpay.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
                    >
                      ← Back
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart?.items.map((item: any) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold">₹{item.item_total}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{orderSummary.subtotal.toFixed(2)}</span>
                </div>
                {selectedShipping && (
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>₹{orderSummary.shipping.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-red-500">₹{orderSummary.total.toFixed(2)}</span>
                </div>
              </div>
              
              {currentStep === 3 && (
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || !razorpayLoaded}
                  className="w-full mt-6 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 disabled:bg-gray-300 font-semibold"
                >
                  {loading ? 'Processing...' : !razorpayLoaded ? 'Loading Payment...' : 'Place Order'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
