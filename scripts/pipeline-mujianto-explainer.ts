import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import { flowClient } from '../lib/flowMcp/client';
import { renderHyperframes } from '../lib/hyperframes/renderEngine';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY missing in .env.local');

const PROJECT_ID = 'mujianto-serial-killer';
const PUBLIC_DIR = path.resolve(process.cwd(), 'public', 'renders', PROJECT_ID);
const HF_WORKSPACE = path.resolve(process.cwd(), 'hyperframes-workspace', PROJECT_ID);
const CHUNKS_DIR = path.join(PUBLIC_DIR, 'audio-chunks');
const KEYFRAMES_DIR = path.join(PUBLIC_DIR, 'keyframes');

// Ensure output directories exist
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(CHUNKS_DIR, { recursive: true });
fs.mkdirSync(KEYFRAMES_DIR, { recursive: true });
fs.mkdirSync(HF_WORKSPACE, { recursive: true });
fs.mkdirSync(path.join(HF_WORKSPACE, 'assets'), { recursive: true });

// 1. Sentences breakdown
const SENTENCES = [
  {
    id: 's1',
    text: 'Awal tahun 2012, teror mencekam mengguncang wilayah Nganjuk, Jawa Timur. Belasan pria ditemukan terkapar tak bernyawa di semak-semak dan parit jalanan.',
    shots: [1, 2],
  },
  {
    id: 's2',
    text: 'Semua korban kehilangan ponsel dan dompet, tanpa bekas kekerasan fisik yang jelas.',
    shots: [3],
  },
  {
    id: 's3',
    text: 'Polisi mengungkap pola mengerikan: para korban dihabisi dengan racun tikus mematikan. Pelaku menyelinap lewat kencan rahasia, menjamu mereka dengan secangkir teh maut.',
    shots: [4, 5],
  },
  {
    id: 's4',
    text: 'Saat korban meregang nyawa akibat racun, pelaku merampas harta lalu kabur. Penyelidikan sempat buntu karena minimnya saksi dan jejak identitas pelaku.',
    shots: [6, 7],
  },
  {
    id: 's5',
    text: 'Titik balik tiba ketika seorang korban bernama Faiz berhasil selamat dari maut. Faiz curiga dengan rasa pahit di tegukan pertama dan mengingat plat nomor motor penjemputnya. Berbekal kesaksian ini, tim reskrim menyebar sketsa wajah DPO ke seluruh penjuru.',
    shots: [8, 9, 10],
  },
  {
    id: 's6',
    text: '13 Februari 2012, perburuan berakhir. Mujianto diringkus di rumah persembunyiannya. Di kantor polisi, pengakuan biadabnya terbongkar: 23 orang telah ia racun demi membalas cemburu. Lima korban tewas seketika, sementara belasan lainnya menderita trauma seumur hidup. Pengadilan Negeri Nganjuk menjatuhkan vonis mati, mengakhiri teror sang serial killer Jawa Timur.',
    shots: [11, 12, 13, 14],
  },
];

