import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Delivery | Radhvi',
  description: 'Learn about Radhvi\'s shipping policies, delivery timelines, and charges.',
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-red-50 to-pink-50 py-14">
          <div className="container-custom text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Shipping & Delivery</h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Fast, reliable delivery across India. Here's everything you need to know.
            </p>
          </div>
        </section>

        <section className="py-14 bg-white">
          <div className="container-custom max-w-4xl mx-auto space-y-12">

            {/* Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: '🆓', title: 'Free Shipping', desc: 'On all orders above ₹999' },
                { icon: '📦', title: 'Standard Delivery', desc: '3–7 business days' },
                { icon: '⚡', title: 'Express Delivery', desc: '1–2 days in select cities' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-red-50 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-3">{icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>

            {/* Charges */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Charges</h2>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-gray-700">Order Value</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-700">Shipping Charge</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-700">Delivery Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-5 py-3 text-gray-700">Below ₹999</td>
                      <td className="px-5 py-3 text-gray-700">₹50 flat</td>
                      <td className="px-5 py-3 text-gray-700">3–7 business days</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-gray-700">₹999 and above</td>
                      <td className="px-5 py-3 text-green-600 font-medium">FREE</td>
                      <td className="px-5 py-3 text-gray-700">3–7 business days</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-gray-700">Express (select cities)</td>
                      <td className="px-5 py-3 text-gray-700">₹99–₹149</td>
                      <td className="px-5 py-3 text-gray-700">1–2 business days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Regional Estimates */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Estimates by Region</h2>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-gray-700">Region</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-700">Cities</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-700">Estimated Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { region: 'Metro Cities', cities: 'Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata', days: '2–4 days' },
                      { region: 'Tier 2 Cities', cities: 'Jaipur, Lucknow, Pune, Ahmedabad, Surat, Indore', days: '3–5 days' },
                      { region: 'Tier 3 & Rest of India', cities: 'All other pincodes', days: '5–7 days' },
                      { region: 'Remote Areas', cities: 'J&K, Northeast, Andaman & Nicobar', days: '7–10 days' },
                    ].map(row => (
                      <tr key={row.region}>
                        <td className="px-5 py-3 font-medium text-gray-900">{row.region}</td>
                        <td className="px-5 py-3 text-gray-600">{row.cities}</td>
                        <td className="px-5 py-3 text-gray-700">{row.days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Courier Partners */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Courier Partners</h2>
              <div className="flex flex-wrap gap-3">
                {['Shiprocket', 'Delhivery', 'Blue Dart', 'DTDC', 'Ekart', 'XpressBees'].map(courier => (
                  <span key={courier} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                    {courier}
                  </span>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h3 className="font-semibold text-amber-900 mb-2">Important Notes</h3>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li>Delivery times are estimates and may vary during peak seasons or public holidays.</li>
                <li>Orders placed before 2 PM are typically dispatched the same day.</li>
                <li>You'll receive a tracking link via email/SMS once your order is shipped.</li>
                <li>For time-sensitive gifts, we recommend placing orders at least 3 days in advance.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
