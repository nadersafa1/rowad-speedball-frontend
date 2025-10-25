/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Output configuration for Docker
  output: "standalone",
};

module.exports = nextConfig;
