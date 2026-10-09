import type { Plan, Quality } from "@/lib/types";

export type SwapJobRequest = {
  clipId: string;
  targetFaceId: string;
  sourceFaceId: string;
  plan: Plan;
};

export type SwapJob = {
  id: string;
  provider: "mock" | "reactor";
  watermark: boolean;
  quality: Quality;
  cost: number;
  status: "queued";
};

export interface SwapProvider {
  id: SwapJob["provider"];
  createJob(input: SwapJobRequest): Promise<SwapJob>;
}
