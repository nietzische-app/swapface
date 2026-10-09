import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Watermark({ className }: { className?: string }) {
  return (
    <div
      data-testid="watermark"
      className={cn(
        "pointer-events-none absolute z-20 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 shadow-lg backdrop-blur-sm",
        className ?? "bottom-12 left-2.5",
      )}
    >
      <Star className="h-3 w-3 fill-white text-white" />
      <span className="text-[10px] font-bold tracking-[0.18em] text-white">SWAPFACE</span>
    </div>
  );
}
