"use client";

import type { Category } from "../../../lib/types";
import { useCategoryManager } from "../../../hooks/admin/useCategoryManager";
import Modal from "../../ui/Modal";
import CategoryForm from "./CategoryForm";
import CategoryTable from "./CategoryTable";

type Props = {
  categories: Category[];
  onRefresh: () => Promise<void>;
  showToast: (msg: string) => void;
};

export default function AdminCategorySection({
  categories,
  onRefresh,
  showToast,
}: Props) {
  const {
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
  } = useCategoryManager(categories, onRefresh, showToast);

  return (
    <section id="admin-categories" className="panel">
      <div className="panel__head">
        <h1 className="panel__title main-title">
          <span>Категории</span>
        </h1>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <input
            type="text"
            placeholder="Поиск по категориям"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="actions">
          <button type="button" onClick={openCreate}>
            Добавить категорию
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <CategoryTable
          categories={filteredCategories}
          searchActive={search.trim().length > 0}
          onEdit={openEdit}
          onDelete={remove}
          onReorder={reorder}
        />
      </div>

      <Modal
        id="category-modal"
        title={editingCategory ? "Редактировать категорию" : "Новая категория"}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <CategoryForm editing={editingCategory} onSave={save} onCancel={closeModal} />
      </Modal>
    </section>
  );
}
