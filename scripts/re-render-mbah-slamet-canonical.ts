import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import { groupWordsIntoPhrases, CaptionWord } from '../lib/orchestrator/audio/noirAudioPipeline';
import { generateNoirHyperframesHtml } from '../lib/orchestrator/video/noirVideoTemplate';
import { renderHyperframes } from '../lib/hyperframes/renderEngine';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const PROJECT_ID = 'mbah-slamet-banjarnegara';
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public', 'renders', PROJECT_ID);
const HF_WORKSPACE = path.join(ROOT_DIR, 'hyperframes-workspace', PROJECT_ID);
const KEYFRAMES_DIR = path.join(PUBLIC_DIR, 'keyframes');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'audio');

function resolveFfmpegBin(): { ffmpeg: string; ffprobe: string } {
  const localFfmpeg = path.resolve(process.cwd(), 'bin', 'ffmpeg');
  const localFfprobe = path.resolve(process.cwd(), 'bin', 'ffprobe');
  const ffmpeg = fs.existsSync(localFfmpeg) ? localFfmpeg : 'ffmpeg';
  const ffprobe = fs.existsSync(localFfprobe) ? localFfprobe : 'ffprobe';
  return { ffmpeg, ffprobe };
}

const { ffmpeg, ffprobe } = resolveFfmpegBin();

// Strict Charon voice synthesis using gemini-3.8-flash-tts only (matching Mujianto 100%)
async function synthesizeCharonChunk(text: string, idx: number): Promise<{ wavPath: string; durationSec: number }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY missing in .env.local');

  const pcmPath = path.join(AUDIO_DIR, `sentence-${idx}.pcm`);
  const wavPath = path.join(AUDIO_DIR, `sentence-${idx}.wav`);

  console.log(`[VO] Mensintesis segmen ${idx} dengan Charon (gemini-3.1-flash-tts-preview)...`);

  let audioData: string | undefined;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${key}`, {
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
      console.warn(`[VO] Rate limit 429 per-minute pada segmen ${idx}. Menunggu 25 detik (percobaan ${attempt}/3)...`);
      await new Promise((r) => setTimeout(r, 25000));
      continue;
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`TTS API failed (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as any;
    const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
    if (part?.inlineData?.data) {
      audioData = part.inlineData.data;
      break;
    }
  }

  if (!audioData) {
    throw new Error(`Failed to synthesize sentence ${idx} after retries`);
  }

  fs.writeFileSync(pcmPath, Buffer.from(audioData, 'base64'));

  execFileSync(ffmpeg, [
    '-y',
    '-f', 's16le',
    '-ar', '24000',
    '-ac', '1',
    '-i', pcmPath,
    '-af', 'highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11',
    '-ar', '48000',
    '-ac', '2',
    wavPath,
  ]);

  if (fs.existsSync(pcmPath)) fs.unlinkSync(pcmPath);

  const durStr = execFileSync(ffprobe, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    wavPath,
  ]).toString().trim();

  // Small delay to prevent 3 RPM rate limit on free tier
  await new Promise((r) => setTimeout(r, 8000));

  return { wavPath, durationSec: parseFloat(durStr) || 2.0 };
}

