interface BenefitBulletsProps {
  product: any;
  className?: string;
}

export default function BenefitBullets({ product, className = '' }: BenefitBulletsProps) {
  // Generate benefits based on product name
  const generateBenefits = () => {
    const name = product.name?.toLowerCase() || '';
    
    if (name.includes('flower') || name.includes('bouquet') || name.includes('rose')) {
      return [
        { icon: '💝', text: 'Express your deepest emotions with fresh, handpicked flowers' },
        { icon: '🌹', text: 'Premium quality roses that stay fresh for days' },
        { icon: '🎀', text: 'Beautifully wrapped with elegant ribbon and personal touch' },
        { icon: '💌', text: 'Includes a heartfelt message card to convey your feelings' },
        { icon: '⏰', text: 'Perfect timing - arrives exactly when you need it most' }
      ];
    }
    
    if (name.includes('gift')) {
      return [
        { icon: '🎁', text: 'Thoughtfully curated to create unforgettable moments' },
        { icon: '💖', text: 'Shows how much you care with premium quality items' },
        { icon: '✨', text: 'Beautifully presented to make the unboxing special' },
        { icon: '🤗', text: 'Guaranteed to bring a smile and warm their heart' },
        { icon: '🌟', text: 'Creates lasting memories they\'ll treasure forever' }
      ];
    }
    
    // Default benefits
    return [
      { icon: '💝', text: 'Carefully selected to express your love and care' },
      { icon: '🌟', text: 'Premium quality that exceeds expectations' },
      { icon: '🎀', text: 'Beautifully presented with attention to detail' },
      { icon: '💌', text: 'Perfect way to show someone they\'re special' },
      { icon: '😊', text: 'Guaranteed to create joy and happiness' }
    ];
  };

  const benefits = generateBenefits();

  return (
    <section className={`${className}`}>
      <h3 className="text-xl font-bold text-gray-900 mb-4">Why They'll Love It</h3>
      <div className="space-y-3">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5">{benefit.icon}</span>
            <p className="text-gray-700 leading-relaxed">{benefit.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
