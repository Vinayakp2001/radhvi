'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { authService } from '@/lib/auth';

interface GoogleSignInButtonProps {
  onError: (msg: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogle = () => {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            const res = await api.post('/auth/google/', { credential: response.credential });
            authService.setAuth(res.data.token, res.data.user);
            window.location.href = '/';
          } catch (err: any) {
            onError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: buttonRef.current.offsetWidth || 400,
        text: 'continue_with',
        shape: 'rectangular',
      });
    };

    // If GSI script already loaded
    if (window.google) {
      initGoogle();
      return;
    }

    // Load GSI script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, [onError]);

  return <div ref={buttonRef} className="w-full" />;
}
