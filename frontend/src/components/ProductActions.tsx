'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { wishlistAPI } from '@/lib/wishlist';

interface ProductActionsProps {
  productId: number;
  productName: string;
}

export default function ProductActions({ productId, productName }: ProductActionsProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const { addToCart } = useCart();
  const { state: authState } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authState.isAuthenticated) {
      checkWishlistStatus();
    }
  }, [authState.isAuthenticated, productId]);

  const checkWishlistStatus = async () => {
    try {
      const inWishlist = await wishlistAPI.checkWishlist(productId);
      setIsInWishlist(inWishlist);
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!authState.isAuthenticated) {
      alert('Please login to add items to cart');
      router.push('/login');
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(productId, 1);
      alert(`${productName} added to cart!`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!authState.isAuthenticated) {
      alert('Please login to proceed');
      router.push('/login');
      return;
    }
    
    setIsAddingToCart(true);
    try {
      // Add product to cart
      await addToCart(productId, 1);
      // Redirect to checkout page
      router.push('/checkout');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to proceed. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!authState.isAuthenticated) {
      alert('Please login to add items to wishlist');
      router.push('/login');
      return;
    }

    setIsAddingToWishlist(true);
    try {
      if (isInWishlist) {
        await wishlistAPI.removeFromWishlist(productId);
        setIsInWishlist(false);
        alert(`${productName} removed from wishlist!`);
      } else {
        await wishlistAPI.addToWishlist(productId);
        setIsInWishlist(true);
        alert(`${productName} added to wishlist!`);
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      alert('Failed to update wishlist. Please try again.');
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="btn btn-primary flex-1 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAddingToCart ? 'Adding...' : 'Add to Cart'}
        </button>
        <button
          onClick={handleWishlist}
          disabled={isAddingToWishlist}
          className={`btn px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed ${
            isInWishlist ? 'bg-red-500 hover:bg-red-600 text-white' : 'btn-secondary'
          }`}
          title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg 
            className="w-6 h-6" 
            fill={isInWishlist ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      <button
        onClick={handleBuyNow}
        disabled={isAddingToCart}
        className="w-full btn bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAddingToCart ? 'Processing...' : 'Buy Now'}
      </button>
    </div>
  );
}
