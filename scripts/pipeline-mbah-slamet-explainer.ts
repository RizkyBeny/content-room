import fs from 'node:fs';
import path from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import dotenv from 'dotenv';
import { flowClient } from '../lib/flowMcp/client';
import { groupWordsIntoPhrases, CaptionWord } from '../lib/orchestrator/audio/noirAudioPipeline';
import { generateNoirHyperframesHtml } from '../lib/orchestrator/video/noirVideoTemplate';
import { renderHyperframes } from '../lib/hyperframes/renderEngine';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const execFileAsync = promisify(execFile);

function resolveFfmpegBin(): { ffmpeg: string; ffprobe: string } {
  const localFfmpeg = path.resolve(process.cwd(), 'bin', 'ffmpeg');
  const localFfprobe = path.resolve(process.cwd(), 'bin', 'ffprobe');
  const ffmpeg = fs.existsSync(localFfmpeg) ? localFfmpeg : 'ffmpeg';
  const ffprobe = fs.existsSync(localFfprobe) ? localFfprobe : 'ffprobe';
  return { ffmpeg, ffprobe };
}

const PROJECT_ID = 'mbah-slamet-banjarnegara';
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public', 'renders', PROJECT_ID);
const HF_WORKSPACE = path.join(ROOT_DIR, 'hyperframes-workspace', PROJECT_ID);
const KEYFRAMES_DIR = path.join(PUBLIC_DIR, 'keyframes');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'audio');

async function synthesizeSentenceCharon(text: string, index: number): Promise<{ wavPath: string; durationSec: number }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY missing in .env.local');

  const candidateModels = [
    'gemini-2.5-flash-preview-tts',
    'gemini-3.8-flash-lite-tts',
    'gemini-3.8-flash-tts',
    'gemini-3.1-flash-tts-preview',
  ];

  let audioBase64: string | undefined;

  for (const model of candidateModels) {
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

      if (!res.ok) continue;
      const data = (await res.json()) as any;
      const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
      if (part?.inlineData?.data) {
        audioBase64 = part.inlineData.data;
        break;
      }
    } catch {
      // try next model
    }
  }

  const { ffmpeg, ffprobe } = resolveFfmpegBin();
  const wavPath = path.join(AUDIO_DIR, `sentence-${index}.wav`);

  if (!audioBase64) {
    console.warn(`[VO] Gemini TTS fallback to edge-tts id-ID-ArdiNeural for sentence ${index}...`);
    const tempMp3 = path.join(AUDIO_DIR, `sentence-${index}-temp.mp3`);
    const edgeTtsBin = fs.existsSync('/Users/beny/Library/Python/3.9/bin/edge-tts')
      ? '/Users/beny/Library/Python/3.9/bin/edge-tts'
      : 'edge-tts';

    execFileSync(edgeTtsBin, [
      '--voice', 'id-ID-ArdiNeural',
      '--rate=-4%',
      '--text', text,
      '--write-media', tempMp3,
    ]);

    execFileSync(ffmpeg, [
      '-y',
      '-i', tempMp3,
      '-af', 'highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11',
      '-ar', '48000',
      '-ac', '2',
      wavPath,
    ]);

    if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
  } else {
    const pcmPath = path.join(AUDIO_DIR, `sentence-${index}.pcm`);
    fs.writeFileSync(pcmPath, Buffer.from(audioBase64, 'base64'));

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
  }

  const durStr = execFileSync(ffprobe, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    wavPath,
  ]).toString().trim();

  return { wavPath, durationSec: parseFloat(durStr) || 2.0 };
}

