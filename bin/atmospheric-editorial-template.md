# Atmospheric Indonesian Editorial Template (9:16)

Template ini diturunkan dari `reference-bulan-cerah-1.mp4` dan ditujukan untuk keyframe explainer vertikal dengan suasana keseharian Indonesia yang tenang dan sinematik. Referensi terukur berdurasi 78,54 detik, 1080×1920, sekitar 24 fps, dengan 14 visual shot dan mayoritas direct cut.

## Master style

```text
Vertical 9:16 premium 2D atmospheric editorial illustration of contemporary everyday Indonesia. Semi-painterly digital artwork built from simplified confident shapes, controlled medium detail, soft matte cel shading, subtle dry-brush texture, slightly imperfect hand-painted edges, cinematic perspective, and clear foreground–midground–background separation. Authentic Indonesian urban and neighborhood architecture, restrained visual storytelling through ordinary objects and lived-in spaces, no dominant protagonist unless explicitly requested. Harmonized muted teal, olive green, dusty blue, warm cream, terracotta, ochre, and amber palette. Natural directional light, long graphic shadows, soft atmospheric depth, quiet contemplative mood, polished modern editorial-film keyframe, stable coherent geometry, visually readable on a phone screen. Preserve generous clean areas and a single clear focal idea. Render one clean animation-ready still frame with no typography.
```

## Variabel scene

- `beat`: hook, context, data, climax, impact, atau outro.
- `narration`: gagasan editorial yang harus diterjemahkan menjadi lingkungan dan objek visual.
- `title`: konteks topik yang menjaga interpretasi scene tetap relevan.
- `index`: memilih variasi arketipe ruang, waktu, dan pencahayaan tanpa memecah style.

Arketipe visual berputar antara interior tenang, jalan/threshold urban, still life bukti, ruang publik, aktivitas manusia berskala kecil, dan closing view kontemplatif. Semua scene wajib memiliki foreground frame, subject plane, dan atmospheric background.

## Continuity anchors

1. Shape language semi-painterly, matte texture, soft edges, dan detail level harus sama.
2. Gunakan keluarga teal, olive, dusty blue, cream, terracotta, ochre, dan amber.
3. Arsitektur, vegetasi, kendaraan, furnitur jalan, dan objek domestik harus terasa Indonesia.
4. Jangan membuat recurring hero; manusia hanya hadir bila narasi membutuhkannya.
5. Motif agama hanya muncul ketika topik/narasi menyebut konteks tersebut.
6. Visual plate tidak pernah merender teks, subtitle, logo, watermark, branding, CTA, atau UI.

## Motion grammar

- Kamera bergerak perlahan sekitar 3–5% per shot dengan easing lembut.
- Maksimal satu aksi lingkungan kecil: daun, tirai, burung, cahaya, atau lalu lintas jauh.
- Background dan geometri bangunan tetap stabil; dilarang jitter, morph, camera shake, dan idle float generik.
- Output target 24 fps dengan direct cut atau match arah/cahaya antar-scene.

## Negative prompt

```text
letters, words, numbers, captions, subtitles, title cards, logos, branding, watermark, signatures, UI, photorealism, live-action photography, glossy 3D CGI, plastic materials, anime line art, hard black cartoon outlines, exaggerated facial features, malformed people, extra limbs, duplicated objects, warped vehicles, bent architecture, impossible perspective, cluttered composition, excessive ornaments, oversaturation, neon colors, crushed blacks, blown highlights, heavy blur, fake depth of field, noisy grain, low resolution, compression artifacts, unrequested religious symbols, foreign architecture, camera frame, border
```

## Pemanggilan

Gunakan genre `atmospheric-editorial` saat membuat storyboard. Pada workflow saat ini, brief yang memuat `atmospheric-editorial`, `bulan cerah`, `semi-painterly`, atau `editorial sinematik` akan memilih template ini. Flow menerima prompt visual dan `public/atmospheric-editorial-style-ref.jpg` sebagai style reference; seluruh teks tetap ditangani di luar visual plate.
