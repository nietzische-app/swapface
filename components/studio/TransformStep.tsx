"use client";

import { useState } from "react";
import { PreviewModal } from "@/components/studio/PreviewModal";
import { PreviewStage } from "@/components/studio/PreviewStage";
import { useStudio } from "@/components/providers/StudioProvider";
import { Panel } from "@/components/ui/Panel";

export function TransformStep() {
  const {
    cost,
    job,
    blockReason,
    transform,
    selectedClip,
    selectedSource,
    selectedTarget,
    pushToast,
  } = useStudio();
  const [open, setOpen] = useState(false);
  const previewJob =
    job.status === "done"
      ? job
      : {
          ...job,
          status: job.status,
        };

  function start() {
    if (blockReason && job.status !== "running") {
      pushToast(blockReason);
      return;
    }
    void transform();
  }

  return (
    <Panel title="4. Dönüştürme & Önizleme" className="h-full">
      <div className="grid h-full min-h-[168px] grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.45fr)_minmax(180px,0.9fr)]">
        <div className="flex min-h-0 flex-col gap-3">
          <button
            type="button"
            data-testid="transform-button"
            onClick={start}
            disabled={job.status === "running"}
            className="flex min-h-[92px] flex-1 flex-col items-center justify-center rounded-2xl bg-[linear-gradient(100deg,#4f6bff_0%,#6d5cff_42%,#b14bff_72%,#e879f9_100%)] px-4 py-4 text-center shadow-[0_12px_32px_rgba(109,92,255,0.35)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-80"
          >
            <span className="text-balance text-[13px] font-extrabold tracking-[0.04em] text-white xl:text-[15px]">
              VİDEOYU YÜZÜMLE YENİDEN YARAT
            </span>
            <span className="mt-1 text-[12px] font-medium text-white/85">(Ücret: {cost} Kredi)</span>
          </button>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-[#b7b2c9]">
              <span>Progress Bar</span>
              <span data-testid="progress">{Math.round(job.progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6d5cff] to-[#e879f9] transition-[width] duration-200"
                style={{ width: `${job.progress}%` }}
              />
            </div>
            {job.status === "error" && job.error ? (
              <p className="mt-1.5 text-[11px] text-[#fda4af]">{job.error}</p>
            ) : null}
            {job.status === "done" ? (
              <p className="mt-1.5 text-[11px] text-[#c4b5fd]" data-testid="result-meta">
                {job.watermark ? "Filigranlı" : "Filigransız"} · {job.quality}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1">
            <PreviewStage
              clip={selectedClip}
              source={job.status === "done" ? selectedSource : undefined}
              targetBox={job.status === "done" ? selectedTarget?.box : undefined}
              job={previewJob}
              onPlay={() => setOpen(true)}
            />
          </div>
          <p className="mt-1.5 text-center text-[11px] text-[#9a95ad]">Dönüşüm Önizlemesi</p>
        </div>
      </div>
      {open ? <PreviewModal onClose={() => setOpen(false)} /> : null}
    </Panel>
  );
}
