import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  async rewrites() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`
      },
      {
        source: "/uploads/:path*",
        destination: `${apiOrigin}/uploads/:path*`
      }
    ];
  }
};

export default nextConfig;
