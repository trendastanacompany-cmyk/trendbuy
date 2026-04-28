import type { NextConfig } from "next";
import path from "path";

const isProd = process.env.NODE_ENV === "production";
const defaultApiOrigin = isProd ? "http://api:3001" : "http://localhost:4000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Only needed during `next build` — causes Turbopack to fail in dev
  // when the monorepo root doesn't have next/package.json resolvable
  ...(isProd && { outputFileTracingRoot: path.join(__dirname, "../..") }),
  async rewrites() {
    const rawApiOrigin =
      process.env.API_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      defaultApiOrigin;
    const apiOrigin = rawApiOrigin.replace(/\/+$/, "").replace(/\/api$/, "");
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
