# SwapFace

Trend kliplerden veya kendi videondan bir yüz seçip, kütüphanendeki fotoğrafla önizleyen B2C stüdyo. Arayüz referans paneli adım adım takip eder: video, hedef kişi, kaynak yüz, dönüştür.

## Çalıştırma

```bash
npm install
npm run dev
```

Hetzner üzerinde üretim kopyası:

```bash
git clone https://github.com/nietzische-app/swapface.git
cd swapface
docker compose up -d --build
```

Site `http://SUNUCU_IP:3000` adresinde açılır. Bu adım yalnızca arayüzü ve demo API'yi çalıştırır. Yüz tespiti ve dönüşüm sonraki adımda ayrı bir servis olarak bağlanır.

Uygulama [http://localhost:3000](http://localhost:3000) adresinde açılır. Varsayılan demo hesap `M. Demir`, 120 kredi, Standart plandır.

## Dizin

```
app/                  Next.js sayfaları ve API
  api/detect          Yüz tespiti
  api/swap            Dönüşüm işi ve ilerleme
  page.tsx            Adım adım stüdyo
components/
  shell/              Kenar menü, üst bar, giriş
  studio/             Dört adım, filigran, önizleme
  pages/              Dashboard, yükleme, kütüphane, üyelik, ayarlar
lib/                  Tipler, katalog, dışa aktarma
services/
  credits/policy.ts   Filigran, kalite, günlük limit, ücret
  face-detection/     Mock ve InsightFace adaptörü
  face-swap/          Mock ve ReActor/Roop adaptörü
public/media/         Stüdyo görselleri
```

## Planlar

| | Standart | Pro |
| --- | --- | --- |
| Filigran | Sol altta SwapFace | Yok |
| İndirme | 720p | 1080p |
| Günlük hak | 10 | 30 |
| Ücret | 10 kredi | 10 kredi |

Üyelik ekranından plan değişir. İndirilen WebM (veya kayıt desteklenmiyorsa PNG) bu kuralı dosyanın içine basar. Üretim modeli bağlanmasa da freemium kararı sunucuda `resolveExportPolicy` ile verilir.

## Model servisi

Varsayılan sağlayıcı mock'tur; tarayıcıda gerçek bir yüz değiştirme modeli çalışmaz. Kendi servisini bağlamak için:

```bash
INSIGHTFACE_API_URL=https://detector.example/detect
REACTOR_API_URL=https://swap.example/jobs
```

InsightFace ucu `{ clipId }` alır ve `{ faces: [{ id, name, box: {x,y,w,h}, avatar }] }` döner. `box` değerleri karenin yüzdesidir. ReActor/Roop ucu `{ clipId, targetFaceId, sourceFaceId, plan, quality, watermark }` alır ve `{ id }` döner. Filigran ve çözünürlük modelden değil abonelikten gelir.
