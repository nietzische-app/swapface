import { insightFaceAdapter } from "@/services/face-detection/insightface-adapter";
import { mockDetector } from "@/services/face-detection/mock-provider";
import type { FaceDetector } from "@/services/face-detection/types";

export function getFaceDetector(): FaceDetector {
  if (process.env.INSIGHTFACE_API_URL) return insightFaceAdapter;
  return mockDetector;
}
