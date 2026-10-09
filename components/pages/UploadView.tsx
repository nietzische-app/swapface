"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { useStudio } from "@/components/providers/StudioProvider";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";

export function UploadView() {
  const { addUploadedClip, clips, selectClip } = useStudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const custom = clips.filter((clip) => clip.custom);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <Panel title="Kendi videonu yükle" subtitle="MP4, MOV veya WebM. Stüdyo bu kareyi hedef yüz taramasına alır.">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setOver(false);
            const file = event.dataTransfer.files?.[0];
            if (file) void addUploadedClip(file);
          }}
          className={cn(
            "grid min-h-[280px] place-items-center rounded-3xl border border-dashed px-6 text-center",
            over ? "border-[#a78bfa] bg-[#7c5cff]/10" : "border-white/15",
          )}
        >
          <div>
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-white/[0.05]">
              <Upload className="h-6 w-6 text-[#d6ccff]" />
            </span>
            <p className="text-base font-medium">Sürükle ve bırak veya göz at</p>
            <p className="mt-1 text-sm text-[#9a95ad]">En fazla 250 MB</p>
            <button
              type="button"
              data-testid="upload-browse"
              onClick={() => inputRef.current?.click()}
              className="mt-5 rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              Dosya seç
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void addUploadedClip(file);
              event.target.value = "";
            }}
          />
        </div>
      </Panel>
      <Panel title="Yüklenenler">
        {custom.length === 0 ? (
          <p className="text-sm text-[#b7b2c9]">Henüz kendi videon yok.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {custom.map((clip) => (
              <li key={clip.id} className="overflow-hidden rounded-2xl border border-white/10">
                <img src={clip.poster} alt="" className="h-36 w-full object-cover" />
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="truncate text-sm">{clip.title}</span>
                  <Link
                    href="/"
                    onClick={() => selectClip(clip.id)}
                    className="text-xs font-semibold text-[#c4b5fd]"
                  >
                    Stüdyoda aç
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
