/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable Turbopack — use stable webpack dev server to avoid HMR ws errors
  // Remove this once Turbopack stabilizes in a future Next.js release
};

module.exports = nextConfig;
