'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
  currentCategory?: string;
}

export default function ProductFilters({ categories, currentCategory }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);

  const handleCategoryChange = (categorySlug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (categorySlug) {
      params.set('category', categorySlug);
    } else {
      params.delete('category');
    }
    
    startTransition(() => {
      router.push(`/collections/all?${params.toString()}`);
    });
  };

  const handlePriceRangeChange = (range: string) => {
    const newRanges = selectedPriceRanges.includes(range)
      ? selectedPriceRanges.filter(r => r !== range)
      : [...selectedPriceRanges, range];
    
    setSelectedPriceRanges(newRanges);
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (newRanges.length > 0) {
      params.set('price_range', newRanges.join(','));
    } else {
      params.delete('price_range');
    }
    
    startTransition(() => {
      router.push(`/collections/all?${params.toString()}`);
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
      <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
      
      {isPending && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
      
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Categories</h4>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input
              type="radio"
              name="category"
              value=""
              checked={!currentCategory}
              onChange={() => handleCategoryChange('')}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm">All Categories</span>
          </label>
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="radio"
                name="category"
                value={cat.slug}
                checked={currentCategory === cat.slug}
                onChange={() => handleCategoryChange(cat.slug)}
                className="mr-2 cursor-pointer"
              />
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Price Range</h4>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input
              type="checkbox"
              checked={selectedPriceRanges.includes('0-500')}
              onChange={() => handlePriceRangeChange('0-500')}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm">Under ₹500</span>
          </label>
          <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input
              type="checkbox"
              checked={selectedPriceRanges.includes('500-1000')}
              onChange={() => handlePriceRangeChange('500-1000')}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm">₹500 - ₹1000</span>
          </label>
          <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input
              type="checkbox"
              checked={selectedPriceRanges.includes('1000-2000')}
              onChange={() => handlePriceRangeChange('1000-2000')}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm">₹1000 - ₹2000</span>
          </label>
          <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
            <input
              type="checkbox"
              checked={selectedPriceRanges.includes('2000-999999')}
              onChange={() => handlePriceRangeChange('2000-999999')}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm">Above ₹2000</span>
          </label>
        </div>
      </div>
    </div>
  );
}
