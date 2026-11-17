import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import { groupWordsIntoPhrases, CaptionWord } from '../lib/orchestrator/audio/noirAudioPipeline';
import { generateNoirHyperframesHtml } from '../lib/orchestrator/video/noirVideoTemplate';
import { renderHyperframes } from '../lib/hyperframes/renderEngine';

// Force IPv4 first to prevent Node.js 22 fetch timeout on macOS
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const PROJECT_ID = 'eno-farihah-tragedi-cangkul';
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public', 'renders', PROJECT_ID);
const HF_WORKSPACE = path.join(ROOT_DIR, 'hyperframes-workspace', PROJECT_ID);
const KEYFRAMES_DIR = path.join(PUBLIC_DIR, 'keyframes');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'audio-short');

function resolveFfmpegBin(): { ffmpeg: string; ffprobe: string } {
  const localFfmpeg = path.resolve(process.cwd(), 'bin', 'ffmpeg');
  const localFfprobe = path.resolve(process.cwd(), 'bin', 'ffprobe');
  const ffmpeg = fs.existsSync(localFfmpeg) ? localFfmpeg : 'ffmpeg';
  const ffprobe = fs.existsSync(localFfprobe) ? localFfprobe : 'ffprobe';
  return { ffmpeg, ffprobe };
}

const { ffmpeg, ffprobe } = resolveFfmpegBin();

// 11 High-Impact Sentences (~90 Seconds / 1.5 Minutes Total)
const SENTENCES = [
  {
    shot: 1,
    id: 's1',
    text: 'Pintu kamar nomor tujuh belas terkunci rapat dengan gembok dari arah luar, tapi di dalamnya... sebuah tragedi yang mengguncang nurani bangsa baru saja terjadi.',
  },
  {
    shot: 2,
    id: 's2',
    text: 'Dua rekan kerja curiga korban tak kunjung keluar mes untuk bekerja, hingga setelah pintu didobrak paksa, jasad karyawati berusia delapan belas tahun ditemukan tak bernyawa.',
  },
  {
    shot: 3,
    id: 's3',
    text: 'Di samping kasur, polisi mendapati benda yang sangat ganjil: sebuah cangkul proyek bergagang kayu panjang yang berlumuran darah pekat.',
  },
  {
    shot: 4,
    id: 's4',
    text: 'Tim Identifikasi Inafis menyisir lokasi kejadian, menemukan jejak sidik jari pada kayu cangkul dan tapak kaki berlumpur mengarah ke luar rawa-rawa Dadap.',
  },
  {
    shot: 5,
    id: 's5',
    text: 'Titik terang bermula dari riwayat pesan singkat tengah malam pukul dua puluh tiga lewat tiga puluh, dari seorang remaja pria berinisial RAL.',
  },
  {
    shot: 6,
    id: 's6',
    text: 'Ajakan asusila RAL ditolak mentah-mentah oleh korban, memicu amarah sang remaja yang kemudian berpapasan dengan dua pria lain yang memendam sakit hati mendalam.',
  },
  {
    shot: 7,
    id: 's7',
    text: 'Tiga pria yang awalnya tak saling kenal ini bersatu dalam dendam, menyambar cangkul dari bedeng proyek bangunan dan mendobrak masuk kembali ke kamar mes.',
  },
  {
    shot: 8,
    id: 's8',
    text: 'Di dalam kamar yang sunyi, penganiayaan keji dilakukan secara membabi buta tanpa ada yang sempat mendengar jeritan minta tolong sang karyawati.',
  },
  {
    shot: 9,
    id: 's9',
    text: 'Usai melampiaskan kebiadaban, para pelaku merampas ponsel korban, mencuci tangan di parit, dan membuang pakaian berlumuran darah ke rawa Dadap.',
  },
  {
    shot: 10,
    id: 's10',
    text: 'Namun jejak mereka tak pernah hilang: Tim Cyber Crime Polda Metro Jaya berhasil melacak koordinat pemancar BTS saat ponsel korban diaktifkan kembali.',
  },
  {
    shot: 11,
    id: 's11',
    text: 'Kurang dari dua puluh empat jam, Tim Resmob meringkus ketiga pelaku, hingga Majelis Hakim Pengadilan Negeri Tangerang menjatuhkan vonis hukuman mati.',
  },
];