async function main() {
  console.log('========================================================================');
  console.log('  🕶️  PIPELINE VIDEO EXPLAIENR: SERIAL KILLER MBAH SLAMET BANJARNEGARA ');
  console.log('========================================================================\n');

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(KEYFRAMES_DIR, { recursive: true });
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(HF_WORKSPACE, { recursive: true });

  const { ffmpeg } = resolveFfmpegBin();

  // 1. Naskah 6 Segmen Naratif (Target: 70-80s, Dark Suspense True Crime)
  const sentences = [
    {
      id: 's1',
      text: 'Di lereng sunyi Desa Balun, Banjarnegara, sebuah bukit perkebunan menyimpan kuburan massal paling mengerikan.',
      shots: [1, 2],
    },
    {
      id: 's2',
      text: 'Mbah Slamet, dukun pengganda uang, memikat para korbannya dengan janji manis mengubah puluhan juta rupiah menjadi miliaran secara instan.',
      shots: [3, 4],
    },
    {
      id: 's3',
      text: 'Namun saat korban mendesak menagih uangnya, Mbah Slamet mengajak mereka ritual penarikan gaib di tengah perkebunan petang hari.',
      shots: [5, 6],
    },
    {
      id: 's4',
      text: 'Secangkir minuman disajikan dingin, tanpa korban sadari telah dicampur racun potasium sianida dosis mematikan.',
      shots: [7, 8],
    },
    {
      id: 's5',
      text: 'Korban terakhir bernama Paryanto sempat mengirimkan lokasi dan pesan terakhir ke anaknya, sebelum jasadnya dikubur bersama sebelas korban lainnya.',
      shots: [9, 10, 11],
    },
    {
      id: 's6',
      text: 'Berbekal jejak digital itu, kepolisian membongkar 12 liang lahat, dan Majelis Hakim kini menuntut sang serial killer dengan hukuman mati.',
      shots: [12, 13, 14],
    },
  ];

  console.log('1. Mensintesis Voice Over Charon per segmen naratif...');
  const sentenceTimings: Array<{ id: string; text: string; wavPath: string; durationSec: number; start: number; end: number }> = [];
  let currentCursor = 0.0;

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    console.log(`   [VO] Segmen ${i + 1}/${sentences.length}: "${s.text.slice(0, 45)}..."`);
    const res = await synthesizeSentenceCharon(s.text, i + 1);
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
    currentCursor = end + 0.35; // 350ms dramatic silence gap
  }

  // Gabungkan audio VO
  const silenceWav = path.join(AUDIO_DIR, 'silence.wav');
  execFileSync(ffmpeg, [
    '-y',
    '-f', 'lavfi',
    '-i', 'anullsrc=r=48000:cl=stereo',
    '-t', '0.35',
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

  // Durasi total
  const totalDuration = Number(currentCursor.toFixed(2));
  console.log(`\n✅ Voice Over Selesai: ${totalDuration}s di ${cleanVoPath}`);

  // 2. Generate Transition SFX & BGM Bed
  console.log('\n2. Menyiapkan Sound Effects Glitch & BGM Bed...');
  const sfxPath = path.join(AUDIO_DIR, 'glitch-whoosh.wav');
  execFileSync(ffmpeg, [
    '-y',
    '-f', 'lavfi', '-i', 'anoisesrc=d=0.28:c=pink:r=48000:a=0.9',
    '-f', 'lavfi', '-i', 'sine=f=75:d=0.28:r=48000',
    '-filter_complex',
    '[0:a]bandpass=f=1200:w=800,volume=1.2[noise];' +
    '[1:a]lowpass=f=220,volume=1.5[sub];' +
    '[noise][sub]amix=inputs=2:duration=first,' +
    'afade=t=in:ss=0:d=0.04,afade=t=out:st=0.20:d=0.08,' +
    'flanger=delay=3:depth=2:speed=8[sfx]',
    '-map', '[sfx]',
    '-ar', '48000',
    '-ac', '2',
    sfxPath,
  ]);

  const sourceBgm = path.join(ROOT_DIR, 'public', 'renders', 'noir_1794725807098', 'audio', 'bgm-crime-tension.mp3');
  const localBgm = path.join(AUDIO_DIR, 'bgm-crime-tension.mp3');
  if (fs.existsSync(sourceBgm)) {
    fs.copyFileSync(sourceBgm, localBgm);
  } else {
    execFileSync('npx', ['tsx', 'scripts/generate-dramatic-bgm.ts']);
    fs.copyFileSync(path.join(ROOT_DIR, 'public', 'renders', 'twitter-killer-test', 'bgm-crime-tension.mp3'), localBgm);
  }

  // Hitung Cut Points & Shot Timings (Sentence-to-Shot Semantic Binding)
  const transitionTimes: number[] = [1.3]; // Cut dari Shot 00 ke Shot 01
  const shotTimings: Array<{ shot: number; startSec: number; endSec: number; durationSec: number; imageFile: string }> = [];

  sentences.forEach((s, idx) => {
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
  console.log(`   Ditemukan ${transitionTimes.length} titik potong transisi audio/visual`);

  // Mixing Audio Master (VO 100% + BGM ducked 20% + Transition SFX)
  console.log('   Mixing VO + BGM (20% volume) + SFX dengan FFmpeg...');
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

  // 3. Autocaption Word Timings
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

  // 4. Generate Keyframes via Google Flow MCP (9:16 Still Frames)
  console.log('\n4. Menggenerasi 15 Keyframes Visual Graphic Novel Neo-Noir via Google Flow MCP...');

  const keyframeBlueprints = [
    {
      shot: 0,
      filename: 'cover-shot-00.jpg',
      prompt: "A dramatic high-CTR YouTube Shorts cover and thumbnail illustration, vertical 9:16 aspect ratio (1080x1920), Graphic Novel Neo-Noir style. Visual Scene: A chilling Indonesian true crime hook depicting an ominous elderly shaman silhouette in a dark Javanese hillside plantation in Banjarnegara, glowing cyan potasium poison glass, dark soil mound grave pits. Integrated Bold Typography: Prominent massive distressed headline text: 'SERIAL KILLER BANJARNEGARA' in heavy stencil typography in warm broken-white (#E6EDF3) with antique bronze accents (#C59B27). Sub-headline ribbon banner: '12 NYAWA DITELAN BUKIT KEMATIAN' in deep dried crimson red (#8B2635). Top warning header banner: '/// POLICE INVESTIGATION DOSSIER ///'. Dynamic heavy inking, chiaroscuro lighting, gritty halftone screen tone dot pattern, cel-shaded shadows, matte graphic novel finish. Full bleed composition. No pastel colors, no cartoonish elements.",
    },
    {
      shot: 1,
      filename: 'shot-01.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Subject: An ominous secluded hillside cabbage plantation at dusk in Desa Balun, Wanayasa, Banjarnegara. Cold mist rolling down dark green slopes, fresh soil mound with yellow police tape marked 'GARIS POLISI / DILARANG MELINTAS'. Full bleed vertical portrait framing, dramatic chiaroscuro lighting piercing cold mountain fog, deep shadows, heavy contour inking, fine halftone dot pattern, matte charcoal slate (#0D1117) and antique bronze accents (#C59B27). No watermark.",
    },
    {
      shot: 2,
      filename: 'shot-02.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Stark police criminal sketch mugshot of middle-aged Indonesian shaman suspect Mbah Slamet Tohari, cold unblinking sinister gaze, prisoner identification placard under chin, high contrast comic book inking, heavy cross-hatching, harsh interrogation spotlight, stamped with dried crimson red seal 'TERSANGKA PASAL 340 KUHP'. Halftone shading, matte finish.",
    },
    {
      shot: 3,
      filename: 'shot-03.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Fraud money multiplier ritual altar table in a dim Javanese village house, thick stacks of Indonesian Rupiah banknotes arranged near brass incense burner bowl with thin smoke curling upward, occult ritual keris dagger, deep shadows, antique dull bronze glow (#C59B27), gritty graphic novel halftone dots.",
    },
    {
      shot: 4,
      filename: 'shot-04.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Isometric 45-degree angle top-down view of police forensic evidence desk examining seized fraudulent money multiplying paraphernalia, counterfeit money printing plates, transparent evidence plastic bags with red marker tags '01' and '02', tactical grid paper on matte graphite workbench. Heavy inking, chiaroscuro lighting.",
    },
    {
      shot: 5,
      filename: 'shot-05.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Dim solitary wooden hut on a foggy Banjarnegara hillside at twilight, solitary lantern burning with eerie amber glow inside, silhouette of two men walking into the shadowed cabbage plantation path. Heavy noir inking, dust motes in beam of light, full bleed.",
    },
    {
      shot: 6,
      filename: 'shot-06.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Isometric forensic transit map showing tactical route lines from Sukabumi West Java winding across Central Java mountain roads to Wanayasa Banjarnegara, routes traced in dried crimson marker ink (#8B2635), dark parchment texture, magnifying glass, surveillance grid overlay.",
    },
    {
      shot: 7,
      filename: 'shot-07.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Macro close-up dramatic angle of an old traditional enamel tin cup and plastic mineral water bottle on a damp wooden bench, faint toxic effervescence and white powder settling at the bottom, eerie subtle cyan rim light piercing through deep shadows, dried crimson accents. Heavy graphic novel linework.",
    },
    {
      shot: 8,
      filename: 'shot-08.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Forensic laboratory chemical analysis testing white crystalline potasium cyanide poison powder in a clear glass beaker, toxic hazard warning label skull and crossbones, harsh fluorescent beam piercing dark forensics lab, fine halftone screen tone, matte finish.",
    },
    {
      shot: 9,
      filename: 'shot-09.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). A cracked glowing smartphone screen lying on damp plantation soil in the dark, WhatsApp chat screen clearly visible displaying text: 'Kalo ada apa-apa cari saya ke sini bersama aparat polisi' with red GPS pin location icon glowing eerie amber, rain-slicked dark grass. Heavy inking, halftone dots.",
    },
    {
      shot: 10,
      filename: 'shot-10.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Police forensic excavation crime scene at dusk on Banjarnegara hillside, multiple shallow graves marked with yellow forensic numbered placards 01 to 12, forensic police officers in white protective suits with floodlights piercing cold mountain fog. Dramatic chiaroscuro contrast, deep shadows.",
    },
    {
      shot: 11,
      filename: 'shot-11.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Official police autopsy file dossier and forensic toxicology lab report spread on steel table, bold red confidential stamp 'HASIL LABFOR: POSITIF TOKSIK POTAS', victim dental records and censored incident documents, antique bronze accents (#C59B27). Full bleed.",
    },
    {
      shot: 12,
      filename: 'shot-12.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Solemn judicial courtroom scene at Pengadilan Negeri Banjarnegara, defendant elderly shaman Mbah Slamet sitting head bowed in wooden prisoner dock guarded by armed police, harsh courtroom spotlight casting long menacing shadows on dark hardwood floor.",
    },
    {
      shot: 13,
      filename: 'shot-13.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Heavy dark judicial gavel with antique brass bronze bands resting on sound block, official court verdict decree document reading 'TUNTUTAN PIDANA MATI', dramatic ray of light illuminating balanced iron scales of justice, timeless justice allegory, deep chiaroscuro.",
    },
    {
      shot: 14,
      filename: 'shot-14.jpg',
      prompt: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Massive heavy vault steel door of police archive closing and locked with iron chains, embossed brass seal, large bold red wax stamp across the seam reading 'VONIS MATI / CASE CLOSED', dark slate background with fine halftone dots (#0D1117). Full bleed.",
    },
  ];

  for (let i = 0; i < keyframeBlueprints.length; i++) {
    const kf = keyframeBlueprints[i];
    const outPath = path.join(KEYFRAMES_DIR, kf.filename);

    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 20000) {
      console.log(`   [Keyframe ${kf.shot}/14] File ${kf.filename} sudah ada (cached).`);
      continue;
    }

    console.log(`   [Keyframe ${kf.shot}/14] Flow MCP generating ${kf.filename}...`);
    let success = false;

    try {
      const res = await flowClient.generate({
        project: 'mbah-slamet-banjarnegara',
        prompt: kf.prompt,
        type: 'image',
        aspect: '9:16',
        max_credits: 0,
      });

      if (res.task_id) {
        const waitRes = await flowClient.waitForJob(res.task_id, 180);
        if (waitRes.finished && waitRes.files?.[0] && fs.existsSync(waitRes.files[0])) {
          fs.copyFileSync(waitRes.files[0], outPath);
          console.log(`   ✅ [Keyframe ${kf.shot}/14] Flow MCP render selesai: ${outPath}`);
          success = true;
        }
      }
    } catch (err: any) {
      console.warn(`   ⚠️ Flow MCP error pada ${kf.filename}: ${err.message}`);
    }

    if (!success || !fs.existsSync(outPath) || fs.statSync(outPath).size < 1000) {
      console.log(`   [Keyframe ${kf.shot}/14] Fallback ke script Python PIL Neo-Noir...`);
      const pyScript = path.join(ROOT_DIR, 'scripts', 'generate-noir-keyframe.py');
      execFileSync('python3', [
        pyScript,
        '--out', outPath,
        '--shot', String(kf.shot),
        '--label', `Shot ${kf.shot}`,
        '--headline', 'SERIAL KILLER BANJARNEGARA',
        '--subheadline', '12 KORBAN DIHABISI DUKUN POTAS',
        '--evidence', 'Racun Potasium Sianida & Liang Kubur',
      ]);
      console.log(`   ✅ Fallback keyframe dibuat: ${outPath}`);
    }
  }

  // 5. Generate HyperFrames index.html & hyperframes.json
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

  // 9. Generate Web Review Portal dengan Social Media Distribution Kit
  console.log('\n9. Menyusun Halaman Web Review Portal & Social Media Kit...');
  generateWebReviewPortal(totalDuration, allWords.length);

  console.log('\n========================================================================');
  console.log('🎉 SEMUA PROSES SELESAI DENGAN SUKSES!');
  console.log(`👉 Buka Review Portal: http://localhost:3000/renders/${PROJECT_ID}/index.html`);
  console.log('========================================================================\n');
}

function generateWebReviewPortal(durationSec: number, wordCount: number) {
  const portalPath = path.join(PUBLIC_DIR, 'index.html');
  const durStr = durationSec.toFixed(1);

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SERIAL KILLER BANJARNEGARA (Mbah Slamet Dituntut Hukuman Mati) - Video Review</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-[#0A0D12] text-slate-100 min-h-screen p-4 md:p-8 flex flex-col items-center">
  <div class="max-w-7xl w-full space-y-8">
    <!-- Header -->
    <div class="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800 text-red-400 text-xs font-semibold mb-2">
          <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Template: Mystery True Crime (9:16) &bull; Rigid Pacing: 3&ndash;5 Detik / Image
        </div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">SERIAL KILLER BANJARNEGARA: 12 Korban Dukun Pengganda Uang Mbah Slamet</h1>
        <p class="text-slate-400 text-sm mt-1">
          Kasus: <em>Mbah Slamet Tohari (Dukun Pengganda Uang Banjarnegara Dituntut Pidana Mati)</em> &bull; Durasi: <strong>${durStr} Detik</strong>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <div class="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs mono text-slate-300">
          Total: <span class="text-amber-400 font-bold">14 Shots</span> &bull; <span class="text-cyan-400 font-bold">${wordCount} Kata</span> &bull; <span class="text-emerald-400 font-bold">${durStr}s</span>
        </div>
      </div>
    </div>

    <!-- Video Player Section -->
    <div class="bg-[#12161E] border border-amber-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold mb-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Render Selesai &bull; 1080&times;1920 (30fps) &bull; ${durStr}s
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Final Video (HyperFrames + Charon VO + BGM 20% + SFX)</h2>
          <p class="text-xs text-slate-400 mt-1">
            Video 9:16 vertikal dengan 14 shot kamera dinamis, autocaption bawah tersinkronisasi, dan audio broadcast-normalized.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a
            href="mbah-slamet-final.mp4"
            download="mbah-slamet-final.mp4"
            class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg flex items-center gap-2"
          >
            <span>Unduh MP4 Final</span>
          </a>
        </div>
      </div>

      <div class="flex flex-col md:flex-row items-center justify-center gap-8 pt-4 border-t border-slate-800">
        <!-- Vertical Video Container -->
        <div class="relative w-full max-w-[340px] aspect-[9/16] rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
          <video
            controls
            playsinline
            preload="auto"
            class="w-full h-full object-cover"
          >
            <source src="mbah-slamet-final.mp4?v=1" type="video/mp4">
            Browser Anda tidak mendukung tag video.
          </video>
        </div>

        <div class="space-y-4 max-w-md text-xs text-slate-300">
          <!-- Standalone BGM Player Card -->
          <div class="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                Audio Khusus BGM (Standalone Track)
              </span>
              <a
                href="audio/bgm-crime-tension.mp3"
                download="bgm-crime-tension.mp3"
                class="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold transition"
              >
                Unduh MP3
              </a>
            </div>
            <p class="text-slate-300 text-[11px]">
              Dengarkan langsung instrumen BGM tanpa narasi (Cello pulse, piano eerie Mindhunter, ticking clock, dark pad D-minor):
            </p>
            <audio controls class="w-full h-8" preload="auto">
              <source src="audio/bgm-crime-tension.mp3?v=1" type="audio/mpeg">
              Browser tidak mendukung elemen audio.
            </audio>
          </div>

          <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div class="font-bold text-amber-400 uppercase tracking-wider">Spesifikasi Render Final:</div>
            <ul class="space-y-1.5 text-slate-400 list-disc pl-4">
              <li><strong>Autocaption Kata-per-Kata:</strong> Frasa pendek (maks 4 kata) tersinkronisasi karaoke dengan highlight emas (#C59B27) &amp; scale up subtle persis project benchmark pertama</li>
              <li><strong>Cover Video Menarik (Awal):</strong> Poster visual sinematik dengan tipografi terintegrasi "SERIAL KILLER BANJARNEGARA" &amp; cangkir racun di awal video (0.0s &ndash; 1.3s)</li>
              <li><strong>Resolusi:</strong> 1080 &times; 1920 (9:16 Vertical Shorts/Reels)</li>
              <li><strong>Backsound Dramatis (BGM):</strong> Cinematic Crime Thriller (D-minor 80 BPM, volume <strong>20% (Subtle Bed)</strong>)</li>
              <li><strong>Transisi Visual:</strong> Noir Forensic Glitch (Distorsi scanline &amp; chromatic aberration 0.18s di 14 titik)</li>
              <li><strong>Sound Effect:</strong> Injeksi audio whoosh &amp; glitch hit tersinkronisasi persis dengan transisi visual</li>
              <li><strong>Kamera:</strong> Smooth Ken Burns choreography per shot (Push-in, Creep, Pan, Tilt)</li>
              <li><strong>Voice Over:</strong> Charon (Deep Authority) &bull; 48kHz Stereo &bull; Broadcast -16 LUFS</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Verified Frame Captions Preview -->
      <div class="pt-6 border-t border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold uppercase tracking-wider text-amber-400">Verifikasi Frame &bull; Autocaption Karaoke Kata-per-Kata</h3>
          <span class="text-xs text-slate-400">Frasa pendek (maks 4 kata) &bull; Highlight emas #C59B27 &bull; Area Bawah 300px</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <img src="preview-01s-hook.jpg" alt="Cover Hook 0.8s" class="w-full aspect-[9/16] object-cover" />
            <div class="p-2 text-center text-[10px] text-slate-400 mono">0.8s &bull; Cover Hook & Phrase 0</div>
          </div>
          <div class="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <img src="preview-05s-shot1.jpg" alt="Shot 1 Caption" class="w-full aspect-[9/16] object-cover" />
            <div class="p-2 text-center text-[10px] text-slate-400 mono">5.0s &bull; Shot 1 & Phrase 3</div>
          </div>
          <div class="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <img src="preview-20s-shot4.jpg" alt="Shot 4 Caption" class="w-full aspect-[9/16] object-cover" />
            <div class="p-2 text-center text-[10px] text-slate-400 mono">20.0s &bull; Shot 4 & Phrase 12</div>
          </div>
          <div class="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <img src="preview-45s-shot9.jpg" alt="Shot 9 Caption" class="w-full aspect-[9/16] object-cover" />
            <div class="p-2 text-center text-[10px] text-slate-400 mono">45.0s &bull; Shot 9 & Phrase 25</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Social Media Distribution Kit & Ready-to-Post Captions -->
    <div class="bg-[#12161E] border border-amber-500/50 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600 text-amber-300 text-xs font-bold mb-2">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Siap Posting &bull; 1-Click Copy
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Paket Caption &amp; Metadata Media Sosial</h2>
          <p class="text-xs text-slate-400 mt-1">
            Caption optimal dengan hook emosional, ringkasan kronologi, CTA interaksi, dan tagar berkinerja tinggi untuk YouTube Shorts, TikTok, dan Instagram Reels.
          </p>
        </div>
        
        <!-- Platform Selector Tabs -->
        <div class="flex items-center gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 self-start lg:self-auto">
          <button id="tab-yt" onclick="switchPlatformTab('yt')" class="platform-tab px-4 py-2 rounded-xl text-xs font-bold transition bg-amber-500 text-slate-950 border border-amber-400">
            YouTube Shorts
          </button>
          <button id="tab-tt" onclick="switchPlatformTab('tt')" class="platform-tab px-4 py-2 rounded-xl text-xs font-bold transition bg-slate-900 text-slate-400 border border-slate-800 hover:text-white">
            TikTok
          </button>
          <button id="tab-ig" onclick="switchPlatformTab('ig')" class="platform-tab px-4 py-2 rounded-xl text-xs font-bold transition bg-slate-900 text-slate-400 border border-slate-800 hover:text-white">
            Instagram Reels
          </button>
        </div>
      </div>

      <!-- YouTube Shorts Content -->
      <div id="content-yt" class="platform-content space-y-5">
        <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-amber-400 uppercase tracking-wider">Judul Rekomendasi (SEO &amp; High CTR):</span>
            <button onclick="copyText('yt-title', this)" class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition flex items-center gap-1 border border-slate-700">
              Salin Judul
            </button>
          </div>
          <div id="yt-title" class="p-3 rounded-xl bg-black/60 border border-slate-800 text-sm font-semibold text-white">SERIAL KILLER BANJARNEGARA: 12 Korban Ditelan Bukit Kematian Mbah Slamet #Shorts</div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-amber-400 uppercase tracking-wider">Deskripsi &amp; Narasi YouTube Shorts:</span>
            <button onclick="copyText('yt-desc', this)" class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition flex items-center gap-1 border border-slate-700">
              Salin Deskripsi Lengkap
            </button>
          </div>
          <pre id="yt-desc" class="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">Di lereng perbukitan Desa Balun, Wanayasa, Banjarnegara, terbongkar kasus pembunuhan berantai paling menggemparkan di Jawa Tengah.

Slamet Tohari alias Mbah Slamet, seorang dukun pengganda uang, tega meracuni 12 korban dengan racun potasium sianida saat ritual fiktif penarikan uang gaib di perkebunan petang hari.

Jejak mautnya akhirnya terbongkar setelah korban terakhir bernama Paryanto sempat mengirimkan lokasi terkini (sharelock) dan pesan waspada kepada sang anak. Polisi menggali 12 liang lahat, dan kini Jaksa Penuntut Umum resmi menuntut sang serial killer dengan hukuman mati di Pengadilan Negeri Banjarnegara.

Bagikan pendapatmu di kolom komentar: apa yang membuat tipu daya dukun pengganda uang masih begitu mudah memakan korban?

#MbahSlamet #SerialKillerBanjarnegara #TrueCrimeIndonesia #KasusKriminal #InvestigasiKriminal #BeritaKriminal #DetikJateng #Banjarnegara #KriminalJateng #HukumDanKriminal #Shorts</pre>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-amber-400 uppercase tracking-wider">Tagar Khusus YouTube:</span>
            <button onclick="copyText('yt-tags', this)" class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition flex items-center gap-1 border border-slate-700">
              Salin Tagar
            </button>
          </div>
          <div id="yt-tags" class="p-3 rounded-xl bg-black/60 border border-slate-800 text-xs text-amber-300/90 mono">#MbahSlamet #SerialKillerBanjarnegara #TrueCrimeIndonesia #KasusKriminal #InvestigasiKriminal #BeritaKriminal #DetikJateng #Banjarnegara #KriminalJateng #HukumDanKriminal #Shorts</div>
        </div>
      </div>

      <!-- TikTok Content -->
      <div id="content-tt" class="platform-content space-y-5 hidden">
        <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-amber-400 uppercase tracking-wider">Caption TikTok (Ringkas &amp; Catchy):</span>
            <button onclick="copyText('tt-caption', this)" class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition flex items-center gap-1 border border-slate-700">
              Salin Caption TikTok
            </button>
          </div>
          <pre id="tt-caption" class="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">Kisah Mbah Slamet, serial killer Banjarnegara yang racuni 12 korban dengan potas berkedok ritual pengganda uang 😱☠️ Terbongkar dari pesan WhatsApp terakhir korban! Simak kronologinya! #mbahslamet #serialkiller #banjarnegara #truecrimeindonesia #kasuskriminal #beritakriminal #fyp #foryoupage #viralindonesia</pre>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-amber-400 uppercase tracking-wider">Tagar FYP TikTok:</span>
            <button onclick="copyText('tt-tags', this)" class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition flex items-center gap-1 border border-slate-700">
              Salin Tagar
            </button>
          </div>
          <div id="tt-tags" class="p-3 rounded-xl bg-black/60 border border-slate-800 text-xs text-amber-300/90 mono">#mbahslamet #serialkiller #banjarnegara #truecrimeindonesia #kasuskriminal #beritakriminal #fyp #foryoupage #viralindonesia</div>
        </div>
      </div>

      <!-- Instagram Reels Content -->
      <div id="content-ig" class="platform-content space-y-5 hidden">
        <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-amber-400 uppercase tracking-wider">Caption Instagram Reels (Editorial Format):</span>
            <button onclick="copyText('ig-caption', this)" class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition flex items-center gap-1 border border-slate-700">
              Salin Caption Reels
            </button>
          </div>
          <pre id="ig-caption" class="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">12 NYAWA DITELAN BUKIT KEMATIAN: KISAH SERIAL KILLER MBAH SLAMET BANJARNEGARA ⚠️☠️

Di lereng bukit Desa Balun, Wanayasa, Banjarnegara, tersembunyi kuburan massal korban penipuan berkedok dukun pengganda uang.

Penyelidikan kepolisian mengungkap kejahatan berdarah:
▪️ 12 korban tewas diracun potasium sianida saat ritual fiktif penarikan gaib
▪️ Modus: Menjanjikan puluhan juta menjadi miliaran rupiah secara instan
▪️ Motif eksekusi: Kesal dan panik ditagih pengembalian uang oleh korban
▪️ Titik balik: Pesan WhatsApp dan sharelock korban Paryanto ke anaknya sebelum dieksekusi

Kini, Jaksa Penuntut Umum menuntut Mbah Slamet Tohari dengan hukuman mati tanpa hal yang meringankan.

Bagaimana tanggapan kalian mengenai kasus ini? Tulis pendapat kalian di kolom komentar! 👇

#MbahSlamet #SerialKillerBanjarnegara #TrueCrimeIndonesia #KasusKriminal #InvestigasiKriminal #BeritaKriminal #DetikJateng #Banjarnegara #KriminalJateng #HukumDanKriminal #ReelsCrime</pre>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-amber-400 uppercase tracking-wider">Tagar Instagram Reels:</span>
            <button onclick="copyText('ig-tags', this)" class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition flex items-center gap-1 border border-slate-700">
              Salin Tagar
            </button>
          </div>
          <div id="ig-tags" class="p-3 rounded-xl bg-black/60 border border-slate-800 text-xs text-amber-300/90 mono">#MbahSlamet #SerialKillerBanjarnegara #TrueCrimeIndonesia #KasusKriminal #InvestigasiKriminal #BeritaKriminal #DetikJateng #Banjarnegara #KriminalJateng #HukumDanKriminal #ReelsCrime</div>
        </div>
      </div>
    </div>

    <!-- 14 Shots Grid with Mandatory Shot 00 Cover Image -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      
    <!-- Shot 00 Cover -->
    <div class="bg-[#181216] border-2 border-red-600/70 rounded-2xl overflow-hidden flex flex-col hover:border-red-400 transition shadow-xl sm:col-span-2 md:col-span-1 lg:col-span-1">
      <div class="relative aspect-[9/16] bg-slate-950 overflow-hidden">
        <img src="keyframes/cover-shot-00.jpg" alt="Cover Hook" class="w-full h-full object-cover" />
        <div class="absolute top-3 left-3 bg-red-600 text-white font-black text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-md shadow-lg">
          SHOT 00 &bull; MANDATORY COVER
        </div>
        <div class="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-md p-2.5 rounded-lg border border-red-500/40 text-[11px] text-red-200 font-semibold text-center">
          0.00s &ndash; 1.30s (High-CTR Hook)
        </div>
      </div>
      <div class="p-4 space-y-1.5 flex-1 bg-gradient-to-b from-red-950/30 to-transparent">
        <div class="text-xs font-bold text-red-400 uppercase tracking-wider">Hook Thumbnail</div>
        <p class="text-xs text-slate-300 font-medium leading-relaxed">
          Teks besar "SERIAL KILLER BANJARNEGARA" dengan cangkir racun potasium sianida dan siluet Mbah Slamet.
        </p>
      </div>
    </div>
  
    ${Array.from({ length: 14 }, (_, i) => {
      const sNum = i + 1;
      const sNumStr = String(sNum).padStart(2, '0');
      return `
    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-amber-500/50 transition shadow-lg">
      <div class="relative aspect-[9/16] bg-slate-950 overflow-hidden">
        <img src="keyframes/shot-${sNumStr}.jpg" alt="Shot ${sNum}" class="w-full h-full object-cover" />
        <div class="absolute top-3 left-3 bg-slate-900/90 text-amber-400 font-mono font-bold text-[10px] tracking-wider px-2 py-0.5 rounded border border-amber-500/40">
          SHOT ${sNumStr}
        </div>
      </div>
      <div class="p-4 space-y-1.5 flex-1">
        <div class="text-xs font-bold text-amber-400 uppercase tracking-wider">Shot ${sNum}</div>
        <p class="text-xs text-slate-300 font-medium leading-relaxed">
          Visual scene ${sNum} &bull; Transisi Noir Glitch &bull; Ken Burns Motion
        </p>
      </div>
    </div>`;
    }).join('')}
    </div>
  </div>

  <script>
    function copyText(elementId, btn) {
      const el = document.getElementById(elementId);
      if (!el) return;
      const text = el.innerText || el.textContent;
      navigator.clipboard.writeText(text.trim()).then(() => {
        const original = btn.innerText;
        btn.innerText = 'Tersalin! ✓';
        btn.classList.add('bg-emerald-500', 'text-slate-950', 'border-emerald-400');
        btn.classList.remove('bg-slate-800', 'text-amber-400', 'border-slate-700');
        setTimeout(() => {
          btn.innerText = original;
          btn.classList.remove('bg-emerald-500', 'text-slate-950', 'border-emerald-400');
          btn.classList.add('bg-slate-800', 'text-amber-400', 'border-slate-700');
        }, 2000);
      });
    }

    function switchPlatformTab(platform) {
      document.querySelectorAll('.platform-content').forEach((el) => el.classList.add('hidden'));
      document.querySelectorAll('.platform-tab').forEach((el) => {
        el.classList.remove('bg-amber-500', 'text-slate-950', 'border-amber-400');
        el.classList.add('bg-slate-900', 'text-slate-400', 'border-slate-800');
      });
      const activeContent = document.getElementById('content-' + platform);
      if (activeContent) activeContent.classList.remove('hidden');
      const activeTab = document.getElementById('tab-' + platform);
      if (activeTab) {
        activeTab.classList.add('bg-amber-500', 'text-slate-950', 'border-amber-400');
        activeTab.classList.remove('bg-slate-900', 'text-slate-400', 'border-slate-800');
      }
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(portalPath, html, 'utf8');
}

main().catch((err) => {
  console.error('\n❌ Fatal Error in Mbah Slamet Pipeline:', err);
  process.exit(1);
});
