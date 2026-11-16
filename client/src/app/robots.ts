import type { MetadataRoute } from "next";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

/**
 * Only the marketing page is public. Everything else is either an authenticated
 * workspace, a one-time invitation link, or an API route.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/home",
          "/projects",
          "/priority",
          "/search",
          "/settings",
          "/teams",
          "/timeline",
          "/user",
          "/onboarding",
          "/invite",
          "/api/",
          "/backend/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
