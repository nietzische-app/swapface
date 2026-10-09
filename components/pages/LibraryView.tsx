"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { SelfieModal } from "@/components/studio/SelfieModal";
import { useStudio } from "@/components/providers/StudioProvider";
import { FaceThumb } from "@/components/ui/FaceThumb";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";

export function LibraryView() {
  const { library, selectedSourceFaceId, selectSourceFace, addLibraryFace, removeLibraryFace } = useStudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selfie, setSelfie] = useState(false);

  return (
    <div className="mx-auto max-w-5xl">
      <Panel
        title="Yüz kütüphanesi"
        subtitle="Dönüşümde kullanacağın fotoğraflar. Seçili yüz stüdyodaki 3. adıma yazılır."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold"
            >
              Fotoğraf ekle
            </button>
            <button
              type="button"
              data-testid="library-selfie"
              onClick={() => setSelfie(true)}
              className="inline-flex items-center gap-1 rounded-xl bg-[#7c5cff] px-3 py-2 text-xs font-semibold"
            >
              <Camera className="h-3.5 w-3.5" /> Selfie
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {library.map((face) => {
            const selected = face.id === selectedSourceFaceId;
            return (
              <div
                key={face.id}
                className={cn(
                  "rounded-2xl border p-3",
                  selected ? "border-[#8b5cf6] bg-[#2a2148]" : "border-white/10 bg-white/[0.03]",
                )}
              >
                <FaceThumb src={face.image} alt={face.name} className="mx-auto h-24 w-24 rounded-full" />
                <p className="mt-2 truncate text-center text-sm">{face.name}</p>
                <p className="text-center text-[11px] uppercase tracking-wide text-[#9a95ad]">{face.source}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => selectSourceFace(face.id)}
                    className="flex-1 rounded-xl bg-white/10 py-1.5 text-xs font-semibold"
                  >
                    {selected ? "Seçili" : "Seç"}
                  </button>
                  <button
                    type="button"
                    aria-label={`${face.name} sil`}
                    onClick={() => removeLibraryFace(face.id)}
                    className="grid h-8 w-8 place-items-center rounded-xl bg-white/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) addLibraryFace(file, "upload");
            event.target.value = "";
          }}
        />
      </Panel>
      {selfie ? (
        <SelfieModal onClose={() => setSelfie(false)} onCapture={(file) => addLibraryFace(file, "selfie")} />
      ) : null}
    </div>
  );
}