async function main() {
  console.log('========================================================================');
  console.log('  🕶️  RE-RENDER CANONICAL: SERIAL KILLER MBAH SLAMET (FLOW IMAGES + CHARON VO)');
  console.log('========================================================================\n');

  // 1. Sentences breakdown (identical structure & pacing to Mujianto)
  const SENTENCES = [
    {
      id: 's1',
      text: 'Awal April 2023, lereng dingin perbukitan Desa Balun, Banjarnegara, gempar oleh temuan kuburan massal paling mengerikan di Jawa Tengah.',
      shots: [1, 2],
    },
    {
      id: 's2',
      text: 'Mbah Slamet, seorang dukun penipu berkedok pengganda uang, menjanjikan setoran puluhan juta bisa berlipat ganda menjadi miliaran rupiah.',
      shots: [3, 4],
    },
    {
      id: 's3',
      text: 'Namun ketika korban mulai menagih janji dan mendesak uangnya kembali, sang dukun merencanakan eksekusi berdarah di tengah perkebunan petang hari.',
      shots: [5, 6],
    },
    {
      id: 's4',
      text: 'Korban diajak melakukan ritual gaib, lalu disuguhi minuman yang diam-diam telah dicampur racun potasium sianida dosis mematikan.',
      shots: [7, 8],
    },
    {
      id: 's5',
      text: 'Titik terang tiba saat korban terakhir bernama Paryanto sempat mengirimkan lokasi dan pesan terakhir ke anaknya sebelum tewas diracun.',
      shots: [9, 10],
    },
    {
      id: 's6',
      text: 'Polisi membongkar 12 liang kubur di bukit kematian, dan di Pengadilan Negeri Banjarnegara, Jaksa resmi menuntut Mbah Slamet dengan hukuman mati.',
      shots: [11, 12, 13, 14],
    },
  ];

  // 1. Synthesize consistent Charon VO
  console.log('1. Mensintesis Voice Over konsisten (Charon - gemini-3.8-flash-tts)...');
  const sentenceTimings: Array<{ id: string; text: string; wavPath: string; durationSec: number; start: number; end: number }> = [];
  let currentCursor = 0.0;

  for (let i = 0; i < SENTENCES.length; i++) {
    const s = SENTENCES[i];
    const res = await synthesizeCharonChunk(s.text, i + 1);
    const start = Number(currentCursor.toFixed(2));
    const end = Number((currentCursor + res.durationSec).toFixed(2));
    sentenceTimings.push({
      id: s.id,
      text: s.text,
      wavPath: res.wavPath,
      durationSec: res.durationSec,
      start,
      end,
    });
    currentCursor = end + 0.30; // 300ms dramatic silence gap (identical to Mujianto)
  }

  // Concat VO
  const silenceWav = path.join(AUDIO_DIR, 'silence.wav');
  execFileSync(ffmpeg, [
    '-y',
    '-f', 'lavfi',
    '-i', 'anullsrc=r=48000:cl=stereo',
    '-t', '0.30',
    silenceWav,
  ]);

  const concatListTxt = path.join(AUDIO_DIR, 'concat_vo.txt');
  let concatLines = '';
  sentenceTimings.forEach((st) => {
    concatLines += `file '${st.wavPath}'\n`;
    concatLines += `file '${silenceWav}'\n`;
  });
  fs.writeFileSync(concatListTxt, concatLines);

  const cleanVoPath = path.join(AUDIO_DIR, 'clean-vo.mp3');
  execFileSync(ffmpeg, [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatListTxt,
    '-c:a', 'libmp3lame',
    '-b:a', '192k',
    cleanVoPath,
  ]);

  const totalDuration = Number(currentCursor.toFixed(2));
  console.log(`✅ Voice Over Selesai: ${totalDuration}s di ${cleanVoPath}`);

  // 2. Transition Timings & Shot Timings
  const transitionTimes: number[] = [1.3]; // Cut dari Shot 00 ke Shot 01
  const shotTimings: Array<{ shot: number; startSec: number; endSec: number; durationSec: number; imageFile: string }> = [];

  SENTENCES.forEach((s, idx) => {
    const st = sentenceTimings[idx];
    const assignedShots = s.shots;
    const perShotDur = st.durationSec / assignedShots.length;

    assignedShots.forEach((shotNum, j) => {
      const start = Number((st.start + j * perShotDur).toFixed(2));
      const end = Number((st.start + (j + 1) * perShotDur).toFixed(2));
      const durationSec = Number((end - start).toFixed(2));

      if (start > 0.1 && !transitionTimes.includes(start)) {
        transitionTimes.push(start);
      }

      shotTimings.push({
        shot: shotNum,
        startSec: start,
        endSec: end,
        durationSec,
        imageFile: `shot-${String(shotNum).padStart(2, '0')}.jpg`,
      });
    });
  });

  transitionTimes.sort((a, b) => a - b);

  // 3. Mixing Master Audio (VO + BGM ducked 20% + 14x SFX Glitch)
  console.log('\n2. Mixing Audio Master (Charon VO + BGM 20% + SFX Glitch)...');
  const sfxPath = path.join(AUDIO_DIR, 'glitch-whoosh.wav');
  const localBgm = path.join(AUDIO_DIR, 'bgm-crime-tension.mp3');
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
    '-i', localBgm,
    '-filter_complex', filterStr,
    '-map', '[out]',
    '-c:a', 'libmp3lame',
    '-b:a', '192k',
    masterAudioPath,
  ]);
  console.log(`✅ Master Audio Tersimpan: ${masterAudioPath}`);

  // 4. Calculate word timings for karaoke captions
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
    title: 'SERIAL KILLER BANJARNEGARA - 12 Korban Dukun Mbah Slamet',
    totalDurationSec: totalDuration,
    transitionTimes,
    shotTimings,
    words: allWords,
    sentences: sentenceTimings.map(({ wavPath, ...r }) => r),
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, 'storyboard-data.json'), JSON.stringify(storyboardData, null, 2));

  // 5. Generate HyperFrames index.html & hyperframes.json using Flow MCP images
  console.log('\n===============================================================');
  console.log('  Generating HyperFrames Composition (HTML + GSAP)              ');
  console.log('===============================================================\n');

  const shotImages = Array.from({ length: 14 }, (_, i) => ({
    shot: i + 1,
    imagePath: path.join(KEYFRAMES_DIR, `shot-${String(i + 1).padStart(2, '0')}.jpg`),
  }));

  generateNoirHyperframesHtml({
    jobId: PROJECT_ID,
    title: 'SERIAL KILLER BANJARNEGARA - Mbah Slamet Dituntut Hukuman Mati',
    totalDurationSec: totalDuration,
    coverImagePath: path.join(KEYFRAMES_DIR, 'cover-shot-00.jpg'),
    shotImages,
    shotTimings,
    phrases,
    outputDir: HF_WORKSPACE,
  });

  console.log(`✅ HyperFrames Composition berhasil di-generate di ${HF_WORKSPACE}`);

  // 6. Render Video Timeline dengan HyperFrames Engine (30fps)
  console.log('\n===============================================================');
  console.log('  Rendering Video dengan HyperFrames Engine (1080x1920 @ 30fps) ');
  console.log('===============================================================\n');

  const tempVideoPath = path.join(PUBLIC_DIR, 'temp-visual-timeline.mp4');
  const finalVideoPath = path.join(PUBLIC_DIR, 'mbah-slamet-final.mp4');

  const startTime = Date.now();
  await renderHyperframes({
    projectDir: HF_WORKSPACE,
    outputPath: tempVideoPath,
    fps: 30,
    onProgress: (p) => process.stdout.write(p),
  });

  const renderTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n✅ Visual render selesai dalam ${renderTimeSec} detik!`);

  // 7. Multiplexing Audio Master Track dengan FFmpeg
  console.log('\n===============================================================');
  console.log('  Multiplexing Audio Master Track dengan FFmpeg                 ');
  console.log('===============================================================\n');

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

  // 8. Ekstraksi Verifikasi Frame Snapshots
  console.log('\n8. Mengekstrak snapshot verifikasi visual & autocaption...');
  const snapshots = [
    { sec: '0.8', name: 'preview-01s-hook.jpg' },
    { sec: '5.0', name: 'preview-05s-shot1.jpg' },
    { sec: '20.0', name: 'preview-20s-shot4.jpg' },
    { sec: '45.0', name: 'preview-45s-shot9.jpg' },
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

  console.log('\n========================================================================');
  console.log('🎉 RE-RENDER DENGAN GOOGLE FLOW IMAGES & CHARON VO SELESAI!');
  console.log(`👉 Buka Review Portal: http://localhost:3000/renders/${PROJECT_ID}/index.html`);
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Error in Canonical Re-render:', err);
  process.exit(1);
});