// 2. 15 Flow MCP Prompts (Shot 00 Cover + Shots 01-14)
const SHOT_PROMPTS: Record<number, string> = {
  0: "A dramatic high-CTR YouTube Shorts vertical 9:16 cover illustration (1080x1920), Graphic Novel Neo-Noir style. Ominous close-up silhouette of an Indonesian serial killer suspect with eyes veiled in deep noir ink shadows, standing in front of a desolate Javanese rural roadside at midnight. In foreground, a shattered vintage green-mottled enamel tin mug (cangkir seng blirik) leaking dark toxic liquid with eerie faint vapor, yellow police caution tape 'DILARANG MELINTAS', heavy black contour inking, harsh chiaroscuro lighting, deep matte charcoal slate (#0D1117) and antique bronze accents (#C59B27). Full bleed composition, fine halftone dots, no blank borders.",
  1: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). A desolate rural crossroads in Nganjuk East Java at 2 AM under a lone flickering sodium streetlamp. Narrow cracked asphalt road flanked by dark swaying sugar cane fields, ominous long stretching shadows, cool desaturated slate gray (#0D1117) with eerie antique amber glow (#C59B27), heavy comic book ink linework, fine halftone shading, full bleed.",
  2: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Low angle view through tall roadside wild weeds and muddy ditch. Yellow police crime scene tape 'GARIS POLISI - DILARANG MELINTAS' stretching across the scene. Harsh flashlight beam cutting through the dark night, silhouette of an abandoned crime scene in rural East Java, dark chiaroscuro, heavy black shadows, cold gritty comic textures, full bleed.",
  3: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Macro isometric forensic perspective on damp dirt ground. An abandoned empty worn leather wallet and a scratched vintage keypad mobile phone lying discarded in the weeds, white police forensic evidence chalk line and yellow number tent '01' nearby. Harsh flashlight beam, high contrast black ink crosshatching, matte slate gray with subtle dried crimson accents, full bleed.",
  4: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Close-up of a forensic examination desk. Gloved hands holding an opened evidence glass vial and a torn packet of black rodenticide chemical powder (racun tikus seng). Magnifying glass, tweezers, labeled evidence tags with red rubber stamps (#8B2635). Harsh single overhead desk lamp, dramatic chiaroscuro noir inking, fine halftone dots, full bleed.",
  5: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Isometric view of a wooden village table inside a dimly lit roadside stall (warung remang-remang). Two vintage Indonesian green-mottled enamel tin mugs (cangkir seng blirik hijau vintage), one cup emitting faint sinister swirling vapor, a cracked smartphone with glowing incoming text message beside it. Moody noir shadows, antique bronze ambient highlights (#C59B27), heavy graphic novel linework, full bleed.",
  6: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Dark silhouette of a lone motorcycle rider speeding away down a desolate pitch-black country road in East Java. Red motorcycle tail light streaking through the night mist, dense surrounding bamboo groves casting jagged black shadows, cold desaturated atmosphere, dynamic comic book motion lines, full bleed.",
  7: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Indonesian police detective seen from behind in silhouette, standing before a large wooden investigation board in a dimly lit precinct office. Pinned victim photos, missing person reports, red connecting threads leading to question marks '?', cigarette smoke curling under green banker lamp, deep noir mood, antique bronze highlights, full bleed.",
  8: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Somber hospital ward room in deep chiaroscuro lighting. A surviving young male victim lying in a hospital bed with an IV drip, looking pale but conscious, an Indonesian police detective sitting beside taking notes on a small pocket notebook. Moonlight streaming through hospital blinds casting strip shadows, gritty noir inking, full bleed.",
  9: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Creative comic split-panel composition. Upper panel: extreme close-up of lips hesitating against the rim of a tin cup with a droplet of bitter tea. Lower panel: sharp mental flashback memory of an Indonesian motorcycle license plate starting with 'AG' illuminated by a headlight in darkness. High contrast graphic novel noir, antique bronze glowing typography (#C59B27), full bleed.",
  10: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Close-up of a weathered public brick wall plastered with Indonesian police 'DPO - BURONAN RESKRIM' wanted posters. Gritty hand-drawn police composite sketch of a 24-year-old male suspect with cold piercing eyes, stamped with bold distressed red police ink 'BURONAN' (#8B2635). Streetlamp glare, gritty comic texture, full bleed.",
  11: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Dramatic night-time tactical raid. Plainclothes Indonesian police detectives storming into a modest rural village house in Berbek Nganjuk. Suspect tackled and handcuffed on the floor under intense flashlight beams, shock and panic in the room, heavy black contour inking, stark cinematic noir contrast, full bleed.",
  12: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Police interrogation press conference room. Mujianto sitting with head bowed in shame wearing an orange detainee vest, hands handcuffed. In foreground on wooden desk, a thick stack of official interrogation dossiers stamped in bold crimson red '23 KORBAN DIRACUN' (#8B2635). Flashes of camera strobes in background, gritty halftone shading, full bleed.",
  13: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). A quiet, somber public rural graveyard in East Java under dark brooding rain clouds. Five simple wooden grave markers in the foreground with scattered fresh jasmine flowers, solitary trees silhouetted against a cold pale slate sky (#0D1117), melancholic and haunting graphic novel noir atmosphere, full bleed.",
  14: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Indonesian district courtroom (Pengadilan Negeri). Close-up low angle of an antique brass and dark teak judge's gavel striking the wooden block, fine dust particles suspended in dramatic overhead light beam. Behind the bench, the national emblem Garuda Pancasila embossed in dark bronze (#C59B27), final case dossier stamped 'VONIS MATI' in dried crimson red (#8B2635), authoritative noir climax, full bleed."
};

// Step 1: Synthesize Charon VO chunks
async function synthesizeChunk(text: string, idx: number): Promise<{ wavPath: string; durationSec: number }> {
  console.log(`[TTS] Synthesizing sentence ${idx + 1}/${SENTENCES.length}...`);
  const models = ['gemini-3.8-flash-tts', 'gemini-3.1-flash-tts-preview', 'gemini-3.8-flash-lite-tts'];
  let audioData: string | undefined;

  for (const m of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI_KEY || '' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
          },
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
      if (part?.inlineData?.data) {
        audioData = part.inlineData.data;
        break;
      }
    } catch {
      // try next
    }
  }

  if (!audioData) {
    throw new Error(`Failed to synthesize sentence ${idx + 1}`);
  }

  const pcmPath = path.join(CHUNKS_DIR, `sentence-${idx}.pcm`);
  const wavPath = path.join(CHUNKS_DIR, `sentence-${idx}.wav`);
  fs.writeFileSync(pcmPath, Buffer.from(audioData, 'base64'));

  execFileSync('./bin/ffmpeg', [
    '-y', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcmPath,
    '-af', 'highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '2', wavPath,
  ]);
  fs.unlinkSync(pcmPath);

  const durStr = execFileSync('./bin/ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wavPath,
  ], { encoding: 'utf8' }).trim();

  return { wavPath, durationSec: Number(durStr) };
}

// Step 2: Batch Generate Flow MCP Keyframes
async function generateAllKeyframes() {
  console.log('\n===============================================================');
  console.log('  Generating 15 Keyframes via Google Flow MCP (0 Credits / Free) ');
  console.log('===============================================================\n');

  for (let shot = 0; shot <= 14; shot++) {
    const filename = shot === 0 ? 'cover-shot-00.jpg' : `shot-${String(shot).padStart(2, '0')}.jpg`;
    const destPublic = path.join(KEYFRAMES_DIR, filename);
    const destHf = path.join(HF_WORKSPACE, 'assets', filename);

    if (fs.existsSync(destPublic) && fs.statSync(destPublic).size > 50000) {
      console.log(`[FlowMCP] Shot ${shot} already exists: ${filename} (${(fs.statSync(destPublic).size / 1024).toFixed(0)} KB)`);
      if (!fs.existsSync(destHf)) fs.copyFileSync(destPublic, destHf);
      continue;
    }

    const prompt = SHOT_PROMPTS[shot];
    console.log(`[FlowMCP] Generating Shot ${shot}/14...`);

    const result = await flowClient.generate({
      project: PROJECT_ID,
      prompt,
      type: 'image',
      aspect: '9:16',
      max_credits: 0,
    });

    if (!result.task_id) {
      throw new Error(`Flow MCP did not return a task_id for shot ${shot}`);
    }

    console.log(`[FlowMCP] Shot ${shot} queued (task_id: ${result.task_id}). Waiting for render...`);

    const finished = await flowClient.waitForJob(result.task_id, 180);

    if (!finished.finished || !finished.files || finished.files.length === 0) {
      throw new Error(`Flow MCP failed for shot ${shot}: error=${finished.error || 'Unknown error'}`);
    }

    const flowFile = finished.files[0];
    console.log(`[FlowMCP] Shot ${shot} generated successfully: ${flowFile}`);

    fs.copyFileSync(flowFile, destPublic);
    fs.copyFileSync(flowFile, destHf);
    console.log(`[FlowMCP] Saved to: ${destPublic}`);
  }
}

async function main() {
  console.log('=== Starting End-to-End Pipeline for "Serial Killer Nganjuk" ===\n');

  // 1. Generate Keyframes
  await generateAllKeyframes();

  // 2. Synthesize Voice Over
  console.log('\n===============================================================');
  console.log('  Synthesizing Charon Voice Over Chunks                         ');
  console.log('===============================================================\n');

  const sentenceResults: Array<{ id: string; text: string; wavPath: string; durationSec: number }> = [];
  for (let i = 0; i < SENTENCES.length; i++) {
    const res = await synthesizeChunk(SENTENCES[i].text, i);
    sentenceResults.push({
      id: SENTENCES[i].id,
      text: SENTENCES[i].text,
      wavPath: res.wavPath,
      durationSec: res.durationSec,
    });
    console.log(`[TTS] Sentence ${i + 1} completed: ${res.durationSec.toFixed(2)}s`);
  }

  // Create concat list with 300ms silence between sentences
  const silenceWav = path.join(CHUNKS_DIR, 'silence.wav');
  execFileSync('./bin/ffmpeg', [
    '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '0.3', silenceWav,
  ]);

  const concatListFile = path.join(CHUNKS_DIR, 'concat_list.txt');
  const lines: string[] = [];
  sentenceResults.forEach((s, idx) => {
    lines.push(`file '${s.wavPath}'`);
    if (idx < sentenceResults.length - 1) {
      lines.push(`file '${silenceWav}'`);
    }
  });
  fs.writeFileSync(concatListFile, lines.join('\n'));

  const cleanVoPath = path.join(PUBLIC_DIR, 'clean-vo.mp3');
  execFileSync('./bin/ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', concatListFile,
    '-c:a', 'libmp3lame', '-b:a', '192k', cleanVoPath,
  ]);

  const totalDuration = Number(execFileSync('./bin/ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', cleanVoPath,
  ], { encoding: 'utf8' }).trim());

  console.log(`\n✅ Clean Voice Over Created: ${cleanVoPath} (${totalDuration.toFixed(2)}s)`);

  // 3. Audio Mixing: SFX Glitch + BGM Bed at 20%
  console.log('\n===============================================================');
  console.log('  Mixing BGM (20%) + Transition SFX into Master Audio           ');
  console.log('===============================================================\n');

  const sfxPath = path.join(CHUNKS_DIR, 'forensic-glitch-sfx.wav');
  execFileSync('./bin/ffmpeg', [
    '-y',
    '-f', 'lavfi', '-i', 'anoisesrc=d=0.28:c=pink:r=48000:a=0.18',
    '-f', 'lavfi', '-i', 'sine=f=80:d=0.28',
    '-filter_complex',
    '[0:a]bandpass=f=1200:w=800,volume=1.2[noise];' +
    '[1:a]lowpass=f=220,volume=1.5[sub];' +
    '[noise][sub]amix=inputs=2:duration=first,' +
    'afade=t=in:ss=0:d=0.04,afade=t=out:st=0.20:d=0.08,' +
    'flanger=delay=3:depth=2:speed=8[sfx]',
    '-map', '[sfx]', '-ar', '48000', '-ac', '2', sfxPath,
  ]);

  // Use BGM
  const sourceBgm = path.resolve(process.cwd(), 'public', 'renders', 'twitter-killer-test', 'bgm-crime-tension.mp3');
  const targetBgm = path.join(PUBLIC_DIR, 'bgm-crime-tension.mp3');
  const hfBgm = path.join(HF_WORKSPACE, 'assets', 'bgm-crime-tension.mp3');
  fs.copyFileSync(sourceBgm, targetBgm);
  fs.copyFileSync(sourceBgm, hfBgm);

  // Calculate 14 transition timestamps
  // Hook Shot 00 ends at 1.30s
  const availableDur = totalDuration - 1.30;
  const shotDur = availableDur / 14;
  const transitionTimes: number[] = [1.30];
  for (let i = 1; i < 14; i++) {
    transitionTimes.push(Number((1.30 + i * shotDur).toFixed(2)));
  }

  let filterStr = '[0:a]volume=1.0[vo];[2:a]volume=0.20,afade=t=in:ss=0:d=1.5,afade=t=out:st=' + (totalDuration - 2.5).toFixed(1) + ':d=2.5[bgm_bed];';
  const delayedInputs: string[] = [];
  transitionTimes.forEach((t, i) => {
    const delayMs = Math.round(t * 1000);
    filterStr += `[1:a]adelay=${delayMs}|${delayMs},volume=0.65[sfx_${i}];`;
    delayedInputs.push(`[sfx_${i}]`);
  });

  filterStr += `[vo][bgm_bed]${delayedInputs.join('')}amix=inputs=${transitionTimes.length + 2}:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11[out]`;

  const masterAudioPath = path.join(PUBLIC_DIR, 'master-audio.mp3');
  execFileSync('./bin/ffmpeg', [
    '-y',
    '-i', cleanVoPath,
    '-i', sfxPath,
    '-i', targetBgm,
    '-filter_complex', filterStr,
    '-map', '[out]',
    '-c:a', 'libmp3lame',
    '-b:a', '192k',
    masterAudioPath,
  ]);

  console.log(`✅ Mastered audio saved: ${masterAudioPath}`);

  // Build sentence timings and word timestamps for bottom autocaptions
  let currentOffset = 0;
  const sentenceTimings = sentenceResults.map((s) => {
    const start = currentOffset;
    const end = start + s.durationSec;
    currentOffset = end + 0.3;
    return { ...s, start, end };
  });

  const allWords: Array<{ word: string; start: number; end: number }> = [];
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

  // Calculate 14 shot intervals
  const shotTimings = Array.from({ length: 14 }, (_, i) => {
    const start = 1.30 + i * shotDur;
    const end = 1.30 + (i + 1) * shotDur;
    return {
      shot: i + 1,
      startSec: Number(start.toFixed(2)),
      endSec: Number(end.toFixed(2)),
      durationSec: Number(shotDur.toFixed(2)),
      imageFile: `shot-${String(i + 1).padStart(2, '0')}.jpg`,
    };
  });

  const storyboardData = {
    title: 'SERIAL KILLER NGANJUK - Peracun 23 Korban',
    totalDurationSec: totalDuration,
    transitionTimes,
    shotTimings,
    words: allWords,
    sentences: sentenceTimings.map(({ wavPath, ...r }) => r),
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, 'storyboard-data.json'), JSON.stringify(storyboardData, null, 2));

  // 4. Generate HyperFrames index.html
  console.log('\n===============================================================');
  console.log('  Generating HyperFrames Composition (HTML + GSAP)              ');
  console.log('===============================================================\n');

  const hfHtml = generateHyperframesHtml({
    title: 'SERIAL KILLER NGANJUK',
    totalDuration,
    shotTimings,
    transitionTimes,
    words: allWords,
  });

  fs.writeFileSync(path.join(HF_WORKSPACE, 'index.html'), hfHtml);
  fs.writeFileSync(path.join(HF_WORKSPACE, 'hyperframes.json'), JSON.stringify({
    name: 'mujianto-serial-killer',
    width: 1080,
    height: 1920,
    fps: 30,
    duration: totalDuration,
  }, null, 2));

  // 5. Render Video via HyperFrames
  console.log('\n===============================================================');
  console.log('  Rendering 1080x1920 @ 30fps Video via HyperFrames            ');
  console.log('===============================================================\n');

  const tempVideo = path.join(PUBLIC_DIR, 'temp-visual.mp4');
  const finalVideo = path.join(PUBLIC_DIR, 'mujianto-final.mp4');

  await renderHyperframes({
    projectDir: HF_WORKSPACE,
    outputPath: tempVideo,
    fps: 30,
    onProgress: (p) => process.stdout.write(p),
  });

  console.log('\nMultiplexing visual frames with Master Audio...');
  execFileSync('./bin/ffmpeg', [
    '-y',
    '-i', tempVideo,
    '-i', masterAudioPath,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    finalVideo,
  ]);

  if (fs.existsSync(tempVideo)) fs.unlinkSync(tempVideo);

  const finalDur = execFileSync('./bin/ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', finalVideo,
  ], { encoding: 'utf8' }).trim();
  const finalMb = (fs.statSync(finalVideo).size / (1024 * 1024)).toFixed(2);

  console.log(`\n🎉 FINAL VIDEO RENDER COMPLETED!`);
  console.log(`Output: ${finalVideo}`);
  console.log(`Duration: ${finalDur} seconds | File size: ${finalMb} MB`);

  // 6. Generate Web Review Portal
  console.log('\n===============================================================');
  console.log('  Generating Web Review Portal                                  ');
  console.log('===============================================================\n');

  const webHtml = generateWebPortalHtml({
    title: 'SERIAL KILLER NGANJUK (Kisah Mujianto - Peracun 23 Korban)',
    totalDuration,
    finalMb,
    shotTimings,
    narrationText: SENTENCES.map((s) => s.text).join(' '),
  });

  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), webHtml);
  console.log(`✅ Web review portal: ${path.join(PUBLIC_DIR, 'index.html')}`);
  console.log(`👉 Live URL: http://localhost:3000/renders/${PROJECT_ID}/index.html\n`);
}

