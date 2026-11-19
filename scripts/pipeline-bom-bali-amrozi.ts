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

const PROJECT_ID = 'bom-bali-amrozi';
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

// 7 Concise High-Retention Narrative Sentences (<90s for TikTok/Shorts/Reels) with Dual-Layer Keywords
const SENTENCES = [
  {
    shot: 1,
    id: 's1',
    text: 'Dua ratus dua nyawa melayang di Legian... Tapi pria ini... justru tertawa lebar di depan kamera polisi. Dunia menyebutnya... The Smiling Terrorist.',
    topKeyword: '202 NYAWA & SENYUMAN',
  },
  {
    shot: 2,
    id: 's2',
    text: 'Sabtu malam, 12 Oktober 2002. Dentuman pertama di Paddy’s Pub... disusul ledakan dahsyat satu ton bahan peledak di Sari Club... meluluhlantakkan pusat keramaian Kuta.',
    topKeyword: 'LEDAKAN SARI CLUB',
  },
  {
    shot: 3,
    id: 's3',
    text: 'Di tengah puing yang membara... tim forensik menemukan satu kepingan petunjuk: serpihan pelat nomor rangka mobil Mitsubishi L300 yang hangus terbakar.',
    topKeyword: 'NOMOR RANGKA L300',
  },
  {
    shot: 4,
    id: 's4',
    text: 'Dari pelat besi itu... pelacakan bergerak cepat hingga ke sebuah bengkel di Jawa Timur. November 2002... polisi mengepung rumah seorang pria: Amrozi bin Nurhasyim.',
    topKeyword: 'BENGKEL LAMONGAN',
  },
  {
    shot: 5,
    id: 's5',
    text: 'Terbongkar persekongkolan tiga bersaudara: Mukhlas sebagai perancang taktik... Ali Imron sebagai perakit teknis... dan Amrozi... sebagai pembeli satu ton bahan kimia mematikan.',
    topKeyword: 'TRIO BERSAUDARA',
  },
  {
    shot: 6,
    id: 's6',
    text: 'Alih-alih merasa bersalah... Amrozi justru tertawa lepas dan mengacungkan jempol ke arah puluhan jurnalis. Sebuah senyuman dingin... yang memancing murka dunia.',
    topKeyword: 'SENYUMAN DINGIN',
  },
  {
    shot: 7,
    id: 's7',
    text: 'Agustus 2003... vonis mati diketuk palu hakim di Denpasar. Dan pada 9 November 2008... di bukit sunyi Nusakambangan... riwayat sang teroris tertawa resmi berakhir.',
    topKeyword: 'VONIS MATI NUSAKAMBANGAN',
  },
];

