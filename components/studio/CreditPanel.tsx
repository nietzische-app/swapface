"use client";

import { useStudio } from "@/components/providers/StudioProvider";
import { FaceThumb } from "@/components/ui/FaceThumb";
import { Panel } from "@/components/ui/Panel";

export function CreditPanel() {
  const {
    credits,
    dailyRemaining,
    dailyLimit,
    selectedClip,
    selectedTargetFaceId,
    selectTargetFace,
  } = useStudio();
  const others = (selectedClip?.faces ?? []).filter((face) => face.id !== selectedTargetFaceId);
  const ratio = dailyLimit === 0 ? 0 : Math.max(0, Math.min(1, dailyRemaining / dailyLimit));

  return (
    <Panel className="h-full">
      <div className="flex h-full flex-col">
        <p className="text-[12.5px] text-[#c9c4d8]">
          Mevcut Kredi: <span className="font-semibold text-white">{credits}</span>
        </p>
        <p className="mt-2 text-[12.5px] text-[#c9c4d8]">
          Günlük Limit:{" "}
          <span className="font-medium text-white">
            {dailyRemaining}/{dailyLimit}
          </span>
        </p>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            data-testid="daily-bar"
            className="h-full rounded-full bg-gradient-to-r from-[#6d5cff] to-[#c084fc]"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
          {others.length === 0 ? (
            <p className="text-[11px] leading-snug text-[#8d88a3]">Bu klipte başka yüz yok.</p>
          ) : (
            others.map((face) => (
              <button
                key={face.id}
                type="button"
                data-testid={`alt-${face.id}`}
                onClick={() => selectTargetFace(face.id)}
                className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-2 py-1.5 text-left transition hover:bg-white/[0.08]"
              >
                <FaceThumb
                  src={face.avatar}
                  position={face.avatarPosition}
                  className="h-8 w-8 rounded-full"
                />
                <span className="truncate text-[12.5px] text-white">{face.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </Panel>
  );
}
