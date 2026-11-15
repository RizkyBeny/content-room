# Master Prompt Template: Mystery True Crime (9:16)
## Canonical Architecture & Blueprint Specification

Dokumen kanonik resmi untuk satu-satunya template video visual vertikal 9:16 (1080×1920) di sistem Content-automation: **Mystery True Crime / Serial Investigation Explainer**.

Template ini dirancang khusus untuk konten YouTube Shorts, TikTok, dan Instagram Reels dengan retensi tinggi, visual padat bergaya **Graphic Novel Neo-Noir**, **Full-Bleed 100% Canvas**, **Shot 00 Mandatory Cover Image**, **Noir Forensic Glitch Transition**, dan **Bottom Safe Area Autocaption**.

---

## 1. Filosofi Visual & Art Direction

- **Gaya Seni**: *Graphic Novel Neo-Noir / Investigative Forensic Noir*.
- **Garis & Tinta**: Garis luar hitam tegas dengan variasi ketebalan dinamis (*heavy contour inking*), dipadukan dengan bayangan cel-shaded dan tekstur bintik *halftone screen tone*.
- **Kanvas Penuh (Full-Bleed 100%)**: Ilustrasi memenuhi seluruh bidang 1080×1920 tanpa potongan ruang kosong buatan di atas.
- **Pacing Rigid (3–5 Detik / Shot)**: Setiap video ~60 detik tersusun dari 14–15 shot visual berbeda untuk menjaga retensi penonton dari awal hingga akhir.
- **Pencahayaan Chiaroscuro**: Kontras tajam antara bayangan hitam pekat (*deep shadows*) dan sorotan cahaya lampu meja forensik atau lampu katedral pengadilan yang dingin.

---

## 2. Palet Warna Kanonik

| Peran Warna | Nama Warna | Kode Hex | Penggunaan Utama |
| :--- | :--- | :--- | :--- |
| **Primary Dark** | Matte Charcoal Slate | `#0D1117` | Latar belakang kanvas, meja grafit, bayangan chiaroscuro |
| **Secondary Dark** | Deep Navy Graphite | `#161B22` | Gradasi halftone, permukaan logam forensik, dinding apartemen |
| **Authority Accent** | Antique Dull Bronze | `#C59B27` | Kata aktif autocaption, pita polisi, timbangan keadilan, aksen judul |
| **Warning Accent** | Deep Dried Crimson | `#8B2635` | Pita sub-headline cover, stempel terpidana mati, tag bukti, chromatic glitch |
| **Text Base** | Warm Broken-White | `#E6EDF3` | Kata dasar autocaption, headline cover, rim highlights siluet |
| **Evidence Paper** | Aged Manila Tint | `#F0E6D2` | Label nomor bukti, folder berkas otopsi kepolisian |

---

## 3. Cetak Biru Prompt Master (Prompt Blueprints)

### Blueprint 0: Mandatory High-CTR Cover Image (Shot 00 / Thumbnail Hook)
Wajib hadir di detik `00:00 - 00:01.5` sebagai frame pembuka video sekaligus thumbnail YouTube Shorts:

```text
A dramatic, high-CTR YouTube Shorts cover and thumbnail illustration, vertical 9:16 aspect ratio (1080x1920), Graphic Novel Neo-Noir style.
Visual Scene: A chilling crime scene hook depicting [CASE HERO VISUAL: e.g., the menacing silhouette of a serial killer in a hoodie in a dim Tokyo apartment hallway holding a cracked smartphone with a cold cyan glow, yellow police tape marked 'KEEP OUT / 立入禁止' and white cooler boxes in the shadows].
Integrated Bold Typography:
- Prominent massive distressed headline text: "[MAIN HEADLINE: e.g., JEJAK SADIS TWITTER KILLER]" rendered in heavy stencil/impact typography in warm broken-white (#E6EDF3) with antique brass bronze accents (#C59B27) and deep drop shadows.
- Sub-headline ribbon banner: "[SUB-HEADLINE: e.g., 9 NYAWA DALAM 2 BULAN]" in a deep dried crimson red tape (#8B2635) with sharp white lettering.
- Top warning header banner: "/// POLICE INVESTIGATION DOSSIER ///".
Artistic Style: Dynamic heavy inking, chiaroscuro lighting, gritty halftone screen tone dot pattern, cel-shaded shadows, matte graphic novel finish. Full bleed composition filling the entire 9:16 vertical canvas. No pastel colors, no oversaturation, no cartoonish elements.
```

---

### Blueprint 1: Symbolic Allegory (Mahkamah, Timbangan Keadilan, Eksekusi, Vonis)
Digunakan pada Beat Hook (Intro), Climax, dan Outro:

