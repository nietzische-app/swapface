"use client";

import { useEffect, useState, type RefObject } from "react";

export function useContainerRatio(ref: RefObject<HTMLElement | null>) {
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const rect = element.getBoundingClientRect();
      if (rect.height > 0) setRatio(rect.width / rect.height);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return ratio;
}
