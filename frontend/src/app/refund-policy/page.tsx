import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy | Radhvi',
  description: 'Read Radhvi\'s Refund Policy — eligibility, process, and timelines.',
};

const SECTIONS = [
  {
    title: '1. Refund Eligibility',
    content: `You are eligible for a refund if:

• The item received is damaged or defective
• The wrong item was delivered
• The item does not match the product description
• The item is missing parts or accessories
• You cancel the order before it is dispatched

Refund requests must be raised within 7 days of delivery.`,
  },
  {
    title: '2. Non-Refundable Items',
    content: `The following items are not eligible for refunds:

• Personalised or customised products (engraved, printed, or made-to-order)
• Perishable goods including flowers, food items, and chocolates
• Items marked as "Final Sale" or "Non-Returnable" on the product page
• Products that have been used, opened, or damaged by the customer
• Digital products or gift cards`,
  },
  {
    title: '3. How to Request a Refund',
    content: `To initiate a refund:

1. Go to My Orders and select the relevant order
2. Click "Request Return / Refund"
3. Select your reason and upload photos if the item is damaged
4. Submit the request

Our team will review your request within 24–48 hours and send you a confirmation email with next steps.`,
  },
  {
    title: '4. Refund Processing Time',
    content: `Once your return is approved and the item is picked up and inspected:

• Online Payments (UPI, Card, Net Banking): Refund to original payment method within 5–7 business days
• Cash on Delivery: Refund via bank transfer or store credit within 7–10 business days

You will receive an email confirmation once the refund is processed. Bank processing times may vary.`,
  },
  {
    title: '5. Partial Refunds',
    content: `In some cases, a partial refund may be issued:

• If only part of an order is returned
• If the item shows signs of use but is still eligible for return
• If the original packaging is missing

The refund amount will be communicated to you before processing.`,
  },
  {
    title: '6. Order Cancellations',
    content: `You can cancel your order within 2 hours of placing it, provided it has not been dispatched.

• For prepaid orders: Full refund to original payment method within 5–7 business days
• For COD orders: No charge is applied; the order is simply cancelled

Once an order is dispatched, it cannot be cancelled. You may initiate a return after delivery.`,
  },
  {
    title: '7. Contact Us',
    content: `For refund-related queries, contact our support team:

Email: support@radhvi.in
Phone: +91 97993 88840
Hours: Mon–Sat, 10 AM – 7 PM`,
  },
];

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-red-50 to-pink-50 py-14">
          <div className="container-custom text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Refund Policy</h1>
            <p className="text-sm text-gray-500">Last updated: March 2026</p>
          </div>
        </section>

        <section className="py-14 bg-white">
          <div className="container-custom max-w-3xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-10 flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-900 text-sm">7-Day Return Window</p>
                <p className="text-green-800 text-sm mt-0.5">
                  We accept returns and refund requests within 7 days of delivery for eligible items.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {SECTIONS.map(({ title, content }) => (
                <div key={title}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
                  <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{content}</div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 text-sm mb-4">Need help with a refund or return?</p>
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
