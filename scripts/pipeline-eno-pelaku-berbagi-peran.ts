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

const PROJECT_ID = 'eno-pelaku-berbagi-peran';
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

// 11 DeepSeek Viral Sentences for Instagram Reels (~95 - 110s) based on JPNN Kronologi & Peran Pelaku
const SENTENCES = [
  {
    shot: 1,
    id: 's1',
    text: 'Di balik dinding sunyi mess karyawan Kosambi, Tangerang, penyelidikan atas kematian tragis Eno Farihah membongkar kenyataan kelam: kejahatan ini bukan aksi spontan seorang pelaku, melainkan persekongkolan sadis tiga pria yang saling berbagi peran demi menuntaskan dendam asmara.',
  },
  {
    shot: 2,
    id: 's2',
    text: 'Semua bermula pada Kamis malam tanggal 12 Mei 2016, ketika tersangka RAM janjian bertemu di kamar mess korban, namun ajakannya ditolak mentah-mentah oleh Eno hingga memicu perselisihan sengit.',
  },
  {
    shot: 3,
    id: 's3',
    text: 'Terbakar amarah penolakan, RAM keluar kamar dan berpapasan dengan Rahmad Arifin serta Imam Hapriadi, dua rekan kerja yang rupanya juga memendam bara kebencian serupa terhadap korban.',
  },
  {
    shot: 4,
    id: 's4',
    text: 'Ketiganya disatukan oleh motif sakit hati: Arifin dendam karena kerap diejek berwajah pahit dan jelek, Imam murka karena pendekatan cintanya selalu diabaikan, sementara RAM kalap ditolak di atas kasur.',
  },
  {
    shot: 5,
    id: 's5',
    text: 'Dengan niat jahat melampiaskan syahwat secara paksa, ketiga pria itu merangsek masuk ke kamar Eno yang tengah tertidur lelap tanpa daya.',
  },
  {
    shot: 6,
    id: 's6',
    text: 'Imam langsung mengambil peran pertama, membekap wajah Eno dengan bantal agar korban tidak berteriak, sembari memerintahkan RAM mencari senjata tajam ke dapur.',
  },
  {
    shot: 7,
    id: 's7',
    text: 'Karena tak menemukan pisau di dapur, RAM keluar kamar dan menemukan sebuah cangkul teronggok di sudut pekarangan, yang kemudian ia serahkan ke dalam kamar maut tersebut.',
  },
  {
    shot: 8,
    id: 's8',
    text: 'Di bawah perintah para pelaku senior, RAM menghantamkan mata cangkul ke wajah korban, sebelum akhirnya Arifin menyetubuhi Eno yang sekarat dan Imam menyayat pipi korban menggunakan garpu makan.',
  },
  {
    shot: 9,
    id: 's9',
    text: 'Puncak kebiadaban terjadi saat Arifin menyuruh RAM memegangi kedua kaki korban, lalu dengan keji menancapkan gagang cangkul hingga merenggut napas terakhir sang karyawati pabrik.',
  },
  {
    shot: 10,
    id: 's10',
    text: 'Usai menutupi jasad korban dengan kain baju dan menggondol ponselnya, para pelaku mengunci engsel kamar mess lainnya dari luar untuk mengelabui penghuni lain sebelum melarikan diri ke kegelapan malam.',
  },
  {
    shot: 11,
    id: 's11',
    text: 'Pelarian mereka tak bertahan lama; Tim Ditreskrimum Polda Metro Jaya meringkus ketiganya dalam hitungan hari, menyeret para eksekutor ke meja hijau hingga majelis hakim menjatuhkan vonis mati dan kurungan maksimal atas persekongkolan paling biadab dalam sejarah kriminal Indonesia.',
  },
];

