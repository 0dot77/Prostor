import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  // Allow images from Supabase Storage and Google user avatars
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tebkwkljqxaymnjllhoi.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
