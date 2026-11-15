import fs from 'node:fs';
import path from 'node:path';
import { CaptionPhrase, ShotTiming } from '../audio/noirAudioPipeline';

export interface NoirVideoConfig {
  jobId: string;
  title: string;
  totalDurationSec: number;
  coverImagePath: string;
  shotImages: Array<{ shot: number; imagePath: string }>;
  shotTimings: ShotTiming[];
  phrases: CaptionPhrase[];
  outputDir: string;
}

export function generateNoirHyperframesHtml(config: NoirVideoConfig): string {
  const { totalDurationSec, phrases, shotTimings, coverImagePath, shotImages, outputDir } = config;
  fs.mkdirSync(outputDir, { recursive: true });
  const assetsDir = path.join(outputDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  // 1. Copy Cover Image
  const coverDestName = 'cover-shot-00.jpg';
  const coverDestPath = path.join(assetsDir, coverDestName);
  if (fs.existsSync(coverImagePath)) {
    fs.copyFileSync(coverImagePath, coverDestPath);
  }

  // 2. Copy Shot Images
  const shotsWithLocalAssets: Array<{ shot: number; assetName: string; timing: ShotTiming }> = [];
  shotTimings.forEach((timing, idx) => {
    const shotNum = timing.shot;
    const shotNumStr = String(shotNum).padStart(2, '0');
    const assetName = `shot-${shotNumStr}.jpg`;
    const destPath = path.join(assetsDir, assetName);

    const source = shotImages.find((s) => s.shot === shotNum)?.imagePath || '';
    if (source && fs.existsSync(source)) {
      fs.copyFileSync(source, destPath);
    }

    shotsWithLocalAssets.push({
      shot: shotNum,
      assetName,
      timing,
    });
  });

  // 3. Glitch Timestamps
  const glitchTimings: number[] = [1.3];
  shotsWithLocalAssets.slice(1).forEach((s) => {
    glitchTimings.push(s.timing.startSec);
  });

  // 4. Ken Burns movements (14 variations)
  const cameraMotions = [
    { from: { scale: 1.0, x: 0, y: 0 }, to: { scale: 1.08, x: 0, y: 0 } },
    { from: { scale: 1.0, x: 0, y: 0 }, to: { scale: 1.08, x: 0, y: -25 } },
    { from: { scale: 1.08, x: 0, y: 0 }, to: { scale: 1.01, x: 0, y: 0 } },
    { from: { scale: 1.0, x: -15, y: 0 }, to: { scale: 1.08, x: 15, y: -20 } },
    { from: { scale: 1.04, x: -30, y: 0 }, to: { scale: 1.04, x: 30, y: 0 } },
    { from: { scale: 1.05, x: 0, y: -40 }, to: { scale: 1.05, x: 0, y: 35 } },
    { from: { scale: 1.0, x: 0, y: 0 }, to: { scale: 1.08, x: 0, y: 0 } },
    { from: { scale: 1.0, x: 0, y: 0 }, to: { scale: 1.09, x: 0, y: -30 } },
    { from: { scale: 1.04, x: -25, y: 0 }, to: { scale: 1.04, x: 25, y: 0 } },
    { from: { scale: 1.0, x: 0, y: -15 }, to: { scale: 1.08, x: 0, y: 15 } },
    { from: { scale: 1.04, x: 25, y: 0 }, to: { scale: 1.04, x: -25, y: 0 } },
    { from: { scale: 1.0, x: 0, y: 0 }, to: { scale: 1.09, x: 0, y: -25 } },
    { from: { scale: 1.0, x: 0, y: 0 }, to: { scale: 1.08, x: 0, y: -30 } },
    { from: { scale: 1.06, x: 0, y: 0 }, to: { scale: 1.01, x: 0, y: 0 } },
  ];

  // 5. Build HTML DOM for Shots
  const shotsHtml = shotsWithLocalAssets
    .map(
      (s) => `
    <!-- Shot ${String(s.shot).padStart(2, '0')} -->
    <div class="shot-scene" id="shot-${s.shot}">
      <div class="shot-media-wrapper">
        <img src="assets/${s.assetName}" class="shot-bg" id="bg-${s.shot}" alt="Shot ${s.shot}">
      </div>
    </div>`
    )
    .join('\n');

  // 6. Build Caption Phrases DOM
  const phrasesHtml = phrases
    .map((p) => {
      const wordsHtml = p.words
        .map((w, wIdx) => `<span class="caption-word" id="w-${p.id}-${wIdx}">${escapeHtml(w.word)}</span>`)
        .join(' ');
      return `      <div class="caption-phrase" id="${p.id}">
        ${wordsHtml}
      </div>`;
    })
    .join('\n');

  // 7. Build GSAP Camera & Caption Animation Script
  const shotsJs = shotsWithLocalAssets
    .map((s, idx) => {
      const motion = cameraMotions[idx % cameraMotions.length];
      const start = s.timing.startSec;
      const end = s.timing.endSec;
      const dur = s.timing.durationSec;
      const isLast = idx === shotsWithLocalAssets.length - 1;

      return `
    // Shot ${s.shot} (${start}s - ${end}s)
    tl.set("#shot-${s.shot}", { autoAlpha: 1 }, ${start});
    tl.fromTo("#bg-${s.shot}",
      { scale: ${motion.from.scale}, x: ${motion.from.x}, y: ${motion.from.y} },
      { scale: ${motion.to.scale}, x: ${motion.to.x}, y: ${motion.to.y}, duration: ${dur}, ease: "none" },
      ${start}
    );
    ${
      !isLast
        ? `tl.to("#shot-${s.shot}", { autoAlpha: 0, duration: 0.25, ease: "power1.inOut" }, ${(end - 0.25).toFixed(2)});`
        : ''
    }`;
    })
    .join('\n');

  const phrasesJs = phrases
    .map((p) => {
      const wordTweens = p.words
        .map((w, wIdx) => {
          const wDur = Math.max(0.12, w.end - w.start);
          return `    tl.to("#w-${p.id}-${wIdx}", {
      color: "#C59B27",
      textShadow: "0 0 16px rgba(197, 155, 39, 0.6)",
      scale: 1.06,
      duration: ${wDur.toFixed(2)},
      ease: "power1.out"
    }, ${w.start.toFixed(2)});`;
        })
        .join('\n');

      return `
    // Phrase ${p.id} (${p.start}s - ${p.end}s)
    tl.fromTo("#${p.id}",
      { autoAlpha: 0, y: 15, filter: "blur(6px)" },
      { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.25, ease: "power2.out" },
      ${p.start}
    );
${wordTweens}
    tl.to("#${p.id}",
      { autoAlpha: 0, y: -10, filter: "blur(4px)", duration: 0.2, ease: "power1.in" },
      ${(p.end + 0.05).toFixed(2)}
    );`;
    })
    .join('\n');

  const fullHtml = `<!doctype html>
<html lang="id" data-resolution="portrait">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080, height=1920" />
  <title>${escapeHtml(config.title)} - Graphic Noir True Crime</title>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&family=Montserrat:wght@800;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      margin: 0;
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      background-color: #0A0D12;
      color: #E6EDF3;
      font-family: "Inter", sans-serif;
    }
    #root {
      width: 1080px;
      height: 1920px;
      position: relative;
      overflow: hidden;
    }
    .shot-scene {
      position: absolute;
      inset: 0;
      width: 1080px;
      height: 1920px;
      opacity: 0;
      visibility: hidden;
      z-index: 1;
    }
    .shot-media-wrapper {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .shot-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      transform-origin: center center;
      will-change: transform;
    }
    /* Atmospheric Film Grain & Vignette Overlay */
    .vignette-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, rgba(10, 13, 18, 0) 45%, rgba(10, 13, 18, 0.75) 100%);
      pointer-events: none;
      z-index: 2;
    }
    /* Bottom Dark Scrim for Enhanced Readability */
    .bottom-caption-scrim {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 560px;
      background: linear-gradient(180deg, rgba(10, 13, 18, 0) 0%, rgba(10, 13, 18, 0.55) 45%, rgba(10, 13, 18, 0.92) 100%);
      pointer-events: none;
      z-index: 20;
    }
    /* Clean Bottom Safe Area Autocaption Container */
    #caption-container {
      position: absolute;
      bottom: 300px;
      left: 72px;
      right: 72px;
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      z-index: 25;
      pointer-events: none;
    }
    .caption-phrase {
      position: absolute;
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 16px;
      opacity: 0;
      visibility: hidden;
      font-size: 52px;
      font-weight: 800;
      line-height: 1.25;
      letter-spacing: -0.01em;
      color: #E6EDF3;
      text-shadow: 0 4px 18px rgba(0, 0, 0, 0.98), 0 2px 6px rgba(0, 0, 0, 0.95);
    }
    .caption-word {
      display: inline-block;
      transform-origin: center center;
    }
    /* Noir Forensic Glitch Overlay */
    #forensic-glitch {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      opacity: 0;
      z-index: 30;
      background: repeating-linear-gradient(
        0deg,
        rgba(230, 237, 243, 0.09) 0px,
        rgba(230, 237, 243, 0.09) 2px,
        transparent 2px,
        transparent 5px
      );
      mix-blend-mode: screen;
      will-change: opacity, transform, filter;
    }
  </style>
</head>
<body data-duration="${totalDurationSec.toFixed(3)}">
  <div id="root" data-composition-id="main" data-start="0" data-duration="${totalDurationSec.toFixed(3)}" data-width="1080" data-height="1920">
    <!-- Shot 00 (Cover Image Hook) -->
    <div class="shot-scene" id="shot-0" style="z-index: 5;">
      <div class="shot-media-wrapper">
        <img src="assets/${coverDestName}" class="shot-bg" id="bg-0" alt="Shot 00 Cover">
      </div>
    </div>
${shotsHtml}
    <!-- Atmospheric Vignette -->
    <div class="vignette-overlay"></div>
    <!-- Bottom Dark Scrim for Caption Readability -->
    <div class="bottom-caption-scrim"></div>
    <!-- Noir Forensic Glitch Overlay -->
    <div id="forensic-glitch"></div>

    <!-- Pure Autocaption in Bottom Safe Area -->
    <div id="caption-container">
${phrasesHtml}
    </div>
  </div>

  <script>
    const totalDuration = ${totalDurationSec.toFixed(3)};
    const tl = gsap.timeline({ paused: true });
    window.__timeline = tl;
    window.__timelines = window.__timelines || {};
    window.__timelines["main"] = tl;

    // --- NOIR FORENSIC GLITCH TRANSITION FUNCTION ---
    function triggerNoirGlitch(atTime) {
      const gTl = gsap.timeline();
      gTl.fromTo("#forensic-glitch",
        { opacity: 0, x: -14, filter: "drop-shadow(-6px 0 rgba(139,38,53,0.9)) drop-shadow(6px 0 rgba(197,155,39,0.9))" },
        { opacity: 0.85, x: 12, y: -4, duration: 0.05, ease: "rough" }
      )
      .to("#forensic-glitch", { opacity: 0.5, x: -6, y: 3, filter: "drop-shadow(4px 0 rgba(230,237,243,0.8)) drop-shadow(-4px 0 rgba(139,38,53,0.8))", duration: 0.05 })
      .to("#forensic-glitch", { opacity: 0, x: 0, y: 0, filter: "none", duration: 0.06 });

      tl.add(gTl, Math.max(0, atTime - 0.06));
    }

    const glitchTimings = [${glitchTimings.map((t) => t.toFixed(2)).join(', ')}];
    glitchTimings.forEach((t) => triggerNoirGlitch(t));

    // --- SHOT TRANSITIONS & SMOOTH CAMERA MOVEMENTS ---
    // Shot 0 (Mandatory Cover Hook: 0s - 1.5s)
    tl.set("#shot-0", { autoAlpha: 1 }, 0);
    tl.fromTo("#bg-0",
      { scale: 1.05 },
      { scale: 1.0, duration: 1.5, ease: "power2.out" },
      0
    );
    tl.to("#shot-0", { autoAlpha: 0, duration: 0.35, ease: "power2.inOut" }, 1.15);
${shotsJs}

    // --- AUTOCAPTION PHRASE BLOCKS & KARAOKE WORD HIGHLIGHTS ---
${phrasesJs}

    tl.seek(0);
  </script>
</body>
</html>`;

  // Write hyperframes.json
  const configPath = path.join(outputDir, 'hyperframes.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        $schema: 'https://hyperframes.heygen.com/schema/hyperframes.json',
        registry: 'https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry',
        media: { autoProxy: true },
      },
      null,
      2
    ),
    'utf8'
  );

  const htmlPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(htmlPath, fullHtml, 'utf8');

  return htmlPath;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
