"use client";

import { useEffect, type ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ id, title, isOpen, onClose, children }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("lock");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("lock");
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal is-open" id={id} aria-hidden="false">
      <div className="modal__overlay" onClick={onClose} />
      <div
        className="modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
      >
        <div className="modal__head">
          <h3 className="modal__title" id={`${id}-title`}>
            {title}
          </h3>
          <button type="button" className="modal__close" onClick={onClose}>
            Закрыть
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
