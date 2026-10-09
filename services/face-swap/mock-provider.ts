import { resolveExportPolicy } from "@/services/credits/policy";
import type { SwapProvider } from "@/services/face-swap/types";

export const mockSwapProvider: SwapProvider = {
  id: "mock",
  async createJob(input) {
    const policy = resolveExportPolicy(input.plan);
    return {
      id: crypto.randomUUID(),
      provider: "mock",
      watermark: policy.watermark,
      quality: policy.quality,
      cost: policy.cost,
      status: "queued",
    };
  },
};
