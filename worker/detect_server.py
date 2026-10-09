"""Local InsightFace detector for the SwapFace studio.

Listens on 127.0.0.1:3099. The Next.js app calls POST /detect with a catalog
clip id. Only the detection model is loaded so a 4 GB GTX 1650 can run it.
"""

from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import cv2
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


def analyzer() -> FaceAnalysis:
    global ANALYZER
    if ANALYZER is None:
        app = FaceAnalysis(
            providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
            allowed_modules=["detection"],
        )
        app.prepare(ctx_id=0, det_size=(640, 640))
        ANALYZER = app
    return ANALYZER


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
        if self.path.split("?", 1)[0].rstrip("/") != "/detect":
            self._send(404, {"error": "Bulunamadı"})
            return
        length = int(self.headers.get("Content-Length", "0") or "0")
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            self._send(400, {"error": "Geçersiz istek"})
            return
        clip_id = payload.get("clipId")
        if not isinstance(clip_id, str) or not clip_id:
            self._send(400, {"error": "Klip seçilmedi"})
            return
        faces, error = detect_clip(clip_id)
        if error:
            self._send(404, {"error": error})
            return
        self._send(200, {"faces": faces})

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
