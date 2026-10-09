"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export function SelfieModal({
  onClose,
  onCapture,
}: {
  onClose: () => void;
  onCapture: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        if (!cancelled) setError("Kameraya erişilemedi. Galeriden fotoğraf seçebilirsin.");
      }
    }

    void start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCapture(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
      onClose();
    }, "image/jpeg", 0.9);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#161226]">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Selfie çek</h3>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative aspect-video bg-black">
          {error ? (
            <p className="grid h-full place-items-center px-6 text-center text-sm text-[#d5d0e4]">{error}</p>
          ) : (
            <video ref={videoRef} className="h-full w-full -scale-x-100 object-cover" muted playsInline />
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm text-[#c8c3d8]">
            Vazgeç
          </button>
          <button
            type="button"
            data-testid="selfie-capture"
            disabled={Boolean(error)}
            onClick={capture}
            className="rounded-xl bg-[#7c5cff] px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Çek ve ekle
          </button>
        </div>
      </div>
    </div>
  );
}
