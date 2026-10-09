import { trendingClips } from "@/lib/data";
import type { FaceDetector } from "@/services/face-detection/types";

const fallbackFace = {
  id: "subject-1",
  name: "Özne 1",
  box: { x: 34, y: 18, w: 32, h: 48 },
  avatar: "/media/avatar-demir.jpg",
  avatarPosition: "center",
};

export const mockDetector: FaceDetector = {
  id: "mock",
  async detect(input) {
    const clip = trendingClips.find((item) => item.id === input.clipId);
    return {
      provider: "mock",
      faces: clip ? clip.faces : [fallbackFace],
    };
  },
};