// Flow MCP Prompts for Specific Forensic Keyframes (Graphic Novel Neo-Noir)
const KEYFRAME_PROMPTS: Record<string, string> = {
  'cover-shot-00.jpg':
    "Dramatic high-CTR Instagram Reels vertical 9:16 cover illustration (1080x1920), Graphic Novel Neo-Noir Forensic style. Ominous high-contrast silhouette of Amrozi smiling chillingly in the dark foreground. In the background, charred nocturnal wreckage of Kuta with yellow police caution tape 'DILARANG MELINTAS - GARIS POLISI' and blue police stroboscopic flashes. Matte charcoal slate (#0D1117) with glowing amber highlights (#E5A93C) and deep crimson accents (#8B2635). Distressed bold stencil typography: 'TRAGEDI BOM BALI 2002' in stark white and 'THE SMILING TERRORIST' in vivid crimson ribbon. Full bleed, zero borders.",
  'kuta-night-street.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Exterior nocturnal view of Jalan Legian Kuta Bali before the 2002 tragedy. Wet asphalt reflecting warm neon signs of clubs and bars under a humid night sky. Crowds of international tourists walking along the narrow sidewalk, deep pitch chiaroscuro, heavy comic hatching and ink wash, soot black and teal palette, full bleed.",
  'l300-moving-source.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Ground-level dramatic perspective of a white Mitsubishi L300 box van cruising slowly down a narrow wet street in Kuta late at night. Dim yellowish headlights cutting through evening mist and shadows. Heavy ominous comic ink contours, brooding crime investigation tone, full bleed.",
  'paddys-pub-blast.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Interior night view of a crowded pub (Paddys Pub Kuta) right at the catastrophic initial blast. Wooden bar counters fracturing, shattered liquor bottles flying in the air, glowing orange fireball explosion illuminating stunned silhouettes, deep ink hatching, intense comic book action, full bleed, zero borders.",
  'sari-club-blast-aftermath.jpg':
    "Graphic novel neo-noir forensic vertical illustration 9:16 (1080x1920). Ground Zero aftermath visualization at Sari Club Kuta. Smoldering charred rubble, twisted iron beams, nocturnal smoke rising against dark sky, yellow police evidence markers and forensic flashlights sweeping through the debris. High contrast chiaroscuro, stark monochromatic charcoal with faint embers, full bleed.",
  'forensic-investigation-sweep.jpg':
    "Graphic novel neo-noir forensic vertical illustration 9:16 (1080x1920). Forensic investigators in dark investigative vests and protective gloves searching through the nocturnal charred rubble of Ground Zero with bright directional flashlights. Ground strewn with shattered glass, debris, and numbered yellow evidence tents. High contrast chiaroscuro, heavy ink wash, brooding soot black and amber tones, full bleed, zero borders.",
  'l300-chassis-forensic.jpg':
    "Graphic novel neo-noir forensic macro illustration 9:16 (1080x1920). Close-up macro inspection on a forensic crime lab table. A charred, bent piece of stamped iron chassis showing stamped vehicle identification numbers (VIN / nomor rangka L300) beside a yellow evidence tent 'B-01'. Harsh clinical forensic white light illuminating stamped serial digits, metallic soot, and sharp ink lines, full bleed.",
  'lamongan-workshop-raid.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Nocturnal tactical raid on a rural mechanical workshop in Tenggulun, Lamongan, East Java. Unmarked police sedans with blue strobe lights surrounding a rustic tin-roofed garage. Silhouette of tactical officers in dark vests advancing with flashlights into the workshop, dramatic rim lighting, full bleed.",
  'trio-brothers-corkboard.jpg':
    "Graphic novel neo-noir forensic vertical illustration 9:16 (1080x1920). Police crime investigation corkboard with three classified dossier portraits pinned with red pushpins: 'MUKHLAS (Strategi)', 'ALI IMRON (Perakit)', and 'AMROZI (Logistik & Kimia)'. Red yarn linking the three suspects to a blueprint of Kuta and chemical drums. Clinical analytical lighting, bold comic hatching, full bleed.",
  'chemical-explosive-drums.jpg':
    "Graphic novel neo-noir forensic vertical illustration 9:16 (1080x1920). Clandestine storage shed interior showing stacked chemical drums with warning labels for potassium chlorate and sulfur. Forensic yellow evidence tags attached to sacks of chemical fertilizer and copper detonator wire coils. Moody amber and deep indigo chiaroscuro lighting, heavy graphic novel hatching, full bleed, zero borders.",
  'amrozi-smiling-source.jpg':
    "Graphic novel neo-noir cinematic vertical portrait 9:16 (1080x1920). Dramatic close-up of Amrozi in an interrogation press room. He is smiling broadly and giving a chilling thumbs-up gesture towards a barrage of camera flashes. Heavy chiaroscuro lighting, deep shadows under cheekbones, dark indigo and charcoal wash with eerie amber rim light, unforgettable cold expression, full bleed.",
  'media-frenzy-global-outrage.jpg':
    "Graphic novel neo-noir forensic vertical illustration 9:16 (1080x1920). A sea of photojournalists with massive SLR cameras and blinding white flash strobes firing in a darkened press conference room. In the foreground, front-page newspaper headlines with bold black banners reading \"THE SMILING TERRORIST\" and \"GLOBAL OUTRAGE\". High contrast black and white comic book style with crimson red highlight accents, full bleed, zero borders.",
  'denpasar-court-gavel.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Inside the solemn Denpasar courtroom. A heavy polished wooden judge gavel (palu sidang) in the sharp foreground on a varnished wooden block. In the blurred background, the defendant bench surrounded by courtroom officers. Dramatic ray of tropical window light piercing the dust, full bleed.",
  'nusakambangan-execution-night.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Midnight view of the solitary foggy hills of Bukit Nirbaya, Nusakambangan island. Tall security watchtower with a distant sweeping searchlight cutting through dense rain mist. Dark silhouette of trees against an indigo midnight sky, cold somber closure atmosphere, full bleed.",
};

// 2 Moving Keyframe Video Prompts (Image-to-Video / Frames Mode)
const MOVING_KEYFRAME_CONFIGS = [
  {
    filename: 'moving-l300-kuta.mp4',
    title: 'Moving Video 1: Mobil L300 Kuta Malam Hari',
    firstFrameImage: 'l300-moving-source.jpg',
    prompt:
      'Maintain exact 2D Graphic Novel Neo-Noir Forensic illustration style, colors, and inking textures from the first frame. Slow creeping dolly forward camera motion as the white Mitsubishi L300 box van drives slowly down the rain-slicked nocturnal street of Kuta Bali, dim headlights cutting through mist, deep soot black shadows, atmospheric slow motion.',
  },
  {
    filename: 'moving-amrozi-smiling.mp4',
    title: 'Moving Video 2: Close-up Senyuman Dingin Amrozi',
    firstFrameImage: 'amrozi-smiling-source.jpg',
    prompt:
      'Maintain exact 2D Graphic Novel Neo-Noir Forensic illustration style, colors, and inking textures from the first frame. Slow subtle zoom-in on the grinning face of Amrozi raising his thumb in the press interrogation room, flashing camera strobes illuminating his unrepentant expression, dramatic chiaroscuro crime documentary motion.',
  },
];

