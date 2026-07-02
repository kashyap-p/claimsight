import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["http://127.0.0.1:81", "http://localhost:81", "http://21.0.16.136:3000", "http://21.0.16.136:81"],
};

export default nextConfig;
