'use client';

import { useState } from 'react';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type BulkForm = {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  quantity: string;
  product_interest: string;
  budget_range: string;
};

const BENEFITS = [
  { icon: '💰', title: 'Bulk Discounts', desc: 'Get up to 30% off on orders of 50+ pieces.' },
  { icon: '🎨', title: 'Custom Branding', desc: 'Add your logo, message, or custom packaging.' },
  { icon: '👤', title: 'Dedicated Manager', desc: 'A personal account manager for your order.' },
  { icon: '🚚', title: 'Priority Delivery', desc: 'Guaranteed on-time delivery for your event.' },
  { icon: '📦', title: 'Flexible Quantities', desc: 'Orders from 50 to 10,000+ pieces.' },
  { icon: '💳', title: 'Flexible Payment', desc: 'Invoice-based payment for corporates.' },
];

const BUDGET_OPTIONS = [
  'Under ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000 – ₹5,00,000',
  '₹5,00,000 – ₹10,00,000',
  'Above ₹10,00,000',
];

export default function BulkOrdersPage() {
  const [form, setForm] = useState<BulkForm>({
    company_name: '', contact_person: '', email: '', phone: '',
    quantity: '', product_interest: '', budget_range: '',
  });
  const [errors, setErrors] = useState<Partial<BulkForm>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Partial<BulkForm> = {};
    if (!form.company_name.trim()) e.company_name = 'Required';
    if (!form.contact_person.trim()) e.contact_person = 'Required';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email required';
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Valid 10-digit number required';
    if (!form.quantity.trim()) e.quantity = 'Required';
    if (!form.product_interest.trim()) e.product_interest = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  const inp = (field: keyof BulkForm) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${errors[field] ? 'border-red-400' : 'border-gray-300'}`;

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-red-50 to-pink-50 py-16">
          <div className="container-custom text-center max-w-3xl mx-auto">
            <span className="inline-block bg-red-100 text-red-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Corporate & Bulk Gifting
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Gift at Scale, Without Compromise
            </h1>
            <p className="text-lg text-gray-600">
              Whether it's employee appreciation, client gifting, or a corporate event — we handle
              bulk orders with the same care as individual ones.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-14 bg-white">
          <div className="container-custom">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Why Choose Radhvi for Bulk Orders?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {BENEFITS.map(({ icon, title, desc }) => (
                <div key={title} className="bg-gray-50 rounded-xl p-6">
                  <div className="text-2xl mb-3">{icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Inquiry Form */}
        <section className="py-14 bg-gray-50">
          <div className="container-custom max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get a Custom Quote</h2>
              <p className="text-gray-600 text-sm">Fill in your requirements and we'll get back to you within 24 hours.</p>
            </div>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Inquiry Received!</h3>
                <p className="text-green-700 text-sm">
                  Thank you for your interest. Our bulk orders team will contact you within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ company_name: '', contact_person: '', email: '', phone: '', quantity: '', product_interest: '', budget_range: '' }); }}
                  className="mt-4 text-sm text-green-700 underline"
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                      className={inp('company_name')} placeholder="Acme Corp" />
                    {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                    <input value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))}
                      className={inp('contact_person')} placeholder="Your name" />
                    {errors.contact_person && <p className="text-red-500 text-xs mt-1">{errors.contact_person}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className={inp('email')} placeholder="you@company.com" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      className={inp('phone')} placeholder="+91 XXXXX XXXXX" />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Required *</label>
                    <input value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                      className={inp('quantity')} placeholder="e.g. 200 pieces" />
                    {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                    <select value={form.budget_range} onChange={e => setForm(p => ({ ...p, budget_range: e.target.value }))}
                      className={inp('budget_range')}>
                      <option value="">Select budget</option>
                      {BUDGET_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Interest *</label>
                  <textarea value={form.product_interest} onChange={e => setForm(p => ({ ...p, product_interest: e.target.value }))}
                    rows={4} className={`${inp('product_interest')} resize-none`}
                    placeholder="Describe the type of gifts you're looking for (e.g. premium hampers, personalised mugs, dry fruit boxes...)" />
                  {errors.product_interest && <p className="text-red-500 text-xs mt-1">{errors.product_interest}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors">
                  {loading ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
