interface DeliveryInfoProps {
  className?: string;
}

export default function DeliveryInfo({ className = '' }: DeliveryInfoProps) {
  const deliveryInfo = [
    {
      icon: '🚚',
      title: 'Same Day Delivery',
      description: 'Order before 2 PM for same day delivery in Delhi, Mumbai, Bangalore'
    },
    {
      icon: '💳',
      title: 'Payment Options',
      description: 'Cash on Delivery, UPI, Cards, Net Banking - All payment methods accepted'
    },
    {
      icon: '🔄',
      title: 'Easy Returns',
      description: '7-day return policy. Not satisfied? We\'ll make it right, guaranteed'
    },
    {
      icon: '📞',
      title: '24/7 Support',
      description: 'Need help? Our customer care team is available round the clock'
    }
  ];

  return (
    <section className={`${className}`}>
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Delivery & Service Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deliveryInfo.map((info, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{info.icon}</span>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">{info.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{info.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
