import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Radhvi',
  description: 'Read Radhvi\'s Privacy Policy to understand how we collect, use, and protect your data.',
};

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: `When you use Radhvi, we collect the following types of information:

• Personal Information: Name, email address, phone number, and delivery address when you create an account or place an order.
• Payment Information: We do not store your card details. Payments are processed securely by PhonePe.
• Usage Data: Pages visited, products viewed, search queries, and device/browser information.
• Cookies: We use cookies to maintain your session, remember your cart, and improve your experience.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use your information to:

• Process and fulfil your orders
• Send order confirmations, shipping updates, and delivery notifications
• Respond to your customer service inquiries
• Personalise your shopping experience and product recommendations
• Send promotional emails (you can unsubscribe at any time)
• Improve our website, products, and services
• Comply with legal obligations`,
  },
  {
    title: '3. Cookies',
    content: `We use cookies and similar tracking technologies to:

• Keep you logged in during your session
• Remember items in your cart
• Analyse website traffic and usage patterns
• Deliver relevant advertisements

You can control cookies through your browser settings. Disabling cookies may affect some features of the website.`,
  },
  {
    title: '4. Sharing Your Information',
    content: `We do not sell your personal information. We may share it with:

• Courier Partners (Shiprocket, Delhivery, etc.) to fulfil your orders
• Payment Processors (PhonePe) to process transactions
• Analytics Providers to understand website usage
• Legal Authorities when required by law

All third parties are bound by confidentiality agreements and may only use your data for the specified purpose.`,
  },
  {
    title: '5. Data Security',
    content: `We implement industry-standard security measures including SSL encryption, secure servers, and access controls to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: '6. Your Rights',
    content: `You have the right to:

• Access the personal information we hold about you
• Request correction of inaccurate data
• Request deletion of your account and associated data
• Opt out of marketing communications
• Lodge a complaint with a data protection authority

To exercise these rights, contact us at privacy@radhvi.in.`,
  },
  {
    title: '7. Data Retention',
    content: `We retain your personal information for as long as your account is active or as needed to provide services. Order data is retained for 7 years for legal and accounting purposes. You may request deletion of your account at any time.`,
  },
  {
    title: '8. Children\'s Privacy',
    content: `Radhvi is not intended for children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.`,
  },
  {
    title: '9. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on our website. Your continued use of Radhvi after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: '10. Contact Us',
    content: `For privacy-related questions or requests, contact us at:

Email: privacy@radhvi.in
Address: 13, Chandra Chaya Colony, Alwar, Rajasthan 301001`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-red-50 to-pink-50 py-14">
          <div className="container-custom text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
            <p className="text-sm text-gray-500">Last updated: March 2026</p>
          </div>
        </section>

        <section className="py-14 bg-white">
          <div className="container-custom max-w-3xl mx-auto">
            <p className="text-gray-600 mb-10">
              At Radhvi, we take your privacy seriously. This policy explains what information we collect,
              how we use it, and your rights regarding your personal data.
            </p>
            <div className="space-y-8">
              {SECTIONS.map(({ title, content }) => (
                <div key={title}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
                  <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{content}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
