# Kumparan Visual Editorial Explainer Template (9:16)

Panduan resmi arsitektur visual dan spesifikasi teknis untuk video vertikal 9:16 (1080×1920) Kumparan Explainer Series, berbasis integrasi hybrid antara **Google AI Flow (Imagen 3 & Veo)** dan **Remotion Motion Typography**.

---

## 1. Prinsip Desain & Filosofi Visual

Template ini menggunakan estetika **2.5D Tactile Editorial Poster**:
- **Monochromatic Studio Backdrop**: Latar belakang solid kanonik Kumparan dengan tekstur matte halus dan pencahayaan studio lembut.
- **Isolated Hero Object**: Satu objek pahlawan berdimensi 2.5D dengan bayangan kontak (*grounding contact shadow*) alami.
- **Subtle Tone-on-Tone Watermark**: Satu kata kunci (1-word) berukuran raksasa di latar belakang dengan opasitas tipis 10%–12%, senada dengan warna dasar canvas.
- **Micro-motion Floating**: Objek hero melakukan gerakan mikro bernapas lembut (*breathing float*) dengan kerlipan aksen bintang (*sparkles*) yang halus.
- **Kinetic Centered Typography**: Teks headline rata tengah (*align center*) dengan kurva pengungkapan kata per kata (*word-by-word reveal*) yang sinkron presisi dengan audio voice-over narator.

---

## 2. Diagram Tata Letak & Safe Areas (1080×1920)

```
0px ------------------------------------------------------------- [Top Edge]
    | [TOP SAFE AREA - 140px] Bebas clutter, aman status bar IG/TikTok
148px| Series Kicker: "Topik Serial | 01 - Bab" (Font: Inter 700, 26px, Track: 0.08em)
198px| Pagination Bar: 5 / 7 Segmen (Pill aktif: 34×10px, Dots: r=5px, spasi: 35px)
    |
340px| [HEADLINE ZONE - Max Y: 600px]
    | Kinetic Headline 3-4 Baris (Font: Inter ExtraBold 800, 64px, Line-height: 1.18)
    | Sumbu Simetri: Align Center (text-anchor="middle", x=540)
    | Opasitas kata demi kata: rgba(255, 255, 255, t)
640px------------------------------------------------------------
    | [MIDDLE HERO ZONE - Y: 640px s/d 1440px]
    |
    | 1-Word Watermark Keyword ("ayam", "kurma", "sejarah")
    | - Font: Sans-Serif Bold Raksasa (~320px)
    | - Opasitas: 10% - 12% (tone-on-tone)
    |
    | 2.5D Tactile Hero Illustration
    | - Objek tunggal terisolasi (Ayam mistis, mangkuk gerabah, piring keramik)
    | - Soft contact shadow di dasar objek
    | - Micro-motion breathing float (2-4px) + subtle sparkles
    |
1440px-----------------------------------------------------------
    | [BOTTOM CAMPAIGN ZONE - Y: 1440px s/d 1740px]
    |
1590px| Floating Pill Card (Lebar: 570px, Tinggi: 196px, Corner Radius: rx=44)
    | Latar Putih Bersih + Logo Resmi Kumparan + Tagar Dinamis (#CeritaNusantara)
    |
    | [BOTTOM SAFE AREA - 180px] Aman dari tombol like, komentar, & caption TikTok
1920px----------------------------------------------------------- [Bottom Edge]
```

---

## 3. Palet Warna Kanonik Kumparan

Setiap video atau scene wajib memilih salah satu dari 5 warna solid studio resmi berikut:

| Nama Warna | Kode Hex | Karakter / Emosi Narasi | Contoh Penggunaan |
| :--- | :--- | :--- | :--- |
| **Deep Royal Blue** | `#1B58DB` | Otoritatif, sains, fakta, pengantar tenang | Hook, Sains Populer, Berita Utama |
| **Jade Green** | `#0D6B4F` | Alami, berkah, kesehatan, harmoni, sunnah | Manfaat Medis, Tradisi Suci, Kesejahteraan |
| **Amber Orange** | `#C95200` | Energi, kehangatan, sejarah kuno, petualangan | Budaya, Legenda Masa Lampau, Eksplorasi |
| **Crimson Red** | `#B71C1C` | Tegas, peringatan, benteng pertahanan, kontras | Fakta Kritis, Bahaya, Larangan, Konflik |
| **Warm Ochre** | `#B27318` | Kebijaksanaan, nilai luhur, pesan penutup | Hikmah Akhir, Ajakan Bertindak, Refleksi |

---

## 4. Pembagian Peran Komponen (Separation of Concerns)

### A. Google AI Flow (Imagen 3 & Veo) — Hanya Visual Murni
Google Flow **TIDAK PERNAH** diperintahkan untuk merender teks headline, kalimat penjelas, atau angka pagination.
- **Input Prompt Keyframe**:
  ```
  A premium editorial 2.5D tactile illustration of [HERO_OBJECT] with subtle contact shadow resting on a solid monochromatic studio backdrop of [CANONICAL_COLOR]. Behind the object, the giant single word "[WATERMARK_KEYWORD]" appears in subtle tone-on-tone lettering at 11% opacity. The top 35% of the frame is completely empty negative space. Clean, polished, modern Indonesian editorial magazine style, octane render lighting, no text other than the watermark word.
  ```
- **Motion Prompt Veo**:
  ```
  Locked camera shot. The [HERO_OBJECT] hovers gently in place with an ultra-subtle, organic breathing float of 2-4 pixels. Subtle golden sparkle stars twinkle softly around it. Solid studio background remains completely still and clean. Crisp high-end studio lighting, 24fps smooth motion.
  ```

### B. Remotion & SVG Overlay — 100% Tipografi & Interaksi
Remotion menangani seluruh tipografi dinamis:
1. **Font Engine**: Inter ExtraBold (`font-weight: 800`) dimuat langsung via base64 `@font-face`.
2. **Whitespace Invariant**: Wajib menggunakan `xml:space="preserve"` pada tag `<text>` agar spasi antar-kata tidak terpotong oleh parser XML.
3. **Zero Layout Shift**: Setiap baris dirender sebagai `<text x="540" text-anchor="middle">` dengan seluruh kata tetap ada di DOM menggunakan `<tspan fill="rgba(255,255,255, ${opacity})">`. Hal ini mencegah teks bergeser saat kata baru muncul.
4. **Easing Formula**: Transisi opasitas kata menggunakan kurva `easeOutCubic`:
   $$\text{progress} = 1 - (1 - t)^3$$
   dengan durasi 0.12s–0.15s per kata.
5. **Campaign Pill Card**: Kartu putih rounded `rx=44` dengan latar belakang transparan yang meluncur mulus dari bawah pada awal scene.

---

## 5. Standar Kode TypeScript untuk Overlay Teks

```typescript
// Konstruksi Baris Tipografi Align Center
const linesSvg = sceneLines.map((line) => {
  const tspans = line.words.map((word, idx) => {
    const isLast = idx === line.words.length - 1;
    const space = isLast ? '' : ' ';
    const opacity = getWordOpacity(currentTime, word.startTime);
    return `<tspan fill="rgba(255,255,255,${opacity.toFixed(2)})">${word.text}${space}</tspan>`;
  }).join('');
  return `<text x="540" y="${line.y}" class="headline" xml:space="preserve">${tspans}</text>`;
}).join('\n');
```