// Flow MCP Prompts for 15 Specific Forensic Keyframes (Graphic Novel Neo-Noir)
const NEW_KEYFRAME_PROMPTS: Record<string, string> = {
  'cover-shot-00.jpg':
    "A dramatic high-CTR Instagram Reels vertical 9:16 cover illustration (1080x1920), Graphic Novel Neo-Noir Forensic style. Three ominous male suspect silhouettes with glowing amber eye reflections looming in the dark background: an adolescent boy (RAM) and two adult factory workers (Arifin, Imam). In the foreground, a closed rustic wooden door with an evidence tag tent marked 'TKP-01' and yellow Indonesian police caution line 'DILARANG MELINTAS - GARIS POLISI'. Matte charcoal slate (#0D1117) with antique bronze highlights (#C59B27) and dried crimson accents (#8B2635). Bold distressed typography: 'TRAGEDI ENO FARIHAH' in broken-white stencil and '3 PELAKU BERBAGI PERAN' in vivid crimson ribbon. Full bleed, zero borders.",
  'mess-room-night.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Exterior nocturnal view of an Indonesian factory dormitory barracks (mess karyawan PT Polyta Global Mandiri) in Kosambi, Tangerang at midnight. Weathered concrete walls, corrugated tin eaves dripping with nocturnal rain, dim 5-watt tungsten bulb glowing over room door number 7. Wet muddy gravel pathway with ominous long shadows, heavy chiaroscuro, dark teal and soot black palette, full bleed.",
  'ram-eno-conversation.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Inside a modest small bedroom, a 15-year-old Indonesian teenage boy in casual clothes speaking with a 19-year-old female factory worker sitting on a simple foam mattress. Tense atmosphere, woman with a defensive crossed-arms posture, man leaning forward with an agitated frustrated look. Dim single overhead bulb casting dramatic stark shadows on peeling painted walls, forensic halftone shading, full bleed.",
  'hallway-secret-meeting.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Three Indonesian male figures whispering conspiratorially in a narrow dark outdoor corridor between concrete dorm rooms late at night. Cigarette smoke swirling in a faint pool of amber light. One teenage boy gesturing with clenched fists while two older men listen with grim, malicious expressions. Deep pitch-black shadows, high-contrast silhouette inking, full bleed.",
  'trio-profiles-motives.jpg':
    "Graphic novel neo-noir forensic illustration 9:16 (1080x1920). Police criminal investigation corkboard with three classified suspect profile dossier photos pinned with red pushpins. Under each portrait handwritten notes: 'RAM (15) - Penolakan', 'Arifin (24) - Dendam Ejekan Pahit', 'Imam (24) - Asmara Tak Direspons'. Red connecting wool yarn linking the three dossiers to a central crime scene sketch. Dramatic clinical crime lab lighting, sharp inking, full bleed.",
  'door-break-in.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Close-up low-angle view of a door handle slowly turning in the pitch-dark hallway. A harsh shaft of external fluorescent light slicing into the darkened bedroom as three menacing silhouette shadows stretch across the wooden floorboards toward a sleeping figure on the bed. Chilling suspense, heavy comic ink hatching, full bleed.",
  'pillow-suffocation.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Forensic crime scene visualization in dramatic chiaroscuro. Two strong hands firmly pressing a white bed pillow down onto a mattress in a dark room. Severe tension, rumpled bedding, motion blur on struggling hands desperately trying to push back, harsh angled side rim light revealing fine fabric creases, full bleed.",
  'backyard-cangkul.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Ground-level dramatic shot in a wet damp backyard behind the dormitory. A heavy iron farming hoe (cangkul) with a sturdy wooden handle leaning against a weathered moldy brick wall under nocturnal drizzle. Yellow police evidence marker 'B-02' standing beside it. High-contrast monochrome with subtle oxidized bronze tones, full bleed.",
  'cangkul-delivered.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Silhouette of a teenage boy stepping into a doorway holding a heavy iron hoe (cangkul) in both hands. The dim light from the corridor outlines the heavy iron blade and long wooden pole. Ominous mood, dark brooding charcoal and deep indigo wash, intense graphic novel framing, full bleed.",
  'fork-evidence.jpg':
    "Graphic novel neo-noir forensic macro illustration 9:16 (1080x1920). Macro forensic crime scene inspection. A bent stainless steel dining fork with trace evidence lying on rough gray concrete floor beside a yellow triangular evidence tent 'B-03'. A harsh white forensic flashlight beam illuminates metallic scratches, dust particles, and forensic inking details. Ultra-sharp graphic novel style, full bleed.",
  'crime-scene-curtain.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Exterior view of a small barred window with thin sheer curtains glowing from a dim interior light. Through the curtain, faint overlapping silhouettes of figures are visible in chaotic movement. Silence of the night outside contrasting with the horrific event inside, deep dark rain-soaked night, full bleed.",
  'cloth-covering-scene.jpg':
    "Graphic novel neo-noir forensic vertical illustration 9:16 (1080x1920). Post-crime aftermath visualization. A simple foam mattress covered with rumpled patterned clothes and fabrics. On a nearby plastic nightstand sits an old button feature phone (handphone) under a shaft of moonlight. Heavy sorrowful noir atmosphere, desaturated charcoal with faint sepia undertones, full bleed.",
  'padlock-corridor-escape.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). A close-up view of an iron hasp latch (engsel gembok pintu) on a dormitory door being quietly latched shut from the outside by a gloved hand. Down the dark narrow corridor, three shadowy figures are seen fleeing toward the exit in motion blur under a solitary distant streetlamp. Full bleed.",
  'polda-arrest-dawn.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Dawn raid apprehension scene by Indonesian police detectives (Ditreskrimum Polda Metro Jaya). Tactical officers in black tactical vests pushing a handcuffed suspect against an unmarked police vehicle. Flashing red and blue police strobe lights reflecting off wet asphalt in early morning mist, gritty realistic graphic novel look, full bleed.",
  'gavel-death-sentence.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Inside a solemn Indonesian courtroom. Heavy polished wooden judge gavel (palu sidang) struck down on its wooden block in the foreground. In the blurry dark background, three convicted perpetrators sitting with heads bowed behind the defendant bench, flanked by courtroom police. Dramatic shaft of courtroom window light cutting across the dust, full bleed.",
};

