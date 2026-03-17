import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Radhvi',
  description: 'Read Radhvi\'s Terms & Conditions governing the use of our website and services.',
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using the Radhvi website (radhvi.in), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services. We reserve the right to update these terms at any time, and your continued use constitutes acceptance of any changes.`,
  },
  {
    title: '2. Use of the Website',
    content: `You agree to use Radhvi only for lawful purposes. You must not:

• Use the site in any way that violates applicable laws or regulations
• Attempt to gain unauthorised access to any part of the website
• Transmit any harmful, offensive, or disruptive content
• Use automated tools to scrape or extract data from the website
• Impersonate any person or entity`,
  },
  {
    title: '3. Account Registration',
    content: `To place orders, you may need to create an account. You are responsible for:

• Maintaining the confidentiality of your account credentials
• All activities that occur under your account
• Notifying us immediately of any unauthorised use

We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: '4. Orders & Payments',
    content: `When you place an order on Radhvi:

• You confirm that all information provided is accurate and complete
• Prices are in Indian Rupees (INR) and include applicable taxes
• We reserve the right to cancel orders due to pricing errors, stock unavailability, or suspected fraud
• Payment must be completed before order processing begins
• Order confirmation does not guarantee availability; we will notify you if an item is out of stock`,
  },
  {
    title: '5. Pricing & Availability',
    content: `All prices are subject to change without notice. We make every effort to display accurate pricing, but errors may occur. In the event of a pricing error, we will contact you before processing your order. Product availability is not guaranteed and may change at any time.`,
  },
  {
    title: '6. Intellectual Property',
    content: `All content on Radhvi — including text, images, logos, product descriptions, and design — is the property of Radhvi or its content suppliers and is protected by Indian and international copyright laws. You may not reproduce, distribute, or create derivative works without our express written permission.`,
  },
  {
    title: '7. Limitation of Liability',
    content: `To the maximum extent permitted by law, Radhvi shall not be liable for:

• Indirect, incidental, or consequential damages
• Loss of profits, data, or business opportunities
• Damages arising from third-party actions (couriers, payment processors)
• Delays or failures caused by circumstances beyond our control (force majeure)

Our total liability for any claim shall not exceed the amount paid for the specific order in question.`,
  },
  {
    title: '8. Governing Law',
    content: `These Terms & Conditions are governed by the laws of India. Any disputes arising from the use of Radhvi shall be subject to the exclusive jurisdiction of the courts in Alwar, Rajasthan.`,
  },
  {
    title: '9. Contact',
    content: `For questions about these terms, contact us at:

Email: legal@radhvi.in
Address: 13, Chandra Chaya Colony, Alwar, Rajasthan 301001`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-red-50 to-pink-50 py-14">
          <div className="container-custom text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Terms & Conditions</h1>
            <p className="text-sm text-gray-500">Last updated: March 2026</p>
          </div>
        </section>

        <section className="py-14 bg-white">
          <div className="container-custom max-w-3xl mx-auto">
            <p className="text-gray-600 mb-10">
              Please read these Terms & Conditions carefully before using Radhvi. By using our website,
              you agree to these terms.
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
