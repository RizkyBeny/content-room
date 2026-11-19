import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import dotenv from 'dotenv';
import { generateAudioAndAlignment } from '../lib/flowMcp/audioPipeline';
import { scoreHookCandidate } from '../lib/hookEngine/empiricalScorer';
import { CaseDossierInput, HookCandidate } from '../lib/hookEngine/types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

function resolveFfmpegBin(): { ffmpeg: string; ffprobe: string } {
  const localFfmpeg = path.resolve(process.cwd(), 'bin', 'ffmpeg');
  const localFfprobe = path.resolve(process.cwd(), 'bin', 'ffprobe');
  const ffmpeg = fs.existsSync(localFfmpeg) ? localFfmpeg : 'ffmpeg';
  const ffprobe = fs.existsSync(localFfprobe) ? localFfprobe : 'ffprobe';
  return { ffmpeg, ffprobe };
}

const { ffmpeg, ffprobe } = resolveFfmpegBin();

export const KUMPARAN_DOSSIER: CaseDossierInput = {
  caseId: 'kumparan-ruu-perampasan-aset',
  title: 'Pemerintah-DPR Sepakati RUU Perampasan Aset Dibawa ke Paripurna untuk Disahkan Jadi UU',
  location: 'Komisi III DPR RI, Senayan, Jakarta',
  victim: 'Keuangan Negara & Korban Penipuan / Investasi Bodong Massal',
  suspect: 'Pelaku Korupsi, TPPU, dan Kejahatan Finansial Berdampak Luas',
  keyEvidence: 'Naskah RUU Perampasan Aset, Mekanisme Non-Conviction Based, Ketukan Palu Sidang Tingkat I',
  coreConflict:
    'Setelah bertahun-tahun mandek dan alot di Senayan, seluruh 8 fraksi DPR mendadak serentak menyatakan setuju menyita aset tanpa vonis pidana',
  sourceUrl:
    'https://kumparan.com/kumparannews/pemerintah-dpr-sepakati-ruu-perampasan-aset-dibawa-ke-paripurna-untuk-disahkan-jadi-uu-28b45xHQ7o7',
  rawBrief:
    'Rapat Kerja Pengambilan Keputusan Tingkat I Komisi III DPR dipimpin Wakil Ketua DPR Sufmi Dasco Ahmad pada Rabu (18/11/2026). RUU mengatur perampasan aset tanpa tuntutan pidana, pembuktian terbalik, ancaman pidana mati tetap berlaku, dan penjeratan penipuan teknologi informasi serta investasi bodong massal.',
};

export interface HookVariantDef {
  id: string;
  archetypeKey: string;
  archetypeName: string;
  hookText: string;
  topGiantKeyword: string;
  themeStyle: 'midnight-charcoal' | 'deep-marine-navy';
}

export const HOOK_VARIANTS: HookVariantDef[] = [
  {
    id: 'hook-1',
    archetypeKey: 'cognitive_dissonance_paradox',
    archetypeName: 'The Cognitive Dissonance Paradox',
    hookText:
      'Bertahun-tahun alot dan mandek di Senayan... Tiba-tiba seluruh fraksi DPR kompak berteriak "SETUJU". RUU Perampasan Aset siap diketok... Pertanyaannya: Mengapa mereka mendadak sepakat?',
    topGiantKeyword: 'DPR MENDADAK SEPAKAT',
    themeStyle: 'midnight-charcoal',
  },
  {
    id: 'hook-2',
    archetypeKey: 'odd_specific_detail',
    archetypeName: 'The Odd Specific Detail',
    hookText:
      'Mulai sekarang... rekening Anda bisa disita total negara tanpa perlu menunggu vonis penjara. Bukan cuma koruptor kakap... tapi juga pelaku investasi dan saham bodong.',
    topGiantKeyword: 'SITA TANPA VONIS',
    themeStyle: 'deep-marine-navy',
  },
  {
    id: 'hook-3',
    archetypeKey: 'cold_forensic_warning',
    archetypeName: 'The Cold Forensic Warning',
    hookText:
      'Ancaman hukuman mati tetap berlaku... Ditambah pasal perampasan aset tanpa proses peradilan pidana biasa. Ini adalah peringatan paling mematikan bagi koruptor di Indonesia.',
    topGiantKeyword: 'MISKIN ATAU MATI',
    themeStyle: 'midnight-charcoal',
  },
  {
    id: 'hook-4',
    archetypeKey: 'multi_motive_escalation',
    archetypeName: 'The Multi-Motive Escalation',
    hookText:
      'Delapan fraksi DPR... ribuan korban investasi bodong yang menanti keadilan... dan triliunan uang haram yang mengalir bebas. Semua berkumpul di satu ketukan palu kemarin siang.',
    topGiantKeyword: '8 FRAKSI & TRILIUNAN',
    themeStyle: 'deep-marine-navy',
  },
  {
    id: 'hook-5',
    archetypeKey: 'whispered_crime_scene',
    archetypeName: 'The Whispered Crime Scene',
    hookText:
      'Di ruang rapat Senayan kemarin siang... satu ketukan palu baru saja mengubah nasib ribuan aset gelap. Harta yang disembunyikan di luar negeri... kini bisa dirampas seketika.',
    topGiantKeyword: 'KETUKAN PALU SENAYAN',
    themeStyle: 'midnight-charcoal',
  },
];