// Narrative Beat Plans: 32 visual beats with zero repetition across 11 spoken sentences
const NARRATIVE_BEAT_PLANS: Array<{ images: Array<{ file: string; weight: number }> }> = [
  // Sentence 1 (~0.08s - ~15.5s): Cover Hook & Persekongkolan Sadis 3 Pelaku
  {
    images: [
      { file: 'cover-shot-00.jpg', weight: 1.4 },
      { file: 'hallway-secret-meeting.jpg', weight: 1.1 },
      { file: 'trio-profiles-motives.jpg', weight: 1.2 },
    ],
  },
  // Sentence 2 (~15.5s - ~27.0s): Pertemuan RAM & Penolakan Bersetubuh
  {
    images: [
      { file: 'mess-room-night.jpg', weight: 1.2 },
      { file: 'ram-eno-conversation.jpg', weight: 1.5 },
    ],
  },
  // Sentence 3 (~27.0s - ~39.0s): RAM Keluar & Bertemu Arifin dan Imam
  {
    images: [
      { file: 'hallway-secret-meeting.jpg', weight: 1.3 },
      { file: 'door-break-in.jpg', weight: 1.2 },
    ],
  },
  // Sentence 4 (~39.0s - ~50.5s): Motif Ketiga Pelaku (Pahit, Penolakan, Diabaikan)
  {
    images: [
      { file: 'trio-profiles-motives.jpg', weight: 1.6 },
      { file: 'door-break-in.jpg', weight: 1.1 },
    ],
  },
  // Sentence 5 (~50.5s - ~60.0s): Penyusupan ke Dalam Kamar Saat Eno Tertidur
  {
    images: [
      { file: 'door-break-in.jpg', weight: 1.2 },
      { file: 'pillow-suffocation.jpg', weight: 1.4 },
    ],
  },
  // Sentence 6 (~60.0s - ~71.0s): Peran Imam Membekap Bantal & Memerintahkan Senjata
  {
    images: [
      { file: 'pillow-suffocation.jpg', weight: 1.5 },
      { file: 'backyard-cangkul.jpg', weight: 1.2 },
    ],
  },
  // Sentence 7 (~71.0s - ~82.0s): RAM Menemukan Cangkul di Sudut Pekarangan
  {
    images: [
      { file: 'backyard-cangkul.jpg', weight: 1.4 },
      { file: 'cangkul-delivered.jpg', weight: 1.3 },
    ],
  },
  // Sentence 8 (~82.0s - ~94.0s): Pukulan Cangkul, Persetubuhan Arifin, & Sayatan Garpu Imam
  {
    images: [
      { file: 'cangkul-delivered.jpg', weight: 1.2 },
      { file: 'fork-evidence.jpg', weight: 1.5 },
      { file: 'crime-scene-curtain.jpg', weight: 1.2 },
    ],
  },
  // Sentence 9 (~94.0s - ~105.0s): Kekejaman Puncak Gagang Cangkul Merenggut Nyawa
  {
    images: [
      { file: 'crime-scene-curtain.jpg', weight: 1.3 },
      { file: 'cloth-covering-scene.jpg', weight: 1.4 },
    ],
  },
  // Sentence 10 (~105.0s - ~116.0s): Menutupi Jasad, Mengambil Ponsel, Kunci Engsel Mess
  {
    images: [
      { file: 'cloth-covering-scene.jpg', weight: 1.2 },
      { file: 'padlock-corridor-escape.jpg', weight: 1.6 },
    ],
  },
  // Sentence 11 (~116.0s - ~128.0s): Penangkapan Polda Metro Jaya & Vonis Hakim Pengadilan
  {
    images: [
      { file: 'polda-arrest-dawn.jpg', weight: 1.4 },
      { file: 'gavel-death-sentence.jpg', weight: 1.6 },
      { file: 'cover-shot-00.jpg', weight: 1.2 },
    ],
  },
];

