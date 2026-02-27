'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Address {
  id?: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default?: boolean;
}

interface AddressFormProps {
  address?: Address | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const [formData, setFormData] = useState<Address>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });
  
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      setFormData(address);
    }
  }, [address]);

  const validate = () => {
    const newErrors: any = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Invalid phone number (10 digits)';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Invalid pincode (6 digits)';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      if (address?.id) {
        // Update existing address
        await api.put(`/api/addresses/${address.id}/`, formData);
      } else {
        // Create new address
        await api.post('/api/addresses/', formData);
      }
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save address:', error);
      alert(error.response?.data?.error || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">
        {address?.id ? 'Edit Address' : 'Add New Address'}
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className={`w-full px-4 py-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter your full name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className={`w-full px-4 py-2 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Address *</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className={`w-full px-4 py-2 border rounded-lg ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
            rows={3}
            placeholder="House No., Building Name, Street, Area"
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">City *</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              className={`w-full px-4 py-2 border rounded-lg ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="City"
            />
            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">State *</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({...formData, state: e.target.value})}
              className={`w-full px-4 py-2 border rounded-lg ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="State"
            />
            {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Pincode *</label>
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => setFormData({...formData, pincode: e.target.value})}
              className={`w-full px-4 py-2 border rounded-lg ${errors.pincode ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="6-digit pincode"
              maxLength={6}
            />
            {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData({...formData, country: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            readOnly
          />
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 disabled:bg-gray-300 font-semibold"
        >
          {loading ? 'Saving...' : address?.id ? 'Update Address' : 'Add Address'}
        </button>
      </div>
    </form>
  );
}
