"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../lib/api/admin";
import type { Category, Product } from "../../lib/types";

export function useAdminData(showToast: (msg: string) => void) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [cats, prods] = await Promise.all([
      adminApi.getCategories(),
      adminApi.getProducts(),
    ]);
    setCategories(cats ?? []);
    setProducts(prods ?? []);
  }, []);

  useEffect(() => {
    refresh()
      .catch((err: Error) => showToast(err.message || "Ошибка загрузки данных"))
      .finally(() => setLoading(false));
  }, [refresh, showToast]);

  return { categories, products, loading, refresh };
}
