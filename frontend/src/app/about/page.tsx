import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Radhvi',
  description: 'Learn about Radhvi — our mission, values, and the story behind India\'s thoughtful gift store.',
};

const VALUES = [
  { icon: '💝', title: 'Thoughtfulness', desc: 'Every product is handpicked with care to ensure it carries meaning and emotion.' },
  { icon: '⭐', title: 'Quality', desc: 'We partner only with trusted suppliers who meet our high standards for quality.' },
  { icon: '🚀', title: 'Reliability', desc: 'On-time delivery and responsive support — we take our commitments seriously.' },
  { icon: '🌱', title: 'Sustainability', desc: 'We\'re committed to eco-friendly packaging and responsible sourcing.' },
];

const STATS = [
  { value: '50,000+', label: 'Orders Delivered' },
  { value: '98%', label: 'Happy Customers' },
  { value: '200+', label: 'Cities Served' },
  { value: '500+', label: 'Curated Products' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-red-50 to-pink-50 py-20">
          <div className="container-custom text-center">
            <span className="inline-block bg-red-100 text-red-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Our Story
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Gifts That Speak From the Heart
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              At Radhvi, we believe every gift is a conversation — a way to say "I care" without words.
              We're on a mission to make gifting effortless, meaningful, and memorable.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Who We Are</h2>
                <p className="text-gray-600 mb-4">
                  Radhvi is an online gift store founded with a simple belief: the right gift can strengthen
                  relationships, celebrate milestones, and create lasting memories. Based in Alwar, Rajasthan,
                  we serve customers across India with a curated collection of premium gifts.
                </p>
                <p className="text-gray-600 mb-6">
                  From birthdays and anniversaries to festivals and corporate gifting, we have something
                  special for every occasion. Our team personally vets every product to ensure it meets
                  our standards for quality, presentation, and emotional value.
                </p>
                <Link href="/collections/all" className="inline-block bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors">
                  Shop Our Collection
                </Link>
              </div>
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                <span className="text-8xl">🎁</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-14 bg-red-500 text-white">
          <div className="container-custom">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <div className="text-3xl md:text-4xl font-bold mb-1">{value}</div>
                  <div className="text-red-100 text-sm">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Values</h2>
              <p className="text-gray-600 max-w-xl mx-auto">The principles that guide everything we do.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map(({ icon, title, desc }) => (
                <div key={title} className="bg-gray-50 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-3">{icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 bg-gray-50">
          <div className="container-custom text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to find the perfect gift?</h2>
            <p className="text-gray-600 mb-6">Browse our curated collection and make someone's day special.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/collections/all" className="bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors">
                Shop Now
              </Link>
              <Link href="/contact" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Get in Touch
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
