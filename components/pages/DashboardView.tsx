"use client";

import Link from "next/link";
import { ArrowRight, Clapperboard, ScanFace, Sparkles, Wallet } from "lucide-react";
import { useStudio } from "@/components/providers/StudioProvider";
import { Panel } from "@/components/ui/Panel";

export function DashboardView() {
  const { credits, dailyRemaining, dailyLimit, library, plan, history, selectedClip } = useStudio();
  const stats = [
    { label: "Kredi", value: String(credits), icon: Wallet },
    { label: "Günlük hak", value: `${dailyRemaining}/${dailyLimit}`, icon: Sparkles },
    { label: "Yüz kütüphanesi", value: String(library.length), icon: ScanFace },
    { label: "Plan", value: plan === "pro" ? "Pro" : "Standart", icon: Clapperboard },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Panel className="bg-[radial-gradient(600px_180px_at_0%_0%,rgba(124,92,255,0.28),transparent_60%),#19162b]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#c4b5fd]">Stüdyo</p>
            <h2 className="mt-1 text-xl font-semibold">Kaldığın yerden devam et</h2>
            <p className="mt-1 text-sm text-[#b7b2c9]">
              Seçili klip: {selectedClip?.title ?? "Henüz yok"}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6d5cff] to-[#d946ef] px-4 py-3 text-sm font-semibold"
          >
            Trend kliplere dön <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Panel key={stat.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-[#9a95ad]">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.05]">
                  <Icon className="h-5 w-5 text-[#c4b5fd]" />
                </span>
              </div>
            </Panel>
          );
        })}
      </div>
      <Panel title="Son dönüşümler">
        {history.length === 0 ? (
          <p className="text-sm text-[#b7b2c9]">Henüz dönüşüm yok. Trend Klipler üzerinden bir yüz seçip başlat.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {history.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-medium">{item.clipTitle}</span>
                <span className="text-[#b7b2c9]">
                  {item.watermark ? "Filigranlı" : "Filigransız"} · {item.quality} · {item.at}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
