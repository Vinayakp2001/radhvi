'use client';

import { useState } from 'react';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

type FAQItem = { question: string; answer: string };
type FAQCategory = { category: string; icon: string; items: FAQItem[] };

const FAQ_DATA: FAQCategory[] = [
  {
    category: 'Orders',
    icon: '📦',
    items: [
      {
        question: 'How do I place an order?',
        answer: 'Browse our collection, add items to your cart, and proceed to checkout. You can pay via Cash on Delivery or online payment. You\'ll receive an order confirmation email once your order is placed.',
      },
      {
        question: 'Can I modify or cancel my order?',
        answer: 'You can cancel or modify your order within 2 hours of placing it, as long as it hasn\'t been dispatched. Go to My Orders and click "Cancel Order", or contact our support team.',
      },
      {
        question: 'How do I track my order?',
        answer: 'Once your order is shipped, you\'ll receive a tracking number via email. You can also visit the Track Order page or go to My Orders to see live shipment status.',
      },
      {
        question: 'Do you offer gift wrapping?',
        answer: 'Yes! Many of our products come with premium gift packaging. Look for the "Gift Wrap" option on the product page. You can also add a personalised message card.',
      },
    ],
  },
  {
    category: 'Shipping & Delivery',
    icon: '🚚',
    items: [
      {
        question: 'What are the delivery charges?',
        answer: 'We offer free shipping on orders above ₹999. For orders below ₹999, a flat shipping charge of ₹50 applies. Express delivery options may have additional charges.',
      },
      {
        question: 'How long does delivery take?',
        answer: 'Standard delivery takes 3–7 business days depending on your location. Metro cities typically receive orders in 2–4 days. Express delivery (1–2 days) is available in select cities.',
      },
      {
        question: 'Do you deliver across India?',
        answer: 'Yes, we deliver to all major cities and towns across India via our courier partners including Shiprocket, Delhivery, and Blue Dart.',
      },
      {
        question: 'Can I schedule a delivery date?',
        answer: 'Scheduled delivery is available for select products and cities. You can choose a preferred delivery date during checkout if the option is available for your pincode.',
      },
    ],
  },
  {
    category: 'Returns & Refunds',
    icon: '↩️',
    items: [
      {
        question: 'What is your return policy?',
        answer: 'We accept returns within 7 days of delivery for damaged, defective, or incorrect items. Perishable items like flowers and food products are not eligible for return.',
      },
      {
        question: 'How do I initiate a return?',
        answer: 'Go to My Orders, select the order, and click "Request Return". Fill in the reason and upload photos if the item is damaged. Our team will review and respond within 24–48 hours.',
      },
      {
        question: 'When will I receive my refund?',
        answer: 'Once your return is approved and the item is picked up, refunds are processed within 5–7 business days to your original payment method. COD refunds are issued as store credit or bank transfer.',
      },
      {
        question: 'What items cannot be returned?',
        answer: 'Personalised/customised items, perishable goods (flowers, food), and items marked as "Final Sale" are not eligible for return unless they arrive damaged or defective.',
      },
    ],
  },
  {
    category: 'Payments',
    icon: '💳',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept Cash on Delivery (COD) and online payments via PhonePe (UPI, cards, net banking, wallets). More payment options are being added soon.',
      },
      {
        question: 'Is it safe to pay online on Radhvi?',
        answer: 'Absolutely. All online payments are processed through PhonePe\'s secure payment gateway with 256-bit SSL encryption. We never store your card details.',
      },
      {
        question: 'My payment failed but money was deducted. What do I do?',
        answer: 'If your payment was deducted but the order wasn\'t placed, the amount will be automatically refunded to your account within 5–7 business days. Contact us at support@radhvi.in if it takes longer.',
      },
      {
        question: 'Do you offer EMI options?',
        answer: 'EMI options are available on select credit cards through our payment gateway. You\'ll see the EMI option at checkout if your card is eligible.',
      },
    ],
  },
];

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900 pr-4">{item.question}</span>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-4 bg-white">
          <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const toggle = (key: string) => setOpenKey(prev => prev === key ? null : key);

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-red-50 to-pink-50 py-14">
          <div className="container-custom text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Find quick answers to the most common questions about orders, shipping, returns, and payments.
            </p>
          </div>
        </section>

        {/* FAQ Sections */}
        <section className="py-14 bg-white">
          <div className="container-custom max-w-3xl mx-auto">
            <div className="space-y-10">
              {FAQ_DATA.map(({ category, icon, items }) => (
                <div key={category}>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                    <span>{icon}</span> {category}
                  </h2>
                  <div className="space-y-2">
                    {items.map((item, i) => {
                      const key = `${category}-${i}`;
                      return (
                        <AccordionItem
                          key={key}
                          item={item}
                          isOpen={openKey === key}
                          onToggle={() => toggle(key)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Still need help */}
            <div className="mt-14 bg-red-50 border border-red-100 rounded-xl p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Still have questions?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Our support team is happy to help. Reach out and we'll get back to you within 24 hours.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-red-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
