import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  subtitle,
  children,
  className,
  bodyClassName,
  action,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col rounded-[22px] border border-white/[0.06] bg-[#19162b] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        className,
      )}
    >
      {title ? (
        <header className="mb-2.5 flex shrink-0 items-start justify-between gap-3">
          <div>
            <h2 className="text-[13.5px] font-semibold leading-tight text-white">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-[11px] leading-snug text-[#8d88a4]">{subtitle}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
