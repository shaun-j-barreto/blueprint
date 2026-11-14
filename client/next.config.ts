import type { NextConfig } from "next";

/**
 * The browser only ever talks to Next.js. Express sits behind these same-origin
 * paths, which keeps the session cookie first-party and removes the need for
 * wildcard CORS. `/api/auth` is kept separate from `/backend` so Better Auth's
 * raw request handler never collides with an app route.
 */
const apiInternalUrl = (
  process.env.API_INTERNAL_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiInternalUrl}/api/auth/:path*`,
      },
      {
        source: "/backend/:path*",
        destination: `${apiInternalUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
