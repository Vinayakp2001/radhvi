interface ProductDetailsProps {
  product: any;
  className?: string;
}

export default function ProductDetails({ product, className = '' }: ProductDetailsProps) {
  // Generate product details based on product name and description
  const generateDetails = () => {
    const name = product.name?.toLowerCase() || '';
    const description = product.description || '';
    
    if (name.includes('flower') || name.includes('bouquet') || name.includes('rose')) {
      return [
        'Fresh premium roses handpicked for quality',
        'Elegant wrapping paper in beautiful colors',
        'Satin ribbon bow for that perfect finishing touch',
        'Personalized message card included',
        'Protective packaging for safe delivery',
        'Care instructions to keep flowers fresh longer'
      ];
    }
    
    if (name.includes('gift')) {
      return [
        'Premium quality items carefully selected',
        'Beautiful gift box presentation',
        'Decorative ribbon and bow',
        'Personalized greeting card',
        'Protective packaging for safe transport',
        'Ready to gift - no additional wrapping needed'
      ];
    }
    
    // Extract details from description or provide defaults
    const details: string[] = [];
    if (description.length > 0) {
      // Try to extract meaningful details from description
      const sentences = description.split('.').filter((s: string) => s.trim().length > 10);
      details.push(...sentences.slice(0, 4).map((s: string) => s.trim()));
    }
    
    // Add default details if not enough from description
    while (details.length < 4) {
      const defaultDetails = [
        'Premium quality materials and craftsmanship',
        'Carefully packaged for safe delivery',
        'Perfect for gifting on special occasions',
        'Comes with our quality guarantee'
      ];
      details.push(defaultDetails[details.length] || 'High-quality product');
    }
    
    return details;
  };

  const details = generateDetails();

  return (
    <section className={`${className}`}>
      <h3 className="text-xl font-bold text-gray-900 mb-4">What You Get</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <ul className="space-y-2">
          {details.map((detail, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-red-500 mt-1.5">•</span>
              <span className="text-gray-700">{detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
