"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Category } from "../../../lib/types";
import { useAutoScroll } from "../../../hooks/useAutoScroll";

type Props = {
  categories: Category[];
  searchActive: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => Promise<void>;
};

export default function CategoryTable({
  categories,
  searchActive,
  onEdit,
  onDelete,
  onReorder,
}: Props) {
  const [order, setOrder] = useState<string[]>(() => categories.map((c) => c.id));
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // touch state
  const touchIdRef = useRef<string | null>(null);
  const touchCommittedRef = useRef(false);
  const orderRef = useRef(order);
  orderRef.current = order;

  useAutoScroll(draggingId !== null);

  useEffect(() => {
    setOrder(categories.map((c) => c.id));
  }, [categories]);

  const orderedCategories = order
    .map((id) => categories.find((c) => c.id === id))
    .filter(Boolean) as Category[];

  // ── Mouse drag ────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    if (searchActive) { e.preventDefault(); return; }
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, [searchActive]);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    e.preventDefault();
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(draggingId);
      const to = next.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, draggingId);
      return next;
    });
  }, [draggingId]);

  const handleDragEnd = useCallback(async () => {
    if (!draggingId) return;
    setDraggingId(null);
    try { await onReorder(orderRef.current); }
    catch { setOrder(categories.map((c) => c.id)); }
  }, [draggingId, onReorder, categories]);

  // ── Touch drag ────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    if (searchActive) return;
    touchIdRef.current = id;
    touchCommittedRef.current = false;
  }, [searchActive]);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!touchIdRef.current) return;

      if (!touchCommittedRef.current) {
        touchCommittedRef.current = true;
        setDraggingId(touchIdRef.current);
      }

      e.preventDefault();

      const touch = e.touches[0];
      const rows = document.querySelectorAll<HTMLElement>("[data-cat-id]");
      for (const row of rows) {
        const rect = row.getBoundingClientRect();
        if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          const targetId = row.getAttribute("data-cat-id");
          if (targetId && targetId !== touchIdRef.current) {
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
      const wasCommitted = touchCommittedRef.current;
      touchIdRef.current = null;
      touchCommittedRef.current = false;
      setDraggingId(null);
      if (wasCommitted) {
        try { await onReorder(orderRef.current); }
        catch { setOrder(categories.map((c) => c.id)); }
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
  }, [onReorder, categories]);

  return (
    <table className="data-table">
      <thead>
        <tr>
          {!searchActive && <th style={{ width: 40 }} />}
          <th>Название</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        {orderedCategories.length === 0 ? (
          <tr>
            <td
              colSpan={searchActive ? 2 : 3}
              style={{ textAlign: "center", color: "var(--a-text-muted)", padding: "32px" }}
            >
              Категорий пока нет
            </td>
          </tr>
        ) : (
          orderedCategories.map((cat) => (
            <tr
              key={cat.id}
              data-cat-id={cat.id}
              draggable={!searchActive}
              className={[
                !searchActive ? "is-draggable" : "",
                draggingId === cat.id ? "is-dragging" : "",
              ].filter(Boolean).join(" ")}
              onDragStart={(e) => handleDragStart(e, cat.id)}
              onDragOver={(e) => handleDragOver(e, cat.id)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, cat.id)}
            >
              {!searchActive && (
                <td className="drag-cell">
                  <span className="drag-handle" title="Перетащите для сортировки">⠿</span>
                </td>
              )}
              <td data-label="Название">{cat.name}</td>
              <td data-label="Действия">
                <div className="row-actions">
                  <button type="button" className="ghost" onClick={() => onEdit(cat.id)}>
                    Изменить
                  </button>
                  <button type="button" className="danger" onClick={() => onDelete(cat.id)}>
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