```text
A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920).
Subject: [ALLEGORY OBJECT: e.g., The heavy silhouette of gallows noose hanging inside a monolithic Tokyo justice hall with neoclassical stone pillars and judicial seal].
Composition: Full bleed vertical portrait framing with complete visual depth from top to bottom. Dramatic low-angle perspective, monolithic presence.
Style: High-contrast neo-noir graphic novel, dynamic heavy contour inking, fine halftone dot screen tones, cel-shaded lighting, matte finish.
Color palette: Matte charcoal slate (#0D1117), cold desaturated storm gray, antique brass bronze accents (#C59B27), deep dried crimson accents (#8B2635), zero oversaturation.
Lighting: Dramatic chiaroscuro with sharp volumetric spotlight piercing through cold mist, casting defined deep shadows.
Invariants: Full bleed composition without empty artificial space, no floating text cards, no watermark.
```

---

### Blueprint 2: Forensic Evidence Desk (Meja Investigasi 45° Isometrik)
Digunakan pada Beat Context, Modus Kejahatan, Detail TKP, dan Bukti Perkara:

```text
A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920).
Subject: Isometric 45-degree angle top-down view of a police forensic evidence desk examining [EVIDENCE OBJECTS: e.g., a cracked smartphone with ominous glowing messages, clear plastic evidence bags containing Japanese Yen bills and victim ID cards, white cooler boxes with red evidence tag markers '02' and '03', and confidential autopsy folders].
Composition: Full bleed vertical framing. Forensic items tightly arranged across a matte dark graphite workbench with tactical grid markings. Rich foreground-to-background spatial layers.
Style: Gritty investigative graphic novel noir, crisp black inked linework, fine halftone dot shading, tactile matte paper and metallic textures.
Color palette: Matte charcoal slate (#0D1117), cold metallic gray, antique dull bronze (#C59B27), dried crimson red stamps (#8B2635).
Lighting: Harsh single desk examination lamp casting long dramatic shadows across the table.
Invariants: Full bleed composition, no UI overlays, no digital watermarks.
```

---

## 4. Spesifikasi Gerakan Kamera & Transisi Glitch

1. **Ken Burns Motion per Shot**:
   - `scale: 1.0 -> 1.08` (Slow cinematic push-in).
   - `yPercent: -2%` (Creeping vertical tilt) atau `xPercent: 1.5%` (Subtle horizontal pan).
   - Easing: `none` atau `power1.out` untuk pergerakan kontinu tanpa guncangan.

2. **Noir Forensic Glitch Transition (14 Titik Transisi)**:
   - Terjadi pada setiap pergantian shot (`durasi: 0.18 detik`).
   - Visual: Distorsi scanline horizontal + chromatic aberration merah/emas (`filter: drop-shadow(-6px 0 #8B2635) drop-shadow(6px 0 #C59B27)`).
   - Audio: Sound effect *forensic glitch whoosh / sub hit* memukul sinkron pada frame yang sama.

---

## 5. Spesifikasi Autocaption (Bottom Safe Area)

- **Posisi**: `bottom: 300px`, `left: 72px`, `right: 72px` (Y: 1480px s/d 1620px).
- **Safe Area Invariant**: Diletakkan tepat di atas area elemen UI YouTube Shorts & TikTok (nama channel, audio badge, tombol like/komentar).
- **Bottom Dark Scrim**: Gradasi hitam vertikal setinggi 560px dari dasar kanvas (`rgba(10,13,18,0)` ke `rgba(10,13,18,0.92)`) menjamin kontras 100% di atas detail gambar.
- **Tipografi**:
  - Font: `Montserrat 800` (Extra Bold 52px, letter-spacing: -0.01em).
  - Teks Normal: Broken-White (`#E6EDF3`) dengan `text-shadow: 0 4px 18px rgba(0,0,0,0.98), 0 2px 6px rgba(0,0,0,0.95)`.
  - Kata Aktif (Karaoke): Antique Bronze (`#C59B27`) dengan `scale: 1.08` dan pendar emas lembut.

---

## 6. Prompt Guardrails & Negative Invariants

- **Negative Keywords**: `oversaturated colors, pastel palette, bright cartoon, 3d pixar disney render, cute anime, flat vector clipart, watermark, text cards covering artwork, empty artificial blank header`.
- **Engine Rekomendasi**: Google Flow MCP (`flow.google.com`) dengan opsi `type: 'image'`, `aspect_ratio: '9:16'`, `max_credits: 0` (Unlimited Free Stills).

---

## 7. Arsitektur Audio & Broadcast Mixing

- **Voice Over (VO)**: Level 100% (`volume=1.0`), Karakter suara Charon (berat, otoritatif, dingin).
- **Background Music (BGM)**: Level **20%** (`volume=0.20`, -14 dB relatif terhadap VO) sebagai *subtle tension bed* agar tidak mengaburkan artikulasi kata naskah. Karakter instrumen: D-Minor 80 BPM (pulsing cello ostinato, haunting high piano Mindhunter, subtle ticking clock, dark string pad).
- **Transition SFX**: Level 65% (`volume=0.65`) pada setiap timestamp pergantian adegan (14 titik transisi), sinkron dengan efek visual *Noir Forensic Glitch*.
- **Master Loudness**: Broadcast-normalized `-16 LUFS` (Stereo 48kHz).
