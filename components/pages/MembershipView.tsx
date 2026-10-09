"use client";

import { Check } from "lucide-react";
import { Watermark } from "@/components/studio/Watermark";
import { useStudio } from "@/components/providers/StudioProvider";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";

const packs = [
  { credits: 50, label: "Başlangıç", hint: "5 dönüşüm" },
  { credits: 120, label: "Stüdyo", hint: "12 dönüşüm" },
  { credits: 300, label: "Sahne", hint: "30 dönüşüm" },
];

export function MembershipView() {
  const { plan, setPlan, credits, addCredits, dailyLimit } = useStudio();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <PlanCard
          name="Standart"
          active={plan === "standard"}
          price="Ücretsiz"
          points={[
            "Sol alt köşede SwapFace filigranı",
            "720p dışa aktarma",
            "Günde 10 dönüşüm",
            "Yüz kütüphanesi",
          ]}
          action="Standart kullan"
          onClick={() => setPlan("standard")}
          testId="plan-standard"
        />
        <PlanCard
          name="Pro"
          active={plan === "pro"}
          price="Filigransız"
          points={[
            "Filigran kalkar",
            "1080p dışa aktarma",
            "Günde 30 dönüşüm",
            "Aynı 10 kredi ücreti",
          ]}
          action="Pro'ya geç"
          onClick={() => setPlan("pro")}
          testId="plan-pro"
        />
      </div>
      <Panel title="Filigran farkı" subtitle={`Şu an günlük limit ${dailyLimit}. Mevcut kredi: ${credits}.`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Compare label="Standart · 720p" watermark />
          <Compare label="Pro · 1080p" watermark={false} />
        </div>
      </Panel>
      <Panel title="Kredi yükle" subtitle="Ödeme sağlayıcısı bu demoda bağlı değil. Paketler bakiyeyi yerelde artırır.">
        <div className="grid gap-3 sm:grid-cols-3">
          {packs.map((pack) => (
            <button
              key={pack.credits}
              type="button"
              data-testid={`credits-${pack.credits}`}
              onClick={() => addCredits(pack.credits)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left hover:border-[#8b5cf6]"
            >
              <p className="text-lg font-semibold">+{pack.credits}</p>
              <p className="text-sm text-white">{pack.label}</p>
              <p className="text-xs text-[#9a95ad]">{pack.hint}</p>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PlanCard({
  name,
  active,
  price,
  points,
  action,
  onClick,
  testId,
}: {
  name: string;
  active: boolean;
  price: string;
  points: string[];
  action: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <Panel className={cn(active && "border-[#8b5cf6]")}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-[#c4b5fd]">{price}</p>
        </div>
        {active ? (
          <span className="rounded-full bg-[#7c5cff]/25 px-2 py-1 text-[11px] font-semibold text-[#ddd6fe]">
            Mevcut plan
          </span>
        ) : null}
      </div>
      <ul className="mt-4 space-y-2">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-sm text-[#ddd8ee]">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c4b5fd]" />
            {point}
          </li>
        ))}
      </ul>
      <button
        type="button"
        data-testid={testId}
        onClick={onClick}
        className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#6d5cff] to-[#d946ef] py-2.5 text-sm font-semibold"
      >
        {active ? "Seçili" : action}
      </button>
    </Panel>
  );
}

function Compare({ label, watermark }: { label: string; watermark: boolean }) {
  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-2xl">
        <img src="/media/frame-weeknd.jpg" alt="" className="h-full w-full object-cover" />
        {watermark ? <Watermark className="bottom-3 left-3" /> : null}
      </div>
      <p className="mt-2 text-center text-xs text-[#b7b2c9]">{label}</p>
    </div>
  );
}
