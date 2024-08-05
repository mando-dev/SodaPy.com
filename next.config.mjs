/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static export
  trailingSlash: true,
  images: {
    // If you're not using images, you can leave this as default.
    unoptimized: true,
  },
  reactStrictMode: true, // Enable React's strict mode for highlighting potential problems
};

export default nextConfig;
