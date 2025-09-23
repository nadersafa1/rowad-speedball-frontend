/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Removed standalone output for now to fix issues
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'http://backend:5555/api/:path*'
          : 'http://localhost:2001/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
