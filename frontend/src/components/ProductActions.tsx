'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { wishlistAPI } from '@/lib/wishlist';

interface ProductActionsProps {
  productId: number;
  productName: string;
  price?: number;
  discountedPrice?: number;
  imageUrl?: string;
}

export default function ProductActions({ productId, productName, price = 0, discountedPrice, imageUrl }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [cartStatus, setCartStatus] = useState<'idle' | 'adding' | 'added' | 'error'>('idle');
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) checkWishlistStatus();
  }, [isAuthenticated, productId]);

  const checkWishlistStatus = async () => {
    try {
      setIsInWishlist(await wishlistAPI.checkWishlist(productId));
    } catch { /* ignore */ }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      const sellPrice = discountedPrice || price;
      const existing = JSON.parse(localStorage.getItem('guest_cart') || '[]');
      const idx = existing.findIndex((i: any) => i.product_id === productId);
      if (idx >= 0) existing[idx].quantity += quantity;
      else existing.push({ product_id: productId, quantity, name: productName, price: sellPrice, image_url: imageUrl });
      localStorage.setItem('guest_cart', JSON.stringify(existing));
      setCartStatus('added');
      setTimeout(() => setCartStatus('idle'), 2500);
      return;
    }
    setCartStatus('adding');
    try {
      await addToCart(productId, quantity);
      setCartStatus('added');
      setTimeout(() => setCartStatus('idle'), 2500);
    } catch {
      setCartStatus('error');
      setTimeout(() => setCartStatus('idle'), 2500);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      const sellPrice = discountedPrice || price;
      localStorage.setItem('guest_cart', JSON.stringify([{ product_id: productId, quantity, name: productName, price: sellPrice, image_url: imageUrl }]));
      router.push('/checkout');
      return;
    }
    setCartStatus('adding');
    try {
      await addToCart(productId, quantity);
      router.push('/checkout');
    } catch {
      setCartStatus('error');
      setTimeout(() => setCartStatus('idle'), 2500);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { router.push('/login?redirect=' + window.location.pathname); return; }
    setIsAddingToWishlist(true);
    try {
      if (isInWishlist) { await wishlistAPI.removeFromWishlist(productId); setIsInWishlist(false); }
      else { await wishlistAPI.addToWishlist(productId); setIsInWishlist(true); }
    } catch { /* ignore */ } finally { setIsAddingToWishlist(false); }
  };

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Quantity</span>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-10 text-center text-sm font-medium text-gray-900">{quantity}</span>
          <button onClick={() => setQuantity(q => q + 1)}
            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cart feedback */}
      {cartStatus === 'added' && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Added to cart
        </div>
      )}
      {cartStatus === 'error' && (
        <p className="text-red-500 text-sm">Failed to add to cart. Please try again.</p>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={handleAddToCart} disabled={cartStatus === 'adding'}
          className="flex-1 bg-white border-2 border-red-500 text-red-500 py-3 rounded-lg font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors text-sm">
          {cartStatus === 'adding' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent" />
              Adding...
            </span>
          ) : 'Add to Cart'}
        </button>
        <button onClick={handleWishlist} disabled={isAddingToWishlist}
          className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 transition-colors ${isInWishlist ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-400'}`}>
          <svg className="w-5 h-5" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <button onClick={handleBuyNow} disabled={cartStatus === 'adding'}
        className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors text-sm">
        Buy Now
      </button>
    </div>
  );
}
