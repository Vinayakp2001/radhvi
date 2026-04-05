'use client';

import { useState } from 'react';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type FormData = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const SUBJECTS = [
  'Order Inquiry',
  'Shipping & Delivery',
  'Returns & Refunds',
  'Product Question',
  'Bulk Orders',
  'Other',
];

export default function ContactPage() {
  const [form, setForm] = useState<FormData>({
    name: '', email: '', phone: '', subject: '', message: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email required';
    if (!form.subject) e.subject = 'Please select a subject';
    if (!form.message.trim() || form.message.length < 10) e.message = 'Message must be at least 10 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Simulate submission delay
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  const inp = (field: keyof FormData) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${errors[field] ? 'border-red-400' : 'border-gray-300'}`;

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-red-50 to-pink-50 py-14">
          <div className="container-custom text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Contact Us</h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Have a question or need help? We'd love to hear from you.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-14 bg-white">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

              {/* Contact Details */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Get in Touch</h2>

                {[
                  {
                    icon: '📧',
                    label: 'Email',
                    value: 'radhvi.in@gmail.com',
                    href: 'mailto:radhvi.in@gmail.com',
                  },
                  {
                    icon: '📞',
                    label: 'Phone',
                    value: '+91 97993 88840',
                    href: 'tel:+919799388840',
                  },
                  {
                    icon: '💬',
                    label: 'WhatsApp',
                    value: 'Chat with us',
                    href: 'https://wa.me/919799388840',
                  },
                  {
                    icon: '📍',
                    label: 'Address',
                    value: '13, Chandra Chaya Colony, Alwar, Rajasthan 301001',
                    href: null,
                  },
                ].map(({ icon, label, value, href }) => (
                  <div key={label} className="flex gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">
                      {icon}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                      {href ? (
                        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                          className="text-sm font-medium text-gray-900 hover:text-red-500 transition-colors">
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{value}</p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="border-t pt-6">
                  <p className="text-xs text-gray-500 mb-1">Business Hours</p>
                  <p className="text-sm text-gray-700">Mon – Sat: 10:00 AM – 7:00 PM</p>
                  <p className="text-sm text-gray-700">Sunday: 11:00 AM – 5:00 PM</p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-3">
                {submitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <div className="text-4xl mb-3">✅</div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Message Sent!</h3>
                    <p className="text-green-700 text-sm">
                      Thanks for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                      className="mt-4 text-sm text-green-700 underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                          className={inp('name')} placeholder="Your name" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                          className={inp('email')} placeholder="your@email.com" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                          className={inp('phone')} placeholder="+91 XXXXX XXXXX" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                        <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                          className={inp('subject')}>
                          <option value="">Select a subject</option>
                          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                      <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                        rows={5} className={`${inp('message')} resize-none`} placeholder="How can we help you?" />
                      {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors">
                      {loading ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
