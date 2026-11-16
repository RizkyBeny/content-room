import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import { flowClient } from '../lib/flowMcp/client';
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
    sourceImage: 'shot-02.jpg',
  },
  {
    shot: 2,
    id: 's2',
    text: 'Dua rekan kerja curiga korban tak kunjung keluar mes untuk bekerja, hingga setelah pintu didobrak paksa, jasad karyawati berusia delapan belas tahun ditemukan tak bernyawa.',
    sourceImage: 'shot-03.jpg',
  },
  {
    shot: 3,
    id: 's3',
    text: 'Di samping kasur, polisi mendapati benda yang sangat ganjil: sebuah cangkul proyek bergagang kayu panjang yang berlumuran darah pekat.',
    sourceImage: 'shot-05.jpg',
  },
  {
    shot: 4,
    id: 's4',
    text: 'Tim Identifikasi Inafis menyisir lokasi kejadian, menemukan jejak sidik jari pada kayu cangkul dan tapak kaki berlumpur mengarah ke luar rawa-rawa Dadap.',
    sourceImage: 'shot-06.jpg',
  },
  {
    shot: 5,
    id: 's5',
    text: 'Titik terang bermula dari riwayat pesan singkat tengah malam pukul dua puluh tiga lewat tiga puluh, dari seorang remaja pria berinisial RAL.',
    sourceImage: 'shot-09.jpg',
  },
  {
    shot: 6,
    id: 's6',
    text: 'Ajakan asusila RAL ditolak mentah-mentah oleh korban, memicu amarah sang remaja yang kemudian berpapasan dengan dua pria lain yang memendam sakit hati mendalam.',
    sourceImage: 'shot-11.jpg',
  },
  {
    shot: 7,
    id: 's7',
    text: 'Tiga pria yang awalnya tak saling kenal ini bersatu dalam dendam, menyambar cangkul dari bedeng proyek bangunan dan mendobrak masuk kembali ke kamar mes.',
    sourceImage: 'shot-15.jpg',
  },
  {
    shot: 8,
    id: 's8',
    text: 'Di dalam kamar yang sunyi, penganiayaan keji dilakukan secara membabi buta tanpa ada yang sempat mendengar jeritan minta tolong sang karyawati.',
    sourceImage: 'shot-16.jpg',
  },
  {
    shot: 9,
    id: 's9',
    text: 'Usai melampiaskan kebiadaban, para pelaku merampas ponsel korban, mencuci tangan di parit, dan membuang pakaian berlumuran darah ke rawa Dadap.',
    sourceImage: 'shot-17.jpg',
  },
  {
    shot: 10,
    id: 's10',
    text: 'Namun jejak mereka tak pernah hilang: Tim Cyber Crime Polda Metro Jaya berhasil melacak koordinat pemancar BTS saat ponsel korban diaktifkan kembali.',
    sourceImage: 'shot-18.jpg',
  },
  {
    shot: 11,
    id: 's11',
    text: 'Kurang dari dua puluh empat jam, Tim Resmob meringkus ketiga pelaku, hingga Majelis Hakim Pengadilan Negeri Tangerang menjatuhkan vonis hukuman mati.',
    sourceImage: 'shot-20.jpg',
  },
];

const COVER_PROMPT = "A dramatic high-CTR YouTube Shorts vertical 9:16 cover and thumbnail illustration (1080x1920), Graphic Novel Neo-Noir Forensic style. Heavy weathered wooden door of room 17 in factory workers mess, cold steel padlock securely locked from outside with iron hasp, yellow police caution tape 'GARIS POLISI - DILARANG MELINTAS' stretching across the concrete corridor, harsh tactical flashlight beam, deep charcoal slate (#0D1117) with antique bronze highlights (#C59B27). Bold distressed integrated typography: 'MISTERI GEMBOK KAMAR 17' in warm broken-white stencil and 'TEROR DI MES KARYAWATI' in dried crimson ribbon (#8B2635). Full bleed, zero border.";

