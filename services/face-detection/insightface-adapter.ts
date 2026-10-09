import type { DetectedFace } from "@/lib/types";
import type { FaceDetector } from "@/services/face-detection/types";

/**
 * Self-hosted InsightFace (or compatible) HTTP adapter.
 * The service is expected to answer:
 * POST { clipId } -> { faces: DetectedFace[] }
 */
export const insightFaceAdapter: FaceDetector = {
  id: "insightface",
  async detect(input) {
    const endpoint = process.env.INSIGHTFACE_API_URL;
    if (!endpoint) {
      throw new Error("INSIGHTFACE_API_URL tanımlı değil");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clipId: input.clipId, image: input.image }),
    });

    const data = (await response.json().catch(() => ({}))) as { faces?: DetectedFace[]; error?: string };
    if (!response.ok) {
      throw new Error(data.error || "InsightFace servisi yanıt vermedi");
    }
    return {
      provider: "insightface",
      faces: data.faces ?? [],
    };
  },
};
