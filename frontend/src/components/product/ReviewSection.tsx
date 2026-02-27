interface ReviewSectionProps {
  product: any;
  className?: string;
}

export default function ReviewSection({ product, className = '' }: ReviewSectionProps) {
  const rating = product.rating || 4.5;
  const reviewCount = product.review_count || 127;
  
  // Generate sample reviews for demonstration
  const sampleReviews = [
    {
      name: 'Priya S.',
      rating: 5,
      comment: 'Absolutely beautiful! My partner was so surprised and happy. The quality exceeded my expectations.',
      date: '2 days ago'
    },
    {
      name: 'Rahul M.',
      rating: 5,
      comment: 'Perfect for our anniversary. Delivered on time and looked exactly like the picture. Highly recommend!',
      date: '1 week ago'
    },
    {
      name: 'Anjali K.',
      rating: 4,
      comment: 'Great quality and beautiful presentation. Made my apology so much more meaningful.',
      date: '2 weeks ago'
    }
  ];

  const renderStars = (rating: number, size: string = 'w-4 h-4') => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${size} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} fill-current`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <section className={`${className}`}>
      <div className="border-t pt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Customer Reviews</h3>
          <div className="flex items-center gap-2">
            {renderStars(rating)}
            <span className="text-sm text-gray-600">({reviewCount} reviews)</span>
          </div>
        </div>
        
        {/* Overall Rating */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{rating}</div>
              {renderStars(rating, 'w-5 h-5')}
              <div className="text-sm text-gray-600 mt-1">{reviewCount} reviews</div>
            </div>
            <div className="flex-1">
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const percentage = star === 5 ? 75 : star === 4 ? 20 : star === 3 ? 3 : star === 2 ? 1 : 1;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-3">{star}</span>
                      <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="text-gray-600 text-xs">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Sample Reviews */}
        <div className="space-y-4">
          {sampleReviews.map((review, index) => (
            <div key={index} className="border-b pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{review.name}</span>
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                </div>
                <span className="text-xs text-gray-500 ml-4">{review.date}</span>
              </div>
            </div>
          ))}
        </div>
        
        <button className="mt-4 text-red-600 hover:text-red-700 text-sm font-medium">
          View all reviews →
        </button>
      </div>
    </section>
  );
}
