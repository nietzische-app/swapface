import type { DetectedFace } from "@/lib/types";

export type DetectInput = {
  clipId?: string;
  image?: string;
};

export type DetectResult = {
  provider: "mock" | "insightface";
  faces: DetectedFace[];
};

export interface FaceDetector {
  id: DetectResult["provider"];
  detect(input: DetectInput): Promise<DetectResult>;
}
