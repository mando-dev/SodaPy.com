/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // This ensures the static export behavior
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Remove the experimental section to re-enable Fast Refresh
};

export default nextConfig;
