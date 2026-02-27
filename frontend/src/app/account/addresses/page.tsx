'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import AddressList from '@/components/AddressList';
import AddressForm from '@/components/AddressForm';

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account/addresses');
      return;
    }
    loadAddresses();
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      const response = await api.get('/api/addresses/');
      setAddresses(response.data);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address: any) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  const handleSetDefault = (id: number) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      is_default: addr.id === id
    })));
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAddress(null);
    loadAddresses();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAddress(null);
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
        {/* Header */}
        <div className="mb-6">
          <Link href="/account" className="text-red-500 hover:text-red-600 mb-4 inline-block">
            ← Back to Account
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Manage Addresses</h1>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 font-semibold"
              >
                + Add New Address
              </button>
            )}
          </div>
        </div>

        {/* Form or List */}
        {showForm ? (
          <AddressForm
            address={editingAddress}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        ) : (
          <AddressList
            addresses={addresses}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
          />
        )}
      </div>
    </div>
  );
}
