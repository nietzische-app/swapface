import { getFaceDetector } from "@/services/face-detection";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let clipId: string | undefined;
  let image: string | undefined;
  try {
    const body = (await request.json()) as { clipId?: string; image?: string };
    clipId = body.clipId;
    image = body.image;
  } catch {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  try {
    const detector = getFaceDetector();
    const result = await detector.detect({ clipId, image });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yüz taraması başarısız";
    return Response.json({ error: message }, { status: 502 });
  }
}
