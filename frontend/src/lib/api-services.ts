import api from './api';

// Types
export interface Product {
  id: number;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  price: string;
  discounted_price?: string;
  image_url: string;
  images: string[]; // Array of all product images
  category: number;
  is_best_seller: boolean;
  is_featured: boolean;
  rating: number;
  review_count: number;
  discount_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Occasion {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  image_url: string;
  product_count: number;
  order: number;
}

export interface Testimonial {
  id: number;
  name: string;
  city: string;
  text: string;
  tag: string;
  rating: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

// API Service Functions
export const apiServices = {
  /**
   * Fetch all occasions for "Shop by Occasion" section
   */
  fetchOccasions: async (): Promise<Occasion[]> => {
    try {
      const response = await api.get('/occasions/');
      return response.data.results || response.data;
    } catch (error) {
      console.error('Failed to fetch occasions:', error);
      return [];
    }
  },

  /**
   * Fetch bestseller products
   */
  fetchBestsellers: async (limit: number = 8): Promise<Product[]> => {
    try {
      const response = await api.get('/products/bestsellers/', {
        params: { limit },
      });
      return response.data.results || response.data;
    } catch (error) {
      console.error('Failed to fetch bestsellers:', error);
      return [];
    }
  },

  /**
   * Fetch featured product for highlight section
   */
  fetchFeaturedProduct: async (): Promise<Product | null> => {
    try {
      const response = await api.get('/products/featured/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch featured product:', error);
      return null;
    }
  },

  /**
   * Fetch latest blog posts (placeholder - to be implemented)
   */
  fetchBlogPosts: async (limit: number = 3): Promise<any[]> => {
    try {
      // TODO: Implement when blog API is ready
      // const response = await api.get('/blog/posts/', {
      //   params: { limit },
      // });
      // return response.data.results || response.data;
      return [];
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
      return [];
    }
  },

  /**
   * Fetch testimonials for "Customer Love" section
   */
  fetchTestimonials: async (limit: number = 6): Promise<Testimonial[]> => {
    try {
      const response = await api.get('/testimonials/', {
        params: { limit },
      });
      return response.data.results || response.data;
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
      return [];
    }
  },

  /**
   * Fetch all products with optional filters
   */
  fetchProducts: async (params?: {
    category?: string;
    search?: string;
    ordering?: string;
    limit?: number;
    price_range?: string;
  }): Promise<Product[]> => {
    try {
      const response = await api.get('/products/', { params });
      return response.data.results || response.data;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  },

  /**
   * Fetch single product by slug
   */
  fetchProduct: async (slug: string): Promise<Product | null> => {
    try {
      const response = await api.get(`/products/${slug}/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return null;
    }
  },

  /**
   * Fetch all categories
   */
  fetchCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get('/categories/');
      return response.data.results || response.data;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  },

  /**
   * Fetch single occasion by slug
   */
  fetchOccasion: async (slug: string): Promise<Occasion | null> => {
    try {
      const response = await api.get(`/occasions/${slug}/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch occasion:', error);
      return null;
    }
  },
};

// Helper function to convert API product to component props
export const productToCardProps = (product: Product) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  shortDescription: product.short_description,
  image: product.image_url || '/placeholder-product.jpg',
  price: parseFloat(product.price),
  discountedPrice: product.discounted_price
    ? parseFloat(product.discounted_price)
    : undefined,
  rating: product.rating,
  reviewCount: product.review_count,
  isBestseller: product.is_best_seller,
});

// Helper function to convert API occasion to component props
export const occasionToCardProps = (occasion: Occasion) => {
  // Map occasion slugs to local images
  const localImageMap: Record<string, string> = {
    'valentines': '/occasions/valentines.jpg',
    'valentine': '/occasions/valentines.jpg',
    'birthday': '/occasions/birthday.jpg',
    'birthdays': '/occasions/birthday.jpg',
    'anniversary': '/occasions/anniversary.jpg',
    'anniversaries': '/occasions/anniversary.jpg',
    'wedding': '/occasions/wedding.jpg',
    'weddings': '/occasions/wedding.jpg',
    'mothers-day': '/occasions/mothers-day.jpg',
    'fathers-day': '/occasions/fathers-day.jpg',
    'diwali': '/occasions/diwali.jpg',
    'rakhi': '/occasions/rakhi.jpg',
    'raksha-bandhan': '/occasions/rakhi.jpg',
  };

  // Use local image if available, otherwise fall back to API image or placeholder
  const localImage = localImageMap[occasion.slug.toLowerCase()];
  
  return {
    slug: occasion.slug,
    name: occasion.name,
    tagline: occasion.tagline,
    image: localImage || occasion.image_url || '/placeholder-occasion.jpg',
    productCount: occasion.product_count,
  };
};
