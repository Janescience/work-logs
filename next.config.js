/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const withPWA = isProd ? require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  workboxOptions: {
    disableDevLogs: true,
  }
}) : (config) => config;

const nextConfig = withPWA({
  reactStrictMode: true,
  env: {
    // NEXT_PUBLIC_API_URL: 'https://your-api-url.com',
  },
  // rewrites, redirects, etc. สามารถใส่ได้เหมือนเดิม
});

module.exports = nextConfig;