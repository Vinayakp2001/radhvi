/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'radhvi.in', 'www.radhvi.in', 'images.unsplash.com'],
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: 'http://localhost:8000/media/:path*',
      },
    ];
  },
}

module.exports = nextConfig
