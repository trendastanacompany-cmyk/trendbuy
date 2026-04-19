import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://trendbuy.kz";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 }
  ];
}
