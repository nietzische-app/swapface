import type { FaceBox, Plan, Quality } from "@/lib/types";

export type SwapJobRequest = {
  clipId: string;
  targetFaceId: string;
  sourceFaceId: string;
  plan: Plan;
  sourceImage?: string;
  targetImage?: string;
  targetBox?: FaceBox;
};

export type SwapJob = {
  id: string;
  provider: "mock" | "reactor";
  watermark: boolean;
  quality: Quality;
  cost: number;
  status: "queued";
  image?: string;
};

export interface SwapProvider {
  id: SwapJob["provider"];
  createJob(input: SwapJobRequest): Promise<SwapJob>;
}
