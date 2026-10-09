"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { FaceThumb } from "@/components/ui/FaceThumb";
import { useStudio } from "@/components/providers/StudioProvider";
import { cn } from "@/lib/utils";

const titles: Record<string, string> = {
  "/": "ADIM ADIM VİDEO YÜZ DEĞİŞTİRME",
  "/dashboard": "DASHBOARD",
  "/upload": "DOSYA YÜKLE",
  "/library": "YÜZ KÜTÜPHANESİ",
  "/membership": "ÜYELİK / KREDİ",
  "/settings": "AYARLAR",
};

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { displayName, plan, notifications } = useStudio();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const { logout } = useStudio();

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
      if (!bellRef.current?.contains(event.target as Node)) setBellOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  const notes = [
    plan === "pro"
      ? "Pro plandasın: filigran kapalı, dışa aktarma 1080p."
      : "Standart planda videoların sol alt köşesine SwapFace filigranı basılır.",
    "Bir dönüşüm 10 kredi kullanır.",
    notifications ? "Bildirimler açık." : "Bildirimler kapalı.",
  ];

  return (
    <header className="flex h-[68px] shrink-0 items-center justify-between gap-3 px-4 lg:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white lg:hidden"
          onClick={onMenu}
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-[13px] font-semibold tracking-[0.12em] text-white sm:text-[15px] sm:tracking-[0.14em]">
          {titles[pathname] ?? "SWAPFACE"}
        </h1>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            data-testid="notifications"
            aria-label="Bildirimler"
            onClick={() => {
              setBellOpen((open) => !open);
              setUnread(false);
            }}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-white"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ff4d6d]" /> : null}
          </button>
          {bellOpen ? (
            <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-white/10 bg-[#1b1730] p-3 shadow-2xl">
              <p className="px-1 pb-2 text-[12px] font-semibold text-white">Bildirimler</p>
              <ul className="space-y-2">
                {notes.map((note) => (
                  <li key={note} className="rounded-xl bg-white/[0.04] px-3 py-2 text-[12px] leading-snug text-[#d5d0e6]">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            data-testid="user-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-2.5"
          >
            <FaceThumb src="/media/avatar-demir.jpg" alt="" className="h-8 w-8 rounded-full" />
            <span className="hidden text-[13px] font-medium text-white sm:inline">{displayName}</span>
            {plan === "pro" ? (
              <span className="rounded-full bg-[#7c5cff]/30 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#ddd6fe]">
                PRO
              </span>
            ) : null}
            <ChevronDown className="h-4 w-4 text-[#b7b2c9]" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#1b1730] py-1 shadow-2xl">
              <Link
                href="/membership"
                className="block px-3 py-2 text-[13px] text-[#ddd8ee] hover:bg-white/[0.05]"
                onClick={() => setMenuOpen(false)}
              >
                Üyelik / Kredi
              </Link>
              <Link
                href="/settings"
                className="block px-3 py-2 text-[13px] text-[#ddd8ee] hover:bg-white/[0.05]"
                onClick={() => setMenuOpen(false)}
              >
                Ayarlar
              </Link>
              <button
                type="button"
                className={cn("block w-full px-3 py-2 text-left text-[13px] text-[#ddd8ee] hover:bg-white/[0.05]")}
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                  router.push("/");
                }}
              >
                Çıkış Yap
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
