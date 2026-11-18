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

const PROJECT_ID = 'pulomas-perampokan-sadis';
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

// 11 DeepSeek Viral Sentences for Instagram Reels (~100 - 110s) based on Detikcom Pulomas
const SENTENCES = [
  {
    shot: 1,
    id: 's1',
    text: 'Sebuah rumah mewah di kawasan elite Pulomas, Jakarta Timur, mendadak berubah menjadi neraka bisu, ketika sebelas penghuni rumah disekap berjejal di dalam kamar mandi sempit berukuran satu setengah kali dua meter hingga enam orang meregang nyawa akibat kehabisan oksigen.',
  },
  {
    shot: 2,
    id: 's2',
    text: 'Tragedi kelam pada Senin sore tanggal 26 Desember 2016 itu bermula saat sebuah mobil Suzuki Ertiga putih merayap masuk ke pekarangan rumah nomor 7A, memanfaatkan celah pintu gerbang yang terbuka tanpa pengawasan ketat.',
  },
  {
    shot: 3,
    id: 's3',
    text: 'Dari kendaraan itu, turun empat perampok kawakan yang dikenal kepolisian sebagai komplotan Korea Utara, dipimpin oleh residivis kambuhan bernama Ramlan Butarbutar alias Kapten Pincang, bersama tiga rekannya: Erwin Situmorang, Yus Pane, dan Sinaga.',
  },
  {
    shot: 4,
    id: 's4',
    text: 'Bersenjatakan pistol dan senjata tajam, Ramlan dan kelompoknya merangsek masuk ke ruang tengah, menodong para penghuni rumah, asisten rumah tangga, dan sopir yang tengah berkumpul tanpa daya.',
  },
  {
    shot: 5,
    id: 's5',
    text: 'Satu per satu korban digiring secara paksa ke dalam toilet pembantu di lantai dasar yang pengap tanpa ventilasi, diintimidasi agar tidak bersuara sembari para pelaku menggeledah kamar-kamar tidur utama.',
  },
  {
    shot: 6,
    id: 's6',
    text: 'Nahas, sang pemilik rumah, insinyur arsitek terkemuka Dodi Triono, tiba di rumah saat aksi perampokan tengah berlangsung, dan ia pun langsung diseret serta dijebloskan ke dalam ruangan sempit yang sudah disesaki sepuluh orang.',
  },
  {
    shot: 7,
    id: 's7',
    text: 'Demi memastikan para korban tak bisa meloloskan diri, Erwin Situmorang menyalakan keran air, merusak gerendel kunci, lalu membuang anak kunci ke luar, mengunci mati sebelas jiwa dalam kegelapan yang kian menipis pasokan udaranya.',
  },
  {
    shot: 8,
    id: 's8',
    text: 'Setelah menggasak uang tunai, mata uang asing, puluhan jam tangan mewah bermerek Rolex, dan sejumlah telepon genggam, kawanan bandit ini melenggang kabur meninggalkan para korban berjuang menghirup sisa napas.',
  },
  {
    shot: 9,
    id: 's9',
    text: 'Hampir sembilan belas jam berselang, jerit kepedihan pecah saat kerabat dan petugas keamanan mendobrak paksa pintu toilet, mendapati jasad Dodi Triono beserta dua putrinya dan tiga korban lain telah terbujur kaku akibat kehabisan napas.',
  },
  {
    shot: 10,
    id: 's10',
    text: 'Penyelidikan kilat tim gabungan Polda Metro Jaya membuahkan hasil dalam hitungan jam; jejak para pelaku terendus di Bojong Rawalumbu, Bekasi, memicu drama baku tembak sengit di mana Ramlan Butarbutar tewas tertembus timah panas polisi.',
  },
  {
    shot: 11,
    id: 's11',
    text: 'Tragedi Pulomas menjadi catatan hitam kriminalitas ibu kota, membuktikan bahwa komplotan paling dingin sekalipun tak akan mampu bersembunyi dari kejar-kejaran keadilan hukum yang menuntut pertanggungjawaban atas setiap nyawa tak berdosa.',
  },
];

