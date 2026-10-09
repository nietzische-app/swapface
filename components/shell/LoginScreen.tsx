"use client";

import { FormEvent, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { useStudio } from "@/components/providers/StudioProvider";

export function LoginScreen() {
  const { displayName, setDisplayName, login } = useStudio();
  const [name, setName] = useState(displayName);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim()) setDisplayName(name.trim());
    login();
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#0e0c18] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#171428] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
      >
        <Logo />
        <h1 className="mt-8 text-2xl font-semibold text-white">Stüdyoya devam et</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#a39eb8]">
          Trend kliplerde veya kendi videonda bir yüz seç, kendi fotoğrafınla önizle.
        </p>
        <label className="mt-6 block text-xs font-medium text-[#c8c3d8]" htmlFor="login-name">
          Görünen ad
        </label>
        <input
          id="login-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-[#100e1c] px-4 py-3 text-sm text-white outline-none ring-[#8b5cf6] focus:ring-2"
        />
        <button
          type="submit"
          data-testid="login-submit"
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#5b6cff] via-[#7c5cff] to-[#e879f9] py-3 text-sm font-bold tracking-wide text-white"
        >
          Giriş yap
        </button>
      </form>
    </div>
  );
}
