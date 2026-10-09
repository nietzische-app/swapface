"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useStudio } from "@/components/providers/StudioProvider";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";

export function VideoSelectStep() {
  const { clips, selectedClipId, selectClip, addUploadedClip, selectedClip } = useStudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const trending = clips.filter((clip) => !clip.custom).slice(0, 3);

  return (
    <Panel
      title="1. Video Seç veya Yükle"
      subtitle="Grid of popular trending clips (movie/music videos)"
      className="h-full"
    >
      <div className="grid h-full min-h-[420px] grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.15fr)_minmax(180px,0.82fr)] xl:min-h-0">
        <div className="flex min-h-0 flex-col gap-2.5">
          {trending.map((clip) => {
            const selected = clip.id === selectedClipId;
            return (
              <button
                key={clip.id}
                type="button"
                data-testid={`clip-${clip.id}`}
                onClick={() => selectClip(clip.id)}
                className="flex min-h-0 flex-1 flex-col text-left"
              >
                <div
                  className={cn(
                    "relative min-h-[92px] flex-1 overflow-hidden rounded-2xl border-2",
                    selected ? "border-[#8b5cf6]" : "border-transparent",
                  )}
                >
                  <img src={clip.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </div>
                <span className="mt-1 truncate text-[11px] text-[#b7b2c8]">{clip.title}</span>
              </button>
            );
          })}
        </div>
        <div
          role="button"
          tabIndex={0}
          data-testid="video-dropzone"
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
          onClick={() => inputRef.current?.click()}
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
            "flex h-full min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 text-center transition",
            over ? "border-[#a78bfa] bg-[#7c5cff]/10" : "border-white/15 bg-white/[0.02] hover:border-white/30",
          )}
        >
          <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-white/[0.05]">
            <Upload className="h-5 w-5 text-[#d6ccff]" />
          </span>
          <p className="text-[13px] font-medium leading-snug text-[#d9d4e8]">
            Bilgisayarından/Galeriden
            <br />
            Kendi Videonu Yükle
          </p>
          <p className="mt-2 text-[11px] text-[#8f8aa3]">Sürükle ve Bırak veya Göz At</p>
          {selectedClip?.custom ? (
            <p className="mt-3 max-w-full truncate text-[11px] text-[#c4b5fd]">{selectedClip.title}</p>
          ) : null}
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
      </div>
    </Panel>
  );
}
