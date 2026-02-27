import { api } from './api';

export interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    slug: string;
    price: string;
    discounted_price?: string;
    image_url?: string;
  };
  quantity: number;
  item_total: number;
}

export interface Cart {
  items: CartItem[];
  total_items: number;
  total_amount: number;
}

class CartService {
  private baseUrl = '/cart';

  async getCart(): Promise<Cart> {
    const response = await api.get(this.baseUrl + '/');
    return response.data;
  }

  async addToCart(productId: number, quantity: number = 1): Promise<{ message: string; cart_item_id: number; quantity: number }> {
    const response = await api.post(this.baseUrl + '/add/', {
      product_id: productId,
      quantity,
    });
    return response.data;
  }

  async updateQuantity(cartItemId: number, quantity: number): Promise<{ message: string; quantity?: number }> {
    const response = await api.put(this.baseUrl + '/update_quantity/', {
      cart_item_id: cartItemId,
      quantity,
    });
    return response.data;
  }

  async removeItem(cartItemId: number): Promise<{ message: string }> {
    const response = await api.delete(this.baseUrl + '/remove_item/', {
      data: { cart_item_id: cartItemId },
    });
    return response.data;
  }

  async clearCart(): Promise<{ message: string }> {
    const response = await api.delete(this.baseUrl + '/clear/');
    return response.data;
  }
}

export const cartService = new CartService();
