'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface SortOption {
  value: string;
  label: string;
}

interface ProductSortProps {
  currentSort: string;
  options: SortOption[];
}

export default function ProductSort({ currentSort, options }: ProductSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSortChange = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (sortValue && sortValue !== 'name') {
      params.set('sort', sortValue);
    } else {
      params.delete('sort');
    }
    
    startTransition(() => {
      router.push(`/collections/all?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm font-medium text-gray-700">
        Sort by:
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        disabled={isPending}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isPending && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
      )}
    </div>
  );
}
