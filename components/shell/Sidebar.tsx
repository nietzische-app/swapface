"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  LayoutGrid,
  LogOut,
  ScanFace,
  Settings,
  Star,
  Upload,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useStudio } from "@/components/providers/StudioProvider";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/", label: "Trend Klipler", icon: Star },
  { href: "/upload", label: "Dosya Yükle", icon: Upload },
  { href: "/library", label: "Yüz Kütüphanesi", icon: ScanFace },
  { href: "/membership", label: "Üyelik/Kredi", icon: CreditCard },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const { logout } = useStudio();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/55 backdrop-blur-[2px] lg:hidden",
          open ? "block" : "hidden",
        )}
        onClick={onNavigate}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[232px] shrink-0 flex-col border-r border-white/[0.05] bg-[#110f1c] px-3.5 py-4 transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Logo className="px-2 py-1.5" />
        <nav className="mt-7 flex flex-col gap-1">
          {items.map((item) => {
            const active = isActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-${item.href === "/" ? "trends" : item.href.slice(1)}`}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition",
                  active
                    ? "bg-gradient-to-r from-[#6d4dff] to-[#9460ff] text-white shadow-[0_8px_22px_rgba(109,77,255,0.38)]"
                    : "text-[#a39eb8] hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", active && item.icon === Star && "fill-white")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          data-testid="logout"
          onClick={() => {
            onNavigate();
            logout();
          }}
          className="mb-2 mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-[#8f8aa6] transition hover:bg-white/[0.04] hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Çıkış Yap
        </button>
      </aside>
    </>
  );
}