async function main() {
  console.log('=== Pipeline Kumparan RUU Perampasan Aset (Keyframe & Voiceover) ===\n');

  const baseOutDir = path.resolve(process.cwd(), 'public', 'renders', 'hook-simulator', 'kumparan-ruu-perampasan-aset');
  fs.mkdirSync(baseOutDir, { recursive: true });

  // 1. Evaluasi & Cetak Skor HSI ke Console
  console.log('1. Mengkalkulasi Skor HSI 4 Pilar untuk 5 Varian Hook...');
  const evaluatedHooks = HOOK_VARIANTS.map((v) => {
    const evaluation = scoreHookCandidate({
      hookText: v.hookText,
      topGiantKeyword: v.topGiantKeyword,
      archetypeKey: v.archetypeKey,
      dossier: KUMPARAN_DOSSIER,
    });
    return { ...v, evaluation };
  });

  console.table(
    evaluatedHooks.map((h) => ({
      ID: h.id,
      Arketipe: h.archetypeName,
      HSI: `${h.evaluation.hookSuccessIndex} / 100`,
      'Retensi 3s': `${h.evaluation.predictedRetention3s}%`,
      Keyword: h.topGiantKeyword,
    }))
  );

  // 2. Menyiapkan Proyek HyperFrames untuk Render Keyframe Presisi Kumparan (1080x1920)
  console.log('\n2. Mengompilasi Template Keyframe Kumparan Presisi (9:16 - 1080x1920)...');
  const hfWorkspaceDir = path.resolve(process.cwd(), 'hyperframes-workspace', 'kumparan-ruu-perampasan-aset');
  fs.mkdirSync(hfWorkspaceDir, { recursive: true });

  // Tulis hyperframes.json
  fs.writeFileSync(
    path.join(hfWorkspaceDir, 'hyperframes.json'),
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

  // Tulis index.html sesuai Aturan Kumparan Presisi (Midnight Charcoal & Deep Marine Navy)
  const kumparanHtml = `<!doctype html>
<html lang="id" data-resolution="portrait">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1080, height=1920" />
  <title>Kumparan RUU Perampasan Aset - Keyframe Samples</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">
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
      font-family: 'Inter', sans-serif;
      background-color: #1C1C1E;
    }
    #root {
      width: 1080px;
      height: 1920px;
      position: relative;
      overflow: hidden;
    }
    .scene-view {
      position: absolute;
      inset: 0;
      width: 1080px;
      height: 1920px;
    }
    /* Safe Area Invariants: Top 160px, Bottom 280px, Horizontal 64px (Text margins: 144px) */
    .safe-area {
      position: absolute;
      top: 160px;
      bottom: 280px;
      left: 64px;
      right: 64px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      z-index: 10;
    }
    .text-container {
      margin: 0 80px; /* 64 + 80 = 144px text margin */
    }

    /* Pattern Engine: Dot Grid at Bottom 0, Height 440px */
    .p-dots-charcoal {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 440px;
      background-image: radial-gradient(circle, rgba(255, 255, 255, 0.12) 7px, transparent 8px);
      background-size: 40px 40px;
      z-index: 2;
    }
    .p-dots-navy {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 440px;
      background-image: radial-gradient(circle, rgba(255, 255, 255, 0.08) 7px, transparent 8px);
      background-size: 40px 40px;
      z-index: 2;
    }

    /* THEME 1: Midnight Charcoal (news.jpg) */
    .theme-charcoal {
      background-color: #1C1C1E;
      color: #FFFFFF;
    }
    .kicker-crimson {
      background-color: #E11D48;
      color: #FFFFFF;
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 26px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 12px 24px;
      display: inline-block;
      margin-bottom: 28px;
    }
    .divider-rule {
      width: 100%;
      height: 2px;
      background-color: #E5E5E5;
      margin: 28px 0;
    }
    .headline-charcoal {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 58px;
      line-height: 1.18;
      letter-spacing: -0.02em;
      color: #FFFFFF;
    }
    .highlight-yellow {
      color: #FFDE00;
    }
    .editorial-box {
      background: rgba(28, 28, 30, 0.95);
      border: 2px solid rgba(255, 255, 255, 0.15);
      padding: 36px 40px;
      position: relative;
    }
    .editorial-badge-stamp {
      position: absolute;
      top: -24px;
      right: 36px;
      background: #E11D48;
      color: #FFFFFF;
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 22px;
      letter-spacing: 0.1em;
      padding: 8px 20px;
      text-transform: uppercase;
      box-shadow: 0 8px 24px rgba(225, 29, 72, 0.5);
    }
    .subtext-charcoal {
      font-size: 30px;
      line-height: 1.45;
      color: rgba(255, 255, 255, 0.88);
      margin-top: 20px;
    }
    .giant-flash-charcoal {
      background: rgba(225, 29, 72, 0.15);
      border-left: 6px solid #E11D48;
      padding: 16px 24px;
      margin-top: 28px;
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 32px;
      letter-spacing: 0.05em;
      color: #FF5E7E;
    }

    /* THEME 2: Deep Marine Navy (diagram/explainer) */
    .theme-navy {
      background-color: #123A5E;
      color: #FFFFFF;
    }
    .title-box-white {
      background-color: #FFFFFF;
      color: #123A5E;
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 32px;
      letter-spacing: 0.05em;
      padding: 10px 24px;
      display: inline-block;
      text-transform: uppercase;
    }
    .title-box-amber {
      background-color: #FFB800;
      color: #141414;
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 32px;
      letter-spacing: 0.05em;
      padding: 10px 24px;
      display: inline-block;
      text-transform: uppercase;
      margin-left: 8px;
    }
    .diagram-card {
      background: rgba(18, 58, 94, 0.95);
      border: 2px solid rgba(255, 255, 255, 0.7);
      padding: 40px;
      margin-top: 32px;
      position: relative;
    }
    .headline-navy {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 56px;
      line-height: 1.2;
      color: #FFFFFF;
      margin-top: 24px;
    }
    .stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 10px 20px;
      margin-top: 20px;
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 24px;
      color: #FFB800;
    }
    .stat-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #FFFFFF;
      border: 2px solid #E11D48;
      color: #E11D48;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 900;
    }
    .brand-footer {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 22px;
      letter-spacing: 0.2em;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-footer::before {
      content: '';
      display: inline-block;
      width: 14px;
      height: 14px;
      background: #E11D48;
    }
  </style>
</head>
<body>
  <div id="root" data-composition-id="kumparan-keyframe-gallery" data-start="0" data-duration="6">
    
    <!-- SCENE 1: Midnight Charcoal (At 1.0s) -->
    <section class="scene-view theme-charcoal" data-start="0" data-duration="3">
      <div class="p-dots-charcoal"></div>
      <div class="safe-area">
        <div>
          <span class="kicker-crimson">KUMPARAN NEWS | RUU PERAMPASAN ASET</span>
          <div class="text-container">
            <h1 class="headline-charcoal">
              DPR & PEMERINTAH SEPAKAT:<br />
              <span class="highlight-yellow">RUU PERAMPASAN ASET</span><br />
              DIBAWA KE PARIPURNA
            </h1>
          </div>
        </div>

        <div class="text-container">
          <div class="editorial-box">
            <div class="editorial-badge-stamp">TINGKAT I: SEPAKAT</div>
            <p class="subtext-charcoal">
              Bertahun-tahun alot di Senayan... Seluruh 8 fraksi DPR mendadak serentak menyatakan setuju menyita aset tanpa vonis pidana.
            </p>
            <div class="giant-flash-charcoal">
              ⚡ FLASH: DPR MENDADAK SEPAKAT
            </div>
          </div>
        </div>

        <div class="text-container">
          <div class="divider-rule"></div>
          <div class="brand-footer">KUMPARAN EXPLAINER • 2026</div>
        </div>
      </div>
    </section>

    <!-- SCENE 2: Deep Marine Navy (At 4.0s) -->
    <section class="scene-view theme-navy" data-start="3" data-duration="3">
      <div class="p-dots-navy"></div>
      <div class="safe-area">
        <div>
          <div>
            <span class="title-box-white">KEBIJAKAN HUKUM</span>
            <span class="title-box-amber">SITA TANPA VONIS</span>
          </div>
          <div class="text-container">
            <h1 class="headline-navy">
              HARTA GELAP BISA DISITA<br />
              SEBELUM KETUKAN VONIS!
            </h1>
          </div>
        </div>

        <div class="text-container">
          <div class="diagram-card">
            <div class="stat-pill">
              <span class="stat-circle">!</span>
              MEKANISME NON-CONVICTION BASED
            </div>
            <p class="subtext-charcoal" style="margin-top: 18px;">
              Bukan cuma koruptor kakap... Pelaku investasi bodong, saham fiktif, dan kejahatan finansial digital kini dibekukan seketika.
            </p>
            <div class="giant-flash-charcoal" style="background: rgba(255, 184, 0, 0.15); border-color: #FFB800; color: #FFD15C;">
              ⚖️ SASARAN: KORUPSI & INVESTASI BODONG
            </div>
          </div>
        </div>

        <div class="text-container">
          <div class="divider-rule" style="background-color: rgba(255, 255, 255, 0.4);"></div>
          <div class="brand-footer" style="color: rgba(255, 255, 255, 0.7);">KUMPARAN POLICY • 2026</div>
        </div>
      </div>
    </section>

  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(hfWorkspaceDir, 'index.html'), kumparanHtml, 'utf8');

  // 3. Tangkap Snapshot Keyframe Presisi dengan hyperframes snapshot
  console.log('\n3. Menjalankan hyperframes snapshot untuk menangkap Keyframe 1080x1920...');
  const snapshotOutDir = path.resolve(hfWorkspaceDir, 'snapshots');
  fs.mkdirSync(snapshotOutDir, { recursive: true });

  try {
    execSync(
      `npx hyperframes snapshot "${hfWorkspaceDir}" --at 1.0,4.0 --no-end -o "${snapshotOutDir}"`,
      { stdio: 'inherit' }
    );
  } catch (err: any) {
    console.warn('⚠️ Hyperframes snapshot error:', err.message);
  }

  // File snapshot yang dihasilkan:
  // at 1.0s -> Scene 1 (Midnight Charcoal)
  // at 4.0s -> Scene 2 (Deep Marine Navy)
  const snap1 = path.join(snapshotOutDir, 'at-1s.png');
  const snap2 = path.join(snapshotOutDir, 'at-4s.png');

  // Fallback nama jika hyperframes memakai frame-00 / frame-01
  const frame00 = path.join(snapshotOutDir, 'frame-00-at-1s.png');
  const frame01 = path.join(snapshotOutDir, 'frame-01-at-4s.png');

  const resolvedSnap1 = fs.existsSync(snap1) ? snap1 : (fs.existsSync(frame00) ? frame00 : '');
  const resolvedSnap2 = fs.existsSync(snap2) ? snap2 : (fs.existsSync(frame01) ? frame01 : '');

  console.log('Snapshot 1 (Midnight Charcoal):', resolvedSnap1);
  console.log('Snapshot 2 (Deep Marine Navy):', resolvedSnap2);

  // 4. Salin Keyframe ke direktori output publik
  const hook1Dir = path.join(baseOutDir, 'hook-1');
  const hook2Dir = path.join(baseOutDir, 'hook-2');
  fs.mkdirSync(hook1Dir, { recursive: true });
  fs.mkdirSync(hook2Dir, { recursive: true });

  const finalKeyframe1 = path.join(hook1Dir, 'hook-visual.jpg');
  const finalKeyframe2 = path.join(hook2Dir, 'hook-visual.jpg');

  if (resolvedSnap1 && fs.existsSync(resolvedSnap1)) {
    execFileSync(ffmpeg, ['-y', '-i', resolvedSnap1, finalKeyframe1]);
    fs.copyFileSync(resolvedSnap1, path.join(hook1Dir, 'keyframe-midnight-charcoal.png'));
  }
  if (resolvedSnap2 && fs.existsSync(resolvedSnap2)) {
    execFileSync(ffmpeg, ['-y', '-i', resolvedSnap2, finalKeyframe2]);
    fs.copyFileSync(resolvedSnap2, path.join(hook2Dir, 'keyframe-deep-marine-navy.png'));
  }

  // 5. Komposisi Video Preview 5 Detik untuk Hook 1 & Hook 2
  console.log('\n4. Mengomposisi Video Snippet 5 Detik dengan Voiceover Charon...');
  const audioHook1 = path.join(hook1Dir, 'hook-audio.wav');
  const videoHook1 = path.join(hook1Dir, 'hook-preview.mp4');

  if (fs.existsSync(finalKeyframe1) && fs.existsSync(audioHook1)) {
    console.log('Rendering 5s preview snippet Hook 1...');
    execFileSync(ffmpeg, [
      '-y',
      '-loop', '1',
      '-i', finalKeyframe1,
      '-i', audioHook1,
      '-t', '5.5',
      '-filter_complex',
      '[0:v]scale=1080:1920,zoompan=z=\'min(zoom+0.0006,1.04)\':x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':d=165:s=1080x1920:fps=30[bg];' +
      '[bg]drawbox=x=80:y=180:w=920:h=90:color=black@0.75:t=fill,' +
      'drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial\\ Black.ttf:text=\'⚡ DPR MENDADAK SEPAKAT\':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=202,' +
      'drawbox=x=80:y=1640:w=920:h=120:color=black@0.85:t=fill,' +
      'drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial\\ Bold.ttf:text=\'Bertahun-tahun alot... Tiba-tiba DPR teriak SETUJU!\':fontcolor=yellow:fontsize=36:x=(w-text_w)/2:y=1680[v]',
      '-map', '[v]',
      '-map', '1:a',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '22',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      videoHook1,
    ]);
    console.log('✅ Video Hook 1 MP4 berhasil dibuat:', videoHook1);
  }

  const audioHook2 = path.join(hook2Dir, 'hook-audio.wav');
  const videoHook2 = path.join(hook2Dir, 'hook-preview.mp4');

  if (fs.existsSync(finalKeyframe2) && fs.existsSync(audioHook2)) {
    console.log('Rendering 5s preview snippet Hook 2...');
    execFileSync(ffmpeg, [
      '-y',
      '-loop', '1',
      '-i', finalKeyframe2,
      '-i', audioHook2,
      '-t', '5.5',
      '-filter_complex',
      '[0:v]scale=1080:1920,zoompan=z=\'min(zoom+0.0006,1.04)\':x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':d=165:s=1080x1920:fps=30[bg];' +
      '[bg]drawbox=x=80:y=180:w=920:h=90:color=black@0.75:t=fill,' +
      'drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial\\ Black.ttf:text=\'⚖️ SITA TANPA VONIS\':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=202,' +
      'drawbox=x=80:y=1640:w=920:h=120:color=black@0.85:t=fill,' +
      'drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial\\ Bold.ttf:text=\'Rekening disita tanpa nunggu vonis penjara!\':fontcolor=yellow:fontsize=36:x=(w-text_w)/2:y=1680[v]',
      '-map', '[v]',
      '-map', '1:a',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '22',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      videoHook2,
    ]);
    console.log('✅ Video Hook 2 MP4 berhasil dibuat:', videoHook2);
  }

  console.log('\n=== PIPELINE SELESAI DENGAN SUKSES ===');
}

main().catch(console.error);
