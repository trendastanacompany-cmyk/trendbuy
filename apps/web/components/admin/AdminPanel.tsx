"use client";

import { useAdminData } from "../../hooks/admin/useAdminData";
import { useToast } from "../../hooks/useToast";
import Toast from "../ui/Toast";
import AdminCategorySection from "./categories/AdminCategorySection";
import AdminHeader from "./AdminHeader";
import AdminProductSection from "./products/AdminProductSection";

export default function AdminPanel() {
  const { toastMessage, showToast } = useToast();
  const { categories, products, loading, refresh } = useAdminData(showToast);

  return (
    <div className="wrapper">
      <AdminHeader />

      <main className="main-page admin-main">
        {loading ? (
          <p style={{ padding: "2rem" }}>Загрузка данных...</p>
        ) : (
          <>
            <AdminCategorySection
              categories={categories}
              onRefresh={refresh}
              showToast={showToast}
            />

            <AdminProductSection
              products={products}
              categories={categories}
              onRefresh={refresh}
              showToast={showToast}
            />
          </>
        )}
      </main>

      <Toast message={toastMessage} />
    </div>
  );
}
