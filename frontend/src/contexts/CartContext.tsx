'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Cart, CartItem, cartService } from '@/lib/cart';

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART'; payload: Cart }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CART':
      return { ...state, cart: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_CART':
      return {
        ...state,
        cart: {
          items: [],
          total_items: 0,
          total_amount: 0,
        },
      };
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const refreshCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const cart = await cartService.getCart();
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (error: any) {
      // Silently fail if not authenticated (401) - this is expected
      if (error.response?.status === 401) {
        dispatch({ type: 'SET_CART', payload: { items: [], total_items: 0, total_amount: 0 } });
        return;
      }
      // Log other errors
      console.error('Failed to fetch cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    }
  };

  const addToCart = async (productId: number, quantity: number = 1) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await cartService.addToCart(productId, quantity);
      await refreshCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
      throw error;
    }
  };

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    try {
      await cartService.updateQuantity(cartItemId, quantity);
      await refreshCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update quantity' });
      throw error;
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      await cartService.removeItem(cartItemId);
      await refreshCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item' });
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
      throw error;
    }
  };

  useEffect(() => {
    // Only load cart if user has a token (is authenticated)
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      refreshCart().catch(() => {
        // Failed to load cart, user might not be authenticated
      });
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        state,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
