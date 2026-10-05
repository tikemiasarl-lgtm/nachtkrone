import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zcejzktocuhcpupkrudr.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/products/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
