/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

const nextConfig = withPWA({
  reactStrictMode: true,
  env: {
    // NEXT_PUBLIC_API_URL: 'https://your-api-url.com',
  },
  // rewrites, redirects, etc. สามารถใส่ได้เหมือนเดิม
});

module.exports = nextConfig;