// Rapid-Fire Narrative Frame Mapping (Cuts every 1.5s - 2.5s for Rigid Pacing)
// Uses existing 21 high-detail Flow MCP keyframes
const RAPID_SCENE_SEQUENCE = [
  // Scene 1: Locked-Room Hook (0s - 10s)
  'shot-02.jpg', // Gembok pintu kamar 17
  'shot-01.jpg', // Barak mes berkabut
  'shot-02.jpg', // Macro gembok besi
  'shot-03.jpg', // Pintu terbuka & lorong
  // Scene 2: Dobrak & Penemuan Jasad (10s - 20s)
  'shot-03.jpg', // Pintu didobrak paksa
  'shot-04.jpg', // Detektif & olah TKP
  'shot-03.jpg', // Sudut kamar 17
  'shot-04.jpg', // Lampu UV ALS Inafis
  // Scene 3: Bukti Cangkul Proyek (20s - 28s)
  'shot-05.jpg', // Cangkul bukti 01
  'shot-06.jpg', // Kaca pembesar sidik jari gagang
  'shot-05.jpg', // Bilah besi berdarah
  'shot-06.jpg', // Garis ukur forensik merah
  // Scene 4: Jejak Kaki & Rawa (28s - 36s)
  'shot-07.jpg', // Jejak kaki berlumpur
  'shot-08.jpg', // Kotak HP kosong & kabel charger
  'shot-07.jpg', // Arah lorong menuju rawa
  'shot-08.jpg', // Meja rias berdebu
  // Scene 5: SMS 23.30 & Jam Dinding (36s - 44s)
  'shot-09.jpg', // Layar HP SMS 23.30
  'shot-10.jpg', // Siluet RAL lampu jalan
  'shot-09.jpg', // Jarum jam 23.30
  'shot-10.jpg', // Wajah dingin bertopi
  // Scene 6: Penolakan & Konspirasi (44s - 53s)
  'shot-11.jpg', // Pintu tertutup menolak
  'shot-12.jpg', // Sketsa tersangka Arifin
  'shot-13.jpg', // Sketsa tersangka Imam
  'shot-14.jpg', // 3 siluet berbisik di gang
  // Scene 7: Sambaran Cangkul & Dobrak (53s - 61s)
  'shot-15.jpg', // Tangan menyambar gagang cangkul
  'shot-14.jpg', // Bayangan 3 pria
  'shot-15.jpg', // Bilah besi berkilau
  'shot-16.jpg', // Jendela teralis kamar 17
  // Scene 8: Eksekusi Kamar Sunyi (61s - 70s)
  'shot-16.jpg', // Siluet mencekam di jendela
  'shot-03.jpg', // Kamar 17 gelap
  'shot-16.jpg', // Malam kelam di Kosambi
  'shot-05.jpg', // Cangkul tergeletak
  // Scene 9: Buang Barang Bukti ke Rawa (70s - 78s)
  'shot-17.jpg', // 3 orang lari ke rawa-rawa
  'shot-07.jpg', // Jejak kaki di parit
  'shot-17.jpg', // Melempar pakaian berdarah
  'shot-08.jpg', // Ponsel raib
  // Scene 10: Cyber Crime Tracking BTS (78s - 86s)
  'shot-18.jpg', // Radar BTS Cyber Crime
  'shot-18.jpg', // Peta koordinat Tangerang
  'shot-19.jpg', // Tim Resmob bersiap
  'shot-18.jpg', // Sinyal terdeteksi
  // Scene 11: Penggerebekan & Vonis Mati (86s - end)
  'shot-19.jpg', // Penggerebekan subuh
  'shot-19.jpg', // Tersangka diborgol
  'shot-20.jpg', // Palu vonis hakim PN Tangerang
  'shot-20.jpg', // Timbangan keadilan vonis mati
];

