# Backend Hook Template System — Production Specification & Integration Guide

```yaml
version: "3.1.0"
document_type: "Backend Architecture & Prompt Engine Specification"
target_audience: "Backend Engineers, Platform Architects, AI/ML Pipeline Engineers"
last_updated: "2026-11-19"
status: "APPROVED FOR PRODUCTION IMPLEMENTATION"
benchmark_compliance: "Graphic Novel Neo-Noir Forensic + cmlabs Viral Hook Framework"
```

---

## 1. Executive Summary & Pipeline Architecture

The **Backend Hook Template System** is the critical first stage of the automated content production pipeline. Its primary objective is to solve the **0-to-3 second audience drop-off**: forcing the audience's thumb to halt scrolling within 1.0 second (*Scroll-Stop Velocity*), sustaining attention through the 3-second golden milestone (*Golden Retention Milestone*), and priming social media feed recommendation algorithms.

### 1.1 End-to-End Pipeline Topology

```
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────────────┐
│ 1. INGESTION    │ ──> │ 2. DOSSIER PARSER    │ ──> │ 3. DYNAMIC HOOK ENGINE │
│ • News URL      │     │ • Title, Location    │     │ • Multi-Segment Prompt │
│ • Custom Brief  │     │ • Evidence, Conflict │     │ • 3 Canonical Options  │
│ • Case Library  │     │ • Segment Selection  │     │ • 8 cmlabs Pillars     │
└─────────────────┘     └──────────────────────┘     └────────────────────────┘
                                                                  │
                                                                  ▼
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────────────┐
│ 6. FINAL RENDER │ <── │ 5. MEDIA SYNTHESIS   │ <── │ 4. EMPIRICAL SCORER    │
│ • Flow Studio   │     │ • Gemini TTS Charon  │     │ • 4-Pillar Evaluation  │
│ • 9:16 Video    │     │ • Klenik Warmth DSP  │     │ • HSI Index (0-100)    │
│ • Audio Sync    │     │ • Neo-Noir Keyframe  │     │ • Audience Persona Sim │
└─────────────────┘     └──────────────────────┘     └────────────────────────┘
```

---

## 2. Multi-Segment Architecture (The 6 Target Mediums)

The engine supports 6 content segments through a dynamic prompt architecture. Backend services pass `segment` as an enum:

```typescript
export type ContentSegmentKey =
  | 'video_reels'         // Instagram Reels / TikTok / YouTube Shorts (9:16)
  | 'commerce_ugc'        // Commerce & UGC Video Ads (9:16)
  | 'news_anchor'         // Broadcast News Anchor & Policy Explainer (16:9 / 9:16)
  | 'carousel_swipe'      // Social Media Carousel Cover Slide 1 (4:5 / 1:1)
  | 'article_blog'        // SEO Article H1 Title + Lead Paragraph
  | 'single_image_post';  // Static Image Post + First-line Caption
```

### 2.1 Segment Specifications Matrix

