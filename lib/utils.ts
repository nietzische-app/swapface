import type { FaceBox } from "@/lib/types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function clampBox(box: FaceBox): FaceBox {
  const x = Math.max(0, Math.min(box.x, 94));
  const y = Math.max(0, Math.min(box.y, 94));
  return {
    x,
    y,
    w: Math.max(6, Math.min(box.w, 100 - x)),
    h: Math.max(6, Math.min(box.h, 100 - y)),
  };
}

/** Map a box defined on the source image onto an object-cover container. */
export function mapCoverBox(box: FaceBox, containerRatio: number, imageRatio: number): FaceBox {
  if (!containerRatio || !imageRatio) return box;

  if (containerRatio + 0.02 < imageRatio) {
    const visible = containerRatio / imageRatio;
    const offset = (1 - visible) / 2;
    return clampBox({
      x: ((box.x / 100 - offset) / visible) * 100,
      y: box.y,
      w: (box.w / 100 / visible) * 100,
      h: box.h,
    });
  }

  if (containerRatio > imageRatio + 0.02) {
    const visible = imageRatio / containerRatio;
    const offset = (1 - visible) / 2;
    return clampBox({
      x: box.x,
      y: ((box.y / 100 - offset) / visible) * 100,
      w: box.w,
      h: (box.h / 100 / visible) * 100,
    });
  }

  return box;
}
