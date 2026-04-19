import { apiRequest } from "./client";
import type { Category, Product } from "../types";

export type CategoryPayload = {
  name: string;
  sortOrder: number;
};

export type ProductPayload = {
  categoryId: string;
  name: string;
  sortOrder: number;
  image: string;
  price: number;
  oldPrice?: number | null;
  description?: string;
};

// All write operations go through /api/admin/* (Next.js server-side proxy)
// which injects the ADMIN_API_KEY header. The key never reaches the browser.
const R = "/api/admin";

export const adminApi = {
  getCategories: () => apiRequest<Category[]>(`${R}/categories`),

  getProducts: () => apiRequest<Product[]>(`${R}/products`),

  createCategory: (payload: CategoryPayload) =>
    apiRequest<Category>(`${R}/categories`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateCategory: (id: string, payload: CategoryPayload) =>
    apiRequest<Category>(`${R}/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteCategory: (id: string) =>
    apiRequest<null>(`${R}/categories/${id}`, { method: "DELETE" }),

  createProduct: (payload: ProductPayload) =>
    apiRequest<Product>(`${R}/products`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProduct: (id: string, payload: ProductPayload) =>
    apiRequest<Product>(`${R}/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id: string) =>
    apiRequest<null>(`${R}/products/${id}`, { method: "DELETE" }),

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const result = await apiRequest<{ path?: string; image?: string }>(
      `${R}/uploads/image`,
      { method: "POST", body: formData }
    );
    const path = String(result?.path || result?.image || "").trim();
    if (!path) throw new Error("Сервер не вернул путь к изображению");
    return path;
  },
};
