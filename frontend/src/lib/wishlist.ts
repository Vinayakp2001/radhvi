import api from './api';

export interface WishlistItem {
  id: number;
  product: {
    id: number;
    slug: string;
    name: string;
    short_description: string;
    price: string;
    discounted_price?: string;
    image_url: string;
    rating: number;
    review_count: number;
    is_best_seller: boolean;
  };
  added_at: string;
}

export const wishlistAPI = {
  /**
   * Get user's wishlist
   */
  getWishlist: async (): Promise<WishlistItem[]> => {
    const response = await api.get('/wishlist/');
    // Handle paginated response
    return response.data.results || response.data;
  },

  /**
   * Add product to wishlist
   */
  addToWishlist: async (productId: number): Promise<WishlistItem> => {
    const response = await api.post('/wishlist/add/', {
      product_id: productId,
    });
    return response.data;
  },

  /**
   * Remove product from wishlist
   */
  removeFromWishlist: async (productId: number): Promise<void> => {
    await api.post('/wishlist/remove/', {
      product_id: productId,
    });
  },

  /**
   * Check if product is in wishlist
   */
  checkWishlist: async (productId: number): Promise<boolean> => {
    const response = await api.get(`/wishlist/check/?product_id=${productId}`);
    return response.data.in_wishlist;
  },

  /**
   * Delete wishlist item by ID
   */
  deleteWishlistItem: async (wishlistItemId: number): Promise<void> => {
    await api.delete(`/wishlist/${wishlistItemId}/`);
  },
};

/**
 * Hook for managing wishlist state
 */
export const useWishlist = () => {
  const toggleWishlist = async (productId: number, isInWishlist: boolean) => {
    try {
      if (isInWishlist) {
        await wishlistAPI.removeFromWishlist(productId);
      } else {
        await wishlistAPI.addToWishlist(productId);
      }
      return !isInWishlist;
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      throw error;
    }
  };

  return { toggleWishlist };
};
