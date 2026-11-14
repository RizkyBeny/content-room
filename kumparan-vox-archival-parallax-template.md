# Kumparan Vox Archival Parallax Explainer Template (9:16)

Panduan resmi arsitektur visual dan spesifikasi teknis untuk video vertikal 9:16 (1080×1920) Kumparan Explainer Series, berbasis integrasi konsep **2.5D Multi-Plane Archival Parallax** (terinspirasi dari visual journalism khas Vox), **Google AI Flow (Imagen 3 & Veo)**, dan **Remotion Motion Typography & Archival Overlay**.

---

## 1. Prinsip Desain & Filosofi Visual

Template ini menggunakan estetika **2.5D Multi-Plane Archival Photojournalism Collage**:
- **3-Plane Spatial Depth Separation**:
  - **Foreground Framing**: Lembaran kertas arsip tersobek (*torn paper borders*), kabel spiral mikrofon/telepon, atau headphone analog besar di sudut bawah/samping untuk memberikan kedalaman optik instan.
  - **Midground Hero Zone**: Objek fisik investigasi historis (perekam pita magnetik *reel-to-reel*, tabung vakum berpendar, telepon putar, map berkas dokumen bertato stempel merah tebal **"RAHASIA"**) dipadukan dengan potongan foto arsip hitam-putih (*black-and-white historical photo cutouts*) tokoh atau perwira bersejarah.
  - **Background Plate**: Kliping koran historis 1965 (*aged newsprint*), peta dinding terlipat (*vintage city maps*), atau tirai kantor louvre dengan berkas cahaya dramatis (*volumetric dust motes & light beams*).
- **Ritme Bergantian Antar-Scene (Alternating Rhythm)**:
  - **Variant B (Investigative Desk Overview)**: Sudut pandang meja penyelidikan yang lebih luas dengan peta terbentang, telepon putar, switchbox penyadap, dan potongan foto tokoh utama (digunakan pada Beat Hook, Climax, dan Outro).
  - **Variant A (Macro Evidence & Classified Dossier)**: Sudut pandang makro sinematik ke arah bukti fisik spionase (pita magnetik rekaman, map berkas stempel merah rahasia, meteran VU analog) (digunakan pada Beat Context, Data, dan Impact).
- **Strict Negative Space (Top 35%)**: Area atas frame (0px – 670px) dijaga tetap bersih dari objek fisik yang mengganggu, menyisakan gradien bayangan kantor/ruang arsip gelap sebagai kanvas aman bagi tipografi Remotion.
- **Filmic Tactility**: Nuansa butiran film 35mm halus (*subtle film grain*), tekstur kertas berserat (*matte archival paper grain*), dan pencahayaan chiaroscuro dokumenter.

---

## 2. Diagram Tata Letak & Safe Areas (1080×1920)

```
0px ------------------------------------------------------------- [Top Edge]
    | [TOP SAFE AREA - 140px] Bebas clutter, aman status bar IG/TikTok
148px| Archival Header: "[ DOKUMEN INTELIJEN // BERKAS 01 - HOOK ]" (Mono 22px, Track: 0.16em)
198px| Pagination Dots / Archival Hash Marks: ─ ─ ─ ■ ─ ─ ─ (Track: 35px)
    |
340px| [HEADLINE ZONE - Max Y: 640px]
    | Kinetic Headline 3-4 Baris (Font: Inter ExtraBold 800, 64px, Line-height: 1.18)
    | Sumbu Simetri: Align Center (text-anchor="middle", x=540)
    | Warna Teks: Warm Archival Cream (#F4EBD9) dengan bayangan teks lembut
    | Opasitas transisi kata per kata: rgba(244, 235, 217, t)
640px------------------------------------------------------------
    | [MIDDLE HERO ZONE - Y: 640px s/d 1440px]
    |
    | 2.5D Multi-Plane Archival Composition:
    | - Objek spionase vintage (Reel-to-Reel Tape / Vacuum Tube Switchbox)
    | - Map dossier manila tebal berstempel merah "RAHASIA"
    | - Cutout foto arsip hitam-putih bersejarah
    | - Latar kliping koran 1965 / peta Djakarta buram lembut
    |
1440px-----------------------------------------------------------
    | [BOTTOM ARCHIVAL EVIDENCE ZONE - Y: 1440px s/d 1740px]
    |
1600px| Archival Evidence Badge Card (Lebar: 780px, Tinggi: 160px, rx=16)
    | Latar Manila Tint (#EFE6D5) + Cap Merah "DEKLASIFIKASI" + Border 1.5px
    | Baris 1: BERKAS INVESTIGASI SEJARAH // 1965 - 2026 (Mono 18px, #8C2525)
    | Baris 2: PENYADAPAN DAN KEKUASAAN TANPA PENGAWASAN (Inter 22px, #1A1918)
    | Baris 3: SUMBER: ARSIP DOKUMEN & RISET KUMPARAN (Mono 14px, #5A524C)
    |
    | [BOTTOM SAFE AREA - 180px] Bebas tombol interaksi media sosial
1920px----------------------------------------------------------- [Bottom Edge]
```

