"""Local InsightFace worker for the SwapFace studio.

Listens on 127.0.0.1:3099.
POST /detect reads a catalog frame. POST /swap runs inswapper on this GPU.
"""

from __future__ import annotations

import base64
import json
import subprocess
import tempfile
import threading
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import cv2
import insightface
import numpy as np
from insightface.app import FaceAnalysis

ROOT = Path(__file__).resolve().parents[1]
HOST = "127.0.0.1"
PORT = 3099

CLIPS = {
    "blinding-lights": "frame-weeknd.jpg",
    "dune": "frame-dune.jpg",
    "weeknd-encore": "frame-crowd.jpg",
}

LOCK = threading.Lock()
ANALYZER: FaceAnalysis | None = None
SWAP_ANALYZER: FaceAnalysis | None = None
SWAPPER = None
PROVIDERS = ["CUDAExecutionProvider", "CPUExecutionProvider"]
VIDEO_JOBS: dict[str, dict] = {}


def analyzer() -> FaceAnalysis:
    global ANALYZER
    if ANALYZER is None:
        app = FaceAnalysis(providers=PROVIDERS, allowed_modules=["detection"])
        app.prepare(ctx_id=0, det_size=(640, 640))
        ANALYZER = app
    return ANALYZER


def swap_models():
    global SWAP_ANALYZER, SWAPPER
    if SWAP_ANALYZER is None:
        print("swap modeli yükleniyor")
        app = FaceAnalysis(providers=PROVIDERS, allowed_modules=["detection", "recognition"])
        app.prepare(ctx_id=0, det_size=(320, 320))
        SWAP_ANALYZER = app
    if SWAPPER is None:
        model_path = Path.home() / ".insightface" / "models" / "inswapper_128.onnx"
        if not model_path.is_file():
            raise FileNotFoundError("inswapper_128.onnx bulunamadı")
        SWAPPER = insightface.model_zoo.get_model(str(model_path), providers=PROVIDERS)
    return SWAP_ANALYZER, SWAPPER


def decode_image(value: str):
    if value.startswith("/media/"):
        return cv2.imread(str(ROOT / "public" / value.lstrip("/")))
    payload = value.split(",", 1)[1] if value.startswith("data:") else value
    try:
        raw = base64.b64decode(payload, validate=False)
    except Exception:
        return None
    array = np.frombuffer(raw, dtype=np.uint8)
    return cv2.imdecode(array, cv2.IMREAD_COLOR)


def limit_side(image, max_side: int):
    height, width = image.shape[:2]
    scale = max_side / max(height, width)
    if scale >= 1:
        return image
    return cv2.resize(image, (max(1, int(width * scale)), max(1, int(height * scale))), interpolation=cv2.INTER_AREA)


def box_iou(face, box: dict, width: int, height: int) -> float:
    x1, y1, x2, y2 = [float(value) for value in face.bbox[:4]]
    bx1 = float(box["x"]) / 100 * width
    by1 = float(box["y"]) / 100 * height
    bx2 = bx1 + float(box["w"]) / 100 * width
    by2 = by1 + float(box["h"]) / 100 * height
    ix1, iy1 = max(x1, bx1), max(y1, by1)
    ix2, iy2 = min(x2, bx2), min(y2, by2)
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    union = max(1.0, (x2 - x1) * (y2 - y1) + (bx2 - bx1) * (by2 - by1) - inter)
    return inter / union


def choose_target(faces, box, width: int, height: int):
    if not faces:
        return None
    if not isinstance(box, dict):
        return max(faces, key=lambda face: float(face.det_score))
    needed = ("x", "y", "w", "h")
    if any(key not in box for key in needed):
        return max(faces, key=lambda face: float(face.det_score))
    return max(faces, key=lambda face: box_iou(face, box, width, height))


