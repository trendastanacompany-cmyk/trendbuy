import type { Category, Product } from "./types";

function getApiBase() {
  if (typeof window === "undefined") {
    return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

export type CatalogProduct = Product & {
  slug: string;
  categoryName: string;
  categorySlug: string;
};

export type CatalogCategory = Category & {
  slug: string;
  products: CatalogProduct[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/["'`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function makeSlug(name: string, id: string, fallbackPrefix: string) {
  const base = slugify(name) || fallbackPrefix;
  return `${base}-${id.slice(0, 8)}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    next: { revalidate: 900 }
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function normalizeImagePath(path: string) {
  if (!path) return "/img/products/product-01.png";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

export async function getCatalogData() {
  try {
    const [categories, products] = await Promise.all([
      fetchJson<Category[]>("/api/categories"),
      fetchJson<Product[]>("/api/products")
    ]);

    const categoriesWithSlugs: CatalogCategory[] = categories.map((category) => ({
      ...category,
      slug: makeSlug(category.name, category.id, "category"),
      products: []
    }));

    const categoryMap = new Map(categoriesWithSlugs.map((item) => [item.id, item]));

    for (const product of products) {
      const category = categoryMap.get(product.categoryId);
      if (!category) continue;

      const productWithSlug: CatalogProduct = {
        ...product,
        slug: makeSlug(product.name, product.id, "product"),
        categoryName: category.name,
        categorySlug: category.slug
      };

      category.products.push(productWithSlug);
    }

    const flattenedProducts = categoriesWithSlugs.flatMap((category) => category.products);

    return {
      categories: categoriesWithSlugs,
      products: flattenedProducts
    };
  } catch {
    return {
      categories: [] as CatalogCategory[],
      products: [] as CatalogProduct[]
    };
  }
}

export async function getCategoryBySlug(categorySlug: string) {
  const { categories } = await getCatalogData();
  return categories.find((category) => category.slug === categorySlug) || null;
}

export async function getProductBySlugs(categorySlug: string, productSlug: string) {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return null;

  const product = category.products.find((item) => item.slug === productSlug) || null;
  return product ? { category, product } : null;
}

