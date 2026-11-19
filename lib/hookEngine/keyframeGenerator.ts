import fs from 'node:fs';
import path from 'node:path';
import { execSync, execFileSync } from 'node:child_process';
import { HookCandidate, CaseDossierInput } from './types';

function resolveFfmpegBin(): { ffmpeg: string; ffprobe: string } {
  const localFfmpeg = path.resolve(process.cwd(), 'bin', 'ffmpeg');
  const localFfprobe = path.resolve(process.cwd(), 'bin', 'ffprobe');
  const ffmpeg = fs.existsSync(localFfmpeg) ? localFfmpeg : 'ffmpeg';
  const ffprobe = fs.existsSync(localFfprobe) ? localFfprobe : 'ffprobe';
  return { ffmpeg, ffprobe };
}

const { ffmpeg } = resolveFfmpegBin();

/**
 * Resolves the most fitting Graphic Novel Neo-Noir Forensic Artwork for a candidate.
 * Flagship visual style: Bom Bali Amrozi / Eno Pelaku Berbagi Peran / Mujianto.
 */
function resolveNoirArtwork(candidate: HookCandidate, dossier: CaseDossierInput): string {
  const caseId = dossier.caseId || '';

  // 1. If Candidate 2 of RUU Perampasan Aset (The Odd Specific Detail / Draft Bill Article 47)
  const draftBillVisual = path.resolve(
    process.cwd(),
    'public',
    'renders',
    'hook-simulator',
    'url-jalan-baru-perampasan-aset-dpr',
    'hook-1',
    'hook-visual.jpg'
  );

  // 2. Bom Bali & True Crime Curated Assets
  const courtGavelAsset = path.resolve(
    process.cwd(),
    'hyperframes-workspace',
    'bom-bali-amrozi',
    'assets',
    'denpasar-court-gavel.jpg'
  );
  const forensicSweepAsset = path.resolve(
    process.cwd(),
    'hyperframes-workspace',
    'bom-bali-amrozi',
    'assets',
    'forensic-investigation-sweep.jpg'
  );
  const corkboardAsset = path.resolve(
    process.cwd(),
    'hyperframes-workspace',
    'bom-bali-amrozi',
    'assets',
    'trio-brothers-corkboard.jpg'
  );
  const explosiveDrumsAsset = path.resolve(
    process.cwd(),
    'hyperframes-workspace',
    'bom-bali-amrozi',
    'assets',
    'chemical-explosive-drums.jpg'
  );
  const coverShotAsset = path.resolve(
    process.cwd(),
    'hyperframes-workspace',
    'bom-bali-amrozi',
    'assets',
    'cover-shot-00.jpg'
  );

  // Specific mapping for RUU Perampasan Aset
  if (caseId.includes('ruu') || caseId.includes('perampasan') || caseId.includes('aset') || caseId.includes('kumparan')) {
    if (candidate.id === 'hook-2' || candidate.topGiantKeyword.includes('PASAL') || candidate.hookText.includes('pasal')) {
      if (fs.existsSync(draftBillVisual)) return draftBillVisual;
    }
    if (candidate.id === 'hook-1' || candidate.topGiantKeyword.includes('TANGAN') || candidate.topGiantKeyword.includes('FRAKSI') || candidate.topGiantKeyword.includes('SEPAKAT')) {
      if (fs.existsSync(courtGavelAsset)) return courtGavelAsset;
    }
    if (candidate.id === 'hook-3' || candidate.archetype === 'micro_story_countdown' || candidate.hookText.includes('malam') || candidate.hookText.includes('Senayan') || candidate.hookText.includes('30 hari')) {
      if (fs.existsSync(corkboardAsset)) return corkboardAsset;
      if (fs.existsSync(forensicSweepAsset)) return forensicSweepAsset;
    }
  }

  // Check case-specific renders directory
  const caseKeyframe = path.resolve(process.cwd(), 'public', 'renders', caseId, 'keyframes', 'cover-shot-00.jpg');
  if (fs.existsSync(caseKeyframe)) return caseKeyframe;

  // Defaults based on archetype
  if ((candidate.archetype === 'odd_specific_detail' || candidate.archetype === 'The Odd Specific Detail') && fs.existsSync(draftBillVisual)) {
    return draftBillVisual;
  }
  if (candidate.archetype === 'micro_story_countdown' && fs.existsSync(corkboardAsset)) {
    return corkboardAsset;
  }
  if (fs.existsSync(courtGavelAsset)) return courtGavelAsset;
  if (fs.existsSync(forensicSweepAsset)) return forensicSweepAsset;
  return coverShotAsset;
}

