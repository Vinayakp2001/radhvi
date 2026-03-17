import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Story | Radhvi',
  description: 'The story behind Radhvi — how a passion for meaningful gifting became a brand.',
};

const MILESTONES = [
  { year: '2021', title: 'The Idea', desc: 'Frustrated by generic, impersonal gifts, our founder set out to build a store where every product carries genuine emotion and thoughtfulness.' },
  { year: '2022', title: 'First Orders', desc: 'Radhvi launched with a small but carefully curated collection. The response was overwhelming — customers loved the quality and personal touch.' },
  { year: '2023', title: 'Growing Fast', desc: 'We expanded to 100+ products, partnered with artisans across India, and started delivering to 100+ cities. Our team grew from 2 to 15 people.' },
  { year: '2024', title: 'Going Digital', desc: 'We launched our new website with a seamless shopping experience, same-day delivery in select cities, and a dedicated customer support team.' },
  { year: '2025', title: 'Today', desc: 'With 50,000+ happy customers and growing, Radhvi is now one of India\'s most trusted online gift stores — and we\'re just getting started.' },
];

export default function StoryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-red-50 to-pink-50 py-20">
          <div className="container-custom text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Story</h1>
            <p className="text-xl text-gray-600">
              Every great brand starts with a problem worth solving. Ours started with a gift that didn't feel right.
            </p>
          </div>
        </section>

        {/* Founder Quote */}
        <section className="py-14 bg-white">
          <div className="container-custom max-w-3xl mx-auto">
            <blockquote className="border-l-4 border-red-500 pl-6 py-2">
              <p className="text-xl text-gray-700 italic mb-4">
                "I wanted to send my mother something special on her birthday. I spent hours browsing online stores
                and everything felt generic — the same hampers, the same boxes, the same lack of soul.
                That's when I decided to build something different."
              </p>
              <footer className="text-sm font-semibold text-gray-900">
                — Founder, Radhvi
              </footer>
            </blockquote>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-14 bg-gray-50">
          <div className="container-custom max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Our Journey</h2>
            <div className="space-y-0">
              {MILESTONES.map(({ year, title, desc }, index) => (
                <div key={year} className="flex gap-6">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {year.slice(2)}
                    </div>
                    {index < MILESTONES.length - 1 && (
                      <div className="w-0.5 flex-1 bg-red-200 my-1" style={{ minHeight: '2rem' }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-10 pt-1">
                    <div className="text-xs font-semibold text-red-500 mb-0.5">{year}</div>
                    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision */}
        <section className="py-14 bg-white">
          <div className="container-custom max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Where We're Headed</h2>
            <p className="text-gray-600 mb-4">
              Our vision is to become India's most loved gifting platform — one where every customer
              finds exactly the right gift for every person they care about.
            </p>
            <p className="text-gray-600 mb-8">
              We're building tools to help you personalise gifts, schedule deliveries for future occasions,
              and discover new ways to celebrate the people in your life.
            </p>
            <Link href="/collections/all" className="inline-block bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors">
              Be Part of Our Story
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
