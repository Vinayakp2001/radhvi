import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns & Exchanges | Radhvi',
  description: 'Learn about Radhvi\'s return and exchange policy.',
};

const STEPS = [
  { step: '01', title: 'Initiate Request', desc: 'Go to My Orders, select the order, and click "Request Return". Choose your reason and upload photos if the item is damaged.' },
  { step: '02', title: 'Review & Approval', desc: 'Our team reviews your request within 24–48 hours and sends you a confirmation email with next steps.' },
  { step: '03', title: 'Pickup Scheduled', desc: 'A courier will be scheduled to pick up the item from your address within 2–3 business days.' },
  { step: '04', title: 'Refund Processed', desc: 'Once we receive and inspect the item, your refund is processed within 5–7 business days.' },
];

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-red-50 to-pink-50 py-14">
          <div className="container-custom text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Returns & Exchanges</h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Not happy with your order? We make returns simple and hassle-free.
            </p>
          </div>
        </section>

        <section className="py-14 bg-white">
          <div className="container-custom max-w-4xl mx-auto space-y-12">

            {/* Business Info Block */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="font-semibold text-gray-900 text-sm mb-1">Radhvi Gift Shop</p>
              <p className="text-sm text-gray-600">13, Chandra Chaya Colony, Opposite Silver Oak, Alwar, Rajasthan 301001, India</p>
              <p className="text-sm text-gray-600 mt-1">Email: radhvi.in@gmail.com &nbsp;|&nbsp; Phone: +91 97993 88840</p>
              <p className="text-sm text-gray-600">Website: https://www.radhvi.in</p>
            </div>

            {/* Return Window */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
              <div className="text-4xl">📅</div>
              <div>
                <h2 className="font-semibold text-green-900 text-lg">7-Day Return Window</h2>
                <p className="text-green-800 text-sm mt-0.5">
                  You can return eligible items within 7 days of delivery. Items must be unused, in original packaging.
                </p>
              </div>
            </div>

            {/* Steps */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">How to Return</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {STEPS.map(({ step, title, desc }) => (
                  <div key={step} className="border border-gray-200 rounded-xl p-5">
                    <div className="text-2xl font-bold text-red-500 mb-2">{step}</div>
                    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Eligible / Not Eligible */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-green-200 rounded-xl p-6">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <span>✅</span> Eligible for Return
                </h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  {['Damaged or defective items', 'Wrong item delivered', 'Item not as described', 'Missing parts or accessories', 'Sealed products (unopened)'].map(i => (
                    <li key={i} className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span>{i}</li>
                  ))}
                </ul>
              </div>
              <div className="border border-red-200 rounded-xl p-6">
                <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <span>❌</span> Not Eligible for Return
                </h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  {['Personalised / customised items', 'Perishable goods (flowers, food)', 'Items marked as Final Sale', 'Used or opened products', 'Items returned after 7 days'].map(i => (
                    <li key={i} className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span>{i}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Refund Timeline */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Refund Timeline</h2>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-gray-700">Payment Method</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-700">Refund To</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-700">Timeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { method: 'Online Payment (UPI/Card)', to: 'Original payment method', time: '5–7 business days' },
                      { method: 'Cash on Delivery', to: 'Bank transfer / Store credit', time: '7–10 business days' },
                    ].map(row => (
                      <tr key={row.method}>
                        <td className="px-5 py-3 text-gray-700">{row.method}</td>
                        <td className="px-5 py-3 text-gray-700">{row.to}</td>
                        <td className="px-5 py-3 text-gray-700">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-4">Need help with a return? Our team is here for you.</p>
              <Link href="/contact" className="inline-block bg-red-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
