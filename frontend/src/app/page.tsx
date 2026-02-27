import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import OccasionCard from '@/components/OccasionCard';
import HeroSlider from '@/components/HeroSlider';
import Link from 'next/link';
import { apiServices, productToCardProps, occasionToCardProps } from '@/lib/api-services';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Radhvi - Thoughtful Gifts for Every Occasion | Premium Gift Store',
  description: 'Discover premium gifts for birthdays, anniversaries, weddings, and all special occasions. Shop curated collections of flowers, chocolates, personalized gifts, and more at Radhvi.',
  keywords: 'gifts, online gifts, birthday gifts, anniversary gifts, wedding gifts, flowers, chocolates, personalized gifts, gift hampers, India',
  openGraph: {
    title: 'Radhvi - Thoughtful Gifts for Every Occasion',
    description: 'Celebrate life\'s special moments with our curated collection of premium gifts.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default async function Home() {
  // Fetch all data in parallel
  const [occasions, bestsellers, featuredProduct, testimonials] = await Promise.all([
    apiServices.fetchOccasions(),
    apiServices.fetchBestsellers(8),
    apiServices.fetchFeaturedProduct(),
    apiServices.fetchTestimonials(6),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar message="🎉 Free Shipping on orders above ₹999 | Valentine's Special Offers!" />
      <Header />

      <main className="flex-1">
        {/* Hero Slider Section */}
        <HeroSlider />

        {/* Shop by Occasion Section */}
        {occasions.length > 0 && (
          <section className="py-16 md:py-20 bg-white">
            <div className="container-custom">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-display">
                  Shop by Occasion
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Find the perfect gift for every celebration
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {occasions.slice(0, 8).map((occasion) => (
                  <OccasionCard key={occasion.id} {...occasionToCardProps(occasion)} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bestsellers Section */}
        {bestsellers.length > 0 && (
          <section className="py-16 md:py-20 bg-gray-50">
            <div className="container-custom">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-display">
                  Bestsellers
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Our most loved gifts, chosen by customers like you
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {bestsellers.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    {...productToCardProps(product)}
                    priority={index < 4} // First 4 products get priority loading
                  />
                ))}
              </div>
              <div className="text-center mt-12">
                <Link href="/bestsellers" className="btn btn-primary px-8 py-3">
                  View All Bestsellers
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Featured Product Section */}
        {featuredProduct && (
          <section className="py-16 md:py-20 bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
            <div className="container-custom">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredProduct.image_url || 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800'}
                    alt={featuredProduct.name}
                    className="rounded-2xl shadow-2xl w-full h-full object-cover"
                    loading="lazy"
                  />
                  {featuredProduct.discount_percentage > 0 && (
                    <div className="absolute top-4 left-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-full font-bold text-lg">
                      Save {featuredProduct.discount_percentage}%
                    </div>
                  )}
                </div>
                <div>
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    Featured Product
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display">
                    {featuredProduct.name}
                  </h2>
                  <p className="text-xl text-white/90 mb-6">
                    {featuredProduct.short_description}
                  </p>
                  <div className="flex items-baseline gap-4 mb-8">
                    <span className="text-4xl font-bold">
                      ₹{featuredProduct.discounted_price || featuredProduct.price}
                    </span>
                    {featuredProduct.discounted_price && (
                      <span className="text-2xl text-white/70 line-through">
                        ₹{featuredProduct.price}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/products/${featuredProduct.slug}`}
                    className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg inline-block"
                  >
                    View Product
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* About/Story Section */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-display">
                  Our Story
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  At Radhvi, we believe that every gift tells a story. Founded with a passion for 
                  creating memorable moments, we curate the finest selection of gifts that speak 
                  from the heart.
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  From handpicked flowers to personalized treasures, each product in our collection 
                  is chosen with care to help you celebrate life's most precious moments.
                </p>
                <Link href="/about" className="btn btn-primary px-8 py-3">
                  Learn More About Us
                </Link>
              </div>
              <div className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800"
                  alt="Our story"
                  className="rounded-2xl shadow-xl w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        {testimonials.length > 0 && (
          <section className="py-16 md:py-20 bg-gray-50">
            <div className="container-custom">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-display">
                  Customer Love ❤️
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Hear what our happy customers have to say
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="card p-6 bg-white hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < testimonial.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 fill-gray-300'
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-600">{testimonial.city}</p>
                      </div>
                      <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                        {testimonial.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="container-custom text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 font-display">
              Ready to Make Someone's Day?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Browse our collection and find the perfect gift that speaks from your heart
            </p>
            <Link
              href="/collections/all"
              className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 text-lg inline-block"
            >
              Start Shopping
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
