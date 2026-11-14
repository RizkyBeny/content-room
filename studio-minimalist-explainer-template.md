# Studio Minimalist Brand & Product Explainer Template (9:16)

Panduan arsitektur visual resmi, spesifikasi teknis layout, dan formula prompt master untuk video vertikal 9:16 (1080×1920) bergaya **Studio Minimalist / Grace Studio Product Case Study**, berbasis integrasi:
1. **Google AI Flow (Imagen 3 & Veo 2)** untuk visual hero 3D studio, pencahayaan komersial, dan motion fisika debris di foreground.
2. **Remotion / SVG Overlay** untuk tipografi kinetik dual-font (*Editorial Serif + Heavy Sans*), elemen panduan (*dashed orbit tracker*), dan vector ribbon.

---

## 1. Prinsip Desain & Filosofi Visual

Estetika ini mengadopsi standar komersial papan atas (*high-end modern product commercial & brand documentary*):
- **Seamless Canvas Whitepaper (`#FAFAFA` s/d `#FFFFFF`)**: Latar studio putih bersih tanpa batas dengan grid arsitektur mikro (*subtle coordinate blueprint grid*) dan titik-titik persimpangan garis tipis (*node junction dots*).
- **Two-Zone Hierarchical Layout (Top + Mid Only)**:
  - **Top Area (Y: 180px – 520px)**: Didedikasikan khusus untuk narasi tipografi kinetik.
  - **Mid Area (Y: 520px – 1650px)**: Area panggung objek hero 3D dengan rotasi lembut, bayangan kontak studio, dan partikel/debris melayang (*depth of field*).
  - **Lower Area (Y: 1650px – 1920px)**: Ruang kosong murni (*negative space*) yang membaur mulus tanpa teks atau metadata, menciptakan tampilan lapang dan seamless (*zero visual clutter*).
- **Dual-Font Kinetic Contrast**:
  - *Typeface A (Editorial Serif)*: Frasa transisi naratif yang elegan, dinamis, dan percakapan (*conversational hook*), misal: *"watch how"*, *"went from"*, *"they are not just"*.
  - *Typeface B (Heavy Modern Sans-Serif)*: Entitas utama, angka valuasi, atau penegasan kata kunci, berbobot tebal (*Black/ExtraBold*), misal: *"Kopi Kenangan"*, *"1 BILLION DOLLAR"*, *"Unicorn"*.
- **Photorealistic Studio Lighting**:
  - Tiga titik pencahayaan studio komersial (*Key Light, Fill Light, Crisp Rim Light*).
  - Bayangan kontak lembut di dasar (*soft ambient contact shadow*) yang memberikan kesan objek nyata bertengger di atas ruang studio.
- **Cinematic Foreground Z-Depth Blur**:
  - Partikel kontekstual (seperti lembaran uang kertas 100-ribu/dolar, biji kopi, koin, koper) melayang melintasi lensa kamera dengan kecepatan tinggi, menghasilkan efek *directional motion blur* dan *foreground bokeh*.

---

## 2. Diagram Tata Letak & Safe Areas (1080×1920)

```
0px ------------------------------------------------------------- [Top Edge]
    | [TOP SAFE AREA - 180px] Bebas navigasi status bar & platform UI
    |
180px------------------------------------------------------------
    | [TOP KINETIC TYPOGRAPHY ZONE - Y: 180px s/d 520px]
    |
    | Baris 1: Conversational Hook (Stylized Editorial Serif, 48px - 56px, #0F172A)
    |          Contoh: "perhatikan bagaimana" / "watch how"
    | Baris 2: Punchline / Entity (Heavy Geometric Sans, 72px - 84px, #0F172A / Brand Accent)
    |          Contoh: "KOPI KENANGAN" / "1 MILYAR DOLAR"
    | Baris 3: Sub-kicker opsional (Italic SemiBold Sans, 32px, #475569)
    |          Contoh: "dalam kurun waktu kurang dari 4 tahun"
    |
520px------------------------------------------------------------
    | [MIDGROUND HERO & 3D MOTION ZONE - Y: 520px s/d 1650px]
    |
    | Canvas: Seamless Studio Off-White (#FAFAFA)
    | + Micro Drafting Grid (Opacity 0.08, 1px lines, junction dots)
    | + Dashed Circular Orbit Ring (stroke: #CBD5E1, stroke-dasharray: 12 8)
    | + Faint Architectural Vector Ribbon Path
    |
    | Hero Subject (Render Google Flow):
    | - Centered 3D Physical Product / Object (Tilt: -10° s/d +12°)
    | - Rim lighting highlighting silhouette contours
    | - Realistic ambient occlusion drop shadow
    |
    | Foreground Z-Plane (Render Google Flow):
    | - High-velocity flying contextual elements (Bills, Coffee beans, Coins)
    | - Heavy directional motion blur & shallow depth-of-field bokeh
    |
1650px-----------------------------------------------------------
    | [SEAMLESS LOWER CANVAS & BOTTOM SAFE AREA - Y: 1650px s/d 1920px]
    |
    | 100% Negative Space (Ruang bernafas bersih, tanpa teks, tanpa watermark)
    | Gradasi pencahayaan studio halus ke margin bawah
    |
1920px----------------------------------------------------------- [Bottom Edge]
```

