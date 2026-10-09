"use client";

import { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useStudio } from "@/components/providers/StudioProvider";
import { useContainerRatio } from "@/components/studio/useContainerRatio";
import { FaceThumb } from "@/components/ui/FaceThumb";
import { Panel } from "@/components/ui/Panel";
import { cn, mapCoverBox, toDataUrl } from "@/lib/utils";
import type { DetectedFace } from "@/lib/types";

export function PersonSelectStep() {
  const { selectedClip, selectedTarget, selectTargetFace, replaceClipFaces, pushToast } = useStudio();
  const [scanning, setScanning] = useState(false);
  const [imageRatio, setImageRatio] = useState(16 / 9);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRatio = useContainerRatio(frameRef);

  async function rescan() {
    if (!selectedClip || scanning) return;
    setScanning(true);
    try {
      let response: Response;
      if (selectedClip.videoUrl) {
        const blob = await fetch(selectedClip.videoUrl).then((item) => item.blob());
        const form = new FormData();
        form.append("video", blob, "clip.mp4");
        try {
          response = await fetch("http://127.0.0.1:3099/detect-video", { method: "POST", body: form });
        } catch {
          pushToast("Yerel yüz tarayıcısı kapalı. Worker penceresini kontrol et.");
          return;
        }
      } else {
        const image = selectedClip.frame.startsWith("/media/") ? undefined : await toDataUrl(selectedClip.frame);
        response = await fetch("/api/detect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clipId: selectedClip.id, image }),
        });
      }
      const data = (await response.json()) as { faces?: DetectedFace[]; error?: string; at?: number };
      if (!response.ok || !data.faces) {
        pushToast(data.error || "Tarama başarısız");
        return;
      }
      replaceClipFaces(selectedClip.id, data.faces);
      if (videoRef.current && typeof data.at === "number") {
        videoRef.current.currentTime = data.at;
        videoRef.current.pause();
      }
      pushToast(data.faces.length ? `${data.faces.length} yüz bulundu` : "Bu karelerde yüz bulunamadı");
    } catch {
      pushToast("Tarama başarısız");
    } finally {
      setScanning(false);
    }
  }

  return (
    <Panel
      title="2. Klipteki Değişecek Kişiyi Seç"
      className="h-full"
      action={
        <button
          type="button"
          data-testid="rescan"
          onClick={() => void rescan()}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] text-[#c9c3dc] hover:bg-white/[0.04]"
        >
          <RefreshCw className={cn("h-3 w-3", scanning && "animate-spin")} />
          Tara
        </button>
      }
    >
      <div ref={frameRef} className="relative h-full min-h-[180px] overflow-hidden rounded-2xl bg-black">
        {selectedClip ? (
          selectedClip.videoUrl ? (
            <video
              ref={videoRef}
              key={selectedClip.videoUrl}
              src={selectedClip.videoUrl}
              poster={selectedClip.frame}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              autoPlay
              onLoadedMetadata={(event) => {
                const video = event.currentTarget;
                if (video.videoWidth && video.videoHeight) {
                  setImageRatio(video.videoWidth / video.videoHeight);
                }
              }}
            />
          ) : (
            <img
              src={selectedClip.frame}
              alt=""
              className="h-full w-full object-cover"
              onLoad={(event) => {
                const image = event.currentTarget;
                if (image.naturalWidth && image.naturalHeight) {
                  setImageRatio(image.naturalWidth / image.naturalHeight);
                }
              }}
            />
          )
        ) : null}
        {scanning ? <div className="absolute inset-0 animate-pulse bg-[#7c5cff]/15" /> : null}
        {selectedClip?.faces.map((face) => {
          const active = face.id === selectedTarget?.id;
          const box = mapCoverBox(face.box, containerRatio || imageRatio, imageRatio);
          return (
            <button
              key={face.id}
              type="button"
              data-testid={`target-${face.id}`}
              aria-label={face.name}
              aria-pressed={active}
              onClick={() => selectTargetFace(face.id)}
              className={cn(
                "absolute rounded-md border-2 transition",
                active
                  ? "border-[#d8b4fe] shadow-[0_0_0_3px_rgba(167,139,250,0.35)]"
                  : "border-[#7dd3fc]/90 hover:border-white",
              )}
              style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.w}%`,
                height: `${box.h}%`,
              }}
            />
          );
        })}
        {selectedTarget ? (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full border border-[#8b5cf6] bg-[#161226]/90 py-1 pl-1 pr-3 shadow-lg">
            <FaceThumb
              src={selectedTarget.avatar}
              position={selectedTarget.avatarPosition}
              className="h-7 w-7 rounded-full"
            />
            <span className="text-[12px] font-medium text-white">{selectedTarget.name}</span>
          </div>
        ) : (
          <p className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white">
            Bu karede yüz bulunamadı
          </p>
        )}
      </div>
    </Panel>
  );
}
