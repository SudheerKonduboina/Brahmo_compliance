/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 14: swcMinify removed (SWC minification is default)
  // Production builds automatically use SWC for minification
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
};

module.exports = nextConfig;
