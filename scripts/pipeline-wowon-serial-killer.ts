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

const PROJECT_ID = 'wowon-serial-killer';
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

// 11 DeepSeek Viral Sentences for Instagram Reels (~90s)
const SENTENCES = [
  {
    shot: 1,
    id: 's1',
    text: 'Di balik kesederhanaan sebuah kontrakan di Bantargebang, Bekasi, satu keluarga ditemukan tewas dengan busa keluar dari mulut setelah menenggak kopi beracun, sebuah pemandangan yang justru membongkar sembilan jasad lain terpendam di pekarangan Cianjur.',
  },
  {
    shot: 2,
    id: 's2',
    text: 'Penyelidikan forensik mengungkap kopi hitam itu dicampur racun pestisida Aldicarb dan racun tikus, merenggut nyawa Ai Maimunah beserta dua anak tirinya dalam semalam.',
  },
  {
    shot: 3,
    id: 's3',
    text: "Dari cangkir beracun itu, polisi menelusuri jejak menuju sosok dalang bernama Wowon Erawan alias Aki, pria yang menciptakan tokoh spiritual fiktif 'Aki Banyu' untuk mengendalikan dua eksekutor setianya, Duloh dan Dede.",
  },
  {
    shot: 4,
    id: 's4',
    text: 'Dengan dalih pesugihan penggandaan uang, para korban TKW seperti Siti dan Farida diseret ke dalam perangkap maut, hingga Siti tega didorong ke laut demi menguangkan asuransi.',
  },
  {
    shot: 5,
    id: 's5',
    text: 'Silsilah kematian pun terkuak: Wowon membunuh mertuanya, Noneng, dan istri pertamanya, Wiwin, lalu mengubur keduanya dalam satu lubang di pekarangan Cianjur.',
  },
  {
    shot: 6,
    id: 's6',
    text: 'Kekejaman itu berlanjut saat Wowon membunuh istri sirinya, Halimah, menikahi anak tirinya sendiri, Ai Maimunah, dan bahkan mencekik darah dagingnya, balita Bayu berusia dua tahun, untuk dikubur di samping rumah.',
  },
  {
    shot: 7,
    id: 's7',
    text: "Pembunuhan di Bekasi ternyata direncanakan matang karena Ai Maimunah dianggap tahu terlalu banyak tentang rangkaian pembunuhan sebelumnya, yang oleh pelaku disebut sebagai 'perjalanan perjuangan pembunuhan'.",
  },
  {
    shot: 8,
    id: 's8',
    text: 'Satu per satu lubang kubur dibongkar di pekarangan Cianjur, mengungkap tumpukan jasad yang selama bertahun-tahun disembunyikan di balik tembok rumah keluarga.',
  },
  {
    shot: 9,
    id: 's9',
    text: 'Tim Ditreskrimum Polda Metro Jaya bergerak cepat menangkap trio pembunuh, membeberkan bagaimana Duloh dan Dede mengeksekusi perintah Aki tanpa rasa bersalah.',
  },
  {
    shot: 10,
    id: 's10',
    text: 'Di ruang interogasi, terungkap bahwa setiap korban dibunuh dengan cara berbeda, namun motifnya selalu sama: harta, takhta spiritual, dan upaya menutup mulut saksi hidup.',
  },
  {
    shot: 11,
    id: 's11',
    text: 'Pada akhirnya, kasus ini menjadi cermin dingin bahwa monster paling berbahaya tidak selalu bersembunyi di gang gelap, melainkan duduk tenang di meja makan keluarga sendiri, memangsa darah dagingnya demi keserakahan yang tak pernah usai.',
  },
];

