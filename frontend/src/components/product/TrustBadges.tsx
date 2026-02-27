interface TrustBadgesProps {
  className?: string;
}

export default function TrustBadges({ className = '' }: TrustBadgesProps) {
  const badges = [
    { icon: '🚚', text: 'Free Shipping', subtext: 'On orders above ₹499' },
    { icon: '🔒', text: 'Secure Checkout', subtext: '100% Safe & Secure' },
    { icon: '🇮🇳', text: 'Made in India', subtext: 'Fresh & Premium Quality' },
    { icon: '⚡', text: 'Same Day Delivery', subtext: 'In select cities' }
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
      {badges.map((badge, index) => (
        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <span className="text-lg">{badge.icon}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">{badge.text}</p>
            <p className="text-xs text-gray-600">{badge.subtext}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
