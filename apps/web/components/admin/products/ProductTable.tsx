"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Category, Product } from "../../../lib/types";
import { normalizeImagePath } from "../../../lib/catalog";
import { useAutoScroll } from "../../../hooks/useAutoScroll";

type Props = {
  products: Product[];
  categories: Category[];
  searchActive: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (categoryId: string, orderedIds: string[]) => Promise<void>;
};

function fmt(value: string | number) {
  return new Intl.NumberFormat("ru-RU").format(Number(value));
}

export default function ProductTable({
  products,
  categories,
  searchActive,
  onEdit,
  onDelete,
  onReorder,
}: Props) {
  const [order, setOrder] = useState<string[]>(() => products.map((p) => p.id));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);

  // touch state
  const touchIdRef = useRef<string | null>(null);
  const touchCatIdRef = useRef<string | null>(null);
  const touchCommittedRef = useRef(false);
  const orderRef = useRef(order);
  orderRef.current = order;

  useAutoScroll(draggingId !== null);

  useEffect(() => {
    setOrder(products.map((p) => p.id));
  }, [products]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const orderedProducts = order
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  // ── Mouse drag ────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, product: Product) => {
    if (searchActive) { e.preventDefault(); return; }
    setDraggingId(product.id);
    setDraggingCategoryId(product.categoryId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", product.id);
  }, [searchActive]);

  const handleDragOver = useCallback((e: React.DragEvent, target: Product) => {
    if (!draggingId || !draggingCategoryId) return;
    if (target.categoryId !== draggingCategoryId || draggingId === target.id) return;
    e.preventDefault();
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(draggingId);
      const to = next.indexOf(target.id);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, draggingId);
      return next;
    });
  }, [draggingId, draggingCategoryId]);

  const handleDragEnd = useCallback(async () => {
    const catId = draggingCategoryId;
    if (!draggingId || !catId) return;
    setDraggingId(null);
    setDraggingCategoryId(null);
    const ids = orderRef.current.filter(
      (id) => products.find((p) => p.id === id)?.categoryId === catId
    );
    try { await onReorder(catId, ids); }
    catch { setOrder(products.map((p) => p.id)); }
  }, [draggingId, draggingCategoryId, onReorder, products]);

  // ── Touch drag ────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent, product: Product) => {
    if (searchActive) return;
    touchIdRef.current = product.id;
    touchCatIdRef.current = product.categoryId;
    touchCommittedRef.current = false;
  }, [searchActive]);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!touchIdRef.current) return;

      if (!touchCommittedRef.current) {
        touchCommittedRef.current = true;
        setDraggingId(touchIdRef.current);
        setDraggingCategoryId(touchCatIdRef.current);
      }

      e.preventDefault();

      const touch = e.touches[0];
      const rows = document.querySelectorAll<HTMLElement>("[data-prod-id]");
      for (const row of rows) {
        const rect = row.getBoundingClientRect();
        if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          const targetId = row.getAttribute("data-prod-id");
          const targetCatId = row.getAttribute("data-prod-cat");
          if (
            targetId &&
            targetId !== touchIdRef.current &&
            targetCatId === touchCatIdRef.current
          ) {
            setOrder((prev) => {
              const next = [...prev];
              const from = next.indexOf(touchIdRef.current!);
              const to = next.indexOf(targetId);
              if (from === -1 || to === -1) return prev;
              next.splice(from, 1);
              next.splice(to, 0, touchIdRef.current!);
              return next;
            });
          }
          break;
        }
      }
    };

    const onTouchEnd = async () => {
      if (!touchIdRef.current) return;
      const catId = touchCatIdRef.current;
      const wasCommitted = touchCommittedRef.current;
      touchIdRef.current = null;
      touchCatIdRef.current = null;
      touchCommittedRef.current = false;
      setDraggingId(null);
      setDraggingCategoryId(null);
      if (wasCommitted && catId) {
        const ids = orderRef.current.filter(
          (id) => products.find((p) => p.id === id)?.categoryId === catId
        );
        try { await onReorder(catId, ids); }
        catch { setOrder(products.map((p) => p.id)); }
      }
    };

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);
    return () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [onReorder, products]);

  return (
    <table className="data-table">
      <thead>
        <tr>
          {!searchActive && <th style={{ width: 40 }} />}
          <th style={{ width: 60 }} />
          <th>Название</th>
          <th>Категория</th>
          <th>Цена</th>
          <th>Старая</th>
          <th>Описание</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        {orderedProducts.length === 0 ? (
          <tr>
            <td
              colSpan={searchActive ? 7 : 8}
              style={{ textAlign: "center", color: "var(--a-text-muted)", padding: "32px" }}
            >
              Товаров пока нет
            </td>
          </tr>
        ) : (
          orderedProducts.map((product) => (
            <tr
              key={product.id}
              data-prod-id={product.id}
              data-prod-cat={product.categoryId}
              draggable={!searchActive}
              className={[
                !searchActive ? "is-draggable" : "",
                draggingId === product.id ? "is-dragging" : "",
              ].filter(Boolean).join(" ")}
              onDragStart={(e) => handleDragStart(e, product)}
              onDragOver={(e) => handleDragOver(e, product)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, product)}
            >
              {!searchActive && (
                <td className="drag-cell">
                  <span className="drag-handle" title="Перетащите для сортировки">⠿</span>
                </td>
              )}
              <td className="thumb-cell" data-label="Фото">
                {product.image
                  ? <img src={normalizeImagePath(product.image)} alt={product.name} className="product-thumb" /> // eslint-disable-line @next/next/no-img-element
                  : <div className="product-thumb no-img" />
                }
              </td>
              <td data-label="Название"><strong>{product.name}</strong></td>
              <td data-label="Категория">{categoryMap.get(product.categoryId) ?? "—"}</td>
              <td data-label="Цена" className="price-cell">{fmt(product.price)} тг</td>
              <td data-label="Старая цена" className="price-cell">
                {product.oldPrice ? `${fmt(product.oldPrice)} тг` : "—"}
              </td>
              <td data-label="Описание" className="desc-cell">{product.description || "—"}</td>
              <td data-label="Действия">
                <div className="row-actions">
                  <button type="button" className="ghost" onClick={() => onEdit(product.id)}>
                    Изменить
                  </button>
                  <button type="button" className="danger" onClick={() => onDelete(product.id)}>
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