// Narrative Beat Plans: 14 unique visual beats with ZERO repetition across 7 spoken sentences
const NARRATIVE_BEAT_PLANS: Array<{ images: Array<{ file: string; weight: number }> }> = [
  // Sentence 1 (Hook: 202 Nyawa & Senyuman):
  // "Dua ratus dua nyawa melayang di Legian... Tapi pria ini... justru tertawa lebar di depan kamera polisi. Dunia menyebutnya... The Smiling Terrorist."
  {
    images: [
      { file: 'kuta-night-street.jpg', weight: 1.0 },
      { file: 'moving-amrozi-smiling.mp4', weight: 1.25 },
    ],
  },
  // Sentence 2 (Tragedi Ledakan: Paddy's Pub & Sari Club):
  // "Sabtu malam, 12 Oktober 2002. Dentuman pertama di Paddy’s Pub... disusul ledakan dahsyat satu ton bahan peledak di Sari Club... meluluhlantakkan pusat keramaian Kuta."
  {
    images: [
      { file: 'paddys-pub-blast.jpg', weight: 1.0 },
      { file: 'sari-club-blast-aftermath.jpg', weight: 1.2 },
    ],
  },
  // Sentence 3 (Penyelidikan Forensik: Olah TKP & Nomor Rangka L300):
  // "Di tengah puing yang membara... tim forensik menemukan satu kepingan petunjuk: serpihan pelat nomor rangka mobil Mitsubishi L300 yang hangus terbakar."
  {
    images: [
      { file: 'forensic-investigation-sweep.jpg', weight: 1.0 },
      { file: 'l300-chassis-forensic.jpg', weight: 1.15 },
    ],
  },
  // Sentence 4 (Pelacakan Lamongan: Mobil L300 & Pengepungan Bengkel):
  // "Dari pelat besi itu... pelacakan bergerak cepat hingga ke sebuah bengkel di Jawa Timur. November 2002... polisi mengepung rumah seorang pria: Amrozi bin Nurhasyim."
  {
    images: [
      { file: 'moving-l300-kuta.mp4', weight: 1.0 },
      { file: 'lamongan-workshop-raid.jpg', weight: 1.2 },
    ],
  },
  // Sentence 5 (Trio Bersaudara & Bahan Kimia 1 Ton):
  // "Terbongkar persekongkolan tiga bersaudara: Mukhlas sebagai perancang taktik... Ali Imron sebagai perakit teknis... dan Amrozi... sebagai pembeli satu ton bahan kimia mematikan."
  {
    images: [
      { file: 'trio-brothers-corkboard.jpg', weight: 1.0 },
      { file: 'chemical-explosive-drums.jpg', weight: 1.15 },
    ],
  },
  // Sentence 6 (Senyuman Dingin & Respon Dunia):
  // "Alih-alih merasa bersalah... Amrozi justru tertawa lepas dan mengacungkan jempol ke arah puluhan jurnalis. Sebuah senyuman dingin... yang memancing murka dunia."
  {
    images: [
      { file: 'amrozi-smiling-source.jpg', weight: 1.0 },
      { file: 'media-frenzy-global-outrage.jpg', weight: 1.15 },
    ],
  },
  // Sentence 7 (Vonis Mati & Nusakambangan):
  // "Agustus 2003... vonis mati diketuk palu hakim di Denpasar. Dan pada 9 November 2008... di bukit sunyi Nusakambangan... riwayat sang teroris tertawa resmi berakhir."
  {
    images: [
      { file: 'denpasar-court-gavel.jpg', weight: 1.0 },
      { file: 'nusakambangan-execution-night.jpg', weight: 1.2 },
    ],
  },
];

// Broadcast-standard voice synthesis using Google Gemini TTS Charon with Klenik Low-End Warmth EQ
async function synthesizeSentence(text: string, idx: number): Promise<{ wavPath: string; durationSec: number }> {
  const charonWavPath = path.join(AUDIO_DIR, `charon-klenik-sentence-${idx}.wav`);

  if (fs.existsSync(charonWavPath) && fs.statSync(charonWavPath).size > 10000) {
    const dur = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', charonWavPath]).toString().trim();
    console.log(`   [VO ${idx}/7] ✅ Cache Charon Gemini ditemukan (${dur}s): ${charonWavPath}`);
    return { wavPath: charonWavPath, durationSec: parseFloat(dur) || 8.0 };
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY belum diset di .env.local!');

  console.log(`   [VO ${idx}/7] 🎙️ Mensintesis via Gemini TTS Charon (Klenik Low-End Warmth EQ)...`);
  const models = [
    'gemini-3.8-flash-tts',
    'gemini-3.8-flash-lite-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-2.5-flash-preview-tts',
  ];

  let rawPcm: Buffer | undefined;
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (b64) {
        rawPcm = Buffer.from(b64, 'base64');
        break;
      }
    } catch {
      // try next model
    }
  }

  if (!rawPcm) {
    throw new Error(`Gagal sintesis audio Charon untuk kalimat ${idx}`);
  }

  const tempPcm = path.join(AUDIO_DIR, `.temp-charon-${idx}.pcm`);
  fs.writeFileSync(tempPcm, rawPcm);

  try {
    // Gemini returns 24kHz Mono 16-bit PCM. Convert & master to 48kHz Stereo with Klenik Low-End Warmth EQ
    execFileSync(ffmpeg, [
      '-y',
      '-f', 's16le',
      '-ar', '24000',
      '-ac', '1',
      '-i', tempPcm,
      '-af', 'equalizer=f=110:width_type=o:width=1.8:g=4.0,equalizer=f=3000:width_type=o:width=1.2:g=2.2,highpass=f=75,lowpass=f=7800',
      '-ar', '48000',
      '-ac', '2',
      charonWavPath,
    ]);

    const dur = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', charonWavPath]).toString().trim();
    const durSec = parseFloat(dur) || 8.0;
    console.log(`   [VO ${idx}/7] ✅ Berhasil Charon Gemini (${durSec.toFixed(2)}s)`);
    return { wavPath: charonWavPath, durationSec: durSec };
  } finally {
    if (fs.existsSync(tempPcm)) fs.unlinkSync(tempPcm);
  }
}

