"use client";

import { useCallback, useState } from "react";
import { adminApi } from "../../lib/api/admin";
import type { Category } from "../../lib/types";

export function useCategoryManager(
  categories: Category[],
  onRefresh: () => Promise<void>,
  showToast: (msg: string) => void
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCategories = search.trim()
    ? categories.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  const editingCategory = editingId
    ? (categories.find((c) => c.id === editingId) ?? null)
    : null;

  const openCreate = useCallback(() => {
    setEditingId(null);
    setIsModalOpen(true);
  }, []);

  const openEdit = useCallback((id: string) => {
    setEditingId(id);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingId(null);
  }, []);

  const save = useCallback(
    async (name: string) => {
      if (editingId) {
        const existing = categories.find((c) => c.id === editingId);
        await adminApi.updateCategory(editingId, { name, sortOrder: existing?.sortOrder ?? 0 });
        showToast("Категория обновлена");
      } else {
        await adminApi.createCategory({ name, sortOrder: categories.length });
        showToast("Категория создана");
      }
      closeModal();
      await onRefresh();
    },
    [editingId, onRefresh, showToast, closeModal]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!confirm("Удалить категорию? Связанные товары тоже будут удалены."))
        return;
      await adminApi.deleteCategory(id);
      if (editingId === id) closeModal();
      showToast("Категория удалена");
      await onRefresh();
    },
    [editingId, onRefresh, showToast, closeModal]
  );

  const reorder = useCallback(
    async (orderedIds: string[]) => {
      const byId = new Map(categories.map((c) => [c.id, c]));
      const updates = orderedIds
        .map((id, index) => ({ item: byId.get(id), nextOrder: index }))
        .filter(
          ({ item, nextOrder }) =>
            item !== undefined && (item.sortOrder ?? 0) !== nextOrder
        ) as { item: Category; nextOrder: number }[];

      if (!updates.length) return;

      await Promise.all(
        updates.map(({ item, nextOrder }) =>
          adminApi.updateCategory(item.id, { name: item.name, sortOrder: nextOrder })
        )
      );
      showToast("Порядок категорий сохранен");
      await onRefresh();
    },
    [categories, onRefresh, showToast]
  );

  return {
    editingId,
    editingCategory,
    isModalOpen,
    search,
    setSearch,
    filteredCategories,
    openCreate,
    openEdit,
    closeModal,
    save,
    remove,
    reorder,
  };
}
