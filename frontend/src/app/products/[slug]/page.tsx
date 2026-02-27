import { notFound } from 'next/navigation';
import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ProductImageGallery from '@/components/ProductImageGallery';
import ProductActions from '@/components/ProductActions';
import TrustBadges from '@/components/product/TrustBadges';
import BenefitBullets from '@/components/product/BenefitBullets';
import ProductDetails from '@/components/product/ProductDetails';
import OccasionTags from '@/components/product/OccasionTags';
import ReviewSection from '@/components/product/ReviewSection';
import DeliveryInfo from '@/components/product/DeliveryInfo';
import { apiServices, productToCardProps } from '@/lib/api-services';
import type { Metadata } from 'next';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await apiServices.fetchProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Radhvi',
      description: 'The requested product could not be found.',
    };
  }

  return {
    title: `${product.name} | Radhvi`,
    description: product.short_description || product.description,
    keywords: `${product.name}, gift, premium, online shopping`,
    openGraph: {
      title: product.name,
      description: product.short_description || product.description,
      images: product.image_url ? [product.image_url] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  const product = await apiServices.fetchProduct(slug);
  
  if (!product) {
    notFound();
  }

  const relatedProducts = await apiServices.fetchProducts({
    category: product.category.toString(),
    limit: 4,
  }).then(products => products.filter(p => p.id !== product.id));

  const finalPrice = product.discounted_price ? parseFloat(product.discounted_price) : parseFloat(product.price);
  const originalPrice = parseFloat(product.price);
  const savings = product.discounted_price ? originalPrice - finalPrice : 0;
  const discountPercentage = savings > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  // Generate emotional tagline based on product
  const generateTagline = () => {
    const name = product.name?.toLowerCase() || '';
    
    if (name.includes('sorry') || name.includes('apology')) {
      return "💕 Make things right with a heartfelt gesture";
    }
    if (name.includes('flower') || name.includes('bouquet') || name.includes('rose')) {
      return "🌹 Express your love with nature's most beautiful creation";
    }
    if (name.includes('anniversary')) {
      return "💖 Celebrate your love story with something special";
    }
    if (name.includes('birthday')) {
      return "🎉 Make their special day even more memorable";
    }
    
    return "✨ Create unforgettable moments with thoughtful gifting";
  };

  // Generate storytelling description
  const generateStoryDescription = () => {
    const name = product.name?.toLowerCase() || '';
    
    if (name.includes('sorry') || name.includes('apology')) {
      return [
        "Sometimes words aren't enough to express how sorry we are. That's when a thoughtful gesture speaks louder than any apology. This carefully chosen gift carries your heartfelt emotions and shows just how much you care.",
        "Every relationship goes through ups and downs, but it's how we make things right that truly matters. Let this beautiful gesture be the bridge that brings you closer together, turning a difficult moment into an opportunity for deeper connection.",
        "Because the people we love deserve our very best effort to make things right. Show them that their happiness means everything to you."
      ];
    }
    
    if (name.includes('flower') || name.includes('bouquet') || name.includes('rose')) {
      return [
        "There's something magical about flowers that speaks directly to the heart. Each bloom in this stunning arrangement has been carefully selected to convey emotions that words sometimes cannot express.",
        "Whether it's a celebration of love, an apology from the heart, or simply a way to brighten someone's day, these beautiful flowers carry your feelings with grace and elegance.",
        "Let nature's most beautiful creation be the messenger of your love, creating a moment they'll treasure forever."
      ];
    }
    
    // Default story
    return [
      "Every gift tells a story, and this one speaks of thoughtfulness, care, and the special bond you share. It's more than just a present – it's a way to show someone how much they mean to you.",
      "In a world full of ordinary moments, create something extraordinary. This carefully chosen gift is designed to bring joy, surprise, and that special feeling of being truly loved and appreciated.",
      "Because the best gifts aren't just about what's inside the box – they're about the love, thought, and care that went into choosing something perfect for someone special."
    ];
  };

  const tagline = generateTagline();
  const storyParagraphs = generateStoryDescription();

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />

      <main className="flex-1 bg-white">
        {/* Breadcrumb */}
        <section className="bg-gray-50 py-4">
          <div className="container-custom">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <a href="/" className="hover:text-primary-600">Home</a>
              <span>/</span>
              <a href="/collections/all" className="hover:text-primary-600">Products</a>
              <span>/</span>
              <span className="text-gray-900 font-medium">{product.name}</span>
            </nav>
          </div>
        </section>

        {/* Main Product Section */}
        <section className="py-8">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {/* Product Image Gallery */}
              <ProductImageGallery 
                images={product.images && product.images.length > 0 ? product.images : [product.image_url || '/placeholder-product.jpg']}
                productName={product.name}
              />

              {/* Product Info */}
              <div className="space-y-6">
                {/* Header Section */}
                <header>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h1>
                  <p className="text-lg text-gray-600 mb-4">{tagline}</p>
                  
                  {/* Rating */}
                  {product.rating > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, index) => (
                          <svg
                            key={index}
                            className={`w-5 h-5 ${
                              index < Math.floor(product.rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300 fill-gray-300'
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {product.rating.toFixed(1)} ({product.review_count} reviews)
                      </span>
                    </div>
                  )}
                </header>

                {/* Price Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-bold text-red-600">
                      ₹{finalPrice.toLocaleString()}
                    </span>
                    {savings > 0 && (
                      <>
                        <span className="text-xl text-gray-500 line-through">
                          ₹{originalPrice.toLocaleString()}
                        </span>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                          {discountPercentage}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  {savings > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      You save ₹{savings.toLocaleString()}! 
                      <span className="text-gray-600"> Extra 5% off on prepaid orders</span>
                    </p>
                  )}
                </div>

                {/* Product Actions */}
                <ProductActions productId={product.id} productName={product.name} />
                
                {/* Trust Badges */}
                <TrustBadges className="mt-6" />
              </div>
            </div>
          </div>
        </section>

        {/* Additional Sections */}
        <section className="py-8 bg-gray-50">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Benefits Section */}
                <BenefitBullets product={product} />
                
                {/* Product Details */}
                <ProductDetails product={product} />
                
                {/* Occasions */}
                <OccasionTags product={product} />
                
                {/* Storytelling Description */}
                <section className="bg-white rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Why This Makes the Perfect Gift</h3>
                  <div className="prose prose-gray max-w-none">
                    {storyParagraphs.map((paragraph, index) => (
                      <p key={index} className="text-gray-700 leading-relaxed mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
                
                {/* Reviews */}
                <div className="bg-white rounded-lg p-6">
                  <ReviewSection product={product} />
                </div>
              </div>
              
              {/* Sidebar */}
              <div className="space-y-6">
                {/* Delivery Info */}
                <DeliveryInfo />
                
                {/* Quick Product Info */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-3">Product Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">Gift</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SKU:</span>
                      <span className="font-medium">#{product.id}</span>
                    </div>
                    {product.is_best_seller && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="text-red-600 font-medium">Bestseller</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-12 bg-white">
            <div className="container-custom">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You Might Also Like</h2>
                <p className="text-gray-600">More beautiful gifts to express your feelings</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    {...productToCardProps(relatedProduct)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
