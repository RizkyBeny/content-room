import fs from 'node:fs';
import path from 'node:path';
import { getThemePreset } from './presets';
import { TranscribedWord } from '../flowMcp/types';

export interface StoryboardScene {
  id: string;
  beat: string;
  start_ms: number;
  end_ms: number;
  kicker: string;
  headline: string;
  subtext?: string;
  metric?: string;
  metricLabel?: string;
  assetType: 'video' | 'image' | 'graphic_only';
  assetPath?: string;
  visualIntent?: string;
  variant?: 'variant-a' | 'variant-b';
  stampType?: string;
  stampText?: string;
  evidenceCategory?: string;
  evidenceSource?: string;
  evidenceSummary?: string;
  documentNumber?: string;
  parallaxVariant?: 'macro-dossier' | 'investigative-desk' | string;
}

export interface CompositionConfig {
  jobId: string;
  title: string;
  themePresetId: string;
  totalDurationMs: number;
  audioPath?: string;
  scenes: StoryboardScene[];
  words?: TranscribedWord[];
  outputDir: string;
}

export function generateHyperframesProject(config: CompositionConfig): {
  projectDir: string;
  htmlPath: string;
  configPath: string;
} {
  const projectDir = config.outputDir;
  fs.mkdirSync(projectDir, { recursive: true });

  const preset = getThemePreset(config.themePresetId);
  const totalDurationSec = Math.max(1, Math.ceil(config.totalDurationMs / 1000));
  const isVoxArchival = config.themePresetId === 'vox-archival-parallax';

  // Write hyperframes.json
  const configPath = path.join(projectDir, 'hyperframes.json');
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

  // Copy assets if needed
  if (config.audioPath && fs.existsSync(config.audioPath)) {
    const destAudio = path.join(projectDir, path.basename(config.audioPath));
    if (config.audioPath !== destAudio) {
      fs.copyFileSync(config.audioPath, destAudio);
    }
  }

  for (const scene of config.scenes) {
    if (scene.assetPath && fs.existsSync(scene.assetPath)) {
      const destAsset = path.join(projectDir, path.basename(scene.assetPath));
      if (scene.assetPath !== destAsset) {
        fs.copyFileSync(scene.assetPath, destAsset);
      }
    }
  }

  // 1. Generate index.html based on preset
  const scenesHtml = config.scenes
    .map((scene, idx) => {
      let bgHtml = '';
      if (scene.assetType === 'video' && scene.assetPath) {
        bgHtml = `<video class="scene-bg-media scene-video" src="${path.basename(scene.assetPath)}" muted playsinline></video>`;
      } else if (scene.assetType === 'image' && scene.assetPath) {
        bgHtml = `<img class="scene-bg-media scene-img" src="${path.basename(scene.assetPath)}" alt="scene background" />`;
      } else {
        bgHtml = `<div class="scene-bg-graphic"></div>`;
      }

      const startS = (scene.start_ms / 1000).toFixed(2);
      const durationS = Math.max(0.1, (scene.end_ms - scene.start_ms) / 1000).toFixed(2);

      if (isVoxArchival) {
        // --- Vox Archival 3-Zone Layout ---
        // Hash mark pagination: ─ ─ ─ ■ ─ ─ ─
        const totalScenes = config.scenes.length;
        const hashMarks = Array.from({ length: totalScenes }, (_, i) =>
          i === idx ? `<span class="hash-active">■</span>` : `<span>─</span>`
        ).join(' ');

        const evidenceCategory =
          scene.evidenceCategory ||
          (scene.documentNumber ? `BERKAS INVESTIGASI // ${scene.documentNumber}` : 'BERKAS INVESTIGASI LAPORAN // 2026');
        const evidenceTitle = scene.evidenceSummary || scene.subtext || scene.headline;
        const evidenceSource = scene.evidenceSource || 'SUMBER: ARSIP DOKUMEN & RISET KUMPARAN';
        const stampText = scene.stampType || scene.stampText || 'RAHASIA';

        return `
      <section class="scene-container vox-scene" id="scene-${scene.id}" data-start="${startS}" data-duration="${durationS}">
        <div class="bg-wrapper">
          ${bgHtml}
          <div class="scrim-overlay"></div>
          <div class="film-grain-overlay"></div>
        </div>

        <div class="safe-area vox-safe-area">
          <!-- TOP ZONE: Archival Header & Kinetic Headline -->
          <div class="vox-top-zone">
            <div class="archival-header">[ DOKUMEN INTELIJEN // BERKAS 0${idx + 1} - ${scene.beat.toUpperCase()} ]</div>
            <div class="archival-hash-marks">${hashMarks}</div>
            <div class="vox-headline-container">
              <h1 class="vox-kinetic-title">${scene.headline}</h1>
            </div>
          </div>

          <!-- MIDDLE ZONE: Handled by visual plate or stat metric callout -->
          <div class="vox-mid-spacer" style="display: flex; align-items: center; justify-content: center; min-height: 500px;">
            ${scene.metric ? `
            <div class="vox-mid-metric" id="vox-metric-${scene.id}">
              <span class="vox-mid-metric-val">${scene.metric}</span>
              ${scene.metricLabel ? `<span class="vox-mid-metric-lbl">${scene.metricLabel}</span>` : ''}
            </div>` : ''}
          </div>

          <!-- BOTTOM ZONE: Archival Evidence Badge Card -->
          <div class="vox-evidence-badge-container">
            <div class="vox-evidence-badge" id="evidence-${scene.id}">
              <div class="vox-stamp-mark" id="stamp-${scene.id}">${stampText}</div>
              <div class="vox-evidence-row1">${evidenceCategory}</div>
              <div class="vox-evidence-row2">${evidenceTitle}</div>
              <div class="vox-evidence-row3">${evidenceSource}</div>
            </div>
          </div>
        </div>
      </section>
        `;
      }

      // --- Standard Layout for other presets ---
      const metricHtml = scene.metric
        ? `
        <div class="metric-container" id="metric-${scene.id}">
          <div class="metric-value">${scene.metric}</div>
          ${scene.metricLabel ? `<div class="metric-label">${scene.metricLabel}</div>` : ''}
        </div>
      `
        : '';

      return `
      <section class="scene-container" id="scene-${scene.id}" data-start="${startS}" data-duration="${durationS}">
        <div class="bg-wrapper">
          ${bgHtml}
          <div class="scrim-overlay"></div>
          <div class="dot-pattern"></div>
        </div>

        <div class="safe-area">
          <div class="top-meta">
            <span class="kicker-badge">${scene.kicker}</span>
          </div>

          <div class="scene-card">
            <h1 class="kinetic-title">${scene.headline}</h1>
            ${metricHtml}
            ${scene.subtext ? `<p class="scene-subtext">${scene.subtext}</p>` : ''}
          </div>

          <div class="bottom-branding">
            <div class="brand-tag">EXPLAINER</div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill"></div>
            </div>
          </div>
        </div>
      </section>
      `;
    })
    .join('\n');

  const htmlContent = `<!doctype html>
<html lang="id" data-resolution="portrait">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080, height=1920" />
  <title>${config.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=IBM+Plex+Mono:wght@500;700&family=Inter:wght@400;500;600;700;800;900&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">
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
      background-color: ${preset.colors.bg};
      color: ${preset.colors.text};
      font-family: ${preset.fonts.body};
    }
    #root {
      width: 1080px;
      height: 1920px;
      position: relative;
      overflow: hidden;
    }
    /* Safe Area (Top 140px, Bottom 180px, Horizontal 64px) */
    .safe-area {
      position: absolute;
      top: 140px;
      bottom: 180px;
      left: 64px;
      right: 64px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      z-index: 10;
    }
    .scene-container {
      position: absolute;
      inset: 0;
      width: 1080px;
      height: 1920px;
      opacity: 0;
      visibility: hidden;
    }
    .bg-wrapper {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 1;
    }
    .scene-bg-media {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .scene-bg-graphic {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 50% 40%, ${preset.colors.cardBg} 0%, ${preset.colors.bg} 85%);
    }
    .scrim-overlay {
      position: absolute;
      inset: 0;
      background: ${preset.colors.scrim};
      z-index: 2;
    }
    .dot-pattern {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 480px;
      background-image: radial-gradient(circle, ${preset.colors.patternColor} 3px, transparent 4px);
      background-size: 36px 36px;
      z-index: 3;
    }
    .top-meta {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .bottom-branding {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .brand-tag {
      font-family: ${preset.fonts.heading};
      font-weight: 800;
      font-size: 20px;
      letter-spacing: 0.15em;
      opacity: 0.8;
      color: ${preset.colors.primary};
    }
    .progress-bar-container {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-bar-fill {
      width: 0%;
      height: 100%;
      background: ${preset.colors.primary};
    }
    .scene-subtext {
      font-size: 32px;
      line-height: 1.4;
      margin-top: 24px;
      opacity: 0.9;
    }
    .metric-container {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .metric-label {
      font-size: 28px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.85;
    }
    ${preset.css}
  </style>
</head>
<body class="theme-${preset.id}">
  <div
    id="root"
    data-composition-id="main"
    data-start="0"
    data-duration="${totalDurationSec}"
    data-width="1080"
    data-height="1920"
  >
    ${scenesHtml}
  </div>

  ${config.audioPath ? `<audio id="narration-audio" src="${path.basename(config.audioPath)}" preload="auto"></audio>` : ''}

  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });
    window.__timelines["main"] = tl;

    const totalDuration = ${totalDurationSec};
    const isVox = ${isVoxArchival ? 'true' : 'false'};

    // Choreography per scene
    ${config.scenes
      .map((scene, idx) => {
        const startS = scene.start_ms / 1000;
        const endS = scene.end_ms / 1000;
        const durationS = Math.max(0.2, endS - startS);

        if (isVoxArchival) {
          // Dynamic Cinematic Camera Movement (Vox 2.5D Parallax)
          let camFromScale = 1.0;
          let camToScale = 1.14;
          let camFromX = 0;
          let camToX = 0;
          let camFromY = 0;
          let camToY = -35;
          let camEase = 'power1.inOut';

          if (idx === 0) {
            // Scene 1 (Hook): Steady deliberate push-in focusing toward the desk dossier
            camFromScale = 1.0;
            camToScale = 1.14;
            camFromX = 0;
            camToX = 0;
            camFromY = 0;
            camToY = -40;
            camEase = 'power1.inOut';
          } else if (idx === 1) {
            // Scene 2 (Context): Lateral drift from right to left across financial ledger
            camFromScale = 1.05;
            camToScale = 1.16;
            camFromX = 40;
            camToX = -35;
            camFromY = 10;
            camToY = -25;
            camEase = 'power1.out';
          } else if (idx === 2) {
            // Scene 3 (Problem): Dramatic slow push-in toward excise stagnation charts
            camFromScale = 1.0;
            camToScale = 1.15;
            camFromX = 0;
            camToX = -20;
            camFromY = 20;
            camToY = -30;
            camEase = 'sine.inOut';
          } else if (idx === 3) {
            // Scene 4 (Evidence): Tracking pan across coastal patrol boat photos to radio
            camFromScale = 1.05;
            camToScale = 1.17;
            camFromX = -40;
            camToX = 35;
            camFromY = 15;
            camToY = -20;
            camEase = 'power1.inOut';
          } else {
            // Scene 5 (Resolution): Majestic slow push-in centered on national budget folio
            camFromScale = 1.0;
            camToScale = 1.13;
            camFromX = 0;
            camToX = 0;
            camFromY = 0;
            camToY = -45;
            camEase = 'power2.out';
          }

          return `
    // --- Scene ${scene.id} Vox Archival (Beat: ${scene.beat}) ---
    tl.set("#scene-${scene.id}", { autoAlpha: 1 }, ${startS.toFixed(2)});

    // Headline entrance
    tl.fromTo("#scene-${scene.id} .vox-kinetic-title", 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 
      ${startS.toFixed(2)}
    );

    // Evidence badge slide-up & stamp punch
    tl.fromTo("#evidence-${scene.id}",
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: "back.out(1.2)" },
      ${(startS + 0.15).toFixed(2)}
    );

    tl.fromTo("#stamp-${scene.id}",
      { scale: 1.35, opacity: 0 },
      { scale: 1.0, opacity: 0.9, duration: 0.35, ease: "power2.out" },
      ${(startS + 0.35).toFixed(2)}
    );

    ${
      scene.metric
        ? `
    tl.fromTo("#vox-metric-${scene.id}",
      { scale: 0.88, opacity: 0, y: 20 },
      { scale: 1.0, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.3)" },
      ${(startS + 0.25).toFixed(2)}
    );
    `
        : ''
    }

    // 2.5D Camera choreography on background media plate
    tl.fromTo("#scene-${scene.id} .scene-bg-media",
      { scale: ${camFromScale}, x: ${camFromX}, y: ${camFromY} },
      { scale: ${camToScale}, x: ${camToX}, y: ${camToY}, duration: ${durationS.toFixed(2)}, ease: "${camEase}" },
      ${startS.toFixed(2)}
    );

    // Foreground subtle counter-drift on evidence badge for multiplane parallax
    tl.to("#evidence-${scene.id}",
      { y: -15, duration: ${durationS.toFixed(2)}, ease: "none" },
      ${(startS + 0.6).toFixed(2)}
    );

    // Film dissolve transition to next scene
    ${
      idx < config.scenes.length - 1
        ? `
    tl.to("#scene-${scene.id}", 
      { autoAlpha: 0, duration: 0.35, ease: "power2.inOut" }, 
      ${(endS - 0.35).toFixed(2)}
    );
    `
        : ''
    }
    `;
        }

        // Standard preset choreography
        return `
    // --- Scene ${scene.id} (${scene.beat}) ---
    tl.set("#scene-${scene.id}", { autoAlpha: 1 }, ${startS.toFixed(2)});

    tl.fromTo("#scene-${scene.id} .scene-card", 
      { y: 80, opacity: 0, scale: 0.96 }, 
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)" }, 
      ${startS.toFixed(2)}
    );

    tl.fromTo("#scene-${scene.id} .kicker-badge", 
      { scale: 0.8, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" }, 
      ${startS.toFixed(2)}
    );

    tl.fromTo("#scene-${scene.id} .scene-bg-media",
      { scale: 1.0 },
      { scale: 1.08, duration: ${durationS.toFixed(2)}, ease: "none" },
      ${startS.toFixed(2)}
    );

    ${
      scene.metric
        ? `
    tl.fromTo("#metric-${scene.id}",
      { scale: 0.85, opacity: 0 },
      { scale: 1.0, opacity: 1, duration: 0.45, ease: "elastic.out(1, 0.75)" },
      ${(startS + 0.25).toFixed(2)}
    );
    `
        : ''
    }

    ${
      idx < config.scenes.length - 1
        ? `
    tl.to("#scene-${scene.id}", 
      { autoAlpha: 0, duration: 0.25, ease: "power2.in" }, 
      ${(endS - 0.25).toFixed(2)}
    );
    `
        : ''
    }
    `;
      })
      .join('\n')}

    // Progress bar across total duration
    tl.to(".progress-bar-fill", {
      width: "100%",
      duration: totalDuration,
      ease: "none"
    }, 0);

    tl.seek(0);
  </script>
</body>
</html>`;

  const htmlPath = path.join(projectDir, 'index.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  return { projectDir, htmlPath, configPath };
}
