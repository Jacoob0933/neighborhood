import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Allow server-side Supabase calls
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
