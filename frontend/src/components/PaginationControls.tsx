'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface SearchParams {
  search?: string;
  category?: string;
  sort?: string;
  price_range?: string;
  page?: string;
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  searchParams: SearchParams;
}

export default function PaginationControls({ 
  currentPage, 
  totalPages, 
  searchParams 
}: PaginationControlsProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Debug logging
  console.log('=== PAGINATION CONTROLS DEBUG ===');
  console.log('currentPage:', currentPage);
  console.log('totalPages:', totalPages);
  console.log('searchParams:', searchParams);

  const navigateToPage = (pageNum: number) => {
    const params = new URLSearchParams(urlSearchParams.toString());
    
    if (pageNum > 1) {
      params.set('page', pageNum.toString());
    } else {
      params.delete('page');
    }
    
    const newUrl = `/collections/all?${params.toString()}`;
    
    startTransition(() => {
      router.push(newUrl);
    });
  };

  return (
    <div className="mt-8 flex justify-center items-center gap-2 relative">
      {isPending && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
      
      {currentPage > 1 && (
        <button
          onClick={() => navigateToPage(currentPage - 1)}
          disabled={isPending}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
      )}
      
      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => navigateToPage(pageNum)}
            disabled={isPending}
            className={`px-4 py-2 border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              pageNum === currentPage
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {pageNum}
          </button>
        ))}
      </div>
      
      {currentPage < totalPages && (
        <button
          onClick={() => navigateToPage(currentPage + 1)}
          disabled={isPending}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      )}
    </div>
  );
}