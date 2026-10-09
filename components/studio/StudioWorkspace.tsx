"use client";

import { CreditPanel } from "@/components/studio/CreditPanel";
import { FaceUploadStep } from "@/components/studio/FaceUploadStep";
import { PersonSelectStep } from "@/components/studio/PersonSelectStep";
import { TransformStep } from "@/components/studio/TransformStep";
import { VideoSelectStep } from "@/components/studio/VideoSelectStep";

export function StudioWorkspace() {
  return (
    <div className="grid h-full gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      <VideoSelectStep />
      <div className="grid min-h-0 gap-3 xl:grid-rows-[minmax(0,1.15fr)_minmax(168px,0.78fr)_minmax(210px,0.95fr)]">
        <div className="grid min-h-0 gap-3 md:grid-cols-[minmax(0,1.45fr)_minmax(168px,0.72fr)]">
          <PersonSelectStep />
          <CreditPanel />
        </div>
        <FaceUploadStep />
        <TransformStep />
      </div>
    </div>
  );
}
