export type Plan = "standard" | "pro";

export type Quality = "720p" | "1080p";

export type FaceBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type DetectedFace = {
  id: string;
  name: string;
  box: FaceBox;
  avatar: string;
  avatarPosition?: string;
};

export type Clip = {
  id: string;
  title: string;
  poster: string;
  frame: string;
  videoUrl?: string;
  faces: DetectedFace[];
  custom?: boolean;
};

export type LibraryFace = {
  id: string;
  name: string;
  image: string;
  source: "library" | "upload" | "selfie";
};

export type JobStatus = "idle" | "running" | "done" | "error";

export type JobState = {
  status: JobStatus;
  progress: number;
  watermark: boolean;
  quality: Quality;
  error?: string;
  clipId?: string;
  targetFaceId?: string;
  sourceFaceId?: string;
};

export type HistoryItem = {
  id: string;
  clipTitle: string;
  quality: Quality;
  watermark: boolean;
  at: string;
};

export type ExportPolicy = {
  watermark: boolean;
  quality: Quality;
  dailyLimit: number;
  cost: number;
};
