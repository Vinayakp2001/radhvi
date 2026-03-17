import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers | Radhvi',
  description: 'Join the Radhvi team. We\'re building India\'s most thoughtful gift store.',
};

const CULTURE = [
  { icon: '🚀', title: 'Move Fast', desc: 'We ship quickly, learn from feedback, and iterate. No bureaucracy.' },
  { icon: '💡', title: 'Own Your Work', desc: 'Everyone here has real ownership and impact from day one.' },
  { icon: '🤝', title: 'Team First', desc: 'We win together. Collaboration and kindness are non-negotiable.' },
  { icon: '📈', title: 'Grow Together', desc: 'We invest in your growth — courses, mentorship, and stretch opportunities.' },
  { icon: '🎁', title: 'Love What We Do', desc: 'We genuinely care about making gifting better for millions of people.' },
  { icon: '🌍', title: 'Work Flexibly', desc: 'Remote-friendly culture with flexible hours and a focus on outcomes.' },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-red-50 to-pink-50 py-20">
          <div className="container-custom text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Join Our Team</h1>
            <p className="text-lg text-gray-600">
              We're a small, passionate team building India's most thoughtful gifting platform.
              If you love creating great experiences, we'd love to meet you.
            </p>
          </div>
        </section>

        {/* Culture */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Life at Radhvi</h2>
              <p className="text-gray-600">What it's like to work with us.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {CULTURE.map(({ icon, title, desc }) => (
                <div key={title} className="bg-gray-50 rounded-xl p-6">
                  <div className="text-2xl mb-3">{icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-14 bg-gray-50">
          <div className="container-custom max-w-3xl mx-auto text-center">
            <div className="bg-white border border-gray-200 rounded-2xl p-12">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Open Positions Right Now</h2>
              <p className="text-gray-600 text-sm mb-6">
                We don't have any active openings at the moment, but we're always interested in
                meeting talented people. Send us your resume and we'll keep you in mind for future roles.
              </p>
              <a
                href="mailto:careers@radhvi.in"
                className="inline-block bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Send Your Resume
              </a>
              <p className="text-xs text-gray-400 mt-3">careers@radhvi.in</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
