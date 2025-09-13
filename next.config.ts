import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['*.loca.lt', 'loca.lt', 'localhost', '127.0.0.1'],
  eslint: {
    //Do not fail the build on ESLint errors (temporarily)
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
