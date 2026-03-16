import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Radhvi - Thoughtful Gifts for Every Occasion',
  description: 'Discover unique and thoughtful gifts for birthdays, anniversaries, weddings, and all special occasions. Premium gift hampers delivered across India.',
  keywords: 'gifts, gift hampers, birthday gifts, anniversary gifts, online gifts India, premium gifts',
  openGraph: {
    title: 'Radhvi - Thoughtful Gifts for Every Occasion',
    description: 'Discover unique and thoughtful gifts for birthdays, anniversaries, weddings, and all special occasions.',
    url: 'https://radhvi.in',
    siteName: 'Radhvi',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Radhvi - Thoughtful Gifts for Every Occasion',
    description: 'Premium gift hampers delivered across India.',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
