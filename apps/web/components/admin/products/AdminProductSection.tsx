"use client";

import type { Category, Product } from "../../../lib/types";
import { useProductManager } from "../../../hooks/admin/useProductManager";
import Modal from "../../ui/Modal";
import ProductForm from "./ProductForm";
import ProductTable from "./ProductTable";

type Props = {
  products: Product[];
  categories: Category[];
  onRefresh: () => Promise<void>;
  showToast: (msg: string) => void;
};

export default function AdminProductSection({
  products,
  categories,
  onRefresh,
  showToast,
}: Props) {
  const {
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
  } = useProductManager(products, onRefresh, showToast);

  return (
    <section id="admin-products" className="panel">
      <div className="panel__head">
        <h2 className="panel__title main-title">
          <span>Товары</span>
        </h2>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <input
            type="text"
            placeholder="Поиск по товарам"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="actions">
          <button type="button" onClick={() => openCreate(categories.length > 0)}>
            Добавить товар
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <ProductTable
          products={filteredProducts}
          categories={categories}
          searchActive={search.trim().length > 0}
          onEdit={openEdit}
          onDelete={remove}
          onReorder={reorder}
        />
      </div>

      <Modal
        id="product-modal"
        title={editingProduct ? "Редактировать товар" : "Новый товар"}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <ProductForm
          editing={editingProduct}
          categories={categories}
          onSave={save}
          onCancel={closeModal}
          showToast={showToast}
        />
      </Modal>
    </section>
  );
}
