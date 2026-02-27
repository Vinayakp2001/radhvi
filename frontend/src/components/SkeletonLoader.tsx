'use client';

interface SkeletonLoaderProps {
  type: 'product' | 'occasion' | 'testimonial';
  count?: number;
}

export default function SkeletonLoader({ type, count = 1 }: SkeletonLoaderProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (type === 'product') {
    return (
      <>
        {skeletons.map((i) => (
          <div key={i} className="card overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200" />
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="w-4 h-4 bg-gray-200 rounded" />
                  ))}
                </div>
                <div className="h-3 bg-gray-200 rounded w-12" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="h-6 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }

  if (type === 'occasion') {
    return (
      <>
        {skeletons.map((i) => (
          <div key={i} className="card overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200" />
            <div className="p-6 text-center">
              <div className="h-5 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (type === 'testimonial') {
    return (
      <>
        {skeletons.map((i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="w-5 h-5 bg-gray-200 rounded" />
              ))}
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
          </div>
        ))}
      </>
    );
  }

  return null;
}
