/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // This ensures the static export behavior
    trailingSlash: true,
    images: {
      unoptimized: true
    }
};

export default nextConfig;
