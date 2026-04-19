"use client";

import { useEffect, useRef } from "react";

const EDGE_ZONE = 80;
const MAX_SPEED = 18;

export function useAutoScroll(active: boolean) {
  const rafRef = useRef<number | null>(null);
  const yRef = useRef(0);

  useEffect(() => {
    if (!active) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const onDragOver = (e: DragEvent) => { yRef.current = e.clientY; };
    const onTouchMove = (e: TouchEvent) => { yRef.current = e.touches[0].clientY; };

    const scroll = () => {
      const y = yRef.current;
      const vh = window.innerHeight;
      if (y < EDGE_ZONE) {
        window.scrollBy(0, -Math.round(MAX_SPEED * (1 - y / EDGE_ZONE)));
      } else if (y > vh - EDGE_ZONE) {
        window.scrollBy(0, Math.round(MAX_SPEED * (1 - (vh - y) / EDGE_ZONE)));
      }
      rafRef.current = requestAnimationFrame(scroll);
    };

    document.addEventListener("dragover", onDragOver);
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    rafRef.current = requestAnimationFrame(scroll);

    return () => {
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("touchmove", onTouchMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active]);
}
