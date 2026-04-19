"use client";

import { useCallback, useRef, useState } from "react";

export function useToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToastMessage(text);
    timerRef.current = setTimeout(() => setToastMessage(null), 2800);
  }, []);

  return { toastMessage, showToast };
}