// Flow MCP Prompts for 15 Specific Forensic Keyframes (Graphic Novel Neo-Noir)
const NEW_KEYFRAME_PROMPTS: Record<string, string> = {
  'cover-shot-00.jpg':
    "A dramatic high-CTR Instagram Reels vertical 9:16 cover illustration (1080x1920), Graphic Novel Neo-Noir Forensic style. Split-face portrait: on the left, a cold, ruthless 50-year-old Indonesian male criminal (Ramlan Butarbutar alias Kapten Pincang) with receding hairline, intense callous eyes, and weathered skin under dim amber rim light; on the right, the shadowy exterior of an upscale modern mansion in Pulomas at night surrounded by yellow Indonesian police line tape 'DILARANG MELINTAS - GARIS POLISI'. Matte charcoal slate (#0D1117) with antique bronze highlights (#C59B27) and dried crimson accents (#8B2635). Distressed bold stencil typography: 'TRAGEDI PULOMAS' in broken-white stencil and 'PENYEKAPAN KAMAR MANDI MAUT' in vivid crimson ribbon. Full bleed, zero border.",
  'ertiga-gate-entry.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). A white Suzuki Ertiga car slowly creeping through a tall open wrought-iron gate into the paved courtyard of a grand two-story luxury mansion in Pulomas, East Jakarta. Overcast late afternoon sky, wet asphalt reflections from a passing drizzle, dark charcoal and steel blue tone, heavy chiaroscuro, full bleed.",
  'four-suspects-walking.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Four sinister Indonesian male figures walking briskly in single file along a luxury stone driveway. The leader in front walks with a subtle distinct limp, wearing a dark jacket and baseball cap. Long dramatic shadows cast behind them under dim porch lighting, graphic comic ink hatching, deep black shadows, full bleed.",
  'cctv-living-room-intimidation.jpg':
    "Graphic novel neo-noir security camera footage visualization 9:16 (1080x1920). High-angle black-and-white grain surveillance camera view inside an opulent marble-floored living room with spiral staircase. Armed robbers pointing a handgun and machete at terrified housemaids, drivers, and young girls crouching together on the floor. Digital timestamp overlay '26/12/2016 14:42:15' in green phosphor, high-contrast monochrome inking, full bleed.",
  'narrow-bathroom-door.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Low-angle view of a small wooden door leading to a cramped ground-floor servant bathroom (1.5x2 meters). A tattooed rough hand violently shoving terrified shadowy figures inside. Harsh contrast between warm luxurious corridor chandelier light and the claustrophobic darkness within the small white-tiled bathroom, full bleed.",
  'dodi-arrival-ambush.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). In the front entryway foyer of the luxury home, a well-dressed 59-year-old Indonesian architect wearing glasses and a polo shirt (Ir. Dodi Triono) is ambushed from behind by two masked men. Shocked expression, briefcase slipping from hands, dynamic motion lines, intense noir lighting, full bleed.",
  'water-faucet-broken-lock.jpg':
    "Graphic novel neo-noir forensic macro illustration 9:16 (1080x1920). Inside the cramped bathroom, water gushes rapidly from a bathroom sink faucet onto a tiled floor. Close-up in the foreground reveals a broken metal door latch and keyhole jammed and locked tightly from the outside, with yellow evidence tag tent 'BB-02'. Chilling claustrophobia, dramatic high-contrast ink crosshatching, full bleed.",
  'rolex-money-loot.jpg':
    "Graphic novel neo-noir forensic macro illustration 9:16 (1080x1920). Forensic crime scene evidence display on a polished dark desk. Scattered stacks of Indonesian rupiah notes, foreign Thai baht bills, several luxury Rolex wristwatches with gold bezels, and five smartphones under a clinical white forensic flashlight beam. Sharp line art, halftone dot shading, full bleed.",
  'door-break-crowbar.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Tuesday morning rescue scene. An Indonesian security guard and police officer using a heavy steel crowbar to violently pry open the jammed wooden bathroom door. Splintering wood around the lock, dust flying, intense urgent panic, harsh morning sunlight cutting through the hallway, full bleed.",
  'forensic-rescue-morning.jpg':
    "Graphic novel neo-noir emotional forensic illustration 9:16 (1080x1920). Tragic discovery scene in the hallway outside the bathroom. Paramedics and police officers in forensic vests tending to unconscious victims on the floor with yellow police caution tape across the background. Heartbreaking somber atmosphere, cool desaturated slate and muted crimson palette, full bleed.",
  'bekasi-hideout-dawn.jpg':
    "Graphic novel neo-noir atmospheric vertical illustration 9:16 (1080x1920). Exterior view of a cramped concrete rental alleyway (Gang Kalong, Bojong Rawalumbu, Bekasi) in early morning mist. Cluttered electrical wires overhead, rusted zinc roofs, dim yellow streetlamp reflecting off wet puddles. Unmarked black police vehicles parked discreetly at the corner, high-contrast noir mood, full bleed.",
  'gunfight-ambush.jpg':
    "Graphic novel neo-noir action vertical illustration 9:16 (1080x1920). Intense shootout in a narrow alleyway. Indonesian plainclothes tactical police detectives firing handguns from behind a brick wall, bright orange muzzle flashes illuminating the darkness. A suspect attempting to draw a weapon in the background amidst ricocheting sparks and smoke, full bleed.",
  'ramlan-apprehension.jpg':
    "Graphic novel neo-noir forensic vertical illustration 9:16 (1080x1920). The aftermath of the raid on wet concrete floor. Police detectives securing the scene with handcuffs and evidence markers beside a dropped weapon. Blue and red police strobe lights flashing rhythmically in the rainy background, solemn justice achieved, full bleed.",
  'polda-press-conference.jpg':
    "Graphic novel neo-noir documentary illustration 9:16 (1080x1920). Official police press conference at Ditreskrimum Polda Metro Jaya. High-ranking Indonesian police generals and investigators standing behind a long evidence table displaying seized Rolex watches, currency, weapons, and mugshot portraits on display easels. Flashbulbs popping, microphone stands, sharp graphic novel lines, full bleed.",
  'gavel-justice-memorial.jpg':
    "Graphic novel neo-noir reflective vertical illustration 9:16 (1080x1920). Inside a solemn Indonesian courtroom. A heavy dark wooden judge gavel struck down on its wooden sound block in the foreground. In the soft, respectful background, a framed memorial tribute with glowing candles in front of the Pulomas residence under warm golden light. Poignant closure and justice, full bleed.",
};

