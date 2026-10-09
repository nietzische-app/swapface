"use client";

import { useStudio } from "@/components/providers/StudioProvider";
import { Panel } from "@/components/ui/Panel";

export function SettingsView() {
  const {
    displayName,
    email,
    notifications,
    setDisplayName,
    setEmail,
    setNotifications,
    resetDemo,
    plan,
  } = useStudio();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Panel title="Profil">
        <label className="block text-xs text-[#b7b2c9]" htmlFor="display-name">
          Görünen ad
        </label>
        <input
          id="display-name"
          data-testid="display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-[#100e1c] px-4 py-3 text-sm outline-none ring-[#8b5cf6] focus:ring-2"
        />
        <label className="mt-4 block text-xs text-[#b7b2c9]" htmlFor="email">
          E-posta
        </label>
        <input
          id="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-2xl border border-white/10 bg-[#100e1c] px-4 py-3 text-sm outline-none ring-[#8b5cf6] focus:ring-2"
        />
        <p className="mt-3 text-xs text-[#8d88a3]">Plan: {plan === "pro" ? "Pro" : "Standart"}</p>
      </Panel>
      <Panel title="Tercihler">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Bildirimler</span>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(event) => setNotifications(event.target.checked)}
            className="h-4 w-4 accent-[#7c5cff]"
          />
        </label>
      </Panel>
      <Panel title="Demo">
        <p className="text-sm text-[#b7b2c9]">
          Krediyi, planı ve görünen adı başlangıç haline döndürür. Yüklenen dosyalar bu oturumda kalır, sayfa yenilenince silinir.
        </p>
        <button
          type="button"
          data-testid="reset-demo"
          onClick={resetDemo}
          className="mt-4 rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
        >
          Demoyu sıfırla
        </button>
      </Panel>
    </div>
  );
}