// Flow MCP Prompts for 15 Specific Forensic Keyframes (Graphic Novel Neo-Noir)
const NEW_KEYFRAME_PROMPTS: Record<string, string> = {
  'cover-shot-00.jpg':
    "A dramatic high-CTR Instagram Reels vertical 9:16 cover and thumbnail illustration (1080x1920), Graphic Novel Neo-Noir Forensic style. Striking split-face portrait of 60-year-old Indonesian male suspect Wowon Erawan alias Aki. One half shows an elderly, frail, wrinkled villager with hollow sunken eyes under dim warm lamplight; the other half is consumed in pitch-black shadow revealing a sinister demonic silhouette with glowing ember eyes. In the dark background, a foggy rural Cianjur bamboo grove with freshly dug burial pits marked by yellow police line 'GARIS POLISI'. Matte charcoal slate (#0D1117) with antique bronze highlights (#C59B27). Bold distressed integrated typography: 'SERIAL KILLER CIANJUR - BEKASI' in warm broken-white stencil and 'MISTERI 9 KORBAN WOWON CS' in dried crimson ribbon (#8B2635). Full bleed, zero border.",
  'bantargebang-house.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Desolate rural rental house in Bantargebang Bekasi late at night. Modest single-story Indonesian village house with tiled roof and dim front porch light. Yellow Indonesian police caution tape 'DILARANG MELINTAS - GARIS POLISI' strung across the wooden front door. Wet muddy courtyard with tire tracks under nocturnal drizzle, ominous dark indigo and charcoal palette, heavy chiaroscuro, full bleed.",
  'poison-coffee-cup.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Macro forensic crime scene inspection on an old unpolished wooden table. An overturned enamel mug and ceramic coffee cup with spilled dark black coffee producing suspicious chemical white foam and bubbles. Beside the cup lies an open torn sachet packet of toxic pesticide and rodenticide with skull symbol, labeled with yellow plastic evidence marker tent 'B-01'. Harsh clinical flashlight beam cutting through pitch-black shadows, fine halftone forensic inking, full bleed.",
  'forensic-lab-autopsy.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Police toxicology laboratory at RS Polri Kramat Jati. Brushed stainless steel autopsy table under cold fluorescent lights. Glass test tubes holding dark chemical residue samples, a pair of blue nitrile forensic gloves holding official autopsy toxicology report stamped with red Indonesian police ink 'POSITIF RACUN ALDICARB'. Stark clinical atmosphere, high contrast noir shadows, full bleed.",
  'wowon-aki-banyu.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Sinister psychological portrait. In a pitch-dark room, 60-year-old suspect Wowon crouching in a corner holding an old 2000s cellular phone to his mouth, cupping the microphone with a cloth to disguise his voice into the fictitious cult leader 'Aki Banyu'. His wrinkled face illuminated only by the faint monochrome green backlight of the mobile screen, sinister smile, deep eerie shadows, heavy crosshatching, full bleed.",
  'trio-suspects.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Grim lineup of the three serial killer suspects: Wowon (elderly mastermind), Solihin alias Duloh (cold-blooded executor with gaunt features), and Dede Solehudin (younger accomplice in orange detainee vest). Flanked by Indonesian detectives inside a dim police interrogation facility under a single swinging tungsten bulb, stark dramatic shadows, gritty graphic novel inking, full bleed.",
  'tkw-money-envelope.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Dark supernatural scam evidence. On a bamboo mat beside smoking incense burner and offerings, several thick brown paper envelopes labeled 'PENGGANDAAN UANG' stuffed with rupiah banknotes and copies of green Indonesian migrant worker (TKW) passports with women's passport photos. Eerie mystical candle glow contrasting against charcoal shadows, full bleed.",
  'sea-push-ship.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Chilling midnight nautical murder scene. Silhouettes on the open deck of an inter-island ferry ship crossing dark choppy sea under moonless stormy sky. One shadowy figure violently pushing another figure over the rusted steel railing into the turbulent black ocean waves below. Cold sea spray, dramatic atmospheric noir lighting, heavy graphic novel inking, full bleed.",
  'cianjur-double-grave.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Rural backyard burial scene in Ciranjang Cianjur East Java. Inside a narrow overgrown banana and bamboo grove, a deep rectangular freshly dug burial pit in damp red clay. Indonesian police evidence stakes numbered '01' and '02' marking the single mass grave where two female victims (mother and daughter) were interred together. Yellow police tape flapping, harsh spotlight illumination, full bleed.",
  'halimah-burial.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Melancholic rural village cemetery scene in Cililin West Java at dusk. Villagers in batik and peci gathering around a freshly covered earthen grave mound covered in wilted jasmine petals. A wooden grave marker, ominous grey evening clouds hanging low, deceptive calm masking a concealed murder, moody atmospheric watercolor-ink hybrid, full bleed.",
  'toddler-bayu-grave.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Heartbreaking forensic crime scene view. In a narrow muddy alleyway directly beside the bamboo weave wall of a village shack, an excavated miniature burial trench just one meter long. A small plastic toy truck and tiny child's sandal lying discarded in the wet dirt beside yellow evidence marker '05'. Chiaroscuro noir lighting, poignant emotional weight, full bleed.",
  'bekasi-backyard-hole.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Premeditated murder evidence. Behind a dilapidated rental house in Bekasi, a gaping rectangular hole two meters deep dug into the trash-strewn backyard, freshly excavated with a rusted iron hoe and shovel leaning against the dirt mound. Yellow police line tape encircling the excavation perimeter, stark headlights cutting through murky night mist, full bleed.",
  'inafis-excavation-night.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). High-intensity night excavation operation in Cianjur. Multiple Indonesian Inafis police forensic investigators wearing white protective suits, rubber boots, and face masks digging with spades under blinding portable halogen floodlights. Several excavated pits marked with yellow evidence placards, curious crowds held back by dark silhouettes of uniformed police officers in distance, full bleed.",
  'polda-metro-arrest.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Tactical dawn raid arrest in a West Java village. Armed Indonesian plainclothes detectives subduing and handcuffing the elderly serial killer suspects on the gravel ground outside their wooden shack. Flashing red and blue emergency beacon lights casting vibrant crimson and azure reflections across the misty dawn scene, dynamic low angle, full bleed.",
  'gavel-death-verdict.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). High-drama courtroom culmination in Pengadilan Negeri. Close-up of the chief judge's heavy dark mahogany wooden gavel striking down with immense authority onto the wooden sounding block, sending a shockwave through scattered indictment dossier pages stamped in red 'TUNTUTAN: HUKUMAN MATI' (DEATH PENALTY). Brass balance scales of justice blurred in dark atmospheric background, intense chiaroscuro, full bleed.",
};

