# Kumparan Technical Blueprint Explainer Template (9:16)

Panduan resmi arsitektur visual dan spesifikasi teknis untuk video vertikal 9:16 (1080×1920) Kumparan Explainer Series, berbasis integrasi konsep **Anatomy Precision Instrument** ([wheresryan22/anatomy](https://github.com/wheresryan22/anatomy)), **Google AI Flow (Imagen 3 & Veo)**, dan **Remotion Motion Typography & Technical HUD**.

---

## 1. Prinsip Desain & Filosofi Visual

Template ini menggunakan estetika **Linear-Style Isometric Technical Patent Drawing & Cutaway Machine**:
- **The Object IS the Explanation**: Menolak penggunaan diagram kotak dan garis panah abstrak. Setiap konsep sains, teknologi, ekonomi, atau regulasi diwujudkan sebagai instrumen mekanik atau mesin fisik presisi nyata.
- **Clean Technical Whitepaper Canvas (`#F8FAFC`)**: Latar belakang kertas drafting teknis putih bersih dengan kisi-kisi isometrik mikro (*isometric drafting grid guidelines*) ber-opasitas tipis.
- **4-Tone Technical Studio Shading**: Shading mekanikal empat tingkat (*hi*, *mid*, *lo*, *faint*) dengan garis tepi abu-abu grafit gelap (*dark graphite* 0.6px) dan bayangan kontak ambien lembut (*ambient occlusion halo*) di dasar pelat mesin.
- **Single Lit Accent**: Tepat satu elemen fungsional aktif yang disinari warna biru elektrik teknikal (*Electric Technical Cyan* `#0066FF`), mengarahkan fokus mata penonton tanpa menciptakan polusi visual.
- **Zero Clutter Canvas**: Area atas 35% dan area bawah 20% adalah ruang kosong murni (*negative space*) yang bebas dari objek maupun teks grafis, disiapkan khusus untuk overlay tipografi Remotion.
- **Precision Technical HUD**: Overlay Remotion berupa penggaris ukur milimeter (*tick ruler*), header kode figur `[FIG 01]`, tipografi *dark graphite* rata tengah, serta kartu telemetri data (*Live Telemetry Badge*).

---

## 2. Diagram Tata Letak & Safe Areas (1080×1920)

```
0px ------------------------------------------------------------- [Top Edge]
    | [TOP SAFE AREA - 140px] Bebas clutter navigasi IG/TikTok
148px| Technical Header: "[ FIG 01 // SPESIFIKASI PENYADAPAN ]" (Mono 22px, Track: 0.16em)
195px| Precision Millimeter Tick Ruler: ──┼──┼──┼──┼──┼──┼──┼── (Track: 900px, #0F172A)
    |
340px| [HEADLINE ZONE - Max Y: 600px]
    | Kinetic Headline 3-4 Baris (Font: Inter ExtraBold 800, 64px, Line-height: 1.18)
    | Sumbu Simetri: Align Center (text-anchor="middle", x=540)
    | Warna Teks: Dark Graphite (#0F172A)
    | Opasitas transisi kata per kata: rgba(15, 23, 42, t)
640px------------------------------------------------------------
    | [MIDDLE HERO ZONE - Y: 640px s/d 1440px]
    |
    | Monochromatic Whitepaper Drafting Grid (#F8FAFC)
    |
    | 45° Isometric Precision Mechanical Apparatus:
    | - Pelat dasar milled ber-kaki silindris (baseplate on feet)
    | - Rel linier presisi dengan micrometer carriage & bushing
    | - Dial indicator gauge & kenop thumbscrew bergerigi kuningan
    | - Cutaway cross-section mengungkap gear internal, pegas, & prisma optik
    | - Single Electric Cyan Lit Accent (#0066FF) pada komponen aktif
    | - Soft ambient contact shadow (halo) di bawah pelat dasar
    |
1440px-----------------------------------------------------------
    | [BOTTOM TELEMETRY & CAMPAIGN ZONE - Y: 1440px s/d 1740px]
    |
1610px| Live Telemetry Badge Card (Lebar: 800px, Tinggi: 150px, rx=20)
    | Latar Putih Semi-Transparan + Border 1.5px Slate (#CBD5E1) + Left Accent Bar (#0066FF)
    | Baris 1: TARGET ANALISIS: INTERSEPSI LEVEL (Mono 19px, #0052CC)
    | Baris 2: JARINGAN OPERATOR vs INFILTRASI PONSEL (Inter 22px, #0F172A)
    | Baris 3: KALIBRASI DOKUMEN: ETSI & CITIZEN LAB // 2026 (Mono 14px, #64748B)
    |
    | [BOTTOM SAFE AREA - 180px] Bebas tombol interaksi media sosial
1920px----------------------------------------------------------- [Bottom Edge]
```

---

## 3. The Universal Master Prompt Formula (100% Reprodusibel Lintas AI)

### A. Formula Prompt Keyframe (Google AI Flow / Imagen 3)
```text
A hyper-detailed, clean technical isometric illustration of a precision mechanical [APPARATUS_NAME] designed to explain [CONCEPT_METAPHOR], seen from a 45-degree isometric angle. The machine rests on a heavy milled base plate with cylindrical feet, linear rails with millimeter tick marks, knurled brass thumbscrews, and a cutaway cross-section revealing internal optical prisms, gear mechanisms, and a micrometer probe. Solid, ultra-clean matte technical whitepaper drafting background (#F8FAFC) with faint microscopic isometric drafting grid lines. Precision four-tone technical studio shading with crisp dark graphite outlines and soft ambient occlusion contact shadow beneath the machine. Exactly one active mechanical optical prism is illuminated with a vibrant electric technical cyan accent (#0066FF). The top 35% and bottom 20% of the frame are completely empty negative space. Modern Linear-style engineering drawing, patent diagram aesthetic, octane technical render, absolutely no floating text or labels.
```

### B. Formula Prompt Motion Video (Google AI Flow / Veo)
```text
Locked camera shot, 45-degree isometric angle. The precision mechanical apparatus operates with calm, physical, precision eased motion: the linear carriage glides smoothly along the polished rails, the dial gauge needle deflects steadily, and internal coil springs compress and release with realistic mechanical physics. The clean whitepaper drafting background remains 100% still and solid. High-end product engineering studio lighting, crisp 60fps-smooth motion, zero camera drift.
```

---

## 4. Pembagian Peran Komponen

### A. Google AI Flow (Imagen 3 & Veo) — Hanya Visual Aparatus
- Menggenerasi visual aparatus mekanik 45° isometrik murni di atas kanvas kertas putih `#F8FAFC`.
- **TIDAK PERNAH** merender teks headline, penggaris, atau label mengambang di atas gambar.

### B. Remotion & SVG Overlay — 100% Tipografi, Penggaris, & HUD
- Menggambar penggaris ukur milimeter (*tick ruler*) dengan SVG line bertingkat (*major & minor ticks*).
- Menampilkan teks headline warna *dark graphite* (`#0F172A`) dengan perataan tengah (*Align Center*, `text-anchor="middle"`, `x="540"`).
- Mempertahankan `xml:space="preserve"` dan manipulasi opasitas `<tspan fill="rgba(15, 23, 42, ${opacity})">` untuk memastikan *zero layout shift*.
- Merender kartu telemetri data bawah dengan aksen garis biru teknis.