// Strict Charon voice synthesis using multi-tier Gemini TTS fallback pool
async function synthesizeCharonSentence(text: string, idx: number): Promise<{ wavPath: string; durationSec: number }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY missing in .env.local');

  const pcmPath = path.join(AUDIO_DIR, `short-sentence-${idx}.pcm`);
  const wavPath = path.join(AUDIO_DIR, `short-sentence-${idx}.wav`);

  if (fs.existsSync(wavPath) && fs.statSync(wavPath).size > 10000) {
    const dur = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', wavPath]).toString().trim();
    console.log(`   [VO ${idx}/11] File cache ditemukan (${dur}s): ${wavPath}`);
    return { wavPath, durationSec: parseFloat(dur) || 3.0 };
  }

  console.log(`[VO ${idx}/11] Mensintesis dengan Charon (Gemini TTS pool)...`);

  const models = [
    'gemini-3.8-flash-lite-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-2.5-flash-preview-tts',
    'gemini-3.8-flash-tts',
  ];

  let audioData: string | undefined;

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Charon' },
                },
              },
            },
          }),
        });

        if (res.status === 429) {
          const errText = await res.text().catch(() => '');
          if (errText.includes('per day limit exceeded') || errText.includes('Quota exceeded for metric')) {
            console.warn(`[VO ${idx}/11] Model ${model} kena daily quota limit. Beralih ke model berikutnya...`);
            break;
          }
          console.warn(`[VO ${idx}/11] Model ${model} rate limit 429 per-menit. Menunggu 15 detik (percobaan ${attempt}/3)...`);
          await new Promise((r) => setTimeout(r, 15000));
          continue;
        }

        if (res.status === 503) {
          console.warn(`[VO ${idx}/11] Model ${model} server 503 busy. Menunggu 5 detik...`);
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          console.warn(`[VO ${idx}/11] Model ${model} error ${res.status}: ${errText.slice(0, 100)}. Beralih model...`);
          break;
        }

        const data = (await res.json()) as any;
        audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData) {
          console.log(`[VO ${idx}/11] Berhasil dengan model ${model} (suara: Charon)`);
          break;
        }
      } catch (e: any) {
        console.warn(`[VO ${idx}/11] Network error pada ${model}: ${e.message}`);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    if (audioData) break;
  }

  if (!audioData) {
    throw new Error(`Gagal mendapatkan data audio TTS Charon untuk kalimat ${idx}`);
  }

  fs.writeFileSync(pcmPath, Buffer.from(audioData, 'base64'));

  execFileSync(ffmpeg, [
    '-y',
    '-f', 's16le',
    '-ar', '24000',
    '-ac', '1',
    '-i', pcmPath,
    '-af', 'highpass=f=75,lowpass=f=7800,volume=1.05',
    '-ar', '48000',
    '-ac', '2',
    wavPath,
  ]);

  const dur = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', wavPath]).toString().trim();
  return { wavPath, durationSec: parseFloat(dur) || 3.0 };
}

