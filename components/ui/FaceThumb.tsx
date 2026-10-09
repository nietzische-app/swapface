import { cn } from "@/lib/utils";

export function FaceThumb({
  src,
  position,
  className,
  alt = "",
}: {
  src: string;
  position?: string;
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-cover", className)}
      style={{ objectPosition: position || "center" }}
    />
  );
}