---

## 3. Palet Warna & Visual Identity Kanonik

| Peran Warna | Kode Hex | Deskripsi & Kegunaan |
| :--- | :--- | :--- |
| **Archival Deep Charcoal** | `#1A1918` | Latar kanvas bayangan gelap ruang arsip, warna teks dokumen utama |
| **Warm Archival Cream** | `#F4EBD9` | Warna teks tipografi headline, warna kertas koran/arsip lawas |
| **Dossier Manila Ochre** | `#D8C29D` | Warna map dokumen berkas tebal dan kartu bukti |
| **Stamp Crimson Red** | `#D72638` | Warna stempel **"RAHASIA"**, garis panah anotasi, aksen peringatan |
| **Amber Tungsten Glow** | `#FFE271` | Pendaran cahaya lampu meja hangat & tabung vakum |

---

## 4. Universal Master Prompt Formula

### A. Formula Prompt Keyframe (Google AI Flow / Imagen 3)

#### Varian Meja Investigasi (Investigative Desk & Cutout Tokoh) - Cocok untuk Hook, Climax, Outro:
```text
A high-end editorial 2.5D documentary photo collage in the distinctive Vox visual journalism style, vertical 9:16 composition. An investigative historical desk setup examining [TOPIC_CONTEXT]. In the midground, a vintage rotary telephone connected to an analog interception switchbox with glowing vacuum tubes and patched jumper wires, resting atop a spread of authentic 1965 archival documents with red ink editorial underlines and paperclip attachments. A vintage black-and-white cutout portrait of [HISTORICAL_FIGURE] stands angled on the desk. In the foreground, textured torn edges of yellowed archival paper and a pair of heavy wiretapping headphones frame the bottom and sides. In the background, a large-format vintage Indonesian map of Jakarta and institutional office walls blur into soft focus with subtle dust motes in a beam of light. Rich documentary photojournalism feel, 35mm film texture, high contrast chiaroscuro lighting, distinct 3-plane spatial depth. The top 35% is open, dark, clean negative space. Editorial documentary collage, authentic historical look, no floating letters, no digital watermark.
```

#### Varian Bukti Makro (Macro Reel-to-Reel & Dossier Rahasia) - Cocok untuk Context, Data, Impact:
```text
A high-end editorial 2.5D documentary photo collage in the distinctive Vox visual journalism style, vertical 9:16 composition. The scene depicts a 1960s state surveillance and intelligence archive examining [TOPIC_CONTEXT]. In the midground, an iconic vintage 1960s reel-to-reel magnetic tape recorder with twin aluminum spools, analog VU meters, and coiled vintage bakelite headphones sits on a dark teak wood desk alongside a thick manila folder marked with a bold red rubber stamp reading "RAHASIA". Next to the dossier is a crisp black-and-white archival photograph cutout of historical figures in 1965 military uniforms. In the foreground, a dark coiled telephone cord and a brass magnifying glass create strong foreground depth. In the background, aged Indonesian newspaper clippings from 1965 and shadowy institutional louvre blinds fade softly into warm atmospheric shadow. Tactile matte paper archival aesthetic, subtle 35mm film grain, dramatic documentary lighting with volumetric warm desk lamp glow. The top 35% of the frame is clean, uncluttered negative space reserved for text overlay. Clean, realistic, editorial journalism collage, no digital UI, no floating text or subtitles.
```

### B. Formula Prompt Motion Video (Google AI Flow / Veo)
```text
Slow cinematic 2.5D camera push-in. The foreground torn paper and coiled wire elements drift smoothly outward creating pronounced multiplane parallax depth against the midground [HERO_OBJECT]. Subtle analog movements: tape reels turn with gentle precision, glowing vacuum tubes pulse warmly, and microscopic dust particles drift through the warm lamplight beam. Background archival newspaper remains softly out of focus. Crisp 35mm documentary film grain, 24fps smooth parallax motion, zero erratic warping.
```

---

## 5. Pembagian Peran Komponen (Separation of Concerns)

### A. Google AI Flow (Imagen 3 & Veo) — Lapisan Visual Pelat 2.5D
- Merender gambar kolase fotografi historis bertingkat 3 lapis kedalaman.
- Menggenerasi gerakan gerak parallax lambat (*slow 2.5D push-in*) antara lapisan foreground, midground, dan background.
- **TIDAK PERNAH** merender teks headline, nomor urut, atau subtitle.

### B. Remotion & SVG Overlay — 100% Tipografi & Cap Arsip
- **Header Kicker**: `[ DOKUMEN INTELIJEN // BERKAS {N} - {BEAT} ]` dalam gaya typewriter/mono spasi lebar.
- **Kinetic Centered Typography**: Menggunakan warna `#F4EBD9` (Archival Cream) dengan transisi `easeOutCubic` kata demi kata tanpa pergeseran tata letak (*zero layout shift*).
- **Archival Evidence Badge**: Kartu bukti dokumen bernuansa manila dengan aksen cap merah stempel intelijen pada area bawah video.