async function main() {
  console.log('========================================================================');
  console.log('  ⚡ RE-CUT 1.5 MENIT: RIGID PACING (1.5-2.5s CUTS) & IMMEDIATE COVER VO');
  console.log('     (Tragedi Cangkul Eno Farihah • 40 Rapid Beats • Charon VO)');
  console.log('========================================================================\n');

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(KEYFRAMES_DIR, { recursive: true });
  fs.mkdirSync(path.join(HF_WORKSPACE, 'assets'), { recursive: true });

  // 1. Prepare accelerated Voice Over (1.08x tempo for punchy ~90s delivery)
  console.log('1. Memproses Voice Over Charon (Pacing Cepat ~90s, Mulai Langsung dari Cover)...');
  const sentenceTimings: Array<{ id: string; shot: number; text: string; wavPath: string; durationSec: number; start: number; end: number }> = [];

  let currentCursor = 0.08; // VO starts immediately at 0.08s (on Cover Hook)

  for (let i = 0; i < SENTENCES.length; i++) {
    const s = SENTENCES[i];
    const rawWav = path.join(AUDIO_DIR, `short-sentence-${s.shot}.wav`);
    const punchyWav = path.join(AUDIO_DIR, `punchy-sentence-${s.shot}.wav`);

    if (!fs.existsSync(rawWav)) {
      throw new Error(`Raw wav tidak ditemukan: ${rawWav}`);
    }

    // Process with slight speed-up (atempo=1.08) for tighter, non-laggy speech
    execFileSync(ffmpeg, [
      '-y',
      '-i', rawWav,
      '-filter:a', 'atempo=1.08',
      punchyWav,
    ]);

    const durStr = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', punchyWav]).toString().trim();
    const durationSec = parseFloat(durStr) || 8.0;

    const start = Number(currentCursor.toFixed(2));
    const end = Number((currentCursor + durationSec).toFixed(2));

    sentenceTimings.push({
      id: s.id,
      shot: s.shot,
      text: s.text,
      wavPath: punchyWav,
      durationSec,
      start,
      end,
    });

    console.log(`   [Kalimat ${i + 1}/11] (${durationSec.toFixed(2)}s) -> Timing: ${start}s - ${end}s`);
    currentCursor = end + 0.20; // 200ms crisp dramatic pause
  }

  // Prepend minimal 0.08s buffer so player codecs don't eat the first phoneme
  const introSilenceWav = path.join(AUDIO_DIR, 'intro-silence.wav');
  execFileSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '0.08', introSilenceWav]);

  // Inter-sentence silence
  const silenceWav = path.join(AUDIO_DIR, 'silence.wav');
  execFileSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '0.20', silenceWav]);

  const concatListTxt = path.join(AUDIO_DIR, 'concat_vo.txt');
  let concatLines = `file '${introSilenceWav}'\n`;
  sentenceTimings.forEach((st) => {
    concatLines += `file '${st.wavPath}'\n`;
    concatLines += `file '${silenceWav}'\n`;
  });
  fs.writeFileSync(concatListTxt, concatLines);

  const cleanVoPath = path.join(AUDIO_DIR, 'clean-vo.mp3');
  execFileSync(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', concatListTxt, '-c:a', 'libmp3lame', '-b:a', '192k', cleanVoPath]);

  const totalDuration = Number((currentCursor + 0.4).toFixed(2));
  console.log(`\n✅ Voice Over Selesai: Total Durasi ${totalDuration}s (~${(totalDuration / 60).toFixed(1)} menit) di ${cleanVoPath}`);

  // 2. Build 42 Rapid-Fire Visual Beats (Cutting every 1.8s - 2.5s)
  console.log('\n2. Membangun 42 Rapid-Fire Visual Beats (1.8s - 2.5s per cut)...');
  const coverDuration = 1.30;
  const remainingTime = totalDuration - coverDuration;
  const numBeats = RAPID_SCENE_SEQUENCE.length;
  const avgBeatDuration = remainingTime / numBeats;

  const shotTimings: Array<{ shot: number; startSec: number; endSec: number; durationSec: number; imageFile: string }> = [];
  const transitionTimes: number[] = [1.3]; // Cut from Cover to Beat 1
  const shotImages: Array<{ shot: number; imagePath: string }> = [];

  let beatCursor = coverDuration;
  for (let b = 0; b < numBeats; b++) {
    const shotNum = b + 1;
    const isLast = b === numBeats - 1;
    const bStart = Number(beatCursor.toFixed(2));
    const bEnd = isLast ? totalDuration : Number((beatCursor + avgBeatDuration).toFixed(2));
    const bDur = Number((bEnd - bStart).toFixed(2));

    const sourceImageName = RAPID_SCENE_SEQUENCE[b];
    const sourceImagePath = path.join(KEYFRAMES_DIR, sourceImageName);

    // Save as rapid-beat asset
    const beatAssetName = `beat-${String(shotNum).padStart(2, '0')}.jpg`;
    const beatPub = path.join(KEYFRAMES_DIR, beatAssetName);
    const beatHf = path.join(HF_WORKSPACE, 'assets', beatAssetName);

    if (fs.existsSync(sourceImagePath)) {
      fs.copyFileSync(sourceImagePath, beatPub);
      fs.copyFileSync(sourceImagePath, beatHf);
    }

    shotImages.push({ shot: shotNum, imagePath: beatPub });

    shotTimings.push({
      shot: shotNum,
      startSec: bStart,
      endSec: bEnd,
      durationSec: bDur,
      imageFile: beatAssetName,
    });

    if (bStart > 0.1 && !transitionTimes.includes(bStart)) {
      transitionTimes.push(bStart);
    }

    beatCursor = bEnd;
  }

  transitionTimes.sort((a, b) => a - b);
  console.log(`   Dihasilkan ${shotTimings.length} visual beats! (Rata-rata ${avgBeatDuration.toFixed(2)} detik per cut)`);

  // 3. Mixing Master Audio (VO + Looped BGM ducked 20% + Dynamic SFX Glitches)
  console.log('\n3. Mixing Audio Master Track...');
  const sfxPath = path.join(ROOT_DIR, 'public', 'renders', 'mujianto-serial-killer', 'audio-chunks', 'forensic-glitch-sfx.wav');
  const localBgm = path.join(ROOT_DIR, 'public', 'renders', 'mujianto-serial-killer', 'bgm-crime-tension.mp3');
  const bgmFadeOutStart = Math.max(0, totalDuration - 2.5);

  // Trigger SFX on major narrative scene transitions
  const majorGlitchTimes = [1.3, 10.0, 20.0, 28.0, 36.0, 44.0, 53.0, 61.0, 70.0, 78.0, 86.0].filter((t) => t < totalDuration - 2.0);

  let filterStr = `[0:a]volume=1.0[vo];[2:a]volume=0.20,afade=t=in:ss=0:d=1.5,afade=t=out:st=${bgmFadeOutStart.toFixed(1)}:d=2.5[bgm_bed];`;
  const delayedInputs: string[] = [];

  majorGlitchTimes.forEach((t, i) => {
    const delayMs = Math.round(t * 1000);
    filterStr += `[1:a]adelay=${delayMs}|${delayMs},volume=0.60[sfx_${i}];`;
    delayedInputs.push(`[sfx_${i}]`);
  });

  filterStr += `[vo][bgm_bed]${delayedInputs.join('')}amix=inputs=${majorGlitchTimes.length + 2}:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11[out]`;

  const masterAudioPath = path.join(PUBLIC_DIR, 'master-audio.mp3');
  execFileSync(ffmpeg, [
    '-y',
    '-i', cleanVoPath,
    '-i', sfxPath,
    '-stream_loop', '-1',
    '-i', localBgm,
    '-filter_complex', filterStr,
    '-map', '[out]',
    '-t', `${totalDuration.toFixed(2)}`,
    '-c:a', 'libmp3lame',
    '-b:a', '192k',
    masterAudioPath,
  ]);
  console.log(`✅ Master Audio Tersimpan: ${masterAudioPath}`);

  // 4. Calculate word timings for discrete karaoke captions
  console.log('\n4. Menghitung Word Timings & Discrete Phrases (Maks 4 kata)...');
  const allWords: CaptionWord[] = [];
  sentenceTimings.forEach((st) => {
    const rawWords = st.text.split(/\s+/).filter(Boolean);
    const weights = rawWords.map((w) => Math.max(2, w.length) + (/[.,;]/.test(w) ? 3 : 0));
    const totalW = weights.reduce((a, b) => a + b, 0);
    const available = st.durationSec;
    let wordCursor = st.start;
    rawWords.forEach((w, widx) => {
      const wDur = (weights[widx] / totalW) * available;
      const wStart = wordCursor;
      const wEnd = wordCursor + wDur;
      wordCursor = wEnd;
      allWords.push({
        word: w,
        start: Number(wStart.toFixed(2)),
        end: Number(wEnd.toFixed(2)),
      });
    });
  });

  const phrases = groupWordsIntoPhrases(allWords, 4);
  console.log(`   Dihasilkan ${allWords.length} kata, dikelompokkan ke dalam ${phrases.length} frasa pendek.`);

  // Save storyboard data
  const storyboardData = {
    title: 'MISTERI GEMBOK KAMAR 17 - Tragedi Eno Farihah (Rigid 1.5-2.5s Cut)',
    totalDurationSec: totalDuration,
    transitionTimes,
    shotTimings,
    sentences: sentenceTimings,
    phrases,
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, 'storyboard-data.json'), JSON.stringify(storyboardData, null, 2));

  // 5. Ensure Cover Image is in place
  const coverPub = path.join(KEYFRAMES_DIR, 'cover-shot-00.jpg');
  const coverHf = path.join(HF_WORKSPACE, 'assets', 'cover-shot-00.jpg');
  if (fs.existsSync(coverPub)) {
    fs.copyFileSync(coverPub, coverHf);
  }

  // 6. Generate HyperFrames index.html & hyperframes.json
  console.log('\n5. Generating HyperFrames Composition (42 Rapid Beats, HTML + GSAP)...');
  generateNoirHyperframesHtml({
    jobId: PROJECT_ID,
    title: 'MISTERI GEMBOK KAMAR 17 - Tragedi Eno Farihah',
    totalDurationSec: totalDuration,
    coverImagePath: coverPub,
    shotImages,
    shotTimings,
    phrases,
    outputDir: HF_WORKSPACE,
  });

  console.log(`✅ HyperFrames Composition berhasil di-generate di ${HF_WORKSPACE}`);

  // 7. Render Video Timeline dengan HyperFrames Engine (30fps)
  console.log(`\n6. Rendering Video dengan HyperFrames Engine (1080x1920 @ 30fps, ${totalDuration}s)...`);
  const tempVideoPath = path.join(PUBLIC_DIR, 'temp-visual-timeline.mp4');
  const finalVideoPath = path.join(PUBLIC_DIR, 'eno-farihah-final.mp4');

  const startTime = Date.now();
  await renderHyperframes({
    projectDir: HF_WORKSPACE,
    outputPath: tempVideoPath,
    fps: 30,
    onProgress: (p) => process.stdout.write(p),
  });

  const renderTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n✅ Visual render selesai dalam ${renderTimeSec} detik!`);

  // 8. Multiplexing Audio Master Track dengan FFmpeg
  console.log('\n7. Multiplexing Audio Master Track dengan FFmpeg...');
  execFileSync(ffmpeg, [
    '-y',
    '-i', tempVideoPath,
    '-i', masterAudioPath,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    finalVideoPath,
  ]);

  if (fs.existsSync(tempVideoPath)) {
    fs.unlinkSync(tempVideoPath);
  }

  console.log(`✅ Video Final Berhasil Dibuat: ${finalVideoPath}`);

  // 9. Ekstraksi Verifikasi Frame Snapshots
  console.log('\n8. Mengekstrak snapshot verifikasi visual & autocaption...');
  const snapshots = [
    { sec: '0.8', name: 'preview-01s-hook.jpg' },
    { sec: '5.0', name: 'preview-05s-locked-room.jpg' },
    { sec: '22.0', name: 'preview-22s-cangkul.jpg' },
    { sec: '48.0', name: 'preview-50s-tiga-pelaku.jpg' },
    { sec: '75.0', name: 'preview-75s-cyber-bts.jpg' },
  ];

  for (const s of snapshots) {
    const outImg = path.join(PUBLIC_DIR, s.name);
    execFileSync(ffmpeg, [
      '-y',
      '-ss', s.sec,
      '-i', finalVideoPath,
      '-vframes', '1',
      '-q:v', '2',
      outImg,
    ]);
    console.log(`   Snapshot tersimpan: ${outImg}`);
  }

  // 10. Update Review Portal with Viral Social Media Distribution Kit
  console.log('\n9. Memperbarui Review Portal & Social Media Distribution Kit...');
  const portalHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MISTERI GEMBOK KAMAR 17 | Tragedi Cangkul Eno Farihah</title>
  <style>
    :root {
      --bg: #0D1117;
      --card: #161B22;
      --accent: #C59B27;
      --crimson: #8B2635;
      --text: #EDEDED;
      --text-muted: #8B949E;
      --border: #30363D;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 30px;
    }
    .tag {
      display: inline-block;
      background: var(--crimson);
      color: #FFF;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 2px;
      padding: 4px 12px;
      border-radius: 4px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #FFF;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 16px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .grid {
      display: grid;
      grid-template-columns: 480px 1fr;
      gap: 40px;
      margin-bottom: 50px;
    }
    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
    }
    .video-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    video {
      width: 100%;
      aspect-ratio: 9 / 16;
      display: block;
      background: #000;
    }
    .info-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 30px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .stat-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .stat-box {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .stat-val {
      font-size: 20px;
      font-weight: 800;
      color: var(--accent);
    }
    .stat-lbl {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-top: 4px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #FFF;
      border-left: 3px solid var(--accent);
      padding-left: 10px;
      margin-bottom: 12px;
    }
    .caption-box {
      background: #0D1117;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      font-family: monospace;
      font-size: 13px;
      white-space: pre-wrap;
      position: relative;
    }
    .copy-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: var(--accent);
      color: #000;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .copy-btn:hover { opacity: 0.85; }
    .gallery {
      margin-top: 40px;
    }
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .gallery-item {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .gallery-item img {
      width: 100%;
      aspect-ratio: 9 / 16;
      object-fit: cover;
      display: block;
    }
    .gallery-caption {
      padding: 8px;
      font-size: 10px;
      color: var(--text-muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <span class="tag">RIGID FAST-PACED RE-CUT • 1.5-2.5s PER SHOT</span>
      <h1>MISTERI GEMBOK KAMAR 17</h1>
      <p class="subtitle">Tragedi Cangkul Mes Karyawati Dadap, Kosambi, Tangerang</p>
    </header>

    <div class="grid">
      <div class="video-card">
        <video controls playsinline preload="metadata">
          <source src="eno-farihah-final.mp4" type="video/mp4">
          Browser Anda tidak mendukung tag video.
        </video>
      </div>

      <div class="info-card">
        <div class="stat-row">
          <div class="stat-box">
            <div class="stat-val">${totalDuration}s</div>
            <div class="stat-lbl">Durasi Video</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${shotTimings.length} Beats</div>
            <div class="stat-lbl">Rapid Cuts (1.8s)</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">Frame 0s</div>
            <div class="stat-lbl">VO Start</div>
          </div>
        </div>

        <div>
          <h2 class="section-title">DISTRIBUSI SOSMED (VIRAL HIGH-RETENTION CAPTIONS)</h2>
          
          <p style="font-size: 12px; color: var(--accent); margin-bottom: 6px; font-weight: 600;">📱 FORMAT TIKTOK / INSTAGRAM REELS (HOOK KUAT):</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>Pintu kamar 17 terkunci rapat dari luar, tapi di dalamnya... sebuah tragedi paling mengguncang nurani bangsa baru saja terjadi. 🚪🔐🩸

Bagaimana mungkin 3 pria yang awalnya tak saling kenal bisa bersekongkol melakukan aksi sekeji ini hanya dalam hitungan menit? Simak rekaman forensik olah TKP Inafis hingga pelacakan sinyal BTS yang menjerat para pelaku ke vonis mati!

#TrueCrimeIndonesia #EnoFarihah #TragediCangkul #MisteriKamar17 #DadapTangerang #KasusKriminal #Forensik #CrimeInvestigation #Detikcom #fyp #viral</span>
          </div>

          <p style="font-size: 12px; color: var(--accent); margin-top: 14px; margin-bottom: 6px; font-weight: 600;">📺 FORMAT YOUTUBE SHORTS (HIGH CTR):</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>MISTERI GEMBOK KAMAR 17: Tragedi Teror di Mes Karyawati Tangerang 🚨

Pintu terkunci gembok dari luar, barang bukti cangkul ganjil berlumuran darah, dan jejak pelacakan sinyal ponsel BTS yang menguak konspirasi 3 pelaku dalam kurun waktu kurang dari 24 jam.

#Shorts #TrueCrime #EnoFarihah #InvestigasiKriminal #ForensikKepolisian #TragediCangkul</span>
          </div>
        </div>
      </div>
    </div>

    <div class="gallery">
      <h2 class="section-title">TIMELINE 42 VISUAL BEATS (CUT SETIAP 1.8 - 2.5 DETIK)</h2>
      <div class="gallery-grid">
        <div class="gallery-item">
          <img src="keyframes/cover-shot-00.jpg" alt="Cover Hook">
          <div class="gallery-caption">Cover (0s - 1.3s)</div>
        </div>
        ${shotTimings
          .map(
            (st) => `
        <div class="gallery-item">
          <img src="keyframes/${st.imageFile}" alt="Beat ${st.shot}">
          <div class="gallery-caption">Beat ${String(st.shot).padStart(2, '0')} (${st.durationSec}s)</div>
        </div>`
          )
          .join('')}
      </div>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), portalHtml);
  console.log(`✅ Review Portal Terpublikasi: ${path.join(PUBLIC_DIR, 'index.html')}`);

  console.log('\n========================================================================');
  console.log('🎉 RIGID FAST-PACED RE-CUT SELESAI!');
  console.log(`👉 Buka Review Portal: http://localhost:3000/renders/${PROJECT_ID}/index.html`);
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Error in Pipeline:', err);
  process.exit(1);
});
