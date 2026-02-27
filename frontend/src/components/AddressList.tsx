'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Address {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

interface AddressListProps {
  addresses: Address[];
  onEdit: (address: Address) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
}

export default function AddressList({ addresses, onEdit, onDelete, onSetDefault }: AddressListProps) {
  const [loading, setLoading] = useState<number | null>(null);

  const handleSetDefault = async (id: number) => {
    setLoading(id);
    try {
      await api.post(`/api/addresses/${id}/set-default/`);
      onSetDefault(id);
    } catch (error) {
      console.error('Failed to set default address:', error);
      alert('Failed to set default address');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    setLoading(id);
    try {
      await api.delete(`/api/addresses/${id}/`);
      onDelete(id);
    } catch (error) {
      console.error('Failed to delete address:', error);
      alert('Failed to delete address');
    } finally {
      setLoading(null);
    }
  };

  if (addresses.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-6xl mb-4">📍</div>
        <p className="text-gray-600">No saved addresses yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {addresses.map((address) => (
        <div
          key={address.id}
          className="border rounded-lg p-4 hover:shadow-md transition relative"
        >
          {address.is_default && (
            <span className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
              Default
            </span>
          )}
          
          <div className="mb-3">
            <p className="font-semibold text-lg">{address.name}</p>
            <p className="text-sm text-gray-600">{address.phone}</p>
          </div>
          
          <div className="text-sm text-gray-700 mb-4">
            <p>{address.address}</p>
            <p>{address.city}, {address.state} - {address.pincode}</p>
            <p>{address.country}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(address)}
              disabled={loading === address.id}
              className="flex-1 text-sm border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Edit
            </button>
            
            {!address.is_default && (
              <button
                onClick={() => handleSetDefault(address.id)}
                disabled={loading === address.id}
                className="flex-1 text-sm border border-green-500 text-green-600 py-2 rounded hover:bg-green-50 disabled:opacity-50"
              >
                {loading === address.id ? 'Setting...' : 'Set Default'}
              </button>
            )}
            
            <button
              onClick={() => handleDelete(address.id)}
              disabled={loading === address.id}
              className="text-sm border border-red-500 text-red-600 px-4 py-2 rounded hover:bg-red-50 disabled:opacity-50"
            >
              {loading === address.id ? '...' : '🗑️'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
