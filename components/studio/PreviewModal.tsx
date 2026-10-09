"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { PreviewStage } from "@/components/studio/PreviewStage";
import { useStudio } from "@/components/providers/StudioProvider";
import { exportPreview } from "@/lib/export-preview";

export function PreviewModal({ onClose }: { onClose: () => void }) {
  const { job, clips, library, pushToast, selectedClip } = useStudio();
  const [busy, setBusy] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const clip = clips.find((item) => item.id === job.clipId) ?? selectedClip;
  const source = library.find((face) => face.id === job.sourceFaceId);
  const target = clip?.faces.find((face) => face.id === job.targetFaceId);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const timer = window.setInterval(() => {
      setPlayhead((value) => (value >= 100 ? 0 : value + 2));
    }, 80);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearInterval(timer);
    };
  }, [onClose]);

  async function download() {
    if (!clip) return;
    setBusy(true);
    try {
      if (job.resultVideo) {
        const response = await fetch(job.resultVideo);
        if (!response.ok) throw new Error("Video indirilemedi");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `swapface-${clip.title}.mp4`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        pushToast(job.watermark ? "Filigranlı video indirildi" : "Filigransız video indirildi");
        return;
      }
      await exportPreview({
        imageUrl: job.resultImage || clip.frame,
        videoUrl: job.resultImage ? undefined : clip.videoUrl,
        quality: job.quality,
        watermark: job.watermark,
        faceImageUrl: job.resultImage || job.status !== "done" ? undefined : source?.image,
        box: job.resultImage || job.status !== "done" ? undefined : target?.box,
        filenameBase: `swapface-${clip.title}`,
      });
      pushToast(job.watermark ? "Filigranlı video indirildi" : "Filigransız 1080p video indirildi");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "İndirme başarısız");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#141224] shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">Dönüşüm Önizlemesi</h3>
            <p className="text-[12px] text-[#b7b2c9]" data-testid="export-policy">
              {job.watermark ? "Filigranlı" : "Filigransız"} · {job.quality}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4">
          <div className="aspect-video">
            <PreviewStage
              clip={clip}
              source={source}
              targetBox={target?.box}
              job={job}
              showPlay={false}
            />
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[#8b5cf6]" style={{ width: `${playhead}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <p className="text-[12px] text-[#9a95ad]">
            Demo motoru önizlemesi. İndirilen dosyada planının filigran ve kalite kuralı uygulanır.
          </p>
          <button
            type="button"
            data-testid="download-preview"
            disabled={busy || job.status !== "done"}
            onClick={() => void download()}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#6d5cff] to-[#d946ef] px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            {busy ? "Hazırlanıyor" : "İndir"}
          </button>
        </div>
      </div>
    </div>
  );
}