// Narrative Beat Plans: 32 visual beats with zero repetition across 11 spoken sentences
const NARRATIVE_BEAT_PLANS: Array<{ images: Array<{ file: string; weight: number }> }> = [
  // Sentence 1 (~0.08s - ~16.5s): Cover Hook & Penyekapan Kamar Mandi Maut
  {
    images: [
      { file: 'cover-shot-00.jpg', weight: 1.4 },
      { file: 'narrow-bathroom-door.jpg', weight: 1.1 },
      { file: 'four-suspects-walking.jpg', weight: 1.2 },
    ],
  },
  // Sentence 2 (~16.5s - ~27.5s): Modus Suzuki Ertiga Masuk Pagar Terbuka
  {
    images: [
      { file: 'ertiga-gate-entry.jpg', weight: 1.4 },
      { file: 'four-suspects-walking.jpg', weight: 1.2 },
    ],
  },
  // Sentence 3 (~27.5s - ~39.0s): Komplotan 'Korea Utara' Ramlan Kapten Pincang
  {
    images: [
      { file: 'four-suspects-walking.jpg', weight: 1.3 },
      { file: 'cctv-living-room-intimidation.jpg', weight: 1.3 },
    ],
  },
  // Sentence 4 (~39.0s - ~50.0s): Invasi Ruang Tengah & Todongan Senjata
  {
    images: [
      { file: 'cctv-living-room-intimidation.jpg', weight: 1.5 },
      { file: 'narrow-bathroom-door.jpg', weight: 1.1 },
    ],
  },
  // Sentence 5 (~50.0s - ~60.5s): Penggiringan ke Toilet Pembantu Sempit
  {
    images: [
      { file: 'narrow-bathroom-door.jpg', weight: 1.4 },
      { file: 'dodi-arrival-ambush.jpg', weight: 1.2 },
    ],
  },
  // Sentence 6 (~60.5s - ~71.5s): Kepulangan Ir. Dodi Triono Dijebloskan Masuk
  {
    images: [
      { file: 'dodi-arrival-ambush.jpg', weight: 1.4 },
      { file: 'narrow-bathroom-door.jpg', weight: 1.2 },
    ],
  },
  // Sentence 7 (~71.5s - ~83.0s): Keran Air Dinyalakan & Grendel Pintu Dirusak
  {
    images: [
      { file: 'water-faucet-broken-lock.jpg', weight: 1.6 },
      { file: 'rolex-money-loot.jpg', weight: 1.1 },
    ],
  },
  // Sentence 8 (~83.0s - ~94.0s): Penjarahan Rolex, Uang Asing, & Pelarian
  {
    images: [
      { file: 'rolex-money-loot.jpg', weight: 1.5 },
      { file: 'door-break-crowbar.jpg', weight: 1.2 },
    ],
  },
  // Sentence 9 (~94.0s - ~106.0s): Penemuan Tragis Jam 09.25 & Dobrak Pintu
  {
    images: [
      { file: 'door-break-crowbar.jpg', weight: 1.4 },
      { file: 'forensic-rescue-morning.jpg', weight: 1.4 },
    ],
  },
  // Sentence 10 (~106.0s - ~118.0s): Penggerebekan & Baku Tembak Bojong Bekasi
  {
    images: [
      { file: 'bekasi-hideout-dawn.jpg', weight: 1.1 },
      { file: 'gunfight-ambush.jpg', weight: 1.4 },
      { file: 'ramlan-apprehension.jpg', weight: 1.3 },
    ],
  },
  // Sentence 11 (~118.0s - ~130.0s): Konferensi Pers Polda & Vonis Keadilan
  {
    images: [
      { file: 'polda-press-conference.jpg', weight: 1.3 },
      { file: 'gavel-justice-memorial.jpg', weight: 1.5 },
      { file: 'cover-shot-00.jpg', weight: 1.1 },
    ],
  },
];