async function main() {
  console.log('========================================================================');
  console.log('  🎭 PIPELINE MASTER: TRAGEDI BOM BALI 2002 (THE SMILING TERRORIST)');
  console.log('     (Charon Gemini VO • 2 Moving Keyframes • Dual-Layer Typography • <90s Shorts)');
  console.log('========================================================================\n');

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(KEYFRAMES_DIR, { recursive: true });
  fs.mkdirSync(path.join(HF_WORKSPACE, 'assets'), { recursive: true });

  // 1. Generate 10 forensic keyframes via Google Flow MCP (if not already cached)
  console.log('1. Memeriksa 10 forensic keyframes via Google Flow MCP...');
  for (const [filename, prompt] of Object.entries(KEYFRAME_PROMPTS)) {
    const destPub = path.join(KEYFRAMES_DIR, filename);
    const destHf = path.join(HF_WORKSPACE, 'assets', filename);

    if (fs.existsSync(destPub) && fs.statSync(destPub).size > 20000) {
      console.log(`   Cache ditemukan: ${filename} (${(fs.statSync(destPub).size / 1024).toFixed(0)} KB)`);
      fs.copyFileSync(destPub, destHf);
      continue;
    }

    console.log(`\n🎨 Generating via Flow MCP: ${filename}...`);
    try {
      const res = await flowClient.generate({
        project: PROJECT_ID,
        prompt,
        type: 'image',
        aspect: '9:16',
        max_credits: 0,
      });

      if (res.task_id) {
        console.log(`   Task ${res.task_id} queued. Menunggu render...`);
        const waitRes = await flowClient.waitForJob(res.task_id, 180);
        if (waitRes.finished && waitRes.files?.[0] && fs.existsSync(waitRes.files[0])) {
          fs.copyFileSync(waitRes.files[0], destPub);
          fs.copyFileSync(waitRes.files[0], destHf);
          console.log(`   ✅ Selesai: ${filename} (${(fs.statSync(destPub).size / 1024).toFixed(0)} KB)`);
        }
      }
    } catch (err: any) {
      console.warn(`   ⚠️ Gagal generate ${filename}: ${err.message}. Memakai fallback...`);
      const fallbackSrc = path.join(ROOT_DIR, 'public', 'renders', 'eno-pelaku-berbagi-peran', 'keyframes', 'cover-shot-00.jpg');
      if (fs.existsSync(fallbackSrc)) {
        fs.copyFileSync(fallbackSrc, destPub);
        fs.copyFileSync(fallbackSrc, destHf);
      }
    }
  }

  // 1B. Generate 2 Moving Keyframe Videos via Google Flow MCP (Image-to-Video / Frames Mode)
  console.log('\n1B. Memeriksa 2 video bergerak via Google Flow MCP (Frames Mode)...');
  for (const mc of MOVING_KEYFRAME_CONFIGS) {
    const destPub = path.join(KEYFRAMES_DIR, mc.filename);
    const destHf = path.join(HF_WORKSPACE, 'assets', mc.filename);
    const firstFramePath = path.resolve(KEYFRAMES_DIR, mc.firstFrameImage);

    if (fs.existsSync(destPub) && fs.statSync(destPub).size > 50000) {
      console.log(`   Cache video ditemukan: ${mc.filename} (${(fs.statSync(destPub).size / 1024 / 1024).toFixed(2)} MB)`);
      fs.copyFileSync(destPub, destHf);
      continue;
    }

    console.log(`\n🎥 Generating Moving Video via Flow MCP: ${mc.title}...`);
    console.log(`   🖼️ First Frame: ${firstFramePath}`);

    try {
      const res = await flowClient.generate({
        project: PROJECT_ID,
        prompt: mc.prompt,
        type: 'video',
        aspect: '9:16',
        first_frame: firstFramePath,
        max_credits: 30,
      });

      if (res.task_id) {
        console.log(`   Task ${res.task_id} queued. Menunggu render video (~60-120 detik)...`);
        const waitRes = await flowClient.waitForJob(res.task_id, 300);
        if (waitRes.finished && waitRes.files?.[0] && fs.existsSync(waitRes.files[0])) {
          const rawVideo = waitRes.files[0];
          // Scale/pad to 1080x1920 30fps if needed
          execFileSync(ffmpeg, [
            '-y',
            '-i', rawVideo,
            '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            destPub,
          ]);
          fs.copyFileSync(destPub, destHf);
          console.log(`   ✅ Selesai: ${mc.filename} (${(fs.statSync(destPub).size / 1024 / 1024).toFixed(2)} MB)`);
        }
      }
    } catch (err: any) {
      console.warn(`   ⚠️ Gagal generate video ${mc.filename}: ${err.message}. Memakai fallback still image...`);
      // Fallback create 5s subtle zoom video from first frame
      execFileSync(ffmpeg, [
        '-y',
        '-loop', '1',
        '-i', firstFramePath,
        '-t', '5.0',
        '-vf', 'scale=1080:1920,zoompan=z=\'min(zoom+0.0015,1.1)\':d=150:s=1080x1920:fps=30',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        destPub,
      ]);
      fs.copyFileSync(destPub, destHf);
    }
  }

  // 2. Synthesize 7 Concise Klenik Malam Storyteller Sentences with Charon Gemini VO
  console.log('\n2. Mensintesis 7 Kalimat Voice Over (Charon Gemini TTS + Klenik Low-End Warmth EQ)...');
  const sentenceTimings: Array<{ id: string; shot: number; text: string; topKeyword: string; wavPath: string; durationSec: number; start: number; end: number }> = [];

  let currentCursor = 0.08; // Start immediately from cover at 0.08s (Zero Dead Air)

  for (let i = 0; i < SENTENCES.length; i++) {
    const s = SENTENCES[i];
    const res = await synthesizeSentence(s.text, s.shot);
    const start = Number(currentCursor.toFixed(2));
    const end = Number((currentCursor + res.durationSec).toFixed(2));
    sentenceTimings.push({
      id: s.id,
      shot: s.shot,
      text: s.text,
      topKeyword: s.topKeyword,
      wavPath: res.wavPath,
      durationSec: res.durationSec,
      start,
      end,
    });
    console.log(`   [Kalimat ${i + 1}/7] (${res.durationSec.toFixed(2)}s) -> Timing: ${start}s - ${end}s | Top: "${s.topKeyword}"`);
    currentCursor = end + 0.40; // 400ms atmospheric breathing pause ala Klenik Malam
    await new Promise((r) => setTimeout(r, 600));
  }

  const introSilenceWav = path.join(AUDIO_DIR, 'intro-silence.wav');
  execFileSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '0.08', introSilenceWav]);

  const silence400Wav = path.join(AUDIO_DIR, 'silence.wav');
  execFileSync(ffmpeg, ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '0.40', silence400Wav]);

  const concatList: string[] = [];
  concatList.push(`file '${introSilenceWav}'`);
  sentenceTimings.forEach((st, idx) => {
    concatList.push(`file '${st.wavPath}'`);
    if (idx < sentenceTimings.length - 1) {
      concatList.push(`file '${silence400Wav}'`);
    }
  });

  const concatTxt = path.join(AUDIO_DIR, 'concat_vo.txt');
  fs.writeFileSync(concatTxt, concatList.join('\n'));

  const cleanVoPath = path.join(AUDIO_DIR, 'clean-vo.mp3');
  execFileSync(ffmpeg, [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatTxt,
    '-c:a', 'libmp3lame',
    '-b:a', '192k',
    cleanVoPath,
  ]);

  const totalDurationStr = execFileSync(ffprobe, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    cleanVoPath,
  ]).toString().trim();

  const totalDuration = parseFloat(totalDurationStr);
  console.log(`\n✅ Voice Over Selesai: Total Durasi ${totalDuration.toFixed(2)}s (~${(totalDuration / 60).toFixed(1)} menit) di ${cleanVoPath}`);

  // 3. Assemble Narrative-Synchronized Visual Beats
  console.log('\n3. Membangun Narrative-Synchronized Visual Beats (14 Unique Shots + Opening Cover, 0 Repetitions)...');
  const shotTimings: Array<{
    shot: number;
    startSec: number;
    endSec: number;
    durationSec: number;
    imageFile: string;
  }> = [];

  const shotImages: Array<{ shot: number; imagePath: string }> = [];
  const coverDuration = 1.20;
  const transitionTimes: number[] = [coverDuration]; // Cut from Shot 00 Cover to Shot 01
  let globalShotCounter = 1;

  for (let sIdx = 0; sIdx < sentenceTimings.length; sIdx++) {
    const st = sentenceTimings[sIdx];
    const plan = NARRATIVE_BEAT_PLANS[sIdx];
    const isFirstSentence = sIdx === 0;
    const isLastSentence = sIdx === sentenceTimings.length - 1;

    const windowStart = isFirstSentence ? coverDuration : st.start;
    const windowEnd = isLastSentence ? totalDuration : sentenceTimings[sIdx + 1].start;
    const windowDur = windowEnd - windowStart;

    const totalWeight = plan.images.reduce((acc, img) => acc + img.weight, 0);
    let subCursor = windowStart;

    for (let imgIdx = 0; imgIdx < plan.images.length; imgIdx++) {
      const imgInfo = plan.images[imgIdx];
      const isLastImageInSentence = imgIdx === plan.images.length - 1;
      const imgDur = (imgInfo.weight / totalWeight) * windowDur;

      const bStart = Number(subCursor.toFixed(2));
      const bEnd = (isLastSentence && isLastImageInSentence)
        ? totalDuration
        : Number((subCursor + imgDur).toFixed(2));
      const bDur = Number((bEnd - bStart).toFixed(2));

      const sourceImageName = imgInfo.file;
      const sourceImagePath = path.join(KEYFRAMES_DIR, sourceImageName);
      const isVideo = sourceImageName.endsWith('.mp4');
      const ext = isVideo ? '.mp4' : '.jpg';

      const beatAssetName = `beat-${String(globalShotCounter).padStart(2, '0')}${ext}`;
      const beatPub = path.join(KEYFRAMES_DIR, beatAssetName);
      const beatHf = path.join(HF_WORKSPACE, 'assets', beatAssetName);

      if (fs.existsSync(sourceImagePath)) {
        fs.copyFileSync(sourceImagePath, beatPub);
        fs.copyFileSync(sourceImagePath, beatHf);
      } else {
        console.warn(`⚠️ Warning: ${sourceImagePath} tidak ditemukan, membuat fallback...`);
        if (isVideo) {
          const fallbackStill = path.join(KEYFRAMES_DIR, 'amrozi-smiling-source.jpg');
          execFileSync(ffmpeg, [
            '-y',
            '-loop', '1',
            '-i', fallbackStill,
            '-t', '6.0',
            '-vf', "scale=1080:1920,zoompan=z='min(zoom+0.0012,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=180:s=1080x1920:fps=30",
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            beatPub,
          ]);
          fs.copyFileSync(beatPub, beatHf);
        } else {
          const fallbackSrc = path.join(KEYFRAMES_DIR, 'cover-shot-00.jpg');
          if (fs.existsSync(fallbackSrc)) {
            fs.copyFileSync(fallbackSrc, beatPub);
            fs.copyFileSync(fallbackSrc, beatHf);
          }
        }
      }

      shotImages.push({ shot: globalShotCounter, imagePath: beatPub });

      shotTimings.push({
        shot: globalShotCounter,
        startSec: bStart,
        endSec: bEnd,
        durationSec: bDur,
        imageFile: beatAssetName,
      });

      if (bStart > 0.1 && !transitionTimes.includes(bStart)) {
        transitionTimes.push(bStart);
      }

      subCursor = bEnd;
      globalShotCounter++;
    }
  }

  transitionTimes.sort((a, b) => a - b);
  console.log(`   ✅ Dihasilkan ${shotTimings.length} visual beats tersinkronisasi narasi!`);

  // 4. Mixing Master Audio (VO + Looped BGM ducked 20% + Dynamic SFX Glitches)
  console.log('\n4. Mixing Audio Master Track...');
  const sfxPath = path.join(ROOT_DIR, 'public', 'renders', 'mujianto-serial-killer', 'audio-chunks', 'forensic-glitch-sfx.wav');
  const localBgm = path.join(ROOT_DIR, 'public', 'renders', 'noir_1794719302357', 'audio', 'bgm-crime-tension.mp3');
  const bgmFadeOutStart = Math.max(0, totalDuration - 2.5);

  const majorGlitchTimes = [coverDuration, ...sentenceTimings.slice(1).map((st) => st.start)].filter(
    (t) => t < totalDuration - 2.0
  );

  let filterStr = `[0:a]volume=1.0[vo];[2:a]volume=0.18,afade=t=in:ss=0:d=1.5,afade=t=out:st=${bgmFadeOutStart.toFixed(1)}:d=2.5[bgm_bed];`;
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

  // 5. Calculate word timings for discrete karaoke captions
  console.log('\n5. Menghitung Word Timings & Discrete Phrases (Maks 4 kata)...');
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

  const discretePhrases = groupWordsIntoPhrases(allWords, 4);

  // 6. Map Dual-Layer Giant Keywords Flash
  console.log('\n6. Menyiapkan Dual-Layer Giant Keywords Flash...');
  const topKeywords: Array<{ id: string; text: string; start: number; end: number }> = [];
  sentenceTimings.forEach((st) => {
    topKeywords.push({
      id: st.id,
      text: st.topKeyword,
      start: Number((st.start + 0.1).toFixed(2)),
      end: Number((Math.min(st.end, st.start + 3.8)).toFixed(2)),
    });
  });

  // 7. Generate HyperFrames Video HTML
  console.log('\n7. Mengompilasi HyperFrames HTML (1080x1920 @ 30fps)...');
  const coverPub = path.join(KEYFRAMES_DIR, 'cover-shot-00.jpg');
  const coverHf = path.join(HF_WORKSPACE, 'assets', 'cover-shot-00.jpg');
  if (fs.existsSync(coverPub)) {
    fs.copyFileSync(coverPub, coverHf);
  }

  generateNoirHyperframesHtml({
    jobId: PROJECT_ID,
    title: 'TRAGEDI BOM BALI 2002: The Smiling Terrorist',
    totalDurationSec: totalDuration,
    coverImagePath: coverPub,
    shotImages,
    shotTimings,
    phrases: discretePhrases,
    topKeywords,
    outputDir: HF_WORKSPACE,
  });

  console.log(`✅ File HyperFrames HTML Siap di: ${HF_WORKSPACE}`);

  // 8. Render Video via HyperFrames Engine
  console.log(`\n8. Me-render Video via HyperFrames Engine (1080x1920 @ 30fps, ${totalDuration.toFixed(1)}s)...`);
  const tempVideoPath = path.join(PUBLIC_DIR, 'temp-visual-timeline.mp4');
  const finalVideoPath = path.join(PUBLIC_DIR, `${PROJECT_ID}-final.mp4`);

  const startTime = Date.now();
  await renderHyperframes({
    projectDir: HF_WORKSPACE,
    outputPath: tempVideoPath,
    fps: 30,
    onProgress: (p) => process.stdout.write(p),
  });

  const renderTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n✅ Visual render selesai dalam ${renderTimeSec} detik!`);

  // 9. Mux Final Video with Master Audio
  console.log('\n9. Muxing Final Video dengan Master Audio Track...');
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

  console.log(`🎉 Master Video Berhasil Dibuat: ${finalVideoPath}`);

  // 9B. Extract preview snapshot frames
  console.log('\n9B. Mengekstrak snapshot verification frames...');
  const snapshots = [
    { time: 0.8, name: 'preview-01s-hook.jpg' },
    { time: 3.5, name: 'preview-03s-kuta-street.jpg' },
    { time: 8.5, name: 'preview-08s-moving-amrozi.jpg' },
    { time: 15.0, name: 'preview-15s-paddys-pub.jpg' },
    { time: 22.0, name: 'preview-22s-sari-club.jpg' },
    { time: 28.5, name: 'preview-28s-forensic-sweep.jpg' },
    { time: 34.0, name: 'preview-34s-l300-chassis.jpg' },
    { time: 40.0, name: 'preview-40s-moving-l300.jpg' },
    { time: 47.0, name: 'preview-47s-lamongan-raid.jpg' },
    { time: 53.0, name: 'preview-53s-trio-brothers.jpg' },
    { time: 59.0, name: 'preview-59s-chemical-drums.jpg' },
    { time: 65.5, name: 'preview-65s-amrozi-thumbsup.jpg' },
    { time: 71.0, name: 'preview-71s-global-outrage.jpg' },
    { time: 78.0, name: 'preview-78s-court-gavel.jpg' },
    { time: 85.0, name: 'preview-85s-nusakambangan-night.jpg' },
  ];

  snapshots.forEach((snap) => {
    const snapPath = path.join(PUBLIC_DIR, snap.name);
    try {
      execFileSync(ffmpeg, [
        '-y',
        '-ss', snap.time.toFixed(1),
        '-i', finalVideoPath,
        '-vframes', '1',
        '-q:v', '2',
        snapPath,
      ]);
      console.log(`   Snapshot tersimpan: ${snapPath}`);
    } catch {
      // ignore
    }
  });

  // 10. Update Review Portal & Social Media Distribution Kit
  console.log('\n10. Memperbarui Review Portal & Social Media Distribution Kit...');
  const portalHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tragedi Bom Bali 2002: The Smiling Terrorist (Amrozi) - Review Portal</title>
  <style>
    :root {
      --bg: #0D1117;
      --card: #161B22;
      --border: #30363D;
      --accent: #E5A93C;
      --danger: #DA3633;
      --success: #2EA043;
      --text: #C9D1D9;
      --text-muted: #8B949E;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 40px 20px;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    header { margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 20px; }
    .badge {
      display: inline-block;
      background: var(--accent);
      color: #000;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    h1 { font-size: 28px; color: #FFF; margin-bottom: 6px; }
    .subtitle { font-size: 14px; color: var(--text-muted); }
    .video-section {
      display: grid;
      grid-template-columns: 420px 1fr;
      gap: 32px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 40px;
    }
    .video-player { width: 100%; aspect-ratio: 9/16; border-radius: 8px; background: #000; }
    .info-card { display: flex; flex-direction: column; justify-content: space-between; }
    .stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat-box {
      background: #090D13;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      text-align: center;
    }
    .stat-val { font-size: 20px; font-weight: 800; color: #FFF; }
    .stat-lbl { font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-top: 4px; }
    .section-title { font-size: 16px; color: #FFF; margin-bottom: 12px; border-left: 3px solid var(--accent); padding-left: 8px; }
    .caption-box {
      background: #090D13;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      font-size: 13.5px;
      line-height: 1.6;
      color: #E6EDF3;
      white-space: pre-wrap;
      position: relative;
    }
    .copy-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: var(--accent);
      color: #000;
      border: none;
      padding: 6px 12px;
      font-weight: 700;
      font-size: 11px;
      border-radius: 4px;
      cursor: pointer;
    }
    .gallery { margin-top: 40px; }
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }
    .gallery-item {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .gallery-item img { width: 100%; aspect-ratio: 9/16; object-fit: cover; display: block; }
    .gallery-caption { padding: 8px; font-size: 11px; color: var(--text-muted); text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <span class="badge">Master Final Render</span>
      <h1>Tragedi Bom Bali 2002: The Smiling Terrorist (Amrozi)</h1>
      <p class="subtitle">Vertical Video 9:16 (1080x1920 @ 30fps) • Google Gemini Charon VO • 2 Google Flow Moving Keyframes • Dual-Layer Typography</p>
    </header>

    <div class="video-section">
      <div>
        <video class="video-player" controls preload="metadata" poster="keyframes/cover-shot-00.jpg">
          <source src="${PROJECT_ID}-final.mp4" type="video/mp4">
          Browser Anda tidak mendukung tag video.
        </video>
      </div>

      <div class="info-card">
        <div class="stat-row">
          <div class="stat-box">
            <div class="stat-val">${totalDuration.toFixed(1)}s</div>
            <div class="stat-lbl">Durasi Video</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${shotTimings.length} Beats</div>
            <div class="stat-lbl">Zero Repetition</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">2 Videos</div>
            <div class="stat-lbl">Flow Moving</div>
          </div>
          <div class="stat-box">
            <div class="stat-val" style="color: #4ade80;">Charon Gemini</div>
            <div class="stat-lbl">Klenik Warmth VO</div>
          </div>
        </div>

        <div>
          <h2 class="section-title">DISTRIBUSI SOSMED (VIRAL INSTAGRAM REELS KIT)</h2>
          <p style="font-size: 12px; color: var(--accent); margin-bottom: 6px; font-weight: 600;">📱 FORMAT INSTAGRAM REELS:</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>Dua ratus dua nyawa melayang di Jalan Legian Kuta... Tapi saat tertangkap, pria ini justru tertawa dan mengacungkan jempol ke kamera. Dunia menjulukinya: The Smiling Terrorist. 🚨⛓️

12 Oktober 2002 menjadi malam paling kelam dalam sejarah pariwisata Indonesia. Ledakan beruntun di Paddy's Pub dan Sari Club meluluhlantakkan pusat keramaian Kuta. 

Namun kejahatan tak pernah sempurna:
🔍 Serpihan nomor rangka mobil Mitsubishi L300 yang terbakar menuntun tim gabungan forensik Polri ke sebuah bengkel di Desa Tenggulun, Lamongan.
👥 Terbongkar jaringan terorisme terencana yang dipimpin trio bersaudara: Mukhlas sebagai pengendali taktik, Ali Imron sebagai perakit teknis, dan Amrozi sebagai penyedia logistik & satu ton bahan kimia.
⚖️ Pengadilan Negeri Denpasar menjatuhkan vonis mati. 9 November 2008, Amrozi dieksekusi di Bukit Nirbaya, Nusakambangan.

Simak rekonstruksi forensik dan fakta hukum atas salah satu babak investigasi terbesar di tanah air.

#BomBali #TragediBali2002 #Amrozi #TheSmilingTerrorist #TrueCrimeIndonesia #DokumenterKriminal #PoldaBali #ForensikPolri #InvestigasiSejarah #InstagramReels #viral #fyp</span>
          </div>

          <p style="font-size: 12px; color: var(--accent); margin-top: 14px; margin-bottom: 6px; font-weight: 600;">📺 FORMAT YOUTUBE SHORTS / TIKTOK:</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>KRONOLOGI INVESTIGASI BOM BALI 1: THE SMILING TERRORIST 🚨
Dari dentuman di Sari Club Kuta hingga pelacakan nomor rangka L300 ke Lamongan. Terungkap peran Amrozi, Mukhlas, dan Imam Samudra sebelum vonis mati di Nusakambangan. Simak kronologi lengkapnya!

#Shorts #BomBali #Amrozi #TrueCrime #InvestigasiKriminal #SejarahKelam</span>
          </div>
        </div>
      </div>
    </div>

    <div class="gallery">
      <h2 class="section-title">TIMELINE 18 VISUAL BEATS (ZERO REPETITION)</h2>
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
  console.log('🎉 PIPELINE MASTER SELESAI!');
  console.log(`👉 Buka Review Portal: http://localhost:3000/renders/${PROJECT_ID}/index.html`);
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Error in Pipeline:', err);
  process.exit(1);
});
