"use client";

import { useEffect, useRef, useState } from "react";
import type { Category } from "../../../lib/types";

type Props = {
  editing: Category | null;
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
};

export default function CategoryForm({ editing, onSave, onCancel }: Props) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(editing?.name ?? "");
    nameRef.current?.focus();
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="modal__body" onSubmit={handleSubmit}>
      <div className="field">
        <label className="modal__label" htmlFor="category-name">
          Название
        </label>
        <input
          id="category-name"
          ref={nameRef}
          type="text"
          placeholder="Название категории"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="modal__actions">
        <button type="submit" disabled={saving}>
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
        {editing && (
          <button type="button" className="ghost" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