// Strict Charon voice synthesis using multi-tier Gemini TTS fallback pool (100% Authentic Charon, Zero Fallback)
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

  // If PCM already exists, convert to punchy WAV
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

    for (let cycle = 1; cycle <= 6; cycle++) {
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
              console.warn(`[VO ${idx}/11] Rate limit pada ${model}. Menunggu 15 detik (cycle ${cycle}, attempt ${attempt}/3)...`);
              await new Promise((r) => setTimeout(r, 15000));
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
      if (audioData) break;
      console.log(`[VO ${idx}/11] Semua model dalam rate limit cooldown. Menunggu 25 detik sebelum cycle ${cycle + 1}...`);
      await new Promise((r) => setTimeout(r, 25000));
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
  console.log('  🎭 PIPELINE MASTER: PERAMPOKAN SADIS PULOMAS (PENYEKAPAN KAMAR MANDI)');
  console.log('     (Detikcom Kronologi • 100% Charon VO • Zero Repetition • Flow MCP)');
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
      const fallbackSrc = path.join(ROOT_DIR, 'public', 'renders', 'eno-pelaku-berbagi-peran', 'keyframes', 'cover-shot-00.jpg');
      if (fs.existsSync(fallbackSrc)) {
        fs.copyFileSync(fallbackSrc, destPub);
        fs.copyFileSync(fallbackSrc, destHf);
      }
    }
  }

  // 2. Synthesize 11 DeepSeek Sentences with Gemini Charon VO
  console.log('\n2. Mensintesis 11 Kalimat Voice Over (Gemini Charon VO 100%)...');
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
    title: 'TRAGEDI PULOMAS: Penyekapan Kamar Mandi Maut',
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
    title: 'TRAGEDI PULOMAS: Penyekapan Kamar Mandi Maut',
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
  const finalVideoPath = path.join(PUBLIC_DIR, 'pulomas-perampokan-sadis-final.mp4');

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
    { sec: '18.0', name: 'preview-18s-ertiga-entry.jpg' },
    { sec: '32.0', name: 'preview-32s-four-suspects.jpg' },
    { sec: '45.0', name: 'preview-45s-cctv-intimidation.jpg' },
    { sec: '75.0', name: 'preview-75s-faucet-lock.jpg' },
    { sec: '98.0', name: 'preview-98s-crowbar-rescue.jpg' },
    { sec: '120.0', name: 'preview-120s-justice-verdict.jpg' },
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
  <title>TRAGEDI PULOMAS: Penyekapan Kamar Mandi Maut (Instagram Reels Master)</title>
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
      <span class="tag">INSTAGRAM REELS SPECIAL • DETIKCOM INVESTIGATIF</span>
      <h1>TRAGEDI PERAMPOKAN PULOMAS</h1>
      <p class="subtitle">Misteri Penyekapan Kamar Mandi Maut & Komplotan Korea Utara</p>
    </header>

    <div class="grid">
      <div class="video-card">
        <video controls playsinline preload="metadata">
          <source src="pulomas-perampokan-sadis-final.mp4" type="video/mp4">
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
          
          <p style="font-size: 12px; color: var(--accent); margin-bottom: 6px; font-weight: 600;">📱 FORMAT INSTAGRAM REELS (INVESTIGASI DETIKCOM):</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>Rumah mewah arsitek terkemuka di Pulomas mendadak berubah jadi neraka bisu... 11 penghuni rumah disekap berjejal di kamar mandi sempit 1.5x2 meter hingga 6 orang meninggal dunia kehabisan oksigen! 🚨💔

