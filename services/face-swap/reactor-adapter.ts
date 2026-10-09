import { resolveExportPolicy } from "@/services/credits/policy";
import type { SwapProvider } from "@/services/face-swap/types";

/**
 * ReActor / Roop compatible HTTP adapter.
 * POST { clipId, targetFaceId, sourceFaceId, plan }
 * -> { id?: string }
 * Watermark and export quality are enforced by SwapFace policy, not the model service.
 */
export const reactorAdapter: SwapProvider = {
  id: "reactor",
  async createJob(input) {
    const endpoint = process.env.REACTOR_API_URL;
    if (!endpoint) {
      throw new Error("REACTOR_API_URL tanımlı değil");
    }

    const policy = resolveExportPolicy(input.plan);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clipId: input.clipId,
        targetFaceId: input.targetFaceId,
        sourceFaceId: input.sourceFaceId,
        plan: input.plan,
        quality: policy.quality,
        watermark: policy.watermark,
      }),
    });

    if (!response.ok) {
      throw new Error("ReActor servisi yanıt vermedi");
    }

    const data = (await response.json()) as { id?: string };
    return {
      id: data.id ?? crypto.randomUUID(),
      provider: "reactor",
      watermark: policy.watermark,
      quality: policy.quality,
      cost: policy.cost,
      status: "queued",
    };
  },
};
