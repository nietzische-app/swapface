/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  output: "standalone",
  images: { unoptimized: true },
};

export default nextConfig;