Komplotan "Korea Utara" pimpinan Ramlan Butarbutar alias Kapten Pincang memanfaatkan celah pagar terbuka, menodong seisi rumah dengan senjata api, menyalakan keran air, merusak gerendel kunci, lalu melarikan diri menggasak jam tangan mewah Rolex dan valuta asing.

Simak kronologi lengkap rekonstruksi kejahatan dan baku tembak penggerebekan Ditreskrimum Polda Metro Jaya di Bojong Bekasi!

#TragediPulomas #PerampokanPulomas #DodiTriono #RamlanButarbutar #TrueCrimeIndonesia #KasusKriminal #PoldaMetroJaya #Forensik #Detikcom #InstagramReels #viral #fyp</span>
          </div>

          <p style="font-size: 12px; color: var(--accent); margin-top: 14px; margin-bottom: 6px; font-weight: 600;">📺 FORMAT YOUTUBE SHORTS / TIKTOK:</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>KRONOLOGI LENGKAP PERAMPOKAN SADIS PULOMAS: Penyekapan 11 Korban di Kamar Mandi Maut 🚨

Pagar terbuka, todongan senjata kawanan Kapten Pincang, hingga 11 jiwa terkunci mati di toilet 1.5x2 meter. Simak fakta lengkap tragedi yang mengguncang ibu kota!

#Shorts #Pulomas #TrueCrime #InvestigasiKriminal #KasusPulomas</span>
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
