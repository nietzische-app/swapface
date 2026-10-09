"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { SelfieModal } from "@/components/studio/SelfieModal";
import { useStudio } from "@/components/providers/StudioProvider";
import { FaceThumb } from "@/components/ui/FaceThumb";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";

export function FaceUploadStep() {
  const { library, selectedSourceFaceId, selectSourceFace, addLibraryFace } = useStudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState(false);
  const [selfie, setSelfie] = useState(false);
  const [over, setOver] = useState(false);

  return (
    <Panel title="3. Yeni Yüzünü Yükle (Kendi Fotoğrafın)" className="h-full">
      <div className="flex h-full min-h-[132px] items-stretch gap-3">
        <div
          data-testid="face-dropzone"
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setOver(false);
            const file = event.dataTransfer.files?.[0];
            if (file) addLibraryFace(file, "upload");
          }}
          className={cn(
            "relative flex w-[148px] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed px-3 text-center",
            over ? "border-[#a78bfa] bg-[#7c5cff]/10" : "border-white/15 bg-white/[0.02]",
          )}
        >
          <button type="button" onClick={() => setMenu((open) => !open)} className="flex flex-col items-center">
            <span className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-white/[0.05]">
              <ImagePlus className="h-4 w-4 text-[#d6ccff]" />
            </span>
            <span className="text-[11px] leading-snug text-[#c9c4d8]">
              Galeriden Fotoğraf Seç
              <br />
              veya Selfie Çek
            </span>
          </button>
          {menu ? (
            <div className="absolute left-2 right-2 top-2 z-10 overflow-hidden rounded-xl border border-white/10 bg-[#221b38] text-left shadow-xl">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/[0.05]"
                onClick={() => {
                  setMenu(false);
                  inputRef.current?.click();
                }}
              >
                <ImagePlus className="h-3.5 w-3.5" /> Galeriden seç
              </button>
              <button
                type="button"
                data-testid="open-selfie"
                className="flex w-full items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/[0.05]"
                onClick={() => {
                  setMenu(false);
                  setSelfie(true);
                }}
              >
                <Camera className="h-3.5 w-3.5" /> Selfie çek
              </button>
            </div>
          ) : null}
          <input
            ref={inputRef}
            data-testid="face-input"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) addLibraryFace(file, "upload");
              event.target.value = "";
            }}
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1">
          {library.map((face) => {
            const selected = face.id === selectedSourceFaceId;
            return (
              <button
                key={face.id}
                type="button"
                data-testid={`source-${face.id}`}
                aria-pressed={selected}
                onClick={() => selectSourceFace(face.id)}
                className={cn(
                  "flex w-[84px] shrink-0 flex-col items-center gap-1.5 rounded-2xl px-1.5 py-2",
                  selected ? "bg-[#2a2148] ring-1 ring-[#8b5cf6]" : "hover:bg-white/[0.04]",
                )}
              >
                <FaceThumb src={face.image} alt={face.name} className="h-14 w-14 rounded-full" />
                <span className="line-clamp-2 text-center text-[10px] leading-tight text-[#ddd8ee]">{face.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      {selfie ? (
        <SelfieModal
          onClose={() => setSelfie(false)}
          onCapture={(file) => addLibraryFace(file, "selfie")}
        />
      ) : null}
    </Panel>
  );
}
