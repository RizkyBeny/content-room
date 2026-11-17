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

const PROJECT_ID = 'ryan-jombang-smiling-killer';
const PREV_PROJECT_ID = 'ryan-jombang-kebagusan';
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public', 'renders', PROJECT_ID);
const PREV_PUBLIC_DIR = path.join(ROOT_DIR, 'public', 'renders', PREV_PROJECT_ID);
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
    text: 'Di balik senyum tenang dan wajah tampan seorang pria, tersembunyi salah satu paradoks paling mengerikan dalam sejarah kriminal Indonesia: sebelas jasad manusia terkubur diam-diam di halaman belakang rumahnya.',
  },
  {
    shot: 2,
    id: 's2',
    text: 'Semuanya terungkap pada dua belas Juli 2008, ketika penemuan potongan tubuh Heri Santoso di dekat kawasan Ragunan mengguncang Jakarta dan membuka tabir pembunuhan berantai yang selama ini tak terlihat.',
  },
  {
    shot: 3,
    id: 's3',
    text: 'Polisi bergerak cepat: sebuah nota di rumah korban, mobil yang terparkir di Margonda Residence Depok, dan jejak belanja kartu kredit menuntun penyidik ke satu nama: Very Idham Henyansyah alias Ryan Jombang.',
  },
  {
    shot: 4,
    id: 's4',
    text: 'Pada lima belas Juli, Ryan ditangkap bersama pacarnya, namun gelagatnya justru membuat polisi curiga: pria itu tersenyum tenang dan bahagia, sama sekali tanpa rasa resah layaknya seorang pembunuh.',
  },
  {
    shot: 5,
    id: 's5',
    text: 'Empat hari kemudian, dalam interogasi intensif pada sembilan belas Juli, pengakuan dinginnya membongkar fakta bahwa koper di Ragunan hanyalah permulaan dari rangkaian pembunuhan yang jauh lebih luas.',
  },
  {
    shot: 6,
    id: 's6',
    text: 'Penggalian tahap pertama pada dua puluh Juli di Jombang mendapati palu berlumuran darah dan serpihan tulang di kamar Ryan, serta empat mayat yang ditemukan terkubur di halaman belakang.',
  },
  {
    shot: 7,
    id: 's7',
    text: 'Penggalian diperluas, dan terungkap enam mayat lagi, termasuk seorang ibu bernama Nanik Hidayati dan balitanya yang baru berusia tiga tahun, menggenapkan korban menjadi sebelas jiwa.',
  },
  {
    shot: 8,
    id: 's8',
    text: 'Motifnya pun terkuak: penguasaan harta dan asmara yang berlangsung dari tahun 2006 hingga 2008, sebuah pola kelam yang dijalankan dengan ketenangan mengerikan.',
  },
  {
    shot: 9,
    id: 's9',
    text: 'Bahkan di dalam bui, Ryan menulis autobiografi dan merekam album musik berjudul Persembahan Terakhir, menjelma sebagai sang pembunuh bernyanyi yang menggemparkan publik.',
  },
  {
    shot: 10,
    id: 's10',
    text: 'Majelis Hakim Pengadilan Negeri Depok akhirnya menjatuhkan vonis hukuman mati, mengakhiri drama kriminal yang menyorot sisi gelap manusia di balik senyum ramahnya.',
  },
  {
    shot: 11,
    id: 's11',
    text: 'Refleksi dinginnya: monster paling berbahaya tidak selalu datang dengan wajah menyeramkan, melainkan sering kali bersembunyi di balik topeng senyuman ramah yang menutupi neraka di halaman belakang.',
  },
];

