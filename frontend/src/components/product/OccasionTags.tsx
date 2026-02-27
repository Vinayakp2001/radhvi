interface OccasionTagsProps {
  product: any;
  className?: string;
}

export default function OccasionTags({ product, className = '' }: OccasionTagsProps) {
  // Generate occasions based on product name
  const generateOccasions = () => {
    const name = product.name?.toLowerCase() || '';
    
    if (name.includes('flower') || name.includes('bouquet') || name.includes('rose')) {
      return [
        { text: 'Apology', color: 'bg-pink-100 text-pink-800' },
        { text: 'Anniversary', color: 'bg-red-100 text-red-800' },
        { text: 'Birthday', color: 'bg-yellow-100 text-yellow-800' },
        { text: 'Romantic Surprise', color: 'bg-purple-100 text-purple-800' },
        { text: 'Valentine\'s Day', color: 'bg-rose-100 text-rose-800' },
        { text: 'Proposal', color: 'bg-indigo-100 text-indigo-800' }
      ];
    }
    
    if (name.includes('sorry') || name.includes('apology')) {
      return [
        { text: 'Apology', color: 'bg-pink-100 text-pink-800' },
        { text: 'Making Up', color: 'bg-purple-100 text-purple-800' },
        { text: 'Forgiveness', color: 'bg-blue-100 text-blue-800' },
        { text: 'Relationship Repair', color: 'bg-green-100 text-green-800' }
      ];
    }
    
    if (name.includes('gift')) {
      return [
        { text: 'Birthday', color: 'bg-yellow-100 text-yellow-800' },
        { text: 'Anniversary', color: 'bg-red-100 text-red-800' },
        { text: 'Celebration', color: 'bg-green-100 text-green-800' },
        { text: 'Thank You', color: 'bg-blue-100 text-blue-800' },
        { text: 'Special Occasions', color: 'bg-purple-100 text-purple-800' }
      ];
    }
    
    // Default occasions
    return [
      { text: 'Birthday', color: 'bg-yellow-100 text-yellow-800' },
      { text: 'Anniversary', color: 'bg-red-100 text-red-800' },
      { text: 'Special Moments', color: 'bg-purple-100 text-purple-800' },
      { text: 'Celebration', color: 'bg-green-100 text-green-800' }
    ];
  };

  const occasions = generateOccasions();

  return (
    <section className={`${className}`}>
      <h3 className="text-xl font-bold text-gray-900 mb-4">Perfect For</h3>
      <div className="flex flex-wrap gap-2">
        {occasions.map((occasion, index) => (
          <span
            key={index}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${occasion.color}`}
          >
            {occasion.text}
          </span>
        ))}
      </div>
    </section>
  );
}
