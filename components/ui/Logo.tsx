import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-[#7c5cff] to-[#d946ef] shadow-[0_6px_16px_rgba(124,92,255,0.45)]">
        <Star className="h-4 w-4 fill-white text-white" />
      </span>
      <span className="text-[17px] font-extrabold tracking-[0.16em] text-white">SWAPFACE</span>
    </div>
  );
}