// Flow MCP Prompts for Specific New Scenes
const NEW_KEYFRAME_PROMPTS: Record<string, string> = {
  'cover-shot-00.jpg': "A dramatic high-CTR Instagram Reels vertical 9:16 cover and thumbnail illustration (1080x1920), Graphic Novel Neo-Noir Forensic style. Striking split-face portrait of 30-year-old Indonesian male suspect Very Idham Henyansyah alias Ryan. One half shows a handsome, calm young man with wire-rimmed glasses smiling charmingly under soft lighting; the other half is consumed in deep pitch-black shadows revealing a cold sinister silhouette with dark hollow eyes. In the dark background, a foggy Javanese backyard with freshly dug burial mounds and yellow police caution tape 'GARIS POLISI'. Matte charcoal slate (#0D1117) with antique bronze highlights (#C59B27). Bold distressed integrated typography: 'THE SMILING SERIAL KILLER' in warm broken-white stencil and 'MISTERI 11 KORBAN RYAN JOMBANG' in dried crimson ribbon (#8B2635). Full bleed, zero border.",
  'jombang-excavation.jpg': "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Night excavation in a desolate rural backyard in Jombang East Java. Indonesian police detectives in dark jackets and forensic officers with shovels and spades digging near a banana grove and dried fish pond under harsh portable floodlights. Yellow police line tape 'GARIS POLISI' flapping in the night breeze, several excavated burial pits marked with numbered yellow evidence tents, deep ominous shadows, heavy graphic novel inking, chiaroscuro contrast, full bleed.",
  'bloody-hammer.jpg': "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Extreme close-up forensic laboratory view of physical murder weapon: a heavy steel claw hammer with weathered wooden handle. Dark dried biological bloodstains and microscopic white bone fragments visible on the steel head under a bright magnifying glass and forensic measuring ruler tape in centimeters. Labeled with yellow evidence tent 'B-04', clinical noir chiaroscuro, fine halftone dots, full bleed.",
  'prison-singer.jpg': "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Melancholic psychological prison interior. Inside a dim concrete cell behind heavy iron bars, an old studio recording microphone on a stand, handwritten song lyrics notebook, and an audio cassette tape labeled 'Persembahan Terakhir' resting on a small wooden stool. A single beam of cold moonlight piercing through high cell bars casting long vertical shadows, moody graphic novel inking, deep charcoal slate (#0D1117), full bleed.",
};

// 44 Rapid-Fire Visual Beats Sequence (1.8s - 2.5s per cut)
const RAPID_SCENE_SEQUENCE = [
  // Scene 1: The Smiling Killer Paradox (0s - 10s)
  'cover-shot-00.jpg',
  'shot-10.jpg', // Sketsa Ryan tersenyum tenang
  'jombang-excavation.jpg', // Pekarangan Jombang
  'shot-10.jpg', // Wajah berkacamata
  // Scene 2: 12 Juli 2008 Penemuan Koper Ragunan (10s - 19s)
  'shot-01.jpg', // Kebagusan Ragunan berkabut
  'shot-02.jpg', // Koper hitam tali merah
  'shot-03.jpg', // Polisi membuka koper
  'shot-04.jpg', // Lab forensik RS Polri
  // Scene 3: Pelacakan Margonda & Kartu Kredit (19s - 28s)
  'shot-05.jpg', // Berkas korban Heri Santoso
  'shot-06.jpg', // Mobil korban terparkir
  'shot-11.jpg', // Menara Margonda Residence
  'shot-08.jpg', // Struk belanja kartu kredit
  // Scene 4: Penangkapan & Senyum Bahagia (28s - 37s)
  'shot-09.jpg', // CCTV mall tanda tangan palsu
  'shot-18.jpg', // Penangkapan di Depok
  'shot-10.jpg', // Senyum dingin tak berdosa
  'shot-18.jpg', // Borgol taktis mengunci
  // Scene 5: Pengakuan Dingin Interogasi (37s - 46s)
  'shot-19.jpg', // Ruang interogasi Polda Metro Jaya
  'shot-12.jpg', // Kamar 309 disemprot luminol
  'shot-13.jpg', // Pendaran biru kamar mandi
  'shot-19.jpg', // Tangan menunjuk peta Jombang
  // Scene 6: Penggalian Jombang & Palu Tulang (46s - 55s)
  'bloody-hammer.jpg', // Palu berlumuran darah & serpihan tulang
  'jombang-excavation.jpg', // Penggalian pekarangan malam hari
  'bloody-hammer.jpg', // Kaca pembesar bukti B-04
  'jombang-excavation.jpg', // 4 makam pertama terbuka
  // Scene 7: Penggalian 6 Mayat & Ibu-Balita (55s - 64s)
  'jombang-excavation.jpg', // Garis polisi membentang di kebun
  'shot-04.jpg', // Dokumen forensik identitas korban
  'jombang-excavation.jpg', // Liang lahat di bawah pohon
  'shot-14.jpg', // Pisau dan lakban barang bukti
  // Scene 8: Pola Kelam & Motif Harta (64s - 72s)
  'shot-15.jpg', // Rekonstruksi asmara & pertikaian
  'shot-16.jpg', // Siluet eksekusi gelap noir
  'shot-07.jpg', // Layar transaksi keuangan korban
  'shot-17.jpg', // Taksi tengah malam mengangkut koper
  // Scene 9: Album Musik di Bui Cibanong (72s - 81s)
  'prison-singer.jpg', // Mikrofon rekaman di sel penjara
  'prison-singer.jpg', // Kaset Persembahan Terakhir
  'shot-10.jpg', // Sorot mata Ryan pembunuh bernyanyi
  'prison-singer.jpg', // Jeruji besi dan bayangan dingin
  // Scene 10: Palu Vonis Mati PN Depok (81s - 89s)
  'shot-20.jpg', // Palu hakim di atas tatakan kayu
  'shot-20.jpg', // Berkas resmi vonis mati
  'shot-19.jpg', // Ruang sidang penuh wartawan
  'shot-20.jpg', // Timbangan keadilan
  // Scene 11: Moral Paradox Closing (89s - end)
  'cover-shot-00.jpg', // Split face smiling killer
  'jombang-excavation.jpg', // Pekarangan yang kini sunyi
  'shot-10.jpg', // Senyuman dingin terakhir
  'shot-20.jpg', // Penutupan keadilan
];