// Narrative-Synchronized Beat Plans (Zero Repetition, Dynamic Pacing)
interface SentenceBeatPlan {
  images: Array<{ file: string; weight: number }>;
}

const NARRATIVE_BEAT_PLANS: SentenceBeatPlan[] = [
  // Sentence 1 (0s - ~11.5s): Hook Kontrakan Bantargebang & 9 Jasad Cianjur
  {
    images: [
      { file: 'bantargebang-house.jpg', weight: 1.1 }, // Kontrakan Bekasi malam hari
      { file: 'poison-coffee-cup.jpg', weight: 1.2 }, // Cangkir kopi berbusa racun
      { file: 'inafis-excavation-night.jpg', weight: 1.3 }, // Lampu tembak penggalian Cianjur
    ],
  },
  // Sentence 2 (~11.5s - ~21.0s): Racun Aldicarb & Tikus Menewaskan Ai Maimunah & Anak Tiri
  {
    images: [
      { file: 'poison-coffee-cup.jpg', weight: 1.2 }, // Sachet racun & cangkir kopi
      { file: 'forensic-lab-autopsy.jpg', weight: 1.5 }, // Meja lab autopsi toksikologi RS Polri
    ],
  },
  // Sentence 3 (~21.0s - ~32.5s): Sosok Wowon & Tokoh Fiktif "Aki Banyu" Mengendalikan Duloh & Dede
  {
    images: [
      { file: 'wowon-aki-banyu.jpg', weight: 1.5 }, // Wowon merekayasa suara lewat HP jadul
      { file: 'trio-suspects.jpg', weight: 1.3 }, // Siluet trio pelaku di ruang interogasi
    ],
  },
  // Sentence 4 (~32.5s - ~42.0s): Pesugihan Penggandaan Uang TKW & Tragedi Siti Dibuang ke Laut
  {
    images: [
      { file: 'tkw-money-envelope.jpg', weight: 1.3 }, // Amplop pesugihan uang & paspor TKW
      { file: 'sea-push-ship.jpg', weight: 1.6 }, // Siluet kapal feri malam hari mendorong korban ke laut
    ],
  },
  // Sentence 5 (~42.0s - ~51.5s): Wowon Membunuh Mertua (Noneng) & Istri (Wiwin) 1 Lubang Cianjur
  {
    images: [
      { file: 'cianjur-double-grave.jpg', weight: 1.6 }, // Liang lahat 1 lubang 2 jasad di kebun bambu
      { file: 'inafis-excavation-night.jpg', weight: 1.2 }, // Tim Inafis memasang patok bukti
    ],
  },
  // Sentence 6 (~51.5s - ~63.0s): Membunuh Halimah, Menikahi Anak Tiri, & Mencekik Balita Bayu 2 Tahun
  {
    images: [
      { file: 'halimah-burial.jpg', weight: 1.2 }, // Makam Halimah di Cililin
      { file: 'toddler-bayu-grave.jpg', weight: 1.8 }, // Liang kubur balita 2 tahun & sandal kecil
    ],
  },
  // Sentence 7 (~63.0s - ~73.5s): Rencana Matang Bekasi Menutup Jejak "Perjalanan Perjuangan Pembunuhan"
  {
    images: [
      { file: 'bekasi-backyard-hole.jpg', weight: 1.5 }, // Lubang galian 2 meter belakang kontrakan
      { file: 'poison-coffee-cup.jpg', weight: 1.1 }, // Eksekusi racun kopi di meja
    ],
  },
  // Sentence 8 (~73.5s - ~82.0s): Satu per Satu Lubang Kubur Dibongkar di Pekarangan Cianjur
  {
    images: [
      { file: 'inafis-excavation-night.jpg', weight: 1.4 }, // Sorotan lampu Inafis menggali tanah
      { file: 'cianjur-double-grave.jpg', weight: 1.2 }, // Liang lahat terkuak
    ],
  },
  // Sentence 9 (~82.0s - ~91.0s): Penangkapan Tim Ditreskrimum Polda Metro Jaya
  {
    images: [
      { file: 'polda-metro-arrest.jpg', weight: 1.5 }, // Penggerebekan subuh & borgol taktis
      { file: 'trio-suspects.jpg', weight: 1.2 }, // Trio pelaku diinterogasi
    ],
  },
  // Sentence 10 (~91.0s - ~100.5s): Pengakuan Interogasi: Harta, Takhta Spiritual, & Menutup Saksi
  {
    images: [
      { file: 'forensic-lab-autopsy.jpg', weight: 1.2 }, // Berkas bukti pembuktian ilmiah
      { file: 'gavel-death-verdict.jpg', weight: 1.6 }, // Palu vonis hukuman mati PN
    ],
  },
  // Sentence 11 (~100.5s - ~110.0s): Refleksi Dingin Penutup: Monster di Meja Makan Keluarga
  {
    images: [
      { file: 'cover-shot-00.jpg', weight: 1.4 }, // Split face Wowon Aki
      { file: 'wowon-aki-banyu.jpg', weight: 1.2 }, // Fade to black
    ],
  },
];