/**
 * Generates a 100% precision vertical 9:16 (1080x1920) Keyframe for a Hook Candidate:
 * SIGNATURE VISUAL STYLE: 100% Graphic Novel Neo-Noir Forensic (Bom Bali Amrozi / Eno Farihah style).
 * NO FLAT 2D KUMPARAN NEWS TEMPLATES!
 */
export async function generateKeyframeImage(params: {
  candidate: HookCandidate;
  dossier: CaseDossierInput;
  targetImagePath: string;
}): Promise<string> {
  const { candidate, dossier, targetImagePath } = params;
  const outDir = path.dirname(targetImagePath);
  fs.mkdirSync(outDir, { recursive: true });

  const hfWorkspace = path.resolve(
    process.cwd(),
    'hyperframes-workspace',
    `hook-keyframe-${dossier.caseId || 'case'}-${candidate.id}`
  );
  fs.mkdirSync(hfWorkspace, { recursive: true });

  // Config hyperframes.json
  fs.writeFileSync(
    path.join(hfWorkspace, 'hyperframes.json'),
    JSON.stringify(
      {
        $schema: 'https://hyperframes.heygen.com/schema/hyperframes.json',
        registry: 'https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry',
        media: { autoProxy: true },
      },
      null,
      2
    )
  );

  // Copy or resolve background noir illustration
  const rawBgPath = resolveNoirArtwork(candidate, dossier);
  const localBgName = 'artwork-noir.jpg';
  const localBgPath = path.join(hfWorkspace, localBgName);
  if (fs.existsSync(rawBgPath)) {
    fs.copyFileSync(rawBgPath, localBgPath);
  }

  const kickerText = `DOSSIER FORENSIK // INVESTIGASI KHUSUS`;

  // FLAGSHIP GRAPHIC NOVEL NEO-NOIR FORENSIC CANVAS (1080x1920 Vertikal)
  const htmlContent = `<!doctype html>
<html lang="id" data-resolution="portrait">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080, height=1920" />
  <title>Graphic Noir Keyframe - ${candidate.topGiantKeyword}</title>
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
      font-family: 'Inter', sans-serif;
    }
    #root {
      width: 1080px;
      height: 1920px;
      position: relative;
      overflow: hidden;
      background: #0A0D12;
    }
    .shot-media-wrapper {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 1;
    }
    .shot-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      transform-origin: center center;
    }
    /* Chiaroscuro Atmospheric Film Grain & Radial Vignette Overlay */
    .vignette-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 45%, rgba(10, 13, 18, 0.15) 35%, rgba(10, 13, 18, 0.88) 100%);
      pointer-events: none;
      z-index: 2;
    }
    /* Bottom Dark Scrim for 100% Readable Subtitles */
    .bottom-caption-scrim {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 640px;
      background: linear-gradient(180deg, rgba(10, 13, 18, 0) 0%, rgba(10, 13, 18, 0.72) 40%, rgba(10, 13, 18, 0.98) 100%);
      pointer-events: none;
      z-index: 20;
    }
    /* Top Header Bar */
    .header-bar {
      position: absolute;
      top: 90px;
      left: 64px;
      right: 64px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 30;
    }
    .kicker-noir {
      background: #8B2635;
      color: #FFFFFF;
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 20px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      padding: 10px 24px;
      display: inline-block;
      border-left: 6px solid #E5A93C;
      box-shadow: 0 4px 20px rgba(0,0,0,0.8);
    }
    .case-stamp {
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: 0.18em;
      color: #C59B27;
      text-transform: uppercase;
      opacity: 0.85;
    }
    /* Dual-Layer Typography: Top Giant Keyword Flash */
    #top-keyword-container {
      position: absolute;
      top: 170px;
      left: 64px;
      right: 64px;
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      z-index: 28;
      pointer-events: none;
    }
    .top-keyword-badge {
      padding: 16px 36px;
      background: rgba(13, 17, 23, 0.88);
      border: 2px solid rgba(197, 155, 39, 0.75);
      box-shadow: 0 0 40px rgba(197, 155, 39, 0.45), inset 0 0 25px rgba(139, 38, 53, 0.4);
      border-radius: 12px;
      backdrop-filter: blur(12px);
      transform-origin: center center;
    }
    .top-keyword-text {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 48px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #FFFFFF;
      text-shadow: 0 0 30px rgba(229, 169, 60, 0.95), 0 4px 14px rgba(0, 0, 0, 0.95);
      line-height: 1.15;
      white-space: nowrap;
    }
    /* Clean Bottom Safe Area Autocaption Container */
    #caption-container {
      position: absolute;
      bottom: 260px;
      left: 64px;
      right: 64px;
      min-height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      z-index: 25;
      pointer-events: none;
    }
    .caption-phrase {
      font-size: 46px;
      font-weight: 800;
      line-height: 1.35;
      letter-spacing: -0.01em;
      color: #FFFFFF;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.98), 0 2px 8px rgba(0, 0, 0, 0.95);
      padding: 0 20px;
    }
    .caption-highlight {
      color: #FCD34D;
      text-shadow: 0 0 20px rgba(229, 169, 60, 0.8);
    }
    /* Brand Watermark / Bottom Footer */
    .footer-bar {
      position: absolute;
      bottom: 120px;
      left: 64px;
      right: 64px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 25;
      border-top: 1px solid rgba(197, 155, 39, 0.25);
      padding-top: 20px;
    }
    .brand-tag {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 20px;
      letter-spacing: 0.2em;
      color: rgba(229, 169, 60, 0.7);
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 600;
      letter-spacing: 0.1em;
    }
  </style>
</head>
<body>
  <div id="root" data-composition-id="main" data-start="0" data-duration="5" data-width="1080" data-height="1920">
    <div class="shot-media-wrapper">
      <img class="shot-bg" src="./${localBgName}" alt="Noir Artwork" />
    </div>
    <div class="vignette-overlay"></div>
    <div class="bottom-caption-scrim"></div>

    <div class="header-bar">
      <span class="kicker-noir">${kickerText}</span>
      <span class="case-stamp">${(dossier.caseId || 'CRIME ARCHIVE').toUpperCase()}</span>
    </div>

    <div id="top-keyword-container">
      <div class="top-keyword-badge">
        <div class="top-keyword-text">${candidate.topGiantKeyword}</div>
      </div>
    </div>

    <div id="caption-container">
      <div class="caption-phrase">
        &ldquo;${candidate.hookText}&rdquo;
      </div>
    </div>

    <div class="footer-bar">
      <span class="brand-tag">TRUE CRIME EXPLAINER</span>
      <span class="brand-sub">9:16 VERTICAL CINEMATIC</span>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    window.__timeline = tl;
    window.__timelines = window.__timelines || {};
    window.__timelines["main"] = tl;
  </script>
</body>
</html>`;

  const indexHtmlPath = path.join(hfWorkspace, 'index.html');
  fs.writeFileSync(indexHtmlPath, htmlContent, 'utf8');

  // Snapshot via hyperframes in 2.5s
  const snapDir = path.join(hfWorkspace, 'snapshots');
  fs.mkdirSync(snapDir, { recursive: true });

  try {
    execSync(
      `npx hyperframes snapshot "${hfWorkspace}" --at 1.0 --no-end -o "${snapDir}"`,
      { stdio: 'pipe' }
    );

    const generatedSnap = path.join(snapDir, 'frame-00-at-1s.png');
    if (fs.existsSync(generatedSnap)) {
      execFileSync(ffmpeg, ['-y', '-i', generatedSnap, targetImagePath]);
      console.log(`✅ [Keyframe Generator] Berhasil merender keyframe Neo-Noir (Bom Bali style): ${targetImagePath}`);
      return targetImagePath;
    }
  } catch (snapErr: any) {
    console.warn(`⚠️ Hyperframes snapshot failed: ${snapErr.message}, menggunakan ffmpeg composition fallback...`);
  }

  // Bulletproof FFmpeg composition fallback directly on rawBgPath
  if (fs.existsSync(rawBgPath)) {
    execFileSync(ffmpeg, [
      '-y',
      '-i',
      rawBgPath,
      '-vf',
      'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
      targetImagePath,
    ]);
  }

  return targetImagePath;
}