def swap_faces(payload: dict) -> tuple[str | None, str | None]:
    source_value = payload.get("sourceImage")
    if not isinstance(source_value, str) or not source_value:
        return None, "Kaynak yüz fotoğrafı yok"
    source = decode_image(source_value)
    clip_id = payload.get("clipId")
    filename = CLIPS.get(clip_id) if isinstance(clip_id, str) else None
    target = cv2.imread(str(ROOT / "public" / "media" / filename)) if filename else None
    if target is None and isinstance(payload.get("targetImage"), str):
        target = decode_image(payload["targetImage"])
    if source is None or target is None:
        return None, "Görsel okunamadı"
    max_side = 1920 if payload.get("quality") == "1080p" else 1280
    source = limit_side(source, 1024)
    target = limit_side(target, max_side)
    with LOCK:
        face_app, swapper = swap_models()
        source_faces = face_app.get(source)
        target_faces = face_app.get(target)
        if not source_faces:
            return None, "Kaynak fotoğrafta yüz yok"
        if not target_faces:
            return None, "Karede yüz yok"
        source_face = max(source_faces, key=lambda face: float(face.det_score))
        height, width = target.shape[:2]
        target_face = choose_target(target_faces, payload.get("targetBox"), width, height)
        if target_face is None or getattr(source_face, "normed_embedding", None) is None:
            return None, "Yüz modeli bu kareyi çözemedi"
        swapped = swapper.get(target, target_face, source_face, paste_back=True)
    if swapped is None:
        return None, "Dönüşüm başarısız"
    ok, encoded = cv2.imencode(".jpg", swapped, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    if not ok:
        return None, "Sonuç yazılamadı"
    image = "data:image/jpeg;base64," + base64.b64encode(encoded.tobytes()).decode("ascii")
    return image, None


def fit_even(image, max_w: int, max_h: int):
    height, width = image.shape[:2]
    scale = min(max_w / width, max_h / height, 1)
    width = max(2, int(width * scale) // 2 * 2)
    height = max(2, int(height * scale) // 2 * 2)
    if (image.shape[1], image.shape[0]) == (width, height):
        return image
    return cv2.resize(image, (width, height), interpolation=cv2.INTER_AREA)


def paint_watermark(frame):
    height, width = frame.shape[:2]
    scale = max(0.7, width / 900)
    thickness = max(2, int(scale * 2))
    origin = (24, height - 28)
    cv2.putText(frame, "SWAPFACE", origin, cv2.FONT_HERSHEY_SIMPLEX, scale, (20, 16, 32), thickness + 2, cv2.LINE_AA)
    cv2.putText(frame, "SWAPFACE", origin, cv2.FONT_HERSHEY_SIMPLEX, scale, (245, 245, 250), thickness, cv2.LINE_AA)
    return frame


def face_box(face, width: int, height: int) -> dict:
    x1, y1, x2, y2 = [float(value) for value in face.bbox[:4]]
    return {
        "x": x1 / width * 100,
        "y": y1 / height * 100,
        "w": (x2 - x1) / width * 100,
        "h": (y2 - y1) / height * 100,
    }


def open_encoder(width: int, height: int, fps: float, dest: Path):
    try:
        import imageio_ffmpeg
    except ImportError as exc:
        raise RuntimeError("Video kodlayıcı yok. .venv içinde pip install imageio-ffmpeg çalıştır.") from exc
    command = [
        imageio_ffmpeg.get_ffmpeg_exe(),
        "-y",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "bgr24",
        "-s",
        f"{width}x{height}",
        "-r",
        f"{fps:.3f}",
        "-i",
        "pipe:0",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(dest),
    ]
    return subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def run_video_job(job_id: str, src: Path, dest: Path, meta: dict) -> None:
    job = VIDEO_JOBS[job_id]
    encoder = None
    cap = cv2.VideoCapture(str(src))
    try:
        if not cap.isOpened():
            raise RuntimeError("Video açılmadı")
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 25)
        if fps < 1 or fps > 120:
            fps = 25
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        max_w, max_h = (1920, 1080) if meta.get("quality") == "1080p" else (1280, 720)
        source = decode_image(str(meta.get("sourceImage") or ""))
        if source is None:
            raise RuntimeError("Kaynak yüz fotoğrafı yok")
        source = limit_side(source, 1024)
        with LOCK:
            face_app, swapper = swap_models()
            source_faces = face_app.get(source)
        if not source_faces:
            raise RuntimeError("Kaynak fotoğrafta yüz yok")
        source_face = max(source_faces, key=lambda face: float(face.det_score))
        if getattr(source_face, "normed_embedding", None) is None:
            raise RuntimeError("Yüz modeli bu fotoğrafı çözemedi")
        hint = meta.get("targetBox")
        written = 0
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame = fit_even(frame, max_w, max_h)
            height, width = frame.shape[:2]
            with LOCK:
                faces = face_app.get(frame)
                target = choose_target(faces, hint, width, height)
                if target is not None:
                    swapped = swapper.get(frame, target, source_face, paste_back=True)
                    if swapped is not None:
                        frame = swapped
                        hint = face_box(target, width, height)
            if meta.get("watermark"):
                frame = paint_watermark(frame)
            if encoder is None:
                encoder = open_encoder(width, height, fps, dest)
            if encoder.stdin is None:
                raise RuntimeError("Video yazılamadı")
            encoder.stdin.write(frame.tobytes())
            written += 1
            if total > 0:
                job["progress"] = max(1, min(99, round(written / total * 100)))
        if encoder is None or written == 0:
            raise RuntimeError("Video karesi okunamadı")
        encoder.stdin.close()
        encoder.stdin = None
        if encoder.wait() != 0 or not dest.is_file():
            raise RuntimeError("Video yazılamadı")
        job["progress"] = 100
        job["status"] = "done"
    except Exception as exc:
        print("video swap failed:", exc)
        job["status"] = "error"
        job["error"] = str(exc)
        if encoder is not None and encoder.stdin:
            encoder.stdin.close()
        if encoder is not None:
            encoder.wait()
    finally:
        cap.release()


def parse_multipart(content_type: str, body: bytes) -> dict[str, bytes]:
    marker = content_type.split("boundary=", 1)[1].strip().strip('"')
    parts: dict[str, bytes] = {}
    for chunk in body.split(("--" + marker).encode("utf-8")):
        if b"\r\n\r\n" not in chunk:
            continue
        header_blob, data = chunk.split(b"\r\n\r\n", 1)
        if data.endswith(b"\r\n"):
            data = data[:-2]
        header = header_blob.decode("utf-8", "replace")
        if 'name="' not in header:
            continue
        name = header.split('name="', 1)[1].split('"', 1)[0]
        parts[name] = data
    return parts


def start_video_job(meta: dict, video: bytes) -> str:
    job_id = uuid.uuid4().hex
    folder = Path(tempfile.mkdtemp(prefix="swapface-"))
    src = folder / "input.bin"
    dest = folder / "output.mp4"
    src.write_bytes(video)
    VIDEO_JOBS[job_id] = {"progress": 1, "status": "running", "error": None, "path": dest, "trimmed": False}
    threading.Thread(target=run_video_job, args=(job_id, src, dest, meta), daemon=True).start()
    return job_id


def face_avatar(image, x1: float, y1: float, x2: float, y2: float) -> str:
    height, width = image.shape[:2]
    left, top = int(max(0, x1)), int(max(0, y1))
    right, bottom = int(min(width, x2)), int(min(height, y2))
    if right - left < 2 or bottom - top < 2:
        return ""
    ok, encoded = cv2.imencode(".jpg", image[top:bottom, left:right], [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    if not ok:
        return ""
    return "data:image/jpeg;base64," + base64.b64encode(encoded.tobytes()).decode("ascii")


def describe_faces(image, clip_id: str, avatar: str | None) -> list[dict]:
    height, width = image.shape[:2]
    with LOCK:
        found = analyzer().get(image)
    faces = []
    ranked = sorted(found, key=lambda face: float(face.det_score), reverse=True)
    for index, face in enumerate(ranked, start=1):
        x1, y1, x2, y2 = [float(value) for value in face.bbox[:4]]
        x1 = min(max(x1, 0.0), width)
        y1 = min(max(y1, 0.0), height)
        x2 = min(max(x2, 0.0), width)
        y2 = min(max(y2, 0.0), height)
        box_w = (x2 - x1) / width * 100
        box_h = (y2 - y1) / height * 100
        if box_w < 1 or box_h < 1:
            continue
        box_x = x1 / width * 100
        box_y = y1 / height * 100
        faces.append(
            {
                "id": f"{clip_id}-face-{index}",
                "name": f"Yüz {index}",
                "box": {
                    "x": round(box_x, 2),
                    "y": round(box_y, 2),
                    "w": round(box_w, 2),
                    "h": round(box_h, 2),
                },
                "avatar": avatar or face_avatar(image, x1, y1, x2, y2),
                "avatarPosition": f"{box_x + box_w / 2:.0f}% {box_y + box_h / 2:.0f}%",
            }
        )
    return faces


def detect_clip(clip_id: str, image_value: str | None = None) -> tuple[list[dict] | None, str | None]:
    if isinstance(image_value, str) and image_value:
        image = decode_image(image_value)
        if image is None:
            return None, "Kare okunamadı"
        return describe_faces(limit_side(image, 1280), clip_id, None), None
    filename = CLIPS.get(clip_id)
    if filename is None:
        return None, "Bu klip worker üzerinde yok"
    image = cv2.imread(str(ROOT / "public" / "media" / filename))
    if image is None:
        return None, "Kare okunamadı"
    return describe_faces(image, clip_id, f"/media/{filename}"), None


class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0].rstrip("/")
        if path == "/health":
            self._send(200, {"ok": True, "provider": "insightface"})
            return
        if path.startswith("/swap-video/") and path.endswith("/file"):
            job_id = path.split("/")[2]
            job = VIDEO_JOBS.get(job_id)
            if not job or job.get("status") != "done":
                self._send(404, {"error": "Video hazır değil"})
                return
            self._send_file(Path(job["path"]))
            return
        if path.startswith("/swap-video/"):
            job = VIDEO_JOBS.get(path.split("/")[2])
            if not job:
                self._send(404, {"error": "İş bulunamadı"})
                return
            self._send(
                200,
                {
                    "progress": job["progress"],
                    "status": job["status"],
                    "error": job["error"],
                    "trimmed": job["trimmed"],
                },
            )
            return
        self._send(404, {"error": "Bulunamadı"})

    def do_POST(self) -> None:
        path = self.path.split("?", 1)[0].rstrip("/")
        content_type = self.headers.get("Content-Type", "")
        length = int(self.headers.get("Content-Length", "0") or "0")
        if path == "/swap-video":
            if "multipart/form-data" not in content_type or "boundary=" not in content_type:
                self._send(400, {"error": "Video paketi eksik"})
                return
            parts = parse_multipart(content_type, self.rfile.read(length))
            try:
                meta = json.loads(parts.get("meta", b"{}").decode("utf-8"))
            except json.JSONDecodeError:
                self._send(400, {"error": "Geçersiz istek"})
                return
            video = parts.get("video")
            if not video:
                self._send(400, {"error": "Video dosyası yok"})
                return
            job_id = start_video_job(meta, video)
            self._send(200, {"id": job_id})
            return
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            self._send(400, {"error": "Geçersiz istek"})
            return
        if path == "/detect":
            clip_id = payload.get("clipId")
            if not isinstance(clip_id, str) or not clip_id:
                self._send(400, {"error": "Klip seçilmedi"})
                return
            image_value = payload.get("image")
            faces, error = detect_clip(clip_id, image_value if isinstance(image_value, str) else None)
            if error:
                self._send(404, {"error": error})
                return
            self._send(200, {"faces": faces})
            return
        if path == "/swap":
            try:
                image, error = swap_faces(payload)
            except FileNotFoundError as exc:
                self._send(404, {"error": str(exc)})
                return
            except Exception as exc:
                print("swap failed:", exc)
                self._send(500, {"error": "Dönüşüm başarısız"})
                return
            if error or not image:
                self._send(422, {"error": error or "Dönüşüm başarısız"})
                return
            self._send(200, {"id": uuid.uuid4().hex, "image": image})
            return
        self._send(404, {"error": "Bulunamadı"})

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length")

    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path: Path) -> None:
        data = path.read_bytes()
        size = len(data)
        start, end = 0, size - 1
        status = 200
        range_header = self.headers.get("Range")
        if range_header and range_header.startswith("bytes="):
            piece = range_header.removeprefix("bytes=").split("-", 1)
            if piece[0]:
                start = int(piece[0])
            if len(piece) > 1 and piece[1]:
                end = int(piece[1])
            end = min(end, size - 1)
            status = 206
        chunk = data[start : end + 1]
        self.send_response(status)
        self._cors()
        self.send_header("Content-Type", "video/mp4")
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(len(chunk)))
        if status == 206:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()
        self.wfile.write(chunk)

    def log_message(self, fmt: str, *args) -> None:
        print(f"{self.address_string()} {fmt % args}")


def main() -> None:
    print("model yükleniyor")
    analyzer()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"swapface detect listening on http://{HOST}:{PORT}/detect")
    server.serve_forever()


if __name__ == "__main__":
    main()
