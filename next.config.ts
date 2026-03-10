import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure pdf-parse and its native dependency are bundled correctly on the server
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
};

export default nextConfig;
