import { resolveExportPolicy } from "@/services/credits/policy";
import { getSwapProvider } from "@/services/face-swap";
import type { Plan, Quality } from "@/lib/types";

export const runtime = "nodejs";

type StoredJob = {
  id: string;
  startedAt: number;
  durationMs: number;
  watermark: boolean;
  quality: Quality;
  cost: number;
  provider: string;
  clipId: string;
  targetFaceId: string;
  sourceFaceId: string;
};

const store = globalThis as unknown as { __swapfaceJobs?: Map<string, StoredJob> };
const jobs = store.__swapfaceJobs ?? new Map<string, StoredJob>();
store.__swapfaceJobs = jobs;

function asPlan(value: unknown): Plan {
  return value === "pro" ? "pro" : "standard";
}

export async function POST(request: Request) {
  let body: {
    plan?: string;
    credits?: number;
    dailyRemaining?: number;
    clipId?: string;
    targetFaceId?: string;
    sourceFaceId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!body.clipId || !body.targetFaceId || !body.sourceFaceId) {
    return Response.json({ error: "Video ve yüz seçimi eksik" }, { status: 400 });
  }

  const plan = asPlan(body.plan);
  const policy = resolveExportPolicy(plan);

  if (typeof body.credits === "number" && body.credits < policy.cost) {
    return Response.json({ error: "Yetersiz kredi" }, { status: 402 });
  }

  if (typeof body.dailyRemaining === "number" && body.dailyRemaining < 1) {
    return Response.json({ error: "Günlük limit doldu" }, { status: 429 });
  }

  try {
    const provider = getSwapProvider();
    const created = await provider.createJob({
      clipId: body.clipId,
      targetFaceId: body.targetFaceId,
      sourceFaceId: body.sourceFaceId,
      plan,
    });

    const job: StoredJob = {
      id: created.id,
      startedAt: Date.now(),
      durationMs: 6800,
      watermark: policy.watermark,
      quality: policy.quality,
      cost: policy.cost,
      provider: provider.id,
      clipId: body.clipId,
      targetFaceId: body.targetFaceId,
      sourceFaceId: body.sourceFaceId,
    };
    jobs.set(job.id, job);

    return Response.json({
      id: job.id,
      provider: job.provider,
      watermark: job.watermark,
      quality: job.quality,
      cost: job.cost,
      status: "queued",
      progress: 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dönüşüm başlatılamadı";
    return Response.json({ error: message }, { status: 502 });
  }
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "İş kimliği gerekli" }, { status: 400 });

  const job = jobs.get(id);
  if (!job) return Response.json({ error: "İş bulunamadı" }, { status: 404 });

  const progress = Math.min(100, Math.round(((Date.now() - job.startedAt) / job.durationMs) * 100));
  return Response.json({
    id: job.id,
    provider: job.provider,
    watermark: job.watermark,
    quality: job.quality,
    cost: job.cost,
    progress,
    status: progress >= 100 ? "done" : "running",
  });
}
