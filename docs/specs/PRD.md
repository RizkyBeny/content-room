# Product Requirement Document (PRD)
## Project: HOOK Successor Engine (Empirical 0–3s Video Retention Simulator)
**Document Version:** 1.0.0  
**Owner:** Design-Dev Squad (Product Manager)  
**Status:** Implemented & Verified  

---

### 1. Executive Summary & Problem Statement
Content creators, true-crime documentarians, and investigative media producers can consistently film and edit high-quality long-form video content, yet **over 70% of viewers swipe away within the first 1.5 to 3 seconds**. 
The root cause is not the visual quality of the main body, but rather the **absence of an empirical, psychologically tension-charged HOOK formulation**.

Existing tools offer vague generative text prompts without:
1. Grounded psychological tension archetypes (Paradox, Concrete Oddity, Forensics).
2. Algorithmic retention prediction (predicting 3-second drop-off and completion rates before rendering the full master timeline).
3. 5-second rapid audio-visual simulation with native voice pacing, sound effects, and kinetic typography.
4. Real-time copy iteration and re-scoring feedback loop.

The **HOOK Successor Engine** solves this by providing an end-to-end A/B testing simulator and playground that scores hooks across **4 Empirical Pillars (HSI 1–100)**, generates 5 distinct psychological variants, synthesizes rapid 5s testable MP4 video snippets via Google Flow MCP (Charon Gemini TTS + Klenik EQ), and enables 1-click promotion to the master production timeline.

---

### 2. User Personas
- **The True-Crime / Investigative Creator**: Needs high-tension, Chiaroscuro-grade opening lines that anchor viewer curiosity instantly without sounding like clickbait spam.
- **The Media Producer / Editor**: Wants to test multiple opening angles (forensic detail vs moral paradox vs whispered atmosphere) before committing GPU and voiceover render budgets.
- **The Algorithmic Content Strategist**: Demands quantifiable retention benchmarks (e.g., "Will this hook hit >85% 3s retention like Bom Bali Amrozi or Eno Farihah?").

---

### 3. Scope Boundaries

#### In-Scope (Phase 1 - Complete)
- **Multi-Source Dossier Ingestion**: Ingests case facts via live URL scraping (Radar Tulungagung, Detik, Kompas), historical benchmark library, or raw textual dossier.
- **5 Psychological Hook Archetypes**:
  1. `The Cognitive Dissonance Paradox` (Incongruity Resolution & Moral Shock)
  2. `The Odd Specific Detail` (Curiosity Gap on Concrete Mystery Objects)
  3. `The Whispered Crime Scene` (Nocturnal Atmospheric Immersion & Sensory Tension)
  4. `The Multi-Motive Escalation` (Interpersonal Conflict Web & Conspiratorial Betrayal)
  5. `The Cold Forensic Warning` (Clinical Forensic Intrigue & Unmasking)
- **4-Pillar Empirical Scoring Framework (HSI 1–100)**:
  - Pillar 1: Scroll-Stop Velocity (0–25)
  - Pillar 2: Cognitive Gap Tension (0–25)
  - Pillar 3: Muted Typography Punch (0–25)
  - Pillar 4: Algorithmic Comment / Debate Trigger (0–25)
  - Predicted 3s Retention Rate (%), Predicted Completion Rate (%), and Historical Delta vs Top Benchmark.
- **Flow MCP 5-Second Rapid Media Synthesizer**:
  - Voiceover synthesis via Gemini TTS Charon with Klenik Low-End Warmth EQ (+3.2dB @ 110Hz, -2.5dB @ 3.4kHz).
  - 9:16 Graphic Novel Neo-Noir Forensic Visual Keyframe.
  - FFmpeg rapid compositor rendering 5s 1080x1920 MP4 with Giant Top Keyword flash, bottom subtitles, and subtle zoompan.
- **Interactive Web Arena & CLI**:
  - Next.js UI (`/hook-engine`) with real-time in-place copy editing and instant score recalculation.
  - CLI runner (`pnpm test:hook`) for automated pipeline validation.

#### Out-of-Scope (Future Iterations)
- Direct automated publishing to TikTok/Instagram/YouTube Shorts API.
- Multi-voice conversational banter within the 5s hook (reserved for master explainer pipeline).

---

### 4. User Stories & Acceptance Criteria (Gherkin Format)

#### Scenario 1: Multi-Variant Hook Generation from Case Dossier
```gherkin
Given a case dossier input (either selected benchmark "bom-bali-amrozi" or a scraped news article URL)
When the user triggers "Formulasikan 5 Hook & Prediksi Retensi"
Then the engine must generate exactly 5 distinct hook candidates corresponding to the 5 psychological archetypes
And each candidate must contain a hook text, top giant keyword (2-4 words, uppercase), estimated duration, and 4-pillar scores
And the candidate with the highest HSI must be marked as "Rekomendasi Utama" (Recommended Winner).
```

#### Scenario 2: Rapid 5-Second Media Synthesis via Flow MCP
```gherkin
Given a generated hook candidate
When the user clicks "Sintesis Video 5 Detik (Flow MCP)"
Then the system synthesizes Charon Gemini TTS audio with Klenik Low-End Warmth EQ
And renders a 1080x1920 MP4 video snippet under 5 seconds featuring the top giant keyword and bottom subtitles
And updates the card UI to display an inline video player playable directly inside the browser.
```

#### Scenario 3: Real-Time In-Place Copy Editing and Rescoring
```gherkin
Given an existing hook candidate card
When the user clicks "Edit Copy & Rescore" and modifies the hook text or giant keyword
And clicks "Simpan & Hitung Ulang Skor"
Then the system recalculates all 4 pillar scores, HSI, and predicted 3s retention without page reload
And provides updated psychological and algorithmic improvement tips.
```

#### Scenario 4: Promotion to Master Production Timeline
```gherkin
Given a selected winning hook candidate
When the user clicks "Promosikan Hook Ini ke Master Video"
Then the system locks the selected hook as the master production anchor
And surfaces a confirmation banner displaying the selected archetype, HSI score, and ready-to-render status.
```
