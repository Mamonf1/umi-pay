import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // إزالة علامة أدوات المطور نهائياً — كانت تحجب تبويب الخدمات في الشريط السفلي
  devIndicators: false,
};

export default nextConfig;