async function main() {
  console.log('========================================================================');
  console.log('  ⚡ RE-CUT 1.5 MENIT (90s): TRAGEDI CANGKUL DADAP / ENO FARIHAH');
  console.log('     (Viral Locked-Room Hook • 11 Shots • Authentic Charon VO)');
  console.log('========================================================================\n');

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(KEYFRAMES_DIR, { recursive: true });
  fs.mkdirSync(path.join(HF_WORKSPACE, 'assets'), { recursive: true });

  // 1. Synthesize 11 Sentences with Charon
  console.log('1. Mensintesis 11 Kalimat Voice Over (Charon - Gemini TTS Pool)...');
  const sentenceTimings: Array<{ id: string; shot: number; text: string; wavPath: string; durationSec: number; start: number; end: number; sourceImage: string }> = [];

  let currentCursor = 1.30; // 1.3s for Cover Hook

  for (let i = 0; i < SENTENCES.length; i++) {
    const s = SENTENCES[i];
    const res = await synthesizeCharonSentence(s.text, s.shot);
    const start = Number(currentCursor.toFixed(2));
    const end = Number((currentCursor + res.durationSec).toFixed(2));
    sentenceTimings.push({
      id: s.id,
      shot: s.shot,
      text: s.text,
      wavPath: res.wavPath,
      durationSec: res.durationSec,
      start,
      end,
      sourceImage: s.sourceImage,
    });
    console.log(`   [Kalimat ${i + 1}/11] (${res.durationSec.toFixed(2)}s) -> Timing: ${start}s - ${end}s`);
    currentCursor = end + 0.30; // 300ms dramatic silence gap between sentences

    if (i < SENTENCES.length - 1) {
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  // Prepend 1.30s silence for the cover hook
  const coverSilenceWav = path.join(AUDIO_DIR, 'cover-silence.wav');
  execFileSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '1.30', coverSilenceWav]);

  // Inter-sentence silence
  const silenceWav = path.join(AUDIO_DIR, 'silence.wav');
  execFileSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '0.30', silenceWav]);

  const concatListTxt = path.join(AUDIO_DIR, 'concat_vo.txt');
  let concatLines = `file '${coverSilenceWav}'\n`;
  sentenceTimings.forEach((st) => {
    concatLines += `file '${st.wavPath}'\n`;
    concatLines += `file '${silenceWav}'\n`;
  });
  fs.writeFileSync(concatListTxt, concatLines);

  const cleanVoPath = path.join(AUDIO_DIR, 'clean-vo.mp3');
  execFileSync(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', concatListTxt, '-c:a', 'libmp3lame', '-b:a', '192k', cleanVoPath]);

  const totalDuration = Number((currentCursor + 0.5).toFixed(2));
  console.log(`\n✅ Voice Over Selesai: Total Durasi ${totalDuration}s (~${(totalDuration / 60).toFixed(1)} menit) di ${cleanVoPath}`);

  // 2. Transition Timings & Shot Timings (1:1 with 11 sentences)
  const transitionTimes: number[] = [1.3]; // Cut from Shot 00 to Shot 01
  const shotTimings: Array<{ shot: number; startSec: number; endSec: number; durationSec: number; imageFile: string }> = [];

  sentenceTimings.forEach((st, idx) => {
    const isLast = idx === sentenceTimings.length - 1;
    const start = st.start;
    const end = isLast ? totalDuration : Number((st.end + 0.30).toFixed(2));
    const durationSec = Number((end - start).toFixed(2));

    if (start > 0.1 && !transitionTimes.includes(start)) {
      transitionTimes.push(start);
    }

    shotTimings.push({
      shot: st.shot,
      startSec: start,
      endSec: end,
      durationSec,
      imageFile: `short-shot-${String(st.shot).padStart(2, '0')}.jpg`,
    });
  });

  transitionTimes.sort((a, b) => a - b);

  // 3. Mixing Master Audio (VO + Looped BGM ducked 20% + 11x SFX Glitch)
  console.log('\n2. Mixing Audio Master (Charon VO + Looped BGM 20% + 11x SFX Glitch)...');
  const sfxPath = path.join(ROOT_DIR, 'public', 'renders', 'mujianto-serial-killer', 'audio-chunks', 'forensic-glitch-sfx.wav');
  const localBgm = path.join(ROOT_DIR, 'public', 'renders', 'mujianto-serial-killer', 'bgm-crime-tension.mp3');
  const bgmFadeOutStart = Math.max(0, totalDuration - 2.5);

  let filterStr = `[0:a]volume=1.0[vo];[2:a]volume=0.20,afade=t=in:ss=0:d=1.5,afade=t=out:st=${bgmFadeOutStart.toFixed(1)}:d=2.5[bgm_bed];`;
  const delayedInputs: string[] = [];

  transitionTimes.forEach((t, i) => {
    const delayMs = Math.round(t * 1000);
    filterStr += `[1:a]adelay=${delayMs}|${delayMs},volume=0.65[sfx_${i}];`;
    delayedInputs.push(`[sfx_${i}]`);
  });

  filterStr += `[vo][bgm_bed]${delayedInputs.join('')}amix=inputs=${transitionTimes.length + 2}:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11[out]`;

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
  console.log('\n3. Menghitung Word Timings & Discrete Phrases (Maks 4 kata)...');
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
    title: 'MISTERI GEMBOK KAMAR 17 - Tragedi Eno Farihah (Cut 1.5 Menit)',
    totalDurationSec: totalDuration,
    transitionTimes,
    shotTimings,
    sentences: sentenceTimings,
    phrases,
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, 'storyboard-data.json'), JSON.stringify(storyboardData, null, 2));

  // 5. Generate / Copy Visual Assets
  console.log('\n4. Menyiapkan Aset Visual untuk 11 Shots + Cover Baru...');
  
  // Cover Hook (Generate baru via Flow MCP untuk judul 'MISTERI GEMBOK KAMAR 17')
  const coverPub = path.join(KEYFRAMES_DIR, 'cover-shot-00.jpg');
  const coverHf = path.join(HF_WORKSPACE, 'assets', 'cover-shot-00.jpg');
  console.log('   Generating New Cover via Flow MCP: MISTERI GEMBOK KAMAR 17...');
  try {
    const res = await flowClient.generate({
      project: PROJECT_ID,
      prompt: COVER_PROMPT,
      type: 'image',
      aspect: '9:16',
      max_credits: 0,
    });
    if (res.task_id) {
      console.log(`   Cover task ${res.task_id} queued. Menunggu render...`);
      const waitRes = await flowClient.waitForJob(res.task_id, 180);
      if (waitRes.finished && waitRes.files?.[0] && fs.existsSync(waitRes.files[0])) {
        fs.copyFileSync(waitRes.files[0], coverPub);
        fs.copyFileSync(waitRes.files[0], coverHf);
        console.log('   ✅ New Cover Flow MCP selesai!');
      }
    }
  } catch (err: any) {
    console.warn(`   ⚠️ Flow MCP cover fallback: ${err.message}`);
  }

  // Copy 11 shots from existing keyframes
  const shotImages: Array<{ shot: number; imagePath: string }> = [];
  for (let i = 0; i < SENTENCES.length; i++) {
    const s = SENTENCES[i];
    const src = path.join(KEYFRAMES_DIR, s.sourceImage);
    const destName = `short-shot-${String(s.shot).padStart(2, '0')}.jpg`;
    const destPub = path.join(KEYFRAMES_DIR, destName);
    const destHf = path.join(HF_WORKSPACE, 'assets', destName);

    if (fs.existsSync(src)) {
      fs.copyFileSync(src, destPub);
      fs.copyFileSync(src, destHf);
    }
    shotImages.push({ shot: s.shot, imagePath: destPub });
  }

  // 6. Generate HyperFrames index.html & hyperframes.json
  console.log('\n5. Generating HyperFrames Composition (HTML + GSAP)...');
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
    { sec: '50.0', name: 'preview-50s-tiga-pelaku.jpg' },
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
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
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
      padding: 10px;
      font-size: 11px;
      color: var(--text-muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <span class="tag">HIGH RETENTION RE-CUT • 1.5 MENIT (90s)</span>
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
            <div class="stat-val">11 Shots</div>
            <div class="stat-lbl">Fast Pacing</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">Charon VO</div>
            <div class="stat-lbl">Voice Over</div>
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
      <h2 class="section-title">SNAPSHOT TIMELINE (11 SHOTS RE-CUT)</h2>
      <div class="gallery-grid">
        <div class="gallery-item">
          <img src="keyframes/cover-shot-00.jpg" alt="Cover Hook">
          <div class="gallery-caption">Shot 00: Cover Full-Bleed</div>
        </div>
        ${shotTimings
          .map(
            (st) => `
        <div class="gallery-item">
          <img src="keyframes/${st.imageFile}" alt="Shot ${st.shot}">
          <div class="gallery-caption">Shot ${String(st.shot).padStart(2, '0')} (${st.durationSec}s)</div>
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
  console.log('🎉 RE-CUT 1.5 MENIT SELESAI!');
  console.log(`👉 Buka Review Portal: http://localhost:3000/renders/${PROJECT_ID}/index.html`);
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Error in Pipeline:', err);
  process.exit(1);
});
