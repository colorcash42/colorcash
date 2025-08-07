/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // This is the crucial change to disable image optimization
  // and allow the build to succeed with static images in the public folder.
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;