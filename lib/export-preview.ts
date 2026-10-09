import type { FaceBox, Quality } from "@/lib/types";

type ExportOptions = {
  imageUrl: string;
  videoUrl?: string;
  quality: Quality;
  watermark: boolean;
  faceImageUrl?: string;
  box?: FaceBox;
  filenameBase: string;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Görsel yüklenemedi"));
    image.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const dw = sourceWidth * scale;
  const dh = sourceHeight * scale;
  ctx.drawImage(source, (width - dw) / 2, (height - dh) / 2, dw, dh);
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  face: HTMLImageElement,
  box: FaceBox,
  width: number,
  height: number,
) {
  const bx = (box.x / 100) * width;
  const by = (box.y / 100) * height;
  const bw = (box.w / 100) * width;
  const bh = (box.h / 100) * height;
  const cx = bx + bw / 2;
  const cy = by + bh / 2;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, bw * 0.46, bh * 0.48, 0, 0, Math.PI * 2);
  ctx.clip();
  const scale = Math.max(bw / face.width, bh / face.height);
  const dw = face.width * scale;
  const dh = face.height * scale;
  ctx.drawImage(face, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const pad = Math.round(width * 0.028);
  const fontSize = Math.max(16, Math.round(width * 0.026));
  ctx.save();
  ctx.font = `700 ${fontSize}px Outfit, sans-serif`;
  const label = "★   SWAPFACE";
  const textWidth = ctx.measureText(label).width;
  const boxW = textWidth + pad * 1.3;
  const boxH = fontSize + pad * 0.85;
  const x = pad;
  const y = height - pad - boxH;
  ctx.fillStyle = "rgba(8, 6, 18, 0.5)";
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, boxH / 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.fillText(label, x + pad * 0.65, y + boxH * 0.72);
  ctx.restore();
}

function canvasBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Dışa aktarma başarısız"));
        return;
      }
      resolve(blob);
    }, type);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function exportPreview(options: ExportOptions) {
  const width = options.quality === "1080p" ? 1920 : 1280;
  const height = options.quality === "1080p" ? 1080 : 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas kullanılamıyor");

  const frame = await loadImage(options.imageUrl);
  const face = options.faceImageUrl ? await loadImage(options.faceImageUrl).catch(() => null) : null;
  const video = options.videoUrl ? document.createElement("video") : null;
  if (video && options.videoUrl) {
    video.src = options.videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    await video.play().catch(() => undefined);
  }

  const paint = () => {
    ctx.fillStyle = "#0c0b14";
    ctx.fillRect(0, 0, width, height);
    if (video && video.readyState >= 2) {
      drawCover(ctx, video, video.videoWidth || frame.width, video.videoHeight || frame.height, width, height);
    } else {
      drawCover(ctx, frame, frame.width, frame.height, width, height);
    }
    if (face && options.box) drawFace(ctx, face, options.box, width, height);
    if (options.watermark) drawWatermark(ctx, width, height);
  };

  paint();

  const base = options.filenameBase.replace(/[^\w\-]+/g, "-").toLowerCase();
  const stamp = options.watermark ? "watermarked" : "clean";
  const canRecord =
    typeof canvas.captureStream === "function" && typeof MediaRecorder !== "undefined";

  if (!canRecord) {
    const blob = await canvasBlob(canvas, "image/png");
    downloadBlob(blob, `${base}-${options.quality}-${stamp}.png`);
    return;
  }

  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const stopped = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });

  recorder.start(120);
  const started = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      paint();
      if (performance.now() - started < 2600) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
  recorder.stop();
  video?.pause();
  const blob = await stopped;
  downloadBlob(blob, `${base}-${options.quality}-${stamp}.webm`);
}