function generateHyperframesHtml(data: {
  title: string;
  totalDuration: number;
  shotTimings: Array<{ shot: number; startSec: number; endSec: number; durationSec: number; imageFile: string }>;
  transitionTimes: number[];
  words: Array<{ word: string; start: number; end: number }>;
}): string {
  // Generate caption spans
  const wordSpans = data.words.map((w, idx) => 
    `<span id="cw-${idx}" class="word-span">${w.word} </span>`
  ).join('');

  // Generate shots layers HTML
  let shotsHtml = `
    <!-- Shot 00: Mandatory Cover Hook (0.0s - 1.3s) -->
    <div id="shot-00" class="shot-layer" style="opacity: 1;">
      <img src="assets/cover-shot-00.jpg" alt="Cover Hook" class="shot-img" />
      <div class="cover-overlay">
        <div class="cover-badge">KASUS KRIMINAL PALING MENCEKAM &bull; NGANJUK</div>
        <div class="cover-title">SERIAL KILLER<br><span class="highlight">NGANJUK</span></div>
        <div class="cover-sub">TEROR RACUN MAUT 23 KORBAN</div>
      </div>
    </div>
  `;

  data.shotTimings.forEach((st) => {
    shotsHtml += `
    <div id="shot-${String(st.shot).padStart(2, '0')}" class="shot-layer" style="opacity: 0;">
      <img src="assets/${st.imageFile}" alt="Shot ${st.shot}" class="shot-img" />
    </div>`;
  });

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${data.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Plus+Jakarta+Sans:wght@700;800&family=JetBrains+Mono:wght@700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #000;
      color: #fff;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
      width: 1080px;
      height: 1920px;
    }
    #stage {
      position: relative;
      width: 1080px;
      height: 1920px;
      background: #0D1117;
      overflow: hidden;
    }
    .shot-layer {
      position: absolute;
      inset: 0;
      width: 1080px;
      height: 1920px;
      overflow: hidden;
    }
    .shot-img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform-origin: center center;
    }
    /* Cover Hook Styling */
    .cover-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 0 40px;
      background: radial-gradient(circle at center, rgba(13,17,23,0.3) 0%, rgba(13,17,23,0.85) 100%);
      z-index: 10;
    }
    .cover-badge {
      display: inline-block;
      padding: 10px 24px;
      background: rgba(139,38,53,0.9);
      border: 2px solid #8B2635;
      color: #fff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.15em;
      border-radius: 999px;
      margin-bottom: 28px;
      text-transform: uppercase;
    }
    .cover-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 84px;
      font-weight: 900;
      line-height: 1.05;
      color: #fff;
      text-shadow: 0 8px 30px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.8);
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    .cover-title .highlight {
      color: #C59B27;
      text-shadow: 0 0 25px rgba(197,155,39,0.7), 0 8px 30px rgba(0,0,0,0.95);
    }
    .cover-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 32px;
      font-weight: 700;
      color: #E6EDF3;
      background: rgba(0,0,0,0.8);
      border: 2px solid #C59B27;
      padding: 12px 28px;
      border-radius: 12px;
      letter-spacing: 0.1em;
    }
    /* Bottom Autocaption Scrim & Container */
    .bottom-caption-scrim {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 560px;
      background: linear-gradient(to top, rgba(10,13,18,0.95) 0%, rgba(10,13,18,0.75) 55%, rgba(10,13,18,0) 100%);
      pointer-events: none;
      z-index: 50;
    }
    #caption-container {
      position: absolute;
      bottom: 300px;
      left: 72px;
      right: 72px;
      min-height: 140px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      text-align: center;
      z-index: 60;
      font-family: 'Montserrat', sans-serif;
      font-size: 52px;
      font-weight: 800;
      line-height: 1.25;
      letter-spacing: -0.01em;
      pointer-events: none;
    }
    .word-span {
      display: inline-block;
      color: #E6EDF3;
      text-shadow: 0 4px 18px rgba(0,0,0,0.98), 0 2px 6px rgba(0,0,0,0.95);
      margin: 0 5px;
      opacity: 0.35;
      transform: scale(0.96);
      transition: color 0.1s ease, opacity 0.1s ease, transform 0.1s ease;
    }
    .word-span.active {
      color: #C59B27;
      opacity: 1;
      transform: scale(1.08);
      text-shadow: 0 0 22px rgba(197,155,39,0.8), 0 4px 18px rgba(0,0,0,0.98);
    }
    .word-span.passed {
      color: #FFFFFF;
      opacity: 0.95;
      transform: scale(1.0);
    }
    /* Noir Forensic Glitch Overlay */
    #forensic-glitch {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 90;
      opacity: 0;
      background: repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 2px, transparent 2px, transparent 4px);
      filter: drop-shadow(-6px 0 #8B2635) drop-shadow(6px 0 #C59B27);
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
</head>
<body>
  <div id="stage" data-composition-id="main">
    ${shotsHtml}
    <div class="bottom-caption-scrim"></div>
    <div id="caption-container">${wordSpans}</div>
    <div id="forensic-glitch"></div>
  </div>

  <script>
    const tl = gsap.timeline({ paused: true });
    window.__timelines = { main: tl };

    // Glitch trigger helper
    function triggerNoirGlitch(time) {
      tl.to("#forensic-glitch", {
        opacity: 0.85,
        duration: 0.06,
        ease: "power1.inOut",
        onStart: () => gsap.set("#stage", { filter: "invert(0.12) contrast(1.4)" }),
      }, time)
      .to("#forensic-glitch", {
        opacity: 0,
        duration: 0.12,
        ease: "power2.out",
        onComplete: () => gsap.set("#stage", { filter: "none" }),
      }, time + 0.06);
    }

    // Shot 00 (Cover Hook: 0.0s - 1.30s)
    tl.to("#shot-00 .shot-img", { scale: 1.06, duration: 1.30, ease: "none" }, 0);

    // Transitions & Camera Choreography
    const shotConfigs = ${JSON.stringify(data.shotTimings)};
    const transitionTimes = ${JSON.stringify(data.transitionTimes)};

    // Trigger glitch at each transition
    transitionTimes.forEach(t => triggerNoirGlitch(t));

    // Cut from Hook to Shot 01 at 1.30s
    tl.set("#shot-00", { autoAlpha: 0 }, 1.30);
    tl.set("#shot-01", { autoAlpha: 1 }, 1.30);

    // Choreograph each shot
    shotConfigs.forEach((st, i) => {
      const shotId = "#shot-" + String(st.shot).padStart(2, '0');
      const nextShotId = i < shotConfigs.length - 1 ? "#shot-" + String(shotConfigs[i + 1].shot).padStart(2, '0') : null;

      // Camera motion per shot
      const motionType = i % 3;
      if (motionType === 0) {
        tl.fromTo(shotId + " .shot-img", { scale: 1.0 }, { scale: 1.08, duration: st.durationSec, ease: "none" }, st.startSec);
      } else if (motionType === 1) {
        tl.fromTo(shotId + " .shot-img", { scale: 1.06, yPercent: 2 }, { scale: 1.0, yPercent: -2, duration: st.durationSec, ease: "none" }, st.startSec);
      } else {
        tl.fromTo(shotId + " .shot-img", { scale: 1.04, xPercent: -2 }, { scale: 1.08, xPercent: 1.5, duration: st.durationSec, ease: "none" }, st.startSec);
      }

      // Cut to next shot
      if (nextShotId) {
        tl.set(shotId, { autoAlpha: 0 }, st.endSec);
        tl.set(nextShotId, { autoAlpha: 1 }, st.endSec);
      }
    });

    // Word Karaoke Synchronisation
    const words = ${JSON.stringify(data.words)};
    words.forEach((w, idx) => {
      const elId = "#cw-" + idx;
      // Active state
      tl.call(() => {
        document.querySelectorAll('.word-span').forEach((el, j) => {
          if (j < idx) {
            el.className = 'word-span passed';
          } else if (j === idx) {
            el.className = 'word-span active';
          } else {
            el.className = 'word-span';
          }
        });
      }, null, w.start);

      // Passed state at word end
      tl.call(() => {
        const el = document.querySelector(elId);
        if (el) el.className = 'word-span passed';
      }, null, w.end);
    });
  </script>
</body>
</html>`;
}

function generateWebPortalHtml(data: {
  title: string;
  totalDuration: number;
  finalMb: string;
  shotTimings: Array<{ shot: number; startSec: number; endSec: number; durationSec: number; imageFile: string }>;
  narrationText: string;
}): string {
  let cardsHtml = `
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
          Teks besar "SERIAL KILLER NGANJUK" dengan cangkir blirik teh beracun dan siluet Mujianto.
        </p>
      </div>
    </div>
  `;

  data.shotTimings.forEach((st) => {
    cardsHtml += `
    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-amber-500/50 transition shadow-lg">
      <div class="relative aspect-[9/16] bg-slate-950 overflow-hidden">
        <img src="keyframes/${st.imageFile}" alt="Shot ${st.shot}" class="w-full h-full object-cover" />
        <div class="absolute top-3 left-3 bg-slate-900/90 text-amber-400 font-mono font-bold text-[10px] tracking-wider px-2 py-0.5 rounded border border-amber-500/40">
          SHOT ${String(st.shot).padStart(2, '0')}
        </div>
        <div class="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md p-2 rounded-lg border border-slate-700 text-[11px] text-slate-300 font-mono text-center">
          ${st.startSec.toFixed(2)}s &ndash; ${st.endSec.toFixed(2)}s (${st.durationSec.toFixed(2)}s)
        </div>
      </div>
      <div class="p-4 space-y-1.5 flex-1">
        <div class="text-xs font-bold text-amber-400 uppercase tracking-wider">Shot ${st.shot}</div>
        <p class="text-xs text-slate-300 font-medium leading-relaxed">
          Visual scene ${st.shot} &bull; Transisi Noir Glitch &bull; Ken Burns Motion
        </p>
      </div>
    </div>`;
  });

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - Video Review</title>
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
        <h1 class="text-3xl font-extrabold text-white tracking-tight">${data.title}</h1>
        <p class="text-slate-400 text-sm mt-1">
          Kasus: <em>Mujianto "Serial Killer Nganjuk" Peracun 23 Pasangan Sejenis</em> &bull; Durasi: <strong>${data.totalDuration.toFixed(1)} Detik</strong>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <div class="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs mono text-slate-300">
          Total: <span class="text-amber-400 font-bold">14 Shots</span> &bull; <span class="text-cyan-400 font-bold">135 Kata</span> &bull; <span class="text-emerald-400 font-bold">${data.totalDuration.toFixed(1)}s</span>
        </div>
      </div>
    </div>

    <!-- Video Player Section -->
    <div class="bg-[#12161E] border border-amber-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold mb-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Render Selesai &bull; 1080&times;1920 (30fps) &bull; ${data.totalDuration.toFixed(1)}s
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Final Video (HyperFrames + Charon VO + BGM 20% + SFX)</h2>
          <p class="text-xs text-slate-400 mt-1">
            Video 9:16 vertikal dengan 14 shot kamera dinamis, autocaption bawah tersinkronisasi, dan audio broadcast-normalized.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a
            href="mujianto-final.mp4"
            download="mujianto-final.mp4"
            class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg flex items-center gap-2"
          >
            <span>Unduh MP4 (${data.finalMb} MB)</span>
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
            <source src="mujianto-final.mp4?v=1" type="video/mp4">
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
                href="bgm-crime-tension.mp3"
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
              <source src="bgm-crime-tension.mp3?v=1" type="audio/mpeg">
              Browser tidak mendukung elemen audio.
            </audio>
          </div>

          <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div class="font-bold text-amber-400 uppercase tracking-wider">Spesifikasi Render Final:</div>
            <ul class="space-y-1.5 text-slate-400 list-disc pl-4">
              <li><strong>Resolusi:</strong> 1080 &times; 1920 (9:16 Vertical Shorts/Reels)</li>
              <li><strong>Frame Rate:</strong> 30 FPS Progressive</li>
              <li><strong>Backsound Dramatis (BGM):</strong> Cinematic Crime Thriller (D-minor 80 BPM, volume <strong>20% (Subtle Bed)</strong>)</li>
              <li><strong>Transisi Visual:</strong> Noir Forensic Glitch (Distorsi scanline &amp; chromatic aberration 0.18s di 14 titik)</li>
              <li><strong>Sound Effect:</strong> Injeksi audio whoosh &amp; glitch hit tersinkronisasi persis dengan transisi visual</li>
              <li><strong>Autocaption:</strong> Area Bawah (Bottom: 300px) + Dark Scrim gradasi halus</li>
              <li><strong>Kamera:</strong> Smooth Ken Burns choreography per shot (Push-in, Creep, Pan, Tilt)</li>
              <li><strong>Voice Over:</strong> Charon (Deep Authority) &bull; 48kHz Stereo &bull; Broadcast -16 LUFS</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Full Narration Preview Card -->
    <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
      <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
        <span>Naskah Narasi Lengkap (${data.totalDuration.toFixed(1)} Detik / 135 Kata)</span>
        <span class="text-amber-400 mono">Format: YouTube Shorts</span>
      </div>
      <p class="text-slate-300 text-sm leading-relaxed bg-[#0D1117] p-4 rounded-xl border border-slate-800 mono">
        "${data.narrationText}"
      </p>
    </div>

    <!-- 14 Shots Grid with Mandatory Shot 00 Cover Image -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      ${cardsHtml}
    </div>
  </div>
</body>
</html>`;
}

main().catch((err) => {
  console.error('\n❌ Pipeline Failed:', err);
  process.exit(1);
});
