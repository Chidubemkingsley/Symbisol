const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../'),
  server: {
    keepAliveTimeout: 120000,
  },
};

module.exports = nextConfig;
