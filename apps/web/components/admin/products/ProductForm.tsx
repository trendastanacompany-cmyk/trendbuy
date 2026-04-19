"use client";

import { useEffect, useRef, useState } from "react";
import { adminApi } from "../../../lib/api/admin";
import type { Category, Product } from "../../../lib/types";

type ProductPayload = {
  categoryId: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number | null;
  description?: string;
};

type Props = {
  editing: Product | null;
  categories: Category[];
  onSave: (payload: ProductPayload) => Promise<void>;
  onCancel: () => void;
  showToast: (msg: string) => void;
};

export default function ProductForm({
  editing,
  categories,
  onSave,
  onCancel,
  showToast,
}: Props) {
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCategoryId(editing?.categoryId ?? "");
    setName(editing?.name ?? "");
    setImage(editing?.image ?? "");
    setPrice(editing ? String(editing.price) : "");
    setOldPrice(editing?.oldPrice != null ? String(editing.oldPrice) : "");
    setDescription(editing?.description ?? "");
    nameRef.current?.focus();
  }, [editing]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
    setUploading(true);
    try {
      const path = await adminApi.uploadImage(file);
      setImage(path);
      showToast("Изображение загружено");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let resolvedImage = image;
    if (!resolvedImage && fileRef.current?.files?.[0]) {
      try {
        resolvedImage = await adminApi.uploadImage(fileRef.current.files[0]);
      } catch {
        showToast("Не удалось загрузить изображение");
        return;
      }
    }
    if (!categoryId || !name.trim() || !resolvedImage) {
      showToast("Заполните обязательные поля и загрузите изображение");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        categoryId,
        name: name.trim(),
        image: resolvedImage,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        description: description.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  const previewSrc =
    image && !image.startsWith("blob:")
      ? image.startsWith("/") || /^https?:\/\//i.test(image)
        ? image
        : `/${image}`
      : image;

  return (
    <form className="modal__body modal__grid" onSubmit={handleSubmit}>
      <div className="field">
        <label className="modal__label" htmlFor="product-category">
          Категория
        </label>
        <select
          id="product-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          <option value="">Выберите категорию</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="modal__label" htmlFor="product-name">
          Название
        </label>
        <input
          id="product-name"
          ref={nameRef}
          type="text"
          placeholder="Название товара"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="field span-2 upload-group">
        <label className="upload-label" htmlFor="product-image-file">
          {uploading ? "Загрузка..." : "Загрузить изображение"}
        </label>
        <input
          id="product-image-file"
          ref={fileRef}
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={handleFileChange}
        />
      </div>

      <div className="field span-2">
        <label className="modal__label" htmlFor="product-image">
          Путь к изображению
        </label>
        <input
          id="product-image"
          type="text"
          placeholder="Заполнится автоматически после загрузки"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          readOnly={uploading}
          required
        />
      </div>

      <div className="field">
        <label className="modal__label" htmlFor="product-price">
          Цена
        </label>
        <input
          id="product-price"
          type="number"
          min={0}
          step={0.01}
          placeholder="Цена"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label className="modal__label" htmlFor="product-old-price">
          Старая цена
        </label>
        <input
          id="product-old-price"
          type="number"
          min={0}
          step={0.01}
          placeholder="Старая цена (необязательно)"
          value={oldPrice}
          onChange={(e) => setOldPrice(e.target.value)}
        />
      </div>

      <div className="field span-2">
        <label className="modal__label" htmlFor="product-description">
          Описание
        </label>
        <input
          id="product-description"
          type="text"
          placeholder="Описание (необязательно)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {previewSrc && (
        <div className="image-preview span-2">
          <p className="image-preview__title">Превью изображения</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewSrc} alt="Превью товара" />
        </div>
      )}

      <div className="modal__actions span-2">
        <button type="submit" disabled={saving || uploading}>
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
        {editing && (
          <button type="button" className="ghost" onClick={onCancel}>
            Отмена редактирования
          </button>
        )}
      </div>
    </form>
  );
}
