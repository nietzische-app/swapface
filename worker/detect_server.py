"""Local InsightFace worker for the SwapFace studio.

Listens on 127.0.0.1:3099.
POST /detect reads a catalog frame. POST /swap runs inswapper on this GPU.
"""

from __future__ import annotations

import base64
import json
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


def detect_clip(clip_id: str) -> tuple[list[dict] | None, str | None]:
    filename = CLIPS.get(clip_id)
    if filename is None:
        return None, "Bu klip worker üzerinde yok"
    image = cv2.imread(str(ROOT / "public" / "media" / filename))
    if image is None:
        return None, "Kare okunamadı"
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
                "avatar": f"/media/{filename}",
                "avatarPosition": f"{box_x + box_w / 2:.0f}% {box_y + box_h / 2:.0f}%",
            }
        )
    return faces, None


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path.split("?", 1)[0].rstrip("/") != "/health":
            self._send(404, {"error": "Bulunamadı"})
            return
        self._send(200, {"ok": True, "provider": "insightface"})

    def do_POST(self) -> None:
        path = self.path.split("?", 1)[0].rstrip("/")
        length = int(self.headers.get("Content-Length", "0") or "0")
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
            faces, error = detect_clip(clip_id)
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

    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

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