---

## 3. Formula Master Prompt AI (Google AI Flow / Imagen 3 / Veo 2)

> [!IMPORTANT]
> **Aturan Mutlak AI Canvas**: Google AI Flow **HANYA** menghasilkan visual objek hero, pencahayaan, material, dan partikel/debris melayang. **JANGAN PERNAH** memasukkan perintah untuk menggambar teks atau huruf pada prompt AI agar tidak terjadi font glitch atau typo. Semua teks dirender 100% oleh Remotion.

### A. Formula Prompt Keyframe Statis (Google AI Flow / Imagen 3)

```text
A commercial high-end 3D product studio photograph of [HERO_OBJECT_DESCRIPTION], isolated in the center of a seamless vertical 9:16 frame. The studio background is an ultra-clean, minimalist matte off-white architectural whitepaper canvas (#FAFAFA) featuring subtle, faint microscopic technical blueprint grid lines and tiny coordinate node dots. In the foreground and midground, [CONTEXTUAL_FLOATING_ELEMENTS] float and tumble through the air with pronounced directional motion blur and dramatic optical shallow depth of field bokeh. Studio commercial three-point lighting setup with soft overhead diffusers, crisp white rim lighting accentuating the edges of the [HERO_OBJECT_NAME], and a soft realistic ambient contact shadow grounded beneath it. Dynamic 15-degree rotational tilt, modern luxury editorial packaging aesthetic, 8k resolution, photorealistic octane render, clean negative space in the top 35% and bottom 20% of the composition, absolutely no floating letters, no digital typography, no watermark.
```

### B. Formula Prompt Video Motion (Google AI Flow / Veo 2)

```text
Locked vertical 9:16 camera shot with an ultra-subtle smooth macro push-in. In the center, [HERO_OBJECT_DESCRIPTION] levitates with gentle, continuous physical rotation and slight weightless floating inertia. In the foreground, [CONTEXTUAL_FLOATING_ELEMENTS] gracefully tumble and fly past the camera lens with realistic physical velocity, casting cinematic depth-of-field blur and motion trails. The seamless studio off-white grid background remains steady and static. Commercial studio high-key lighting, crisp 60fps buttery-smooth motion physics, ultra-high definition product commercial quality, zero camera jitter, zero text rendering.
```

---

## 4. Variabel Modular Berdasarkan Jenis Studi Kasus

| Studi Kasus | `[HERO_OBJECT_DESCRIPTION]` | `[CONTEXTUAL_FLOATING_ELEMENTS]` | `[ACCENT_COLOR]` |
| :--- | :--- | :--- | :--- |
| **Kopi Kenangan (Unicorn F&B)** | Modern matte black takeaway iced coffee cup with frosted condensation droplets and gold seal | Crisp red Indonesian 100,000 Rupiah banknotes and glossy roasted dark coffee beans (strictly no foreign dollars) | Warm Gold `#D97706` / Deep Brown `#78350F` |
| **Liquid Death (Beverage / FMCG)** | Matte black aluminum beverage tallboy can with gothic embossed metallic accents | Crisp United States 100-dollar bills and melted ice crystal shards flying past lens | Stark Silver `#E2E8F0` / Cold Black `#0F172A` |
| **Fintech / Valuasi Bisnis Lokal (Kopi Kenangan / GoTo)** | Open premium black leather executive briefcase filled to the brim with neatly banded stacks of red 100,000 Indonesian Rupiah banknotes | Crisp authentic red Indonesian 100,000 Rupiah banknotes flying with motion blur (strictly no US dollars / foreign currency) | Emerald Green `#059669` / Warm Gold `#D97706` |
| **Tech Hardware / Startup Gadget** | Sleek anodized aluminum smart device or minimalist microchip processor resting on a pedestal | Floating holographic data circuit fragments and polished translucent glass prisms | Electric Cyan `#0066FF` / Clean Titanium `#64748B` |

