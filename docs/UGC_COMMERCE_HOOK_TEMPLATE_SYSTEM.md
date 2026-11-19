# UGC & E-Commerce Hook Template System — Production Specification

```yaml
version: "3.2.0"
segment: "commerce_ugc"
document_type: "Backend Architecture & Prompt Engine Specification"
target_audience: "Backend Engineers, Growth Marketers, Media Synthesizer Engineers"
last_updated: "2026-11-19"
status: "APPROVED FOR PRODUCTION IMPLEMENTATION"
audio_contract: "Gemini TTS Aoede (Female Creator) / Puck (Male Creator)"
canvas_contract: "1080x1920 (9:16 Native TikTok/Reels UGC Style)"
```

---

## 1. Executive Summary & Psychology of UGC Video Ads

In direct-response video advertising (TikTok Ads, Instagram Reels Shopping, Shopee Video, YouTube Shorts Ads), the **Hook determines 80% of ad performance (ROAS & CPA)**. If a viewer swipes away before second 3, the entire cost-per-impression (CPM) is wasted.

### 1.1 The Golden Rules of E-Commerce UGC Hooks

Unlike news or long-form storytelling, e-commerce UGC hooks must adhere to strict behavioral constraints:
1. **Zero Brand Intro**: Never start with a brand logo or "Halo guys, kenalin produk X". Detik 0 harus langsung menabrak rasa sakit (*pain point*) atau rasa penasaran konsumen.
2. **Strict Time Budget**: 12–18 kata (~4.0 hingga 6.5 detik durasi berbicara).
3. **Native Content Disguise**: Harus terlihat seperti video organik kreator asli, bukan iklan komersial televisi (*Don't Make Ads, Make TikToks*).
4. **Muted Legibility (TikTok Highlight Sticker)**: Teks tebal 2–3 kata huruf kapital dengan background box kuning, merah, atau putih agar terbaca instan di mode suara nonaktif.

---

## 2. Product Dossier Schema (`ProductDossierInput`)

Backend services ingest product data via the following interface:

```typescript
export type CommerceNicheCategory =
  | 'beauty_skincare'   // Skincare, makeup, hair care
  | 'gadget_tech'       // TWS, phone accessories, smart wearables, desk setups
  | 'fashion_apparel'   // Bags, shoes, daily wear, jewelry
  | 'fnb_culinary'      // Healthy snacks, coffee, food supplements
  | 'home_living'       // Ergonomic furniture, cleaning tools, home gadgets
  | 'general';          // Other consumer products

export interface ProductDossierInput {
  productName: string;
  category: CommerceNicheCategory;
  targetPersona?: string;    // e.g. "Wanita 20-35 tahun pejuang jerawat / garis halus"
  painPoint: string;        // e.g. "Bekas jerawat hitam gak hilang-hilang meski udah beli skincare jutaan"
  uspBenefit: string;       // e.g. "Kombinasi Retinol 1% Encapsulated + Niacinamide tanpa bikin purging"
  offerPrice?: string;      // e.g. "Diskon 40% + Free Ongkir terbatas hari ini"
  productUrl?: string;      // e.g. "https://shopee.co.id/product/..."
}
```

---

## 3. The 3 Canonical UGC Hook Archetypes

For every product dossier, the engine produces **exactly 3 high-converting hook variations**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    THE 3 CANONICAL UGC HOOK ARCHETYPES                       │
├──────────────────────────────┬──────────────────────────────┬────────────────┤
│ 1. THE NEGATIVE WARNING      │ 2. THE GATEKEPT SECRET       │ 3. THE         │
│ (Problem Paradox & Stop Call)│ (Curiosity Hack & Odd Detail)│ TRANSFORMATION │
│ • "STOP Pakai Cara Ini..."   │ • "Kenapa Ga Ada yg Bahas?"  │ • Dulu vs Kini │
│ • Tabrak Kesalahan Fatal     │ • 1 Bahan / Fitur Tersembunyi│ • Panik H-1 /  │
│ • Loss Aversion Hook         │ • Curiosity Gap              │ FOMO Countdown │
└──────────────────────────────┴──────────────────────────────┴────────────────┘
```

### 3.1 Option 1: `ugc_negative_warning` (The Negative Warning & Problem Paradox)
- **Psychological Principle**: *Loss Aversion & Fear of Doing It Wrong*. Manusia 2x lebih terdorong menghindari kerugian/kesalahan daripada mengejar keuntungan.
- **Syntactic Formula**:
  $$\text{Formula} = [\text{"STOP"} / \text{"JANGAN BELI"}] + [\text{Kebiasaan Sia-sia Konsumen}] + [\text{Konsekuensi Buruk yang Tak Disadari}] + [\text{Pertanyaan Menusuk}]$$
- **Contoh (Skincare)**:
  > *"Stop buang duit jutaan buat facial... kalau cara kamu ngilangin bekas jerawat masih kayak gini. Kulit kamu itu iritasi... bukan sembuh. Mau sampai kapan?"*  
  > **Top Giant Keyword**: `STOP BUANG DUIT`
- **Contoh (Gadget TWS)**:
  > *"Jangan beli TWS harga jutaan dulu... sebelum kamu lihat headphone 100 ribuan ini. Noise cancelling-nya... bikin orang kantor mikir kamu budek."*  
  > **Top Giant Keyword**: `JANGAN BELI DULU`

### 3.2 Option 2: `ugc_gatekept_secret` (The Gatekept Secret & 1 Odd Feature)
- **Psychological Principle**: *Information-Gap Theory & Insider Privilege*. Keinginan mengetahui rahasia orang dalam yang sengaja disembunyikan.
- **Syntactic Formula**:
  $$\text{Formula} = [\text{"Kenapa gak ada yang ngasih tahu..."} / \text{"Rahasia orang dalem..."}] + [\text{Satu Kandungan / Fitur Spesifik}] + [\text{Hasil yang Terlalu Bagus untuk Dilewatkan}]$$
- **Contoh (Skincare)**:
  > *"Kenapa gak ada dokter kulit yang ngasih tahu rahasia ini? Cuma modal satu tetes retinol encapsulated sebelum tidur... bekas hitam 3 tahun bisa rontok dalam dua minggu."*  
  > **Top Giant Keyword**: `RAHASIA ORANG DALEM`
- **Contoh (Backpack Anti-Theft)**:
  > *"Ternyata ini alasan pramugari luar negeri gak pernah pakai tas ransel biasa. Ada satu resleting rahasia di punggung... yang pencopet bandara pun gak bakal tahu."*  
  > **Top Giant Keyword**: `RESLETING RAHASIA`

### 3.3 Option 3: `ugc_before_after_countdown` (The Micro-Story Transformation & Urgent FOMO)
- **Psychological Principle**: *Relatable Empathy, Hope & Time Scarcity*. Cerita transformasi nyata yang membuktikan hasil nyata dalam batas waktu mendesak.
- **Syntactic Formula**:
  $$\text{Formula} = [\text{Titik Terendah / Momen Panik H-1}] + [\text{Momen Penemuan Tak Terduga}] + [\text{Transformasi Nyata / Batas Waktu Promo}]$$
- **Contoh (Skincare)**:
  > *"H-3 wisuda muka break-out parah sampai gak berani keluar kamar. Sampai nemu botol ungu ini... dan hari ini semua orang ngira aku baru perawatan salon mahal."*  
  > **Top Giant Keyword**: `H-3 WISUDA PANIK`
- **Contoh (Gadget TWS)**:
  > *"Tiga hari lagi promo clearance sale ini ditutup selamanya... Baterai tahan 48 jam dan bass sedalam ini di bawah 200 ribu? Cek keranjang kuning sebelum kehabisan."*  
  > **Top Giant Keyword**: `SISA 3 HARI LAGI`

---

## 4. Parameterized System Prompt Specification (Commerce UGC)

Backend microservices MUST inject product dossiers into this production-tested prompt template:

```text
Anda adalah Lead UGC Creative Strategist & Direct-Response Ad Scriptwriter untuk TikTok Ads, Instagram Reels Shopping, dan Shopee Video.
Misi Anda: Menghentikan jempol konsumen dalam 1.0 detik pertama (Scroll-Stop) dan memicu rasa penasaran akut tanpa terkesan seperti iklan TV norak.

TARGET SEGMEN KONTEN: Commerce & UGC Video Ad (9:16 Vertical)
- Batasan Format: 12-18 kata, durasi berbicara 4.0-6.0 detik, naskah mengalir sangat natural layaknya teman merekomendasikan barang.
- Tanda Baca: Gunakan jeda elipsis (...) untuk jeda nafas natural (0.3s-0.5s) agar voiceover terdengar santai dan tidak kaku.
- Frasa Kunci: Tentukan 1 frasa "topGiantKeyword" (2-3 kata HURUF BESAR) berdaya kejut tinggi untuk sticker caption feed.

TUGAS: Formulasikan TEPAT 3 variasi HOOK UGC berbasis 3 arketipe kanonikal:
1. ugc_negative_warning:
   Formula Negative Warning / Stop Doing This. Tabrak kesalahan fatal konsumen yang membuat masalah mereka makin parah.
2. ugc_gatekept_secret:
   Formula Gatekept Secret / Specific Hack. Ungkap satu kandungan bahan aktif / fitur spesifik tersembunyi yang belum banyak orang tahu.
3. ugc_before_after_countdown:
   Formula Micro-Story Transformation / Urgent FOMO. Ceritakan titik terendah / momen panik sebelum menemukan produk, atau hitungan mundur batas promo.

Format Output WAJIB JSON murni tanpa markdown wrapper:
{
  "candidates": [
    {
      "archetypeKey": "ugc_negative_warning",
      "hookText": "Stop buang duit jutaan buat facial... kalau bekas jerawat kamu masih dibiarin kayak gini. Kulit kamu butuh satu bahan ini... bukan racikan abal-abal.",
      "topGiantKeyword": "STOP BUANG DUIT"
    },
    {
      "archetypeKey": "ugc_gatekept_secret",
      "hookText": "Kenapa gak ada yang ngasih tahu trik ini? Cuma modal satu tetes serum encapsulated ini sebelum tidur... bekas hitam menahun bisa samar dalam seminggu.",
      "topGiantKeyword": "TRIK RAHASIA MALAM"
    },
    {
      "archetypeKey": "ugc_before_after_countdown",
      "hookText": "H-3 ketemu calon mertua tapi muka kusam parah... Untung langsung checkout botol ini. Sekarang kulit glowing natural tanpa dempul bedak tebal.",
      "topGiantKeyword": "H-3 PANIK GLOWING"
    }
  ]
}
```

---

## 5. Voice Persona & Acoustic Contract (Gemini TTS)

Untuk video UGC, **karakter suara dingin Charon dilarang keras**. Backend secara otomatis beralih ke voice persona ramah dan natural:

| Kategori Niche | Gemini TTS Prebuilt Voice | Karakter Suara | Nada EQ FFmpeg |
| :--- | :--- | :--- | :--- |
| `beauty_skincare`, `fashion_apparel` | **`Aoede`** | Wanita ramah, hangat, antusias, natural layaknya influencer kecantikan | `equalizer=f=220:g=1.5,equalizer=f=4500:g=2.0` (Bright Crisp Vocal) |
| `gadget_tech`, `general`, `home_living` | **`Puck`** | Pria muda energik, relatable, tech-enthusiast, santai | `equalizer=f=180:g=2.0,equalizer=f=3200:g=1.0` (Punchy Modern Podcast) |

- **API Endpoint**: `POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}`
- **Fallback Hierarchy**: `gemini-3.8-flash-tts` $\rightarrow$ `gemini-3.8-flash-lite-tts` $\rightarrow$ `ElevenLabs` (Conversational UGC Persona).

---

## 6. Visual Keyframe Contract (Native TikTok/Reels Style)

- **Dimensi**: 1080x1920 (9:16 Portrait).
- **Komposisi Visual**:
  - *Option 1*: Problem POV atau Before/After Split dengan sticker text merah/kuning `"STOP SCROLLING"` atau `"SALAH BESAR"`.
  - *Option 2*: Creator holding product / Close-up kandungan dengan sticker hijau/kuning `"RAHASIA DOKTER"` atau `"FEATURE HACK"`.
  - *Option 3*: Product beauty shot dengan rating ⭐ 4.9/5, badge `"SOLD 10K+"` atau `"PROMO TERBATAS"`.
- **Tipografi Sticker**:
  - Font: Bold Sans (Inter / Montserrat / Bebas Neue).
  - Background box: Kotak ber-padding dengan warna kontras (Kuning cerah `#FEE500` teks hitam, atau Merah cerah `#FF004F` teks putih) mengikuti desain native TikTok/Reels caption box.