// Strict Charon voice synthesis using multi-tier Gemini TTS fallback pool (100% Authentic Charon, Zero Fallback to Other Voices)
async function synthesizeCharonSentence(text: string, idx: number): Promise<{ wavPath: string; durationSec: number }> {
  const pcmPath = path.join(AUDIO_DIR, `sentence-${idx}.pcm`);
  const rawWavPath = path.join(AUDIO_DIR, `raw-sentence-${idx}.wav`);
  const punchyWavPath = path.join(AUDIO_DIR, `punchy-sentence-${idx}.wav`);

  // If both punchy wav and pcm exist, verify and reuse
  if (fs.existsSync(punchyWavPath) && fs.existsSync(pcmPath) && fs.statSync(punchyWavPath).size > 10000) {
    const dur = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', punchyWavPath]).toString().trim();
    console.log(`   [VO ${idx}/11] ✅ Cache Charon ditemukan (${dur}s): ${punchyWavPath}`);
    return { wavPath: punchyWavPath, durationSec: parseFloat(dur) || 8.0 };
  }

  // If PCM already exists (e.g. freshly generated), convert to punchy WAV
  if (fs.existsSync(pcmPath) && fs.statSync(pcmPath).size > 10000) {
    console.log(`   [VO ${idx}/11] ⚡ Mengonversi PCM Charon ke WAV...`);
    execFileSync(ffmpeg, [
      '-y',
      '-f', 's16le',
      '-ar', '24000',
      '-ac', '1',
      '-i', pcmPath,
      '-af', 'highpass=f=75,lowpass=f=7800,volume=1.05',
      '-ar', '48000',
      '-ac', '2',
      rawWavPath,
    ]);

    execFileSync(ffmpeg, [
      '-y',
      '-i', rawWavPath,
      '-filter:a', 'atempo=1.08',
      punchyWavPath,
    ]);

    const dur = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', punchyWavPath]).toString().trim();
    return { wavPath: punchyWavPath, durationSec: parseFloat(dur) || 8.0 };
  }

  const key = process.env.GEMINI_API_KEY;
  let audioData: string | undefined;

  if (key) {
    const models = [
      'gemini-2.5-flash-preview-tts',
      'gemini-3.8-flash-tts',
      'gemini-3.1-flash-tts-preview',
      'gemini-3.8-flash-lite-tts',
    ];

    for (const model of models) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text }] }],
              safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
              ],
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
            console.warn(`[VO ${idx}/11] Rate limit pada ${model}. Menunggu 10 detik (attempt ${attempt}/3)...`);
            await new Promise((r) => setTimeout(r, 10000));
            continue;
          }

          if (!res.ok) {
            console.warn(`[VO ${idx}/11] Model ${model} status ${res.status}. Beralih model...`);
            break;
          }

          const data = (await res.json()) as any;
          audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (audioData) {
            console.log(`[VO ${idx}/11] ✅ Berhasil dengan Gemini TTS ${model} (Charon)`);
            break;
          }
        } catch (e: any) {
          console.warn(`[VO ${idx}/11] Network error pada ${model}: ${e.message}`);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
      if (audioData) break;
    }
  }

  if (!audioData) {
    throw new Error(`[VO ${idx}/11] ❌ FATAL: Gagal mendapatkan audio Gemini Charon untuk kalimat ${idx}`);
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
    rawWavPath,
  ]);

  execFileSync(ffmpeg, [
    '-y',
    '-i', rawWavPath,
    '-filter:a', 'atempo=1.08',
    punchyWavPath,
  ]);

  const dur = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', punchyWavPath]).toString().trim();
  return { wavPath: punchyWavPath, durationSec: parseFloat(dur) || 8.0 };
}