| Segment Key | Target Medium | Target Word Count / Length | Audio/Visual Constraint | Primary Algorithmic Goal |
| :--- | :--- | :--- | :--- | :--- |
| `video_reels` | 9:16 Vertical (1080x1920) | 15–22 kata (5–8s audio) | Ellipsis pauses (`...`), 2–3 word giant text | 3s Retention Milestone (Zero Scroll-away) |
| `commerce_ugc` | 9:16 Ad Video | 12–18 kata (4–6s audio) | Problem-agitation, solution contrast (See [UGC Spec](file:///Users/beny/Documents/Project-self/Content-automation/docs/UGC_COMMERCE_HOOK_TEMPLATE_SYSTEM.md)) | Click-Through Rate (CTR) & Call-to-Value |
| `news_anchor` | 16:9 / 9:16 Breaking News | 18–25 kata (6–9s audio) | High authority tone, official clause cite | Social Watch Time & Authority Trust |
| `carousel_swipe` | 4:5 (1080x1350) Slide 1 | 7–10 kata title + 1 line teaser | High visual typography, swipe indicator | Swipe-Through Rate (STR) to Slide 2 |
| `article_blog` | Web Article (H1 + Lead) | H1 (50-65 chars) + 30-45 words | H1 bold anchor, zero fluff lead | Search Intent Satisfaction & Dwell Time |
| `single_image_post` | 1:1 / 4:5 Post + Caption | 3–5 words on image + 15–20 words | High-contrast visual + pre-truncate line | "Read More" click & comment trigger |

---

## 3. The 3 Canonical Hook Archetypes

Regardless of segment, the engine generates **exactly 3 canonical psychological variations** mapped to the 8 cmlabs viral principles:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    THE 3 CANONICAL PSYCHOLOGICAL ARCHETYPES                  │
├──────────────────────────────┬──────────────────────────────┬────────────────┤
│ 1. THE PARADOX               │ 2. THE ODD SPECIFIC DETAIL   │ 3. THE         │
│ (Cognitive Dissonance)       │ (Concrete Curiosity Gap)     │ COUNTDOWN      │
│ • Clashing Moral/Logic Realities • Bizarre Physical Object / Clause • Ticking Clock   │
│ • "10-Year Stagnation vs 1-Day Pass" • "Odd Clause Number Hidden in Draft" • 30-Day Guillotine│
└──────────────────────────────┴──────────────────────────────┴────────────────┘
```

### 3.1 Archetype 1: `cognitive_dissonance_paradox`
- **cmlabs Pillars**: *Pernyataan Kontroversial & Fakta Mengejutkan* (Controversial Paradox & Shocking Facts).
- **Psychological Trigger**: Incongruity Resolution & Moral Outrage. The human brain cannot easily dismiss two clashing truths without seeking resolution.
- **Narrative Formula**:
  $$\text{Formula} = [\text{Extreme Scale of Tragedy / 10-Yr Gridlock}] + [\text{Abrupt Shift / Instant Pass}] + [\text{Uncomfortable Retorical Question}]$$
- **Example (`video_reels`)**:
  > *"Delapan fraksi... serentak setuju menyita aset tanpa vonis... Setelah bertahun-tahun mandek. Apa yang mereka takutkan... hingga berubah pikiran dalam satu ketukan palu?"*  
  > **Top Giant Keyword**: `DELAPAN FRAKSI BERUBAH`

### 3.2 Archetype 2: `odd_specific_detail`
- **cmlabs Pillars**: *Pertanyaan Penasaran & Objek Misteri Konkrit* (Curiosity Gap & Concrete Physical Clue).
- **Psychological Trigger**: Information-Gap Theory (Loewenstein). People don't care about abstract ideas; they obsess over specific tangible anomalies.
- **Narrative Formula**:
  $$\text{Formula} = [\text{Specific Room / Draft Page / Location}] + [\text{One Bizarre Concrete Evidence That Shouldn't Exist}] + [\text{Chilling Implication}]$$
- **Example (`video_reels`)**:
  > *"Ada satu pasal bernomor ganjil di halaman belakang naskah RUU itu... yang tak pernah dibahas di depan kamera. Nomor pasalnya... ganjil. Dan itu bukan kebetulan."*  
  > **Top Giant Keyword**: `PASAL YANG TERKUBUR`

### 3.3 Archetype 3: `micro_story_countdown`
- **cmlabs Pillars**: *Kisah Cerita Pendek (Micro-Storytelling) & Batas Waktu Dingin* (Micro-Story & Urgent Deadline).
- **Psychological Trigger**: Loss Aversion & Urgent Threat Perception.
- **Narrative Formula**:
  $$\text{Formula} = [\text{Critical Night/Hour Setting at Scene}] + [\text{Covert Activity Unfolding}] + [\text{Cold Hard Deadline Penalty}]$$
- **Example (`video_reels`)**:
  > *"Malam sebelum ketukan palu di Senayan... sebuah draf rahasia diselipkan ke meja pimpinan. Mulai detik ini... 30 hari adalah vonis mati bagi aset mencurigakan."*  
  > **Top Giant Keyword**: `HITUNGAN MUNDUR SENAYAN`

---

## 4. System Prompt Specification (Production Template)

Backend services MUST construct the LLM call using the following parameterized system prompt:

```text
Anda adalah Lead Hook Strategist & High-Retention Scriptwriter kelas dunia.
Spesialisasi Format: {{SEGMENT_NAME}} ({{TARGET_MEDIUM}}).
Gaya narasi Anda terinspirasi dari formula viral cmlabs (Cara Membuat Hook Konten) & storytelling psikologis berbobot: dingin, berjarak, tanpa basa-basi klise, dengan jeda nafas elipsis (...) yang presisi.

TARGET SEGMEN KONTEN:
- Format & Medium: {{TARGET_MEDIUM}}
- Batasan Format: {{FORMAT_CONSTRAINTS}}
- Penempatan Frasa Kunci: {{KEYWORD_PLACEMENT}}
- Pemicu Psikologis Utama: {{PRIMARY_TRIGGER}}
- Arahan Spesifik Segmen: {{PROMPT_DIRECTIVE}}

TUGAS: Formulasikan TEPAT 3 variasi HOOK pembuka berdasarkan 3 arketipe kanonikal berikut:
1. cognitive_dissonance_paradox:
   Formula cmlabs: Pernyataan Kontroversial & Fakta Mengejutkan.
   Membenturkan dua realitas ekstrem yang saling bertolak belakang. Akhiri dengan pertanyaan penasaran tajam.
2. odd_specific_detail:
   Formula cmlabs: Pertanyaan Penasaran & Objek Misteri Konkrit.
   Menyorot satu objek fisik janggal, nomor ruangan, atau nomor pasal tersembunyi yang tak lazim di TKP / naskah regulasi.
3. micro_story_countdown:
   Formula cmlabs: Kisah Cerita Pendek (Micro-Storytelling) & Statistik Batas Waktu.
   Membuka narasi dengan setting menit-menit genting di TKP / ruang sidang, diikuti konsekuensi batas waktu dingin.

PANDUAN PENULISAN WAJIB:
- Bahasa Indonesia baku sastrawi/investigatif yang dingin, berjarak, dan memikat.
- Zero-Fluff: DILARANG KERAS menggunakan kata pengantar klise ("Halo guys", "Tahukah Anda", "Kali ini kita akan bahas"). Mulai detik 0 langsung tabrak konflik!
- Rekayasa tanda baca titik tiga (...) untuk jeda nafas audio (0.4s - 0.6s pause).
- Tentukan 1 frasa kunci "topGiantKeyword" (2-3 kata HURUF BESAR) untuk audiens mode senyap / judul visual cover.
- Anti-Empty Clickbait: Naskah hook harus menjanjikan fakta riil yang ada dalam dossier perkara.

Format Output WAJIB JSON murni tanpa markdown wrapper:
{
  "candidates": [
    {
      "archetypeKey": "cognitive_dissonance_paradox",
      "hookText": "Delapan fraksi... serentak setuju menyita aset tanpa vonis... Setelah bertahun-tahun mandek. Apa yang mereka takutkan... hingga berubah pikiran dalam satu ketukan palu?",
      "topGiantKeyword": "DELAPAN FRAKSI BERUBAH"
    },
    {
      "archetypeKey": "odd_specific_detail",
      "hookText": "Ada satu pasal bernomor ganjil di halaman belakang naskah RUU itu... yang tak pernah dibahas di depan kamera. Nomor pasalnya... ganjil. Dan itu bukan kebetulan.",
      "topGiantKeyword": "PASAL YANG TERKUBUR"
    },
    {
      "archetypeKey": "micro_story_countdown",
      "hookText": "Malam sebelum ketukan palu di Senayan... sebuah draf rahasia diselipkan ke meja pimpinan. Mulai detik ini... 30 hari adalah vonis mati bagi rekening mencurigakan.",
      "topGiantKeyword": "HITUNGAN MUNDUR SENAYAN"
    }
  ]
}
```

---

## 5. Scoring & Empirical Evaluation Engine (HSI)

Every generated hook is scored programmatically across 4 quantitative pillars (0–25 points each), producing the composite **Hook Success Index (HSI: 0–100)**:

$$\text{HSI} = P_{\text{ScrollStop}} + P_{\text{CognitiveGap}} + P_{\text{MutedTypo}} + P_{\text{CommentDebate}}$$

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    THE 4 EMPIRICAL SCORING PILLARS (100 PTS)                 │
├──────────────────────┬──────────────────────┬────────────────────────────────┤
│ 1. Scroll-Stop (25)  │ 2. Cognitive Gap(25) │ 3. Muted Typography (25)       │
│ • Conflict in 1.0s   │ • Curiosity Gap      │ • 2-3 Word Capital Punch       │
│ • Ellipsis cadence   │ • Tangible Anomaly   │ • High-Contrast Feed Legibility│
├──────────────────────┴──────────────────────┴────────────────────────────────┤
│ 4. Comment / Debate Ratio (25 pts)                                           │
│ • Moral ambiguity / Polemic trigger driving algorithmic comment sections      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Retention Curve Prediction Models

The engine calculates mathematical retention predictions:
- **Predicted 3-Second Retention**:
  $$\text{Retention}_{3s} = \min(94, 60 + (\text{HSI} \times 0.35))\%$$
- **Predicted Video Completion Rate**:
  $$\text{CompletionRate} = \min(78, 30 + (\text{HSI} \times 0.42))\%$$
- **Benchmark Comparative Offset**:
  $$\Delta_{\text{Benchmark}} = \text{HSI}_{\text{Candidate}} - \text{HSI}_{\text{TopBenchmarkCase}}$$

---

## 6. Audio & Media Synthesis Integration (Backend Contracts)

### 6.1 Audio Synthesis (The Charon Multi-Tier Pool)

To guarantee 100% uptime without silent fallbacks, the backend MUST use the multi-tier Google Gemini TTS pool with prebuilt voice `Charon`:

- **API Endpoint**:
  `POST https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}`
- **Fallback Hierarchy**:
  1. `gemini-3.8-flash-tts`
  2. `gemini-3.8-flash-lite-tts`
  3. `gemini-2.5-flash-preview-tts`
  4. `gemini-3.1-flash-tts-preview`
  5. `ElevenLabs API` (Charon Cloned Voice ID: `TX3LPaxmHKxFdv7VOQHJ`)
- **Payload Schema**:
  ```json
  {
    "contents": [{ "parts": [{ "text": "Delapan fraksi... serentak setuju menyita aset tanpa vonis..." }] }],
    "generationConfig": {
      "responseModalities": ["AUDIO"],
      "speechConfig": {
        "voiceConfig": {
          "prebuiltVoiceConfig": { "voiceName": "Charon" }
        }
      }
    }
  }
  ```
- **Klenik Low-End Warmth DSP Filter Chain (FFmpeg)**:
  ```bash
  ffmpeg -i input.wav -af \
    "equalizer=f=110:width_type=o:width=1.8:g=3.2,equalizer=f=3400:width_type=o:width=1.2:g=-2.5,highpass=f=75,lowpass=f=7800,volume=-1.5dB" \
    output_mastered.wav
  ```

### 6.2 Visual Keyframe Generation (Graphic Novel Neo-Noir Forensic)

- **Canvas Dimensions**: $1080 \times 1920$ (9:16 Portrait)
- **Visual Style**: Heavy ink outlines, deep chiaroscuro, cinematic amber/charcoal forensic grading.
- **Top Giant Keyword Overlay**:
  Font: Heavy sans-serif (Inter / Anton / Bebas Neue), uppercase, centered in the upper third ($y = 180\text{px}$), with subtle dark drop-shadow.

---

## 7. REST API Schemas & Sample Payloads

### 7.1 `POST /api/hook-engine/generate`

**Request Payload**:
```json
{
  "sourceUrl": "https://kumparan.com/kumparannews/pemerintah-dpr-sepakati-ruu-perampasan-aset-dibawa-ke-paripurna-untuk-disahkan-jadi-uu-28b45xHQ7o7",
  "caseId": "kumparan-ruu-perampasan-aset",
  "segment": "video_reels",
  "synthesizeMedia": true
}
```

**Response Payload (HTTP 200)**:
```json
{
  "ok": true,
  "session": {
    "sessionId": "sess-1795061234567",
    "createdAt": "2026-11-19T04:50:00.000Z",
    "dossier": {
      "caseId": "kumparan-ruu-perampasan-aset",
      "title": "Kesepakatan Kilat RUU Perampasan Aset DPR",
      "location": "Gedung DPR RI Senayan, Jakarta",
      "victim": "Publik & Keuangan Negara",
      "suspect": "Oligarki Koruptor & Elit Politik",
      "keyEvidence": "Naskah RUU Klausul Aset Non-Vonis",
      "coreConflict": "10 tahun mandek, mendadak sepakat dibawa ke paripurna dalam satu malam tanpa proses perdebatan publik",
      "segment": "video_reels"
    },
    "recommendedWinnerId": "hook-2",
    "candidates": [
      {
        "id": "hook-1",
        "archetype": "cognitive_dissonance_paradox",
        "archetypeName": "The Cognitive Dissonance Paradox",
        "hookText": "Delapan fraksi... serentak setuju menyita aset tanpa vonis... Setelah bertahun-tahun mandek. Apa yang mereka takutkan... hingga berubah pikiran dalam satu ketukan palu?",
        "topGiantKeyword": "DELAPAN FRAKSI BERUBAH",
        "durationSecEstimate": 8.1,
        "hookSuccessIndex": 83,
        "predictedRetention3s": 85,
        "predictedCompletionRate": 65,
        "conciseSummary": "Membenturkan 10 tahun penolakan DPR dengan kesepakatan kilat semalam. Menahan jempol lewat paradoks politik berisiko tinggi.",
        "media": {
          "status": "ready",
          "audioUrl": "/audio/hook-1-charon.mp3",
          "keyframeUrl": "/images/hook-1-keyframe.jpg",
          "videoPreviewUrl": "/video/hook-1-preview.mp4"
        }
      },
      {
        "id": "hook-2",
        "archetype": "odd_specific_detail",
        "archetypeName": "The Odd Specific Detail",
        "hookText": "Ada satu pasal di halaman belakang naskah RUU itu... yang tak pernah dibahas di kamera. Nomor pasalnya... ganjil. Dan itu bukan kebetulan.",
        "topGiantKeyword": "PASAL GANJIL",
        "durationSecEstimate": 9.9,
        "hookSuccessIndex": 85,
        "predictedRetention3s": 86,
        "predictedCompletionRate": 68,
        "conciseSummary": "Menyorot anomali pasal ganjil tersembunyi. Memaksa penonton bertahan menanti pembuktian klausul rahasia.",
        "media": {
          "status": "ready",
          "audioUrl": "/audio/hook-2-charon.mp3",
          "keyframeUrl": "/images/hook-2-keyframe.jpg",
          "videoPreviewUrl": "/video/hook-2-preview.mp4"
        }
      },
      {
        "id": "hook-3",
        "archetype": "micro_story_countdown",
        "archetypeName": "The Micro-Story Countdown",
        "hookText": "Malam sebelum ketukan palu di Senayan... sebuah draf rahasia diselipkan ke meja pimpinan. Mulai detik ini... 30 hari adalah vonis mati bagi aset mencurigakan.",
        "topGiantKeyword": "HITUNGAN MUNDUR SENAYAN",
        "durationSecEstimate": 8.6,
        "hookSuccessIndex": 84,
        "predictedRetention3s": 85,
        "predictedCompletionRate": 66,
        "conciseSummary": "Setting menit-menit genting sebelum palu diketuk dipadu deadline 30 hari. Menciptakan sensasi ancaman waktu.",
        "media": {
          "status": "ready",
          "audioUrl": "/audio/hook-3-charon.mp3",
          "keyframeUrl": "/images/hook-3-keyframe.jpg",
          "videoPreviewUrl": "/video/hook-3-preview.mp4"
        }
      }
    ]
  }
}
```

---

## 8. Backend Implementation Checklist

When integrating this module into production microservices:

1. [x] **Strict Model Modality**: Verify that Gemini TTS calls `models/{MODEL}:generateContent` with `responseModalities: ["AUDIO"]` and `voiceName: "Charon"`.
2. [x] **No Silent Fallbacks**: Throw an explicit exception or escalate to the next fallback tier rather than returning empty audio buffers (`anullsrc`).
3. [x] **DSP Normalization**: Ensure FFmpeg applies the Klenik Low-End Warmth EQ (+3.2dB @ 110Hz, -2.5dB @ 3.4kHz) and normalizes LUFS to broadcast standard (-14 to -16 LUFS, peak -1.0dB).
4. [x] **Dynamic Segment Mapping**: Pass the `segment` parameter into the system prompt to activate segment-specific guidelines.
5. [x] **Exactly 3 Output Candidates**: Enforce a strict JSON array length of 3 to preserve UI simplicity and minimize decision fatigue.