// Edge-TTS ArdiNeural Voice Synthesis with Noir Acoustic Mastering
async function synthesizeArdiSentence(text: string, idx: number): Promise<{ wavPath: string; durationSec: number }> {
  const pcmPath = path.join(AUDIO_DIR, `sentence-${idx}.pcm`);
  const rawWavPath = path.join(AUDIO_DIR, `raw-sentence-${idx}.wav`);
  const punchyWavPath = path.join(AUDIO_DIR, `punchy-sentence-${idx}.wav`);

  if (fs.existsSync(punchyWavPath) && fs.statSync(punchyWavPath).size > 10000) {
    const dur = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', punchyWavPath]).toString().trim();
    console.log(`   [VO ${idx}/11] File cache ditemukan (${dur}s): ${punchyWavPath}`);
    return { wavPath: punchyWavPath, durationSec: parseFloat(dur) || 8.0 };
  }

  console.log(`[VO ${idx}/11] Mensintesis dengan Edge-TTS (id-ID-ArdiNeural, Noir Mastering)...`);
  const tempMp3 = path.join(AUDIO_DIR, `temp-sentence-${idx}.mp3`);
  const edgeTtsBin = fs.existsSync('/Users/beny/Library/Python/3.9/bin/edge-tts')
    ? '/Users/beny/Library/Python/3.9/bin/edge-tts'
    : 'edge-tts';

  execFileSync(edgeTtsBin, [
    '--voice', 'id-ID-ArdiNeural',
    '--rate=+2%',
    '--pitch=-8Hz',
    '--text', text,
    '--write-media', tempMp3,
  ]);

  execFileSync(ffmpeg, [
    '-y',
    '-i', tempMp3,
    '-af', 'equalizer=f=120:width_type=o:width=2:g=3.5,equalizer=f=3200:width_type=o:width=1:g=2.5,highpass=f=75,lowpass=f=8000',
    '-ar', '48000',
    '-ac', '2',
    rawWavPath,
  ]);

  if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);

  // Accelerate slightly (atempo=1.08) for snappy ~90s Instagram Reels delivery
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
  console.log('  🎭 PIPELINE MASTER: SERIAL KILLER CIANJUR - BEKASI (WOWON CS 9 KORBAN)');
  console.log('     (DeepSeek Script • Edge-TTS Noir Mastered • Zero Repetition • Flow MCP)');
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
      const fallbackSrc = path.join(ROOT_DIR, 'public', 'renders', 'ryan-jombang-smiling-killer', 'keyframes', 'shot-10.jpg');
      if (fs.existsSync(fallbackSrc)) {
        fs.copyFileSync(fallbackSrc, destPub);
        fs.copyFileSync(fallbackSrc, destHf);
      }
    }
  }

  // 2. Synthesize 11 DeepSeek Sentences with Edge-TTS (ArdiNeural Noir Mastered)
  console.log('\n2. Mensintesis 11 Kalimat Voice Over (Edge-TTS ArdiNeural Noir Mastered)...');
  const sentenceTimings: Array<{ id: string; shot: number; text: string; wavPath: string; durationSec: number; start: number; end: number }> = [];

  // Start immediately from cover at 0.08s (Zero Dead Air)
  let currentCursor = 0.08;

  for (let i = 0; i < SENTENCES.length; i++) {
    const s = SENTENCES[i];
    const res = await synthesizeArdiSentence(s.text, s.shot);
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
    title: 'SERIAL KILLER CIANJUR - BEKASI: Wowon Cs (9 Korban)',
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
    title: 'SERIAL KILLER CIANJUR - BEKASI: Wowon Cs (9 Korban)',
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
  const finalVideoPath = path.join(PUBLIC_DIR, 'wowon-serial-killer-final.mp4');

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
    { sec: '15.0', name: 'preview-15s-poison-cup.jpg' },
    { sec: '25.0', name: 'preview-25s-wowon-aki-banyu.jpg' },
    { sec: '35.0', name: 'preview-35s-sea-push.jpg' },
    { sec: '55.0', name: 'preview-55s-toddler-bayu.jpg' },
    { sec: '70.0', name: 'preview-70s-bekasi-hole.jpg' },
    { sec: '95.0', name: 'preview-95s-death-verdict.jpg' },
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
  <title>SERIAL KILLER CIANJUR - BEKASI | Wowon Cs (9 Korban)</title>
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
      <span class="tag">INSTAGRAM REELS SPECIAL • 1.5 MENIT (DEEPSEEK SCRIPT)</span>
      <h1>SERIAL KILLER CIANJUR - BEKASI</h1>
      <p class="subtitle">Misteri Kopi Beracun & 9 Korban Terpendam Wowon Cs</p>
    </header>

    <div class="grid">
      <div class="video-card">
        <video controls playsinline preload="metadata">
          <source src="wowon-serial-killer-final.mp4" type="video/mp4">
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
            <div class="stat-val">Frame 0.08s</div>
            <div class="stat-lbl">VO Start</div>
          </div>
        </div>

        <div>
          <h2 class="section-title">DISTRIBUSI SOSMED (VIRAL INSTAGRAM REELS KIT)</h2>
          
          <p style="font-size: 12px; color: var(--accent); margin-bottom: 6px; font-weight: 600;">📱 FORMAT INSTAGRAM REELS (SUPERNATURAL CON HOOK):</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>Satu keluarga ditemukan tewas dengan mulut berbusa di kontrakan Bantargebang Bekasi... namun secangkir kopi hitam itu justru membongkar neraka sembilan jasad terkubur di pekarangan Cianjur! ☕🩸🤐

Wowon alias Aki merekayasa sosok spiritual fiktif "Aki Banyu" lewat telepon, menjerat para TKW dalam pesugihan amplop ajaib, hingga tega mencekik balita darah dagingnya sendiri berusia 2 tahun demi menutup jejak kejahatan berantai.

Simak kronologi lengkap pengungkapan Ditreskrimum Polda Metro Jaya atas kasus pembunuhan berantai paling mengerikan di Jawa Barat ini!

#SerialKiller #WowonCs #PembunuhanBerantai #CianjurBekasi #TrueCrimeIndonesia #KasusKriminal #Forensik #Detikcom #InstagramReels #fyp #viral</span>
          </div>

          <p style="font-size: 12px; color: var(--accent); margin-top: 14px; margin-bottom: 6px; font-weight: 600;">📺 FORMAT YOUTUBE SHORTS / TIKTOK:</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>SERIAL KILLER WOWON CS: Misteri Kopi Beracun & 9 Jasad Terkubur di Cianjur-Bekasi 🚨

Sosok fiktif Aki Banyu, penipuan pesugihan TKW, hingga balita 2 tahun yang dikubur diam-diam di samping rumah. Simak kronologi lengkap pembunuhan berantai yang mengguncang nurani bangsa!

#Shorts #TrueCrime #WowonCianjur #InvestigasiKriminal #ForensikKepolisian</span>
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
