"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEMO_USER, initialLibrary, trendingClips } from "@/lib/data";
import type {
  Clip,
  DetectedFace,
  HistoryItem,
  JobState,
  LibraryFace,
  Plan,
} from "@/lib/types";
import { uid } from "@/lib/utils";
import { resolveExportPolicy } from "@/services/credits/policy";

const STORAGE_KEY = "swapface-demo";

type Toast = { id: number; message: string };

type StudioState = {
  plan: Plan;
  credits: number;
  dailyRemaining: number;
  displayName: string;
  email: string;
  authed: boolean;
  notifications: boolean;
  clips: Clip[];
  library: LibraryFace[];
  selectedClipId: string;
  selectedTargetFaceId: string;
  selectedSourceFaceId: string;
  job: JobState;
  history: HistoryItem[];
  toast: Toast | null;
};

type StudioContextValue = StudioState & {
  dailyLimit: number;
  cost: number;
  selectedClip: Clip | undefined;
  selectedTarget: DetectedFace | undefined;
  selectedSource: LibraryFace | undefined;
  blockReason: string | null;
  selectClip: (id: string) => void;
  selectTargetFace: (id: string) => void;
  selectSourceFace: (id: string) => void;
  addUploadedClip: (file: File) => Promise<void>;
  addLibraryFace: (file: File, source: "upload" | "selfie") => void;
  removeLibraryFace: (id: string) => void;
  replaceClipFaces: (clipId: string, faces: DetectedFace[]) => void;
  setPlan: (plan: Plan) => void;
  addCredits: (amount: number) => void;
  setDisplayName: (name: string) => void;
  setEmail: (email: string) => void;
  setNotifications: (value: boolean) => void;
  transform: () => Promise<void>;
  resetDemo: () => void;
  logout: () => void;
  login: () => void;
  pushToast: (message: string) => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

function cloneClips(clips: Clip[]): Clip[] {
  return clips.map((clip) => ({
    ...clip,
    faces: clip.faces.map((face) => ({ ...face, box: { ...face.box } })),
  }));
}

function idleJob(plan: Plan): JobState {
  const policy = resolveExportPolicy(plan);
  return {
    status: "idle",
    progress: 0,
    watermark: policy.watermark,
    quality: policy.quality,
  };
}

function createInitialState(): StudioState {
  return {
    plan: "standard",
    credits: DEMO_USER.credits,
    dailyRemaining: resolveExportPolicy("standard").dailyLimit,
    displayName: DEMO_USER.displayName,
    email: DEMO_USER.email,
    authed: true,
    notifications: true,
    clips: cloneClips(trendingClips),
    library: initialLibrary.map((face) => ({ ...face })),
    selectedClipId: "blinding-lights",
    selectedTargetFaceId: "weeknd",
    selectedSourceFaceId: "demir",
    job: idleJob("standard"),
    history: [],
    toast: null,
  };
}

function captureVideoFrame(file: File) {
  return new Promise<{ poster: string; videoUrl: string }>((resolve, reject) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.src = videoUrl;
    video.playsInline = true;

    const fail = () => reject(new Error("Video okunamadı"));
    video.onerror = fail;
    video.onloadeddata = () => {
      const target = Number.isFinite(video.duration) ? Math.min(0.35, Math.max(video.duration / 4, 0)) : 0;
      if (target > 0) {
        video.currentTime = target;
        return;
      }
      paint();
    };
    video.onseeked = paint;

    function paint() {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ poster: videoUrl, videoUrl });
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        resolve({
          poster: blob ? URL.createObjectURL(blob) : videoUrl,
          videoUrl,
        });
      }, "image/jpeg", 0.82);
    }
  });
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudioState>(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const toastId = useRef(1);
  const runId = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<StudioState>;
        const plan: Plan = saved.plan === "pro" ? "pro" : "standard";
        setState((current) => ({
          ...current,
          plan,
          credits: typeof saved.credits === "number" ? saved.credits : current.credits,
          dailyRemaining:
            typeof saved.dailyRemaining === "number" ? saved.dailyRemaining : current.dailyRemaining,
          displayName: saved.displayName || current.displayName,
          email: saved.email || current.email,
          authed: typeof saved.authed === "boolean" ? saved.authed : current.authed,
          notifications:
            typeof saved.notifications === "boolean" ? saved.notifications : current.notifications,
          job: idleJob(plan),
        }));
      }
    } catch {
      /* keep defaults that match the studio */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload = {
      plan: state.plan,
      credits: state.credits,
      dailyRemaining: state.dailyRemaining,
      displayName: state.displayName,
      email: state.email,
      authed: state.authed,
      notifications: state.notifications,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    hydrated,
    state.plan,
    state.credits,
    state.dailyRemaining,
    state.displayName,
    state.email,
    state.authed,
    state.notifications,
  ]);

  useEffect(() => {
    if (!state.toast) return;
    const timer = window.setTimeout(() => {
      setState((current) => ({ ...current, toast: null }));
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [state.toast]);

  const pushToast = useCallback((message: string) => {
    toastId.current += 1;
    const next = { id: toastId.current, message };
    setState((current) => ({ ...current, toast: next }));
  }, []);

  const resetJobForSelection = useCallback((plan: Plan, job: JobState) => {
    if (job.status === "running") return job;
    return idleJob(plan);
  }, []);

  const selectClip = useCallback((id: string) => {
    setState((current) => {
      const clip = current.clips.find((item) => item.id === id);
      if (!clip) return current;
      return {
        ...current,
        selectedClipId: id,
        selectedTargetFaceId: clip.faces[0]?.id ?? "",
        job: resetJobForSelection(current.plan, current.job),
      };
    });
  }, [resetJobForSelection]);

  const selectTargetFace = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      selectedTargetFaceId: id,
      job: resetJobForSelection(current.plan, current.job),
    }));
  }, [resetJobForSelection]);

  const selectSourceFace = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      selectedSourceFaceId: id,
      job: resetJobForSelection(current.plan, current.job),
    }));
  }, [resetJobForSelection]);

  const addUploadedClip = useCallback(async (file: File) => {
    if (!file.type.startsWith("video/")) {
      pushToast("Yalnızca video dosyası yükleyebilirsin");
      return;
    }
    if (file.size > 250 * 1024 * 1024) {
      pushToast("Video 250 MB sınırını aşıyor");
      return;
    }

    try {
      const captured = await captureVideoFrame(file);
      const id = uid("clip");
      const faceId = uid("face");
      const clip: Clip = {
        id,
        title: file.name.replace(/\.[^.]+$/, ""),
        poster: captured.poster,
        frame: captured.poster,
        videoUrl: captured.videoUrl,
        custom: true,
        faces: [
          {
            id: faceId,
            name: "Özne 1",
            box: { x: 34, y: 16, w: 30, h: 48 },
            avatar: captured.poster,
            avatarPosition: "center",
          },
        ],
      };
      setState((current) => ({
        ...current,
        clips: [clip, ...current.clips.filter((item) => item.id !== id)],
        selectedClipId: id,
        selectedTargetFaceId: faceId,
        job: idleJob(current.plan),
      }));
      pushToast("Videon hazır. Değişecek kişiyi seç.");
    } catch {
      pushToast("Video karesi alınamadı");
    }
  }, [pushToast]);

  const addLibraryFace = useCallback((file: File, source: "upload" | "selfie") => {
    if (!file.type.startsWith("image/")) {
      pushToast("Yüz için bir fotoğraf seç");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      pushToast("Fotoğraf 15 MB sınırını aşıyor");
      return;
    }
    const id = uid(source);
    const image = URL.createObjectURL(file);
    const face: LibraryFace = {
      id,
      name: source === "selfie" ? "Selfie" : file.name.replace(/\.[^.]+$/, "").slice(0, 18),
      image,
      source,
    };
    setState((current) => ({
      ...current,
      library: [...current.library, face],
      selectedSourceFaceId: id,
      job: resetJobForSelection(current.plan, current.job),
    }));
    pushToast(source === "selfie" ? "Selfie kütüphaneye eklendi" : "Fotoğraf kütüphaneye eklendi");
  }, [pushToast, resetJobForSelection]);

  const removeLibraryFace = useCallback((id: string) => {
    setState((current) => {
      if (current.library.length <= 1) return current;
      const library = current.library.filter((face) => face.id !== id);
      return {
        ...current,
        library,
        selectedSourceFaceId:
          current.selectedSourceFaceId === id ? library[library.length - 1].id : current.selectedSourceFaceId,
      };
    });
  }, []);

  const replaceClipFaces = useCallback((clipId: string, faces: DetectedFace[]) => {
    setState((current) => ({
      ...current,
      clips: current.clips.map((clip) => (clip.id === clipId ? { ...clip, faces } : clip)),
      selectedTargetFaceId:
        current.selectedClipId === clipId ? faces[0]?.id ?? "" : current.selectedTargetFaceId,
    }));
  }, []);

  const setPlan = useCallback((plan: Plan) => {
    setState((current) => {
      const nextPolicy = resolveExportPolicy(plan);
      const prevPolicy = resolveExportPolicy(current.plan);
      let dailyRemaining = current.dailyRemaining;
      if (plan === "pro" && current.plan !== "pro") {
        dailyRemaining = Math.min(
          nextPolicy.dailyLimit,
          current.dailyRemaining + (nextPolicy.dailyLimit - prevPolicy.dailyLimit),
        );
      }
      if (plan === "standard" && current.plan !== "standard") {
        dailyRemaining = Math.min(nextPolicy.dailyLimit, current.dailyRemaining);
      }
      const job =
        current.job.status === "running"
          ? current.job
          : {
              ...current.job,
              watermark: nextPolicy.watermark,
              quality: nextPolicy.quality,
            };
      return { ...current, plan, dailyRemaining, job };
    });
    pushToast(plan === "pro" ? "Pro aktif. Filigran kalktı, dışa aktarma 1080p." : "Standart plana döndün. Filigran açık.");
  }, [pushToast]);

  const addCredits = useCallback((amount: number) => {
    setState((current) => ({ ...current, credits: current.credits + amount }));
    pushToast(`${amount} kredi yüklendi`);
  }, [pushToast]);

  const setDisplayName = useCallback((name: string) => {
    setState((current) => ({ ...current, displayName: name.slice(0, 28) }));
  }, []);

  const setEmail = useCallback((email: string) => {
    setState((current) => ({ ...current, email }));
  }, []);

  const setNotifications = useCallback((value: boolean) => {
    setState((current) => ({ ...current, notifications: value }));
  }, []);

  const logout = useCallback(() => {
    setState((current) => ({ ...current, authed: false }));
  }, []);

  const login = useCallback(() => {
    setState((current) => ({ ...current, authed: true }));
  }, []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(createInitialState());
    pushToast("Demo hesap sıfırlandı");
  }, [pushToast]);

  const transform = useCallback(async () => {
    if (busy.current) return;
    const snapshot = state;
    const policy = resolveExportPolicy(snapshot.plan);
    const clip = snapshot.clips.find((item) => item.id === snapshot.selectedClipId);
    const target = clip?.faces.find((face) => face.id === snapshot.selectedTargetFaceId);
    const source = snapshot.library.find((face) => face.id === snapshot.selectedSourceFaceId);

    if (snapshot.job.status === "running") return;
    if (!clip || !target || !source) {
      pushToast("Video, hedef yüz ve kendi yüzün seçili olmalı");
      return;
    }
    if (snapshot.credits < policy.cost) {
      pushToast("Yetersiz kredi");
      return;
    }
    if (snapshot.dailyRemaining < 1) {
      pushToast("Günlük limit doldu");
      return;
    }

    busy.current = true;
    const token = ++runId.current;
    setState((current) => ({
      ...current,
      credits: current.credits - policy.cost,
      dailyRemaining: current.dailyRemaining - 1,
      job: {
        status: "running",
        progress: 2,
        watermark: policy.watermark,
        quality: policy.quality,
        clipId: clip.id,
        targetFaceId: target.id,
        sourceFaceId: source.id,
      },
    }));

    let jobId: string | null = null;
    try {
      const response = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: snapshot.plan,
          credits: snapshot.credits,
          dailyRemaining: snapshot.dailyRemaining,
          clipId: clip.id,
          targetFaceId: target.id,
          sourceFaceId: source.id,
        }),
      });
      const data = (await response.json()) as {
        id?: string;
        error?: string;
        watermark?: boolean;
        quality?: JobState["quality"];
      };
      if (!response.ok || !data.id) {
        throw new Error(data.error || "Dönüşüm başlatılamadı");
      }
      jobId = data.id;
      if (runId.current !== token) return;
      setState((current) => ({
        ...current,
        job: {
          ...current.job,
          watermark: data.watermark ?? policy.watermark,
          quality: data.quality ?? policy.quality,
        },
      }));
    } catch (error) {
      if (runId.current !== token) return;
      const message = error instanceof Error ? error.message : "Dönüşüm başlatılamadı";
      setState((current) => ({
        ...current,
        credits: current.credits + policy.cost,
        dailyRemaining: current.dailyRemaining + 1,
        job: {
          status: "error",
          progress: 0,
          watermark: policy.watermark,
          quality: policy.quality,
          error: message,
        },
      }));
      busy.current = false;
      pushToast(message);
      return;
    }

    let settled = false;
    const timer = window.setInterval(async () => {
      if (runId.current !== token || !jobId) {
        window.clearInterval(timer);
        return;
      }
      try {
        const response = await fetch(`/api/swap?id=${jobId}`);
        const data = (await response.json()) as { progress?: number; status?: string };
        const progress = data.progress ?? 0;
        if (progress >= 100) {
          if (settled) return;
          settled = true;
          busy.current = false;
          window.clearInterval(timer);
          setState((current) => {
            if (current.job.status === "done") return current;
            return {
              ...current,
              job: { ...current.job, progress: 100, status: "done" },
              history: [
                {
                  id: jobId || uid("job"),
                  clipTitle: clip.title,
                  quality: current.job.quality,
                  watermark: current.job.watermark,
                  at: new Date().toLocaleString("tr-TR"),
                },
                ...current.history,
              ].slice(0, 8),
            };
          });
          pushToast("Dönüşüm hazır");
          return;
        }
        setState((current) => {
          if (current.job.status !== "running") return current;
          return { ...current, job: { ...current.job, progress } };
        });
      } catch {
        if (!settled && runId.current === token) busy.current = false;
        window.clearInterval(timer);
      }
    }, 220);
  }, [pushToast, state]);

  const policy = resolveExportPolicy(state.plan);
  const selectedClip = state.clips.find((clip) => clip.id === state.selectedClipId);
  const selectedTarget = selectedClip?.faces.find((face) => face.id === state.selectedTargetFaceId);
  const selectedSource = state.library.find((face) => face.id === state.selectedSourceFaceId);

  const blockReason = useMemo(() => {
    if (state.job.status === "running") return "Dönüşüm sürüyor";
    if (!selectedClip) return "Önce bir video seç";
    if (!selectedTarget) return "Değişecek kişiyi seç";
    if (!selectedSource) return "Kendi yüzünü seç";
    if (state.credits < policy.cost) return "Yetersiz kredi";
    if (state.dailyRemaining < 1) return "Günlük limit doldu";
    return null;
  }, [
    policy.cost,
    selectedClip,
    selectedSource,
    selectedTarget,
    state.credits,
    state.dailyRemaining,
    state.job.status,
  ]);

  const value = useMemo<StudioContextValue>(
    () => ({
      ...state,
      dailyLimit: policy.dailyLimit,
      cost: policy.cost,
      selectedClip,
      selectedTarget,
      selectedSource,
      blockReason,
      selectClip,
      selectTargetFace,
      selectSourceFace,
      addUploadedClip,
      addLibraryFace,
      removeLibraryFace,
      replaceClipFaces,
      setPlan,
      addCredits,
      setDisplayName,
      setEmail,
      setNotifications,
      transform,
      resetDemo,
      logout,
      login,
      pushToast,
    }),
    [
      addCredits,
      addLibraryFace,
      addUploadedClip,
      blockReason,
      login,
      logout,
      policy.cost,
      policy.dailyLimit,
      pushToast,
      removeLibraryFace,
      replaceClipFaces,
      resetDemo,
      selectClip,
      selectSourceFace,
      selectTargetFace,
      selectedClip,
      selectedSource,
      selectedTarget,
      setDisplayName,
      setEmail,
      setNotifications,
      setPlan,
      state,
      transform,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error("useStudio StudioProvider içinde kullanılmalı");
  return context;
}
