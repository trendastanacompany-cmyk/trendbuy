"use client";

import { useCallback, useState } from "react";
import { adminApi } from "../../lib/api/admin";
import type { Product } from "../../lib/types";

export function useProductManager(
  products: Product[],
  onRefresh: () => Promise<void>,
  showToast: (msg: string) => void
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const editingProduct = editingId
    ? (products.find((p) => p.id === editingId) ?? null)
    : null;

  const filteredProducts = search.trim()
    ? products.filter((p) => {
        const haystack = [p.name, p.description, p.image, p.price, p.oldPrice, p.sortOrder]
          .map((v) => String(v ?? "").toLowerCase())
          .join(" ");
        return haystack.includes(search.toLowerCase());
      })
    : products;

  const openCreate = useCallback(
    (hasCategoriesAvailable: boolean) => {
      if (!hasCategoriesAvailable) {
        showToast("Сначала добавьте категорию");
        return;
      }
      setEditingId(null);
      setIsModalOpen(true);
    },
    [showToast]
  );

  const openEdit = useCallback((id: string) => {
    setEditingId(id);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingId(null);
  }, []);

  const save = useCallback(
    async (payload: {
      categoryId: string;
      name: string;
      image: string;
      price: number;
      oldPrice?: number | null;
      description?: string;
    }) => {
      if (editingId) {
        const existing = products.find((p) => p.id === editingId);
        await adminApi.updateProduct(editingId, { ...payload, sortOrder: existing?.sortOrder ?? 0 });
        showToast("Товар обновлен");
      } else {
        await adminApi.createProduct({ ...payload, sortOrder: products.length });
        showToast("Товар создан");
      }
      closeModal();
      await onRefresh();
    },
    [editingId, onRefresh, showToast, closeModal]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!confirm("Удалить этот товар?")) return;
      await adminApi.deleteProduct(id);
      if (editingId === id) closeModal();
      showToast("Товар удален");
      await onRefresh();
    },
    [editingId, onRefresh, showToast, closeModal]
  );

  const reorder = useCallback(
    async (categoryId: string, orderedIds: string[]) => {
      const byId = new Map(products.map((p) => [p.id, p]));
      const updates = orderedIds
        .map((id, index) => ({ item: byId.get(id), nextOrder: index }))
        .filter(
          ({ item, nextOrder }) =>
            item !== undefined && (item.sortOrder ?? 0) !== nextOrder
        ) as { item: Product; nextOrder: number }[];

      if (!updates.length) return;

      await Promise.all(
        updates.map(({ item, nextOrder }) =>
          adminApi.updateProduct(item.id, {
            categoryId: item.categoryId,
            name: item.name,
            image: item.image,
            sortOrder: nextOrder,
            price: item.price,
            oldPrice: item.oldPrice,
            description: item.description || "",
          })
        )
      );
      showToast("Порядок товаров сохранен");
      await onRefresh();
    },
    [products, onRefresh, showToast]
  );

  return {
    editingId,
    editingProduct,
    isModalOpen,
    search,
    setSearch,
    filteredProducts,
    openCreate,
    openEdit,
    closeModal,
    save,
    remove,
    reorder,
  };
}