// Strict voice synthesis using Gemini TTS pool with seamless edge-tts ArdiNeural fallback
async function synthesizeVoiceoverSentence(text: string, idx: number): Promise<{ wavPath: string; durationSec: number }> {
  const pcmPath = path.join(AUDIO_DIR, `sentence-${idx}.pcm`);
  const rawWavPath = path.join(AUDIO_DIR, `raw-sentence-${idx}.wav`);
  const punchyWavPath = path.join(AUDIO_DIR, `punchy-sentence-${idx}.wav`);

  if (fs.existsSync(punchyWavPath) && fs.statSync(punchyWavPath).size > 10000) {
    const dur = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', punchyWavPath]).toString().trim();
    console.log(`   [VO ${idx}/11] File cache ditemukan (${dur}s): ${punchyWavPath}`);
    return { wavPath: punchyWavPath, durationSec: parseFloat(dur) || 8.0 };
  }

  const key = process.env.GEMINI_API_KEY;
  let audioData: string | undefined;

  // 1. Try Gemini TTS if key is present
  if (key) {
    const models = [
      'gemini-3.8-flash-lite-tts',
      'gemini-3.1-flash-tts-preview',
      'gemini-2.5-flash-preview-tts',
      'gemini-3.8-flash-tts',
    ];

    for (const model of models) {
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

        if (res.status === 429 || !res.ok) {
          break; // Daily quota exhausted, fallback immediately to high-def edge-tts
        }

        const data = (await res.json()) as any;
        audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData) {
          console.log(`[VO ${idx}/11] Berhasil dengan Gemini TTS ${model} (Charon)`);
          break;
        }
      } catch (e: any) {
        break;
      }
    }
  }

  if (audioData) {
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
  } else {
    // 2. High-fidelity edge-tts fallback (id-ID-ArdiNeural with crime documentary acoustic mastering)
    console.log(`[VO ${idx}/11] Menggunakan High-Fidelity Voice id-ID-ArdiNeural (Acoustic Mastering)...`);
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
  }

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
  console.log('  🎭 PIPELINE MASTER: THE SMILING SERIAL KILLER (RYAN JOMBANG)');
  console.log('     (DeepSeek Script • 1.5 Menit Reels • Immediate Cover VO • 44 Beats)');
  console.log('========================================================================\n');

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(KEYFRAMES_DIR, { recursive: true });
  fs.mkdirSync(path.join(HF_WORKSPACE, 'assets'), { recursive: true });

  // 1. Copy available keyframes from previous Ryan Jombang project
  console.log('1. Mengimpor keyframe forensik dari arsip sebelumnya...');
  const prevKeyframes = fs.readdirSync(path.join(PREV_PUBLIC_DIR, 'keyframes'));
  prevKeyframes.forEach((f) => {
    if (f.endsWith('.jpg') && f.startsWith('shot-')) {
      const src = path.join(PREV_PUBLIC_DIR, 'keyframes', f);
      const destPub = path.join(KEYFRAMES_DIR, f);
      const destHf = path.join(HF_WORKSPACE, 'assets', f);
      if (!fs.existsSync(destPub)) fs.copyFileSync(src, destPub);
      if (!fs.existsSync(destHf)) fs.copyFileSync(src, destHf);
    }
  });

  // 2. Generate specific new keyframes via Google Flow MCP
  console.log('\n2. Men-generate keyframe baru via Google Flow MCP...');
  for (const [filename, prompt] of Object.entries(NEW_KEYFRAME_PROMPTS)) {
    const destPub = path.join(KEYFRAMES_DIR, filename);
    const destHf = path.join(HF_WORKSPACE, 'assets', filename);

    if (fs.existsSync(destPub) && fs.statSync(destPub).size > 20000) {
      console.log(`   Cache ditemukan: ${filename}`);
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
          console.log(`   ✅ Selesai: ${filename}`);
        }
      }
    } catch (err: any) {
      console.warn(`   ⚠️ Gagal generate ${filename}: ${err.message}. Memakai fallback...`);
      const fallbackSrc = path.join(PREV_PUBLIC_DIR, 'keyframes', 'shot-10.jpg');
      if (fs.existsSync(fallbackSrc)) {
        fs.copyFileSync(fallbackSrc, destPub);
        fs.copyFileSync(fallbackSrc, destHf);
      }
    }
  }

  // 3. Synthesize 11 DeepSeek Sentences with Charon
  console.log('\n3. Mensintesis 11 Kalimat Voice Over (Charon - Gemini TTS Pool)...');
  const sentenceTimings: Array<{ id: string; shot: number; text: string; wavPath: string; durationSec: number; start: number; end: number }> = [];

  // Start immediately from cover at 0.08s
  let currentCursor = 0.08;

  for (let i = 0; i < SENTENCES.length; i++) {
    const s = SENTENCES[i];
    const res = await synthesizeVoiceoverSentence(s.text, s.shot);
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

    if (i < SENTENCES.length - 1 && !fs.existsSync(path.join(AUDIO_DIR, `punchy-sentence-${i + 2}.wav`))) {
      await new Promise((r) => setTimeout(r, 4000));
    }
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

  // 4. Build 44 Rapid-Fire Visual Beats (Cutting every 1.8s - 2.5s)
  console.log('\n4. Membangun 44 Rapid-Fire Visual Beats (1.8s - 2.5s per cut)...');
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

  // 5. Mixing Master Audio (VO + Looped BGM ducked 20% + Dynamic SFX Glitches)
  console.log('\n5. Mixing Audio Master Track...');
  const sfxPath = path.join(ROOT_DIR, 'public', 'renders', 'mujianto-serial-killer', 'audio-chunks', 'forensic-glitch-sfx.wav');
  const localBgm = path.join(ROOT_DIR, 'public', 'renders', 'mujianto-serial-killer', 'bgm-crime-tension.mp3');
  const bgmFadeOutStart = Math.max(0, totalDuration - 2.5);

  const majorGlitchTimes = [1.3, 10.0, 19.0, 28.0, 37.0, 46.0, 55.0, 64.0, 72.0, 81.0].filter((t) => t < totalDuration - 2.0);

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

  // 6. Calculate word timings for discrete karaoke captions
  console.log('\n6. Menghitung Word Timings & Discrete Phrases (Maks 4 kata)...');
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
    title: 'THE SMILING SERIAL KILLER - Misteri 11 Korban Ryan Jombang',
    totalDurationSec: totalDuration,
    transitionTimes,
    shotTimings,
    sentences: sentenceTimings,
    phrases,
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, 'storyboard-data.json'), JSON.stringify(storyboardData, null, 2));

  // 7. Generate HyperFrames index.html & hyperframes.json
  console.log('\n7. Generating HyperFrames Composition (44 Rapid Beats, HTML + GSAP)...');
  const coverPub = path.join(KEYFRAMES_DIR, 'cover-shot-00.jpg');
  const coverHf = path.join(HF_WORKSPACE, 'assets', 'cover-shot-00.jpg');
  if (fs.existsSync(coverPub)) {
    fs.copyFileSync(coverPub, coverHf);
  }

  generateNoirHyperframesHtml({
    jobId: PROJECT_ID,
    title: 'THE SMILING SERIAL KILLER - Misteri 11 Korban Ryan Jombang',
    totalDurationSec: totalDuration,
    coverImagePath: coverPub,
    shotImages,
    shotTimings,
    phrases,
    outputDir: HF_WORKSPACE,
  });

  console.log(`✅ HyperFrames Composition berhasil di-generate di ${HF_WORKSPACE}`);

  // 8. Render Video Timeline dengan HyperFrames Engine (30fps)
  console.log(`\n8. Rendering Video dengan HyperFrames Engine (1080x1920 @ 30fps, ${totalDuration}s)...`);
  const tempVideoPath = path.join(PUBLIC_DIR, 'temp-visual-timeline.mp4');
  const finalVideoPath = path.join(PUBLIC_DIR, 'ryan-jombang-smiling-killer-final.mp4');

  const startTime = Date.now();
  await renderHyperframes({
    projectDir: HF_WORKSPACE,
    outputPath: tempVideoPath,
    fps: 30,
    onProgress: (p) => process.stdout.write(p),
  });

  const renderTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n✅ Visual render selesai dalam ${renderTimeSec} detik!`);

  // 9. Multiplexing Audio Master Track dengan FFmpeg
  console.log('\n9. Multiplexing Audio Master Track dengan FFmpeg...');
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

  // 10. Ekstraksi Verifikasi Frame Snapshots
  console.log('\n10. Mengekstrak snapshot verifikasi visual & autocaption...');
  const snapshots = [
    { sec: '0.8', name: 'preview-01s-hook.jpg' },
    { sec: '5.0', name: 'preview-05s-smiling-killer.jpg' },
    { sec: '25.0', name: 'preview-25s-margonda-card.jpg' },
    { sec: '50.0', name: 'preview-50s-jombang-excavation.jpg' },
    { sec: '85.0', name: 'preview-85s-verdict.jpg' },
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

  // 11. Update Review Portal with Instagram Reels Distribution Kit
  console.log('\n11. Memperbarui Review Portal & Social Media Distribution Kit...');
  const portalHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>THE SMILING SERIAL KILLER | Ryan Jombang</title>
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
      <h1>THE SMILING SERIAL KILLER</h1>
      <p class="subtitle">Misteri 11 Korban di Balik Senyuman Ryan Jombang</p>
    </header>

    <div class="grid">
      <div class="video-card">
        <video controls playsinline preload="metadata">
          <source src="ryan-jombang-smiling-killer-final.mp4" type="video/mp4">
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
            <div class="stat-lbl">Rigid Cuts (1.8s)</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">Frame 0s</div>
            <div class="stat-lbl">VO Start</div>
          </div>
        </div>

        <div>
          <h2 class="section-title">DISTRIBUSI SOSMED (VIRAL INSTAGRAM REELS KIT)</h2>
          
          <p style="font-size: 12px; color: var(--accent); margin-bottom: 6px; font-weight: 600;">📱 FORMAT INSTAGRAM REELS (PARADOX HOOK):</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>Di balik senyuman ramah dan wajah tampan seorang pria... tersembunyi kuburan massal 11 jasad manusia di halaman belakang rumahnya. 🚪🩸🤐

Dikenal sebagai "The Smiling Serial Killer", Ryan Jombang mengejutkan penyidik Polda Metro Jaya karena selalu tersenyum tenang dan bahagia tanpa rasa resah, hingga palu berlumuran darah di kamarnya membongkar pembunuhan keji seorang ibu dan balita 3 tahun.

Simak kronologi lengkap penyelidikan forensik yang mengguncang bangsa ini!

#TheSmilingSerialKiller #RyanJombang #TrueCrimeIndonesia #KasusMutilasi #Jombang #CrimeInvestigation #Forensik #Detikcom #InstagramReels #fyp #viral</span>
          </div>

          <p style="font-size: 12px; color: var(--accent); margin-top: 14px; margin-bottom: 6px; font-weight: 600;">📺 FORMAT YOUTUBE SHORTS / TIKTOK:</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>THE SMILING SERIAL KILLER: Misteri 11 Jasad di Halaman Belakang Ryan Jombang 🚨

Wajah tampan, senyuman tenang, dan album musik di balik jeruji besi. Bagaimana pembunuh berantai paling fenomenal di Indonesia ini terbongkar dari potongan koper di Ragunan?

#Shorts #TrueCrime #RyanJombang #InvestigasiKriminal #ForensikKepolisian</span>
          </div>
        </div>
      </div>
    </div>

    <div class="gallery">
      <h2 class="section-title">TIMELINE 44 VISUAL BEATS (RIGID CUTS)</h2>
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
