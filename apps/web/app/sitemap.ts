import type { MetadataRoute } from "next";
import { getCatalogData } from "../lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://trendbuy.kz";
  const { categories, products } = await getCatalogData();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalog`, changeFrequency: "daily", priority: 0.9 }
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${base}/catalog/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.8
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}/catalog/${product.categorySlug}/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.7
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
