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

  // E-Commerce Real Product Artwork (NO NOIR!)
  if (dossier.segment === 'commerce_ugc' || caseId.includes('shopee') || caseId.includes('obermain') || caseId.includes('ugc')) {
    // Check specific Obermain / Shopee real product image
    const obermainReal = path.resolve(process.cwd(), 'public', 'renders', 'shopee-obermain', 'real-product.jpg');
    if (fs.existsSync(obermainReal)) return obermainReal;

    // Check ecommerce-products directory for downloaded CDN image
    const ecomDir = path.resolve(process.cwd(), 'public', 'renders', 'ecommerce-products');
    if (fs.existsSync(ecomDir)) {
      const files = fs.readdirSync(ecomDir).filter((f) => f.endsWith('.jpg') || f.endsWith('.png'));
      if (files.length > 0) {
        return path.join(ecomDir, files[0]);
      }
    }
  }

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
  if ((candidate.archetype === 'odd_specific_detail' || (candidate.archetype as string) === 'The Odd Specific Detail') && fs.existsSync(draftBillVisual)) {
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

  const isUGC = dossier.segment === 'commerce_ugc';
  const kickerText = isUGC
    ? (dossier.productData?.category === 'beauty_skincare' ? '✨ BEAUTY HACK // RACUN TIKTOK' : '🔥 SPILL PRODUK // REVIEW JUJUR')
    : `DOSSIER FORENSIK // INVESTIGASI KHUSUS`;
  const caseStampText = isUGC
    ? (dossier.productData?.offerPrice || 'DISKON SPESIAL HARI INI')
    : (dossier.caseId || 'CRIME ARCHIVE').toUpperCase();
  const brandTagText = isUGC
    ? (dossier.productData?.productName || dossier.title).toUpperCase()
    : 'TRUE CRIME EXPLAINER';
  const brandSubText = isUGC
    ? '⭐ 4.9/5 (10K+ TERJUAL) • PROMO TERBATAS'
    : '9:16 VERTICAL CINEMATIC';

  // FLAGSHIP GRAPHIC NOVEL NEO-NOIR FORENSIC CANVAS / NATIVE UGC CANVAS (1080x1920 Vertikal)
  const htmlContent = `<!doctype html>
<html lang="id" data-resolution="portrait">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080, height=1920" />
  <title>${isUGC ? 'Native UGC TikTok' : 'Graphic Noir'} Keyframe - ${candidate.topGiantKeyword}</title>
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
      background-color: ${isUGC ? '#0D1117' : '#0A0D12'};
      color: #E6EDF3;
      font-family: 'Inter', sans-serif;
    }
    #root {
      width: 1080px;
      height: 1920px;
      position: relative;
      overflow: hidden;
      background: ${isUGC ? 'linear-gradient(180deg, #0F172A 0%, #0D1117 100%)' : '#0A0D12'};
    }
    .shot-media-wrapper {
      position: absolute;
      inset: 0;
      width: 1080px;
      height: 1920px;
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
      filter: ${isUGC ? 'brightness(0.85) contrast(1.15)' : 'none'};
    }
    /* Chiaroscuro Atmospheric Film Grain & Radial Vignette Overlay */
    .vignette-overlay {
      position: absolute;
      inset: 0;
      background: ${
        isUGC
          ? 'radial-gradient(circle at 50% 50%, rgba(13, 17, 23, 0.2) 20%, rgba(13, 17, 23, 0.85) 100%)'
          : 'radial-gradient(circle at 50% 45%, rgba(10, 13, 18, 0.15) 35%, rgba(10, 13, 18, 0.88) 100%)'
      };
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
      background: ${isUGC ? '#FF004F' : '#8B2635'};
      color: #FFFFFF;
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 20px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 10px 24px;
      display: inline-block;
      border-left: ${isUGC ? '6px solid #FEE500' : '6px solid #E5A93C'};
      box-shadow: 0 4px 20px rgba(0,0,0,0.8);
      border-radius: ${isUGC ? '6px' : '0px'};
    }
    .case-stamp {
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: 0.14em;
      color: ${isUGC ? '#FEE500' : '#C59B27'};
      text-transform: uppercase;
      opacity: 0.95;
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
      background: ${isUGC ? '#FEE500' : 'rgba(13, 17, 23, 0.88)'};
      border: ${isUGC ? 'none' : '2px solid rgba(197, 155, 39, 0.75)'};
      box-shadow: ${isUGC ? '0 12px 36px rgba(0, 0, 0, 0.75)' : '0 0 40px rgba(197, 155, 39, 0.45), inset 0 0 25px rgba(139, 38, 53, 0.4)'};
      border-radius: ${isUGC ? '12px' : '12px'};
      backdrop-filter: blur(12px);
      transform: ${isUGC ? 'rotate(-1.5deg)' : 'none'};
      transform-origin: center center;
    }
    .top-keyword-text {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 48px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: ${isUGC ? '#000000' : '#FFFFFF'};
      text-shadow: ${isUGC ? 'none' : '0 0 30px rgba(229, 169, 60, 0.95), 0 4px 14px rgba(0, 0, 0, 0.95)'};
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
      font-size: 44px;
      font-weight: 800;
      line-height: 1.35;
      letter-spacing: -0.01em;
      color: #FFFFFF;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.98), 0 2px 8px rgba(0, 0, 0, 0.95);
      padding: 0 20px;
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
      border-top: 1px solid ${isUGC ? 'rgba(254, 229, 0, 0.3)' : 'rgba(197, 155, 39, 0.25)'};
      padding-top: 20px;
    }
    .brand-tag {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 20px;
      letter-spacing: 0.15em;
      color: ${isUGC ? '#FEE500' : 'rgba(229, 169, 60, 0.7)'};
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 600;
      letter-spacing: 0.1em;
    }
    /* E-Commerce Real Product Showcase Stage */
    .product-stage {
      position: absolute;
      top: 360px;
      left: 0;
      right: 0;
      height: 700px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    .product-ambient-glow {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(254, 229, 0, 0.15) 0%, rgba(15, 23, 42, 0) 70%);
      pointer-events: none;
    }
    .product-card-frame {
      width: 660px;
      height: 660px;
      border-radius: 32px;
      background: #FFFFFF;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(254, 229, 0, 0.12);
      border: 4px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: hidden;
    }
    .real-product-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div id="root" data-composition-id="main" data-start="0" data-duration="5" data-width="1080" data-height="1920">
    ${
      isUGC
        ? `
    <div class="product-stage">
      <div class="product-ambient-glow"></div>
      <div class="product-card-frame">
        <img class="real-product-img" src="./${localBgName}" alt="Real Product" />
      </div>
    </div>
    `
        : `
    <div class="shot-media-wrapper">
      <img class="shot-bg" src="./${localBgName}" alt="Keyframe Visual" />
    </div>
    <div class="vignette-overlay"></div>
    `
    }
    <div class="bottom-caption-scrim"></div>

    <div class="header-bar">
      <span class="kicker-noir">${kickerText}</span>
      <span class="case-stamp">${caseStampText}</span>
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
      <span class="brand-tag">${brandTagText}</span>
      <span class="brand-sub">${brandSubText}</span>
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
