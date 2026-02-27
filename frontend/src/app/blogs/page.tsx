import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';

export const metadata: Metadata = {
  title: 'Blog | Radhvi',
  description: 'Gift ideas, tips, and inspiration for every occasion.',
};

export default function BlogsPage() {
  // Placeholder blog posts
  const blogPosts = [
    {
      id: 1,
      title: '10 Perfect Gift Ideas for Valentine\'s Day',
      excerpt: 'Make this Valentine\'s Day special with our curated selection of romantic gifts...',
      image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800',
      date: 'Feb 10, 2026',
      category: 'Gift Ideas',
    },
    {
      id: 2,
      title: 'How to Choose the Perfect Birthday Gift',
      excerpt: 'Finding the right birthday gift doesn\'t have to be stressful. Here are our top tips...',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800',
      date: 'Feb 5, 2026',
      category: 'Tips & Guides',
    },
    {
      id: 3,
      title: 'Anniversary Gift Guide: Traditional vs Modern',
      excerpt: 'Celebrate your love with meaningful anniversary gifts that show you care...',
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800',
      date: 'Jan 28, 2026',
      category: 'Gift Ideas',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar message="🎉 Free Shipping on orders above ₹999" />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16 md:py-20">
          <div className="container-custom text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-display">
              Gift Ideas & Inspiration
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover tips, guides, and inspiration for finding the perfect gift
            </p>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16 md:py-20">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <article key={post.id} className="card overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-primary-600">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-500 mb-2">{post.date}</p>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-primary-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    <button className="text-primary-600 font-semibold hover:text-primary-700 transition-colors inline-flex items-center gap-2">
                      Read More
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Coming Soon Message */}
            <div className="text-center mt-12 p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">
                More blog posts coming soon! Stay tuned for gift ideas, tips, and inspiration.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