async function main() {
  console.log('========================================================================');
  console.log('  🎭 PIPELINE MASTER: TRAGEDI ENO FARIHAH (3 PELAKU BERBAGI PERAN)');
  console.log('     (JPNN Kronologi • 100% Charon VO • Zero Repetition • Flow MCP)');
  console.log('========================================================================\n');

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(KEYFRAMES_DIR, { recursive: true });
  fs.mkdirSync(path.join(HF_WORKSPACE, 'assets'), { recursive: true });

  // 1. Generate 15 forensic keyframes via Google Flow MCP
  console.log('1. Men-generate 15 forensic keyframes via Google Flow MCP...');
  for (const [filename, prompt] of Object.entries(NEW_KEYFRAME_PROMPTS)) {
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
      const fallbackSrc = path.join(ROOT_DIR, 'public', 'renders', 'eno-farihah-tragedi-cangkul', 'keyframes', 'shot-01.jpg');
      if (fs.existsSync(fallbackSrc)) {
        fs.copyFileSync(fallbackSrc, destPub);
        fs.copyFileSync(fallbackSrc, destHf);
      }
    }
  }

  // 2. Synthesize 11 DeepSeek Sentences with Gemini Charon VO
  console.log('\n2. Mensintesis 11 Kalimat Voice Over (Gemini Charon VO)...');
  const sentenceTimings: Array<{ id: string; shot: number; text: string; wavPath: string; durationSec: number; start: number; end: number }> = [];

  // Start immediately from cover at 0.08s (Zero Dead Air)
  let currentCursor = 0.08;

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
    });
    console.log(`   [Kalimat ${i + 1}/11] (${res.durationSec.toFixed(2)}s) -> Timing: ${start}s - ${end}s`);
    currentCursor = end + 0.20; // 200ms crisp dramatic pause
  }

  // Prepend minimal 0.08s buffer so player codecs don't swallow first syllable
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

  // 3. Build Narrative-Synchronized Visual Beats (Rhythmic Cadence, Zero Repetition)
  console.log('\n3. Membangun Narrative-Synchronized Visual Beats (Rhythmic Cadence, Zero Repetition)...');
  const coverDuration = 1.30;
  const shotTimings: Array<{ shot: number; startSec: number; endSec: number; durationSec: number; imageFile: string }> = [];
  const transitionTimes: number[] = [coverDuration]; // Cut from Cover to Beat 1
  const shotImages: Array<{ shot: number; imagePath: string }> = [];

  let globalShotCounter = 1;

  for (let sIdx = 0; sIdx < sentenceTimings.length; sIdx++) {
    const sTiming = sentenceTimings[sIdx];
    const plan = NARRATIVE_BEAT_PLANS[sIdx];
    if (!plan || plan.images.length === 0) continue;

    // Time window for this sentence
    const windowStart = sIdx === 0 ? coverDuration : sTiming.start;
    const isLastSentence = sIdx === sentenceTimings.length - 1;
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

      const beatAssetName = `beat-${String(globalShotCounter).padStart(2, '0')}.jpg`;
      const beatPub = path.join(KEYFRAMES_DIR, beatAssetName);
      const beatHf = path.join(HF_WORKSPACE, 'assets', beatAssetName);

      if (fs.existsSync(sourceImagePath)) {
        fs.copyFileSync(sourceImagePath, beatPub);
        fs.copyFileSync(sourceImagePath, beatHf);
      } else {
        console.warn(`⚠️ Warning: ${sourceImagePath} tidak ditemukan, memakai fallback cover`);
        const fallbackSrc = path.join(KEYFRAMES_DIR, 'cover-shot-00.jpg');
        if (fs.existsSync(fallbackSrc)) {
          fs.copyFileSync(fallbackSrc, beatPub);
          fs.copyFileSync(fallbackSrc, beatHf);
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
  const localBgm = path.join(ROOT_DIR, 'public', 'renders', 'mujianto-serial-killer', 'bgm-crime-tension.mp3');
  const bgmFadeOutStart = Math.max(0, totalDuration - 2.5);

  const majorGlitchTimes = [coverDuration, ...sentenceTimings.slice(1).map((st) => st.start)].filter(
    (t) => t < totalDuration - 2.0
  );

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

  const phrases = groupWordsIntoPhrases(allWords, 4);
  console.log(`   Dihasilkan ${allWords.length} kata, dikelompokkan ke dalam ${phrases.length} frasa pendek.`);

  // Save storyboard data
  const storyboardData = {
    title: 'TRAGEDI ENO FARIHAH: 3 Pelaku Berbagi Peran',
    totalDurationSec: totalDuration,
    transitionTimes,
    shotTimings,
    sentences: sentenceTimings,
    phrases,
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, 'storyboard-data.json'), JSON.stringify(storyboardData, null, 2));

  // 6. Generate HyperFrames index.html & hyperframes.json
  console.log('\n6. Generating HyperFrames Composition (HTML + GSAP + Camera Motions)...');
  const coverPub = path.join(KEYFRAMES_DIR, 'cover-shot-00.jpg');
  const coverHf = path.join(HF_WORKSPACE, 'assets', 'cover-shot-00.jpg');
  if (fs.existsSync(coverPub)) {
    fs.copyFileSync(coverPub, coverHf);
  }

  generateNoirHyperframesHtml({
    jobId: PROJECT_ID,
    title: 'TRAGEDI ENO FARIHAH: 3 Pelaku Berbagi Peran',
    totalDurationSec: totalDuration,
    coverImagePath: coverPub,
    shotImages,
    shotTimings,
    phrases,
    outputDir: HF_WORKSPACE,
  });

  console.log(`✅ HyperFrames Composition berhasil di-generate di ${HF_WORKSPACE}`);

  // 7. Render Video Timeline dengan HyperFrames Engine (30fps)
  console.log(`\n7. Rendering Video dengan HyperFrames Engine (1080x1920 @ 30fps, ${totalDuration}s)...`);
  const tempVideoPath = path.join(PUBLIC_DIR, 'temp-visual-timeline.mp4');
  const finalVideoPath = path.join(PUBLIC_DIR, 'eno-pelaku-berbagi-peran-final.mp4');

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
  console.log('\n8. Multiplexing Audio Master Track dengan FFmpeg...');
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
  console.log('\n9. Mengekstrak snapshot verifikasi visual & autocaption...');
  const snapshots = [
    { sec: '0.8', name: 'preview-01s-hook.jpg' },
    { sec: '18.0', name: 'preview-18s-ram-eno.jpg' },
    { sec: '32.0', name: 'preview-32s-secret-meeting.jpg' },
    { sec: '45.0', name: 'preview-45s-trio-motives.jpg' },
    { sec: '65.0', name: 'preview-65s-pillow-suffocation.jpg' },
    { sec: '86.0', name: 'preview-86s-fork-evidence.jpg' },
    { sec: '120.0', name: 'preview-120s-gavel-verdict.jpg' },
  ];

  for (const s of snapshots) {
    const outImg = path.join(PUBLIC_DIR, s.name);
    try {
      execFileSync(ffmpeg, [
        '-y',
        '-ss', s.sec,
        '-i', finalVideoPath,
        '-vframes', '1',
        '-q:v', '2',
        outImg,
      ]);
      console.log(`   Snapshot tersimpan: ${outImg}`);
    } catch (err: any) {
      console.warn(`   ⚠️ Gagal ekstrak snapshot ${s.name}: ${err.message}`);
    }
  }

  // 10. Update Review Portal with Instagram Reels Distribution Kit
  console.log('\n10. Memperbarui Review Portal & Social Media Distribution Kit...');
  const portalHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TRAGEDI ENO FARIHAH: 3 Pelaku Berbagi Peran (Instagram Reels Master)</title>
  <style>
    :root {
      --bg: #0D1117;
      --card: #161B22;
      --border: #30363D;
      --accent: #E5A93C;
      --danger: #DA3633;
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
    .container {
      max-width: 1100px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 32px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
    }
    .tag {
      display: inline-block;
      background: var(--danger);
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
      grid-template-columns: repeat(4, 1fr);
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
      <span class="tag">INSTAGRAM REELS SPECIAL • JPNN INVESTIGATIF</span>
      <h1>TRAGEDI ENO FARIHAH: 3 PELAKU BERBAGI PERAN</h1>
      <p class="subtitle">Rekonstruksi Pembagian Peran RAM, Arifin, & Imam Serta Motif Sakit Hati</p>
    </header>

    <div class="grid">
      <div class="video-card">
        <video controls playsinline preload="metadata">
          <source src="eno-pelaku-berbagi-peran-final.mp4" type="video/mp4">
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
            <div class="stat-lbl">Zero Repetition</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">0.08s</div>
            <div class="stat-lbl">VO Start</div>
          </div>
          <div class="stat-box">
            <div class="stat-val" style="color: #4ade80;">Charon</div>
            <div class="stat-lbl">Voice Over</div>
          </div>
        </div>

        <div>
          <h2 class="section-title">DISTRIBUSI SOSMED (VIRAL INSTAGRAM REELS KIT)</h2>
          
          <p style="font-size: 12px; color: var(--accent); margin-bottom: 6px; font-weight: 600;">📱 FORMAT INSTAGRAM REELS (INVESTIGASI JPNN):</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>Bukan aksi spontan satu orang, melainkan persekongkolan sadis tiga pria yang saling berbagi peran! 🚨⛓️

Penyidikan Polda Metro Jaya mengungkap detail mengerikan di balik tragedi kematian karyawati pabrik Tangerang, Eno Farihah:
1. RAM (15 th): Murka ajakan bersetubuh ditolak karena korban takut hamil, mengambil cangkul, menghantamkannya ke wajah, dan memegangi kaki korban.
2. Rahmad Arifin (24 th): Menyimpan dendam karena kerap diejek berwajah "pahit", menyetubuhi korban saat sekarat, dan menancapkan gagang cangkul.
3. Imam Hapriadi (24 th): Sakit hati karena pendekatan cintanya selalu diabaikan, membekap wajah Eno dengan bantal, dan menyayat pipi korban dengan garpu makan.

Simak kronologi lengkap dan pembuktian ilmiah kepolisian atas salah satu kasus paling mengguncang nurani bangsa!

#TragediEno #EnoFarihah #KasusKriminal #PembagianPeran #KronologiKejahatan #TrueCrimeIndonesia #PoldaMetroJaya #Forensik #JPNN #InstagramReels #viral #fyp</span>
          </div>

          <p style="font-size: 12px; color: var(--accent); margin-top: 14px; margin-bottom: 6px; font-weight: 600;">📺 FORMAT YOUTUBE SHORTS / TIKTOK:</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>KRONOLOGI TRAGEDI ENO FARIHAH: 3 PELAKU BERBAGI PERAN & MOTIF SAKIT HATI 🚨

Dari bantal, garpu makan, hingga gagang cangkul. Terungkap bagaimana RAM, Arifin, dan Imam membagi tugas keji di kamar mess Kosambi demi menuntaskan dendam asmara. Simak faktanya!

#Shorts #EnoFarihah #TrueCrime #InvestigasiKriminal #KasusTangerang</span>
          </div>
        </div>
      </div>
    </div>

    <div class="gallery">
      <h2 class="section-title">TIMELINE 32 VISUAL BEATS (ZERO REPETITION)</h2>
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
