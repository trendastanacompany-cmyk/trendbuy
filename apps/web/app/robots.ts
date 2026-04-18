import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin.html", "/api", "/uploads/private"]
      }
    ],
    sitemap: "https://trendbuy.kz/sitemap.xml",
    host: "https://trendbuy.kz"
  };
}