---

## 5. Integrasi Programmatic di Sistem (`app/lib/explainer/studioMinimalistTemplate.ts`)

Untuk penggunaan langsung di kode aplikasi (service pipeline atau generator storyboard), sistem telah menyediakan modul TypeScript resmi:

```typescript
import {
  buildStudioMinimalistKeyframePrompt,
  buildStudioMinimalistMotionPrompt,
  buildStudioMinimalistSvgOverlay,
  STUDIO_MINIMALIST_STYLE_BIBLE,
  STUDIO_MINIMALIST_PRESETS
} from '@/app/lib/explainer/studioMinimalistTemplate';

// 1. Generate Keyframe Prompt (Imagen 3)
const keyframePrompt = buildStudioMinimalistKeyframePrompt({
  heroObjectName: 'takeaway iced coffee cup',
  heroObjectDescription: 'a modern luxury matte black takeaway iced coffee cup with frosted condensation droplets',
  contextualFloatingElements: 'crisp red Indonesian 100,000 Rupiah banknotes',
  currencyConstraint: 'idr_only',
  rotationTiltDeg: 15
});

// 2. Generate Motion Prompt (Veo 2)
const motionPrompt = buildStudioMinimalistMotionPrompt({
  heroObjectName: 'takeaway iced coffee cup',
  heroObjectDescription: 'a modern luxury matte black takeaway iced coffee cup',
  contextualFloatingElements: 'crisp red Indonesian 100,000 Rupiah banknotes',
  currencyConstraint: 'idr_only'
});

// 3. Render Remotion SVG Overlay
const svg = buildStudioMinimalistSvgOverlay({
  hookSerif: 'perhatikan bagaimana',
  punchlineSans: 'KOPI KENANGAN',
  kickerSans: 'dari kedai sederhana di Kuningan',
  progress: 1.0
});
```

---

## 5. Spesifikasi Remotion / SVG Typography Overlay

### A. Font Pairing Hierarchy
```css
/* Typeface 1: Conversational Hook */
font-family: 'Playfair Display', 'Canela', 'Editorial New', 'Georgia', serif;
font-style: normal;
font-weight: 500;
font-size: 52px;
color: #0F172A;
letter-spacing: -0.02em;

/* Typeface 2: Heavy Punchline / Brand Name */
font-family: 'Inter', 'Neue Haas Grotesk', 'Helvetica Neue', sans-serif;
font-weight: 900;
font-size: 80px;
color: #0F172A;
text-transform: uppercase;
letter-spacing: -0.04em;
line-height: 1.05;

/* Typeface 3: Sub-kicker / Timeline (Opsional) */
font-family: 'Inter', sans-serif;
font-weight: 700;
font-style: italic;
font-size: 34px;
color: #475569;
letter-spacing: -0.01em;
```

### B. Dashed Orbit Guide Graphic (SVG)
```svg
<!-- Lingkaran penuntun fokus produk di area Midground -->
<circle 
  cx="540" 
  cy="1000" 
  r="360" 
  fill="none" 
  stroke="#CBD5E1" 
  stroke-width="2.5" 
  stroke-dasharray="14 10" 
  opacity="0.85"
  transform="rotate(${progress * 45}, 540, 1000)" 
/>
```

---

## 6. Checklist Eksekusi Kualitas Visual (QA Gate)

- [ ] **Canvas Purity**: Latar belakang konsisten putih/abu-abu studio bersih (`#FAFAFA`), tidak ada noise atau tekstur kotor.
- [ ] **Zero AI Text**: Keyframe dan video Veo bebas 100% dari teks buatan AI.
- [ ] **Two-Zone Discipline**: Area bawah (Y > 1650px) 100% bebas dari elemen teks untuk menjaga estetika seamless.
- [ ] **Spatial Layering**: Elemen melayang di foreground memiliki motion blur yang meyakinkan tanpa menutupi bentuk utama produk hero.
- [ ] **Smooth Typography Entrance**: Teks di Top Zone muncul dengan transisi opasitas dan translasi vertikal halus (*eased stagger transition*).

