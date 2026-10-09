"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { useContainerRatio } from "@/components/studio/useContainerRatio";
import { Watermark } from "@/components/studio/Watermark";
import type { Clip, FaceBox, JobState, LibraryFace } from "@/lib/types";
import { mapCoverBox } from "@/lib/utils";

const strips = ["18% 40%", "48% 30%", "72% 42%", "36% 62%", "84% 36%"];

export function PreviewStage({
  clip,
  source,
  targetBox,
  job,
  onPlay,
  showPlay = true,
}: {
  clip?: Clip;
  source?: LibraryFace;
  targetBox?: FaceBox;
  job: JobState;
  onPlay?: () => void;
  showPlay?: boolean;
}) {
  const swapped = job.status === "done" ? job.resultImage : undefined;
  const showResult = Boolean(swapped) || (job.status === "done" && source && targetBox);
  const showWatermark = Boolean(showResult && job.watermark);
  const frameRef = useRef<HTMLDivElement>(null);
  const containerRatio = useContainerRatio(frameRef);
  const [imageRatio, setImageRatio] = useState(16 / 9);
  const mapped = targetBox ? mapCoverBox(targetBox, containerRatio || imageRatio, imageRatio) : undefined;

  return (
    <div ref={frameRef} className="relative h-full min-h-[120px] overflow-hidden rounded-2xl bg-black">
      {swapped ? (
        <img
          src={swapped}
          alt=""
          className="h-full w-full object-cover"
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth && image.naturalHeight) {
              setImageRatio(image.naturalWidth / image.naturalHeight);
            }
          }}
        />
      ) : clip?.videoUrl && job.status === "done" ? (
        <video
          src={clip.videoUrl}
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
          src={clip?.frame ?? "/media/frame-weeknd.jpg"}
          alt=""
          className="h-full w-full object-cover"
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth && image.naturalHeight) {
              setImageRatio(image.naturalWidth / image.naturalHeight);
            }
          }}
        />
      )}
      {showResult && mapped && !swapped && source ? (
        <img
          src={source.image}
          alt=""
          className="pointer-events-none absolute object-cover shadow-[0_8px_24px_rgba(0,0,0,0.35)] [mask-image:radial-gradient(ellipse_at_center,black_58%,transparent_76%)]"
          style={{
            left: `${mapped.x + mapped.w * 0.08}%`,
            top: `${mapped.y + mapped.h * 0.02}%`,
            width: `${mapped.w * 0.84}%`,
            height: `${mapped.h * 0.9}%`,
          }}
        />
      ) : null}
      {job.status === "running" ? (
        <div className="absolute inset-0 grid place-items-center bg-[#0c0b14]/45">
          <span className="text-lg font-semibold">{Math.round(job.progress)}%</span>
        </div>
      ) : null}
      {showWatermark ? <Watermark /> : null}
      {showPlay ? (
        <button
          type="button"
          data-testid="open-preview"
          onClick={onPlay}
          className="absolute left-1/2 top-[42%] grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#1a1028] shadow-xl"
          aria-label="Önizlemeyi oynat"
        >
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </button>
      ) : null}
      <div className="absolute inset-x-2 bottom-2 flex gap-1">
        {strips.map((position) => (
          <img
            key={position}
            src={clip?.frame ?? "/media/frame-weeknd.jpg"}
            alt=""
            className="h-7 flex-1 rounded-md object-cover opacity-90"
            style={{ objectPosition: position }}
          />
        ))}
      </div>
    </div>
  );
}
