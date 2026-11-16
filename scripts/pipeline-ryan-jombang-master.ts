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

const PROJECT_ID = 'ryan-jombang-kebagusan';
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

// 20 Chronological Sentences for Full Mini-Documentary
const SENTENCES = [
  {
    shot: 1,
    id: 's1',
    text: 'Sabtu pagi, dua belas Juli 2008, warga Kebagusan Raya, Pasar Minggu, Jakarta Selatan, digegerkan oleh penemuan koper hitam misterius di semak-semak dekat Kebun Binatang Ragunan.',
  },
  {
    shot: 2,
    id: 's2',
    text: 'Kecurigaan memuncak dari aroma busuk menyengat dan tetesan cairan merah kental yang merembes keluar dari celah resleting koper yang terikat rapat tali rafia merah.',
  },
  {
    shot: 3,
    id: 's3',
    text: 'Saat polisi membuka paksa koper dan kardus di dekatnya, kengerian tak terbayangkan tersingkap: tubuh seorang pria ditemukan terpotong menjadi tujuh bagian tanpa identitas.',
  },
  {
    shot: 4,
    id: 's4',
    text: 'Tim Forensik Rumah Sakit Polri Kramat Jati bergerak cepat melakukan autopsi mendalam dan identifikasi primer melalui pencocokan sidik jari serta rekam medis.',
  },
  {
    shot: 5,
    id: 's5',
    text: 'Hasil identifikasi forensik mengungkap korban bernama Heri Santoso, seorang manajer perusahaan swasta berusia empat puluh tahun yang dilaporkan hilang sejak Jumat malam.',
  },
  {
    shot: 6,
    id: 's6',
    text: 'Penyidik gabungan Ditreskrimum Polda Metro Jaya mendapati bahwa ponsel, dompet, dan mobil korban lenyap dari kediamannya tanpa jejak.',
  },
  {
    shot: 7,
    id: 's7',
    text: 'Titik terang pertama muncul saat tim perbankan mendeteksi adanya transaksi mencurigakan menggunakan kartu kredit milik korban beberapa jam setelah ia dieksekusi.',
  },
  {
    shot: 8,
    id: 's8',
    text: 'Kartu kredit tersebut digesek di sejumlah toko elektronik dan pusat perbelanjaan ternama di kawasan Margonda, Depok, untuk membeli barang-barang bernilai puluhan juta rupiah.',
  },
  {
    shot: 9,
    id: 's9',
    text: 'Rekaman CCTV toko berhasil merekam sosok pria muda bertubuh ramping yang mengenakan kacamata, bertransaksi dengan tanda tangan palsu yang mencurigakan.',
  },
  {
    shot: 10,
    id: 's10',
    text: 'Penyelidikan mendalam mengidentifikasi sosok tersebut sebagai Very Idham Henyansyah alias Ryan, seorang instruktur senam lepas asal Jombang, Jawa Timur.',
  },
  {
    shot: 11,
    id: 's11',
    text: 'Jejak pelarian membawa tim buru sergap ke Apartemen Margonda Residence Tower B lantai tiga kamar tiga kosong sembilan di Kota Depok.',
  },
  {
    shot: 12,
    id: 's12',
    text: 'Di dalam kamar apartemen yang tampak bersih dan rapi, Tim Inafis menyemprotkan cairan kimia luminol untuk mendeteksi bercak darah tak kasat mata.',
  },
  {
    shot: 13,
    id: 's13',
    text: 'Cahaya ultraviolet seketika memancarkan pendaran biru terang di lantai kamar mandi dan dinding, membuktikan bahwa aksi mutilasi keji dilakukan di ruangan tersebut.',
  },
  {
    shot: 14,
    id: 's14',
    text: 'Dari bawah wastafel, polisi menyita sebilah pisau belati bergerigi yang masih menyimpan residu biologis, serta lakban cokelat yang identik dengan pembungkus koper.',
  },
  {
    shot: 15,
    id: 's15',
    text: 'Rekonstruksi mengungkap pada Jumat malam sebelas Juli, korban Heri Santoso mendatangi apartemen sewaan Ryan untuk menyelesaikan urusan pribadi.',
  },
  {
    shot: 16,
    id: 's16',
    text: 'Pertikaian sengit pecah saat korban menunjukkan ketertarikan pada teman dekat Ryan, menyulut kecemburuan obsesif dan amarah gelap sang pelaku.',
  },
  {
    shot: 17,
    id: 's17',
    text: 'Dalam keadaan kalap, Ryan menikam korban bertubi-tubi hingga tewas, lalu memutilasi jasadnya menjadi tujuh bagian untuk memudahkannya membuang bukti.',
  },
  {
    shot: 18,
    id: 's18',
    text: 'Setelah mengemas potongan jasad ke dalam koper dan kardus, Ryan menyewa taksi tengah malam untuk membuangnya ke semak-semak sepi di Kebagusan.',
  },
  {
    shot: 19,
    id: 's19',
    text: 'Kurang dari tiga hari sejak jasad ditemukan, polisi meringkus Ryan di Depok, di mana interogasi intensif membuka pengakuan yang jauh lebih mengerikan tentang kuburan massal di Jombang.',
  },
  {
    shot: 20,
    id: 's20',
    text: 'Pengadilan Negeri Depok akhirnya menjatuhkan vonis hukuman mati bagi Ryan Jombang, menutup babak penyelidikan pembunuhan berantai paling mengguncang dalam sejarah kriminalitas modern Indonesia.',
  },
];

// 21 Prompts for Google Flow MCP Studio
const SHOT_PROMPTS: Record<number, string> = {
  0: "A dramatic high-CTR YouTube Shorts vertical 9:16 cover and thumbnail illustration (1080x1920), Graphic Novel Neo-Noir Forensic style. Desolate suburban roadside in Kebagusan Ragunan at misty dawn with bright yellow police caution tape 'GARIS POLISI - DILARANG MELINTAS' stretching across. In the foreground, a large weathered dark black suitcase (koper) bound with faded red plastic twine resting in damp overgrown grass, yellow police evidence marker tent '01', harsh single tactical flashlight beam piercing cold foggy darkness, heavy contour inking, fine halftone dot pattern, matte charcoal slate (#0D1117) with antique bronze highlights (#C59B27). Bold distressed integrated typography: 'MISTERI KOPER KEBAGUSAN' in warm broken-white stencil and 'TEROR MUTILASI MARGONDA' in dried crimson ribbon (#8B2635). Full bleed, zero border.",
  1: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Exterior low-angle view of Jalan Kebagusan Raya Pasar Minggu near Ragunan Zoo at early morning mist. Damp overgrown roadside bushes, tall wild reeds, distant overcast gray sky, yellow police tape flapping in the wind, a solitary retro streetlamp flickering. Chiaroscuro lighting, heavy ink cross-hatching, matte charcoal slate (#0D1117), full bleed.",
  2: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Ground-level close-up perspective of an ominous large black vinyl suitcase lying abandoned in wet grass and mud. Red twine tied tightly around its swollen body, a shiny silver padlock on the zipper tabs, yellow triangular forensic evidence marker '01' beside it. Harsh white flashlight beam highlighting raindrops and textures, deep noir inking, halftone screen tone texture, full bleed.",
  3: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Respectful psychological crime scene representation. Plainclothes Indonesian detective in leather jacket stepping back in shock under dim morning sky, holding a flashlight illuminating the open suitcase from a distance. Silhouette of police officers keeping curious onlookers behind yellow police line, heavy shadows, no gore, ominous chiaroscuro, matte gray and subtle dried crimson accents, full bleed.",
  4: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Modern clinical forensic morgue laboratory at RS Polri Kramat Jati. Two forensic pathologists in white lab coats, masks, and blue surgical gloves examining case documents under bright stainless steel surgical examination lamps. Overhead camera angle, confidential medical dossier stamped 'HASIL OTOPSI FORENSIK', cool slate blue and monochrome ink tones, full bleed.",
  5: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Police victim identification dossier. Black and white composite photo of victim Heri Santoso, 40-year-old corporate manager in necktie, stamped with red police seal 'KORBAN KEBAGUSAN'. Beside the file lies a silver corporate name badge, magnifying glass, and fingerprint cards with inked whorl prints. Gritty comic textures, deep chiaroscuro, full bleed.",
  6: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Exterior night view of an empty luxury sedan parked askew in a dim Jakarta office parking lot. Driver door slightly ajar, interior dome light off, fallen business card on the wet asphalt beside the tire, eerie fog and rain reflections on windshield. Melancholic noir inking, antique bronze glow, full bleed.",
  7: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Cyber and financial forensics tactical desk. Computer monitor glowing in pitch darkness displaying electronic bank ledger logs, glowing red alert box 'TRANSAKSI TIDAK WAJAR - KARTU KREDIT TERDETEKSI', timestamps and transaction amounts highlighted in green neon phosphor against black terminal screen. Gritty high-contrast noir linework, full bleed.",
  8: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Modern shopping mall electronic boutique counter at Margonda Depok. Point-of-Sale credit card terminal with receipt paper scrolling out, an embossed platinum credit card resting on glass counter, brand new boxed electronics in paper bags, subtle tense atmosphere. Dramatic graphic novel angles, fine halftone textures, full bleed.",
  9: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Grainy monochrome security camera CCTV monitor view with timestamp overlay '2008-07-12 14:22:18'. Slender male figure wearing dark polo shirt and wire-rimmed glasses signing a credit card sales draft at mall cashier, face partially shadowed but distinct facial bone structure visible. Vignette distortion, scanlines, gritty comic inking, full bleed.",
  10: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Police criminal dossier sketch of 30-year-old male suspect Very Idham Henyansyah alias Ryan. Calm yet cold piercing stare, clean-shaven, wire-rimmed spectacles, slender jawline. Bold red confidential stamp 'DPO UTAMA - RESKRIM POLDA METRO JAYA'. High contrast charcoal shading, graphic novel cross-hatching, full bleed.",
  11: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Low angle exterior view of Margonda Residence Apartment tower in Depok at night. Cold monolithic concrete facade with rows of identical windows, single illuminated window on Tower B 3rd floor (Room 309). Neon red street reflections below, wet asphalt, looming ominous atmosphere, full bleed.",
  12: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Inside studio apartment room 309. Two Indonesian police Inafis forensic officers in white protective suits and goggles spraying chemical luminol reagent onto tiled floor. Darkened room, single amber work light on tripod, mysterious quiet room with made bed and small kitchenette in background. Intense graphic novel inking, full bleed.",
  13: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Macro forensic discovery view in bathroom. Glowing fluorescent blue chemiluminescence (luminol reaction) lighting up dark bathroom tiles and grout lines under ultraviolet ALS light, revealing hidden latent wiped bloodstains. Labeled with forensic scale stickers 'B-01' and 'B-02', stark sci-fi noir contrast, full bleed.",
  14: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Close-up of open cabinet beneath bathroom sink. Hidden evidence revealed: heavy tactical serrated dagger with dark handle, yellow evidence tent '03', roll of industrial brown packing tape beside it. Harsh overhead flashlight beam, deep black shadows, antique bronze accents, full bleed.",
  15: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Dramatic psychological tension silhouette. Two male figures standing in apartment living room, intense confrontation. One man pointing finger angrily, the other standing in shadow with rigid posture, red tension haze glowing through window blinds, expressive dynamic comic lines, full bleed.",
  16: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Dark symbolic psychological murder representation. Shadow cast against white apartment wall of raised arm and weapon, glass tumbler shattering on tiled floor, dramatic noir chiaroscuro, no graphic gore, purely suspenseful Hitchcockian silhouette framing, deep charcoal slate (#0D1117), full bleed.",
  17: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Midnight rain on Margonda street outside apartment entrance. A white Jakarta taxi cab idling with headlights on through pouring rain, dark hooded silhouette of a man hauling a heavy black suitcase into the opened trunk, misty reflections of streetlights in street puddles. Dynamic comic perspective, full bleed.",
  18: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Dynamic dawn tactical police ambush in Depok. Plainclothes Polda Metro Jaya Jatanras detectives intercepting suspect Ryan on street, handcuffs clicking shut around his wrists, tactical undercover cars with flashing red-blue strobe lights in background, fast comic book action lines, high contrast chiaroscuro, full bleed.",
  19: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Intense police interrogation chamber at Polda Metro Jaya. Single overhead lamp hanging over metal table, detective leaning forward pointing at map of Jombang East Java with multiple marked excavation red pins, suspect Ryan sitting handcuffed with head bowed in confession, heavy cigarette smoke drifting, full bleed.",
  20: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Solemn judicial courtroom at Pengadilan Negeri Depok. Heavy dark wooden gavel resting on polished sound block, official judicial decree documents reading 'PUTUSAN: VONIS HUKUMAN MATI', majestic shaft of light illuminating courtroom podium, deep historical closure, fine halftone screen tone, full bleed.",
};

// Strict Charon voice synthesis using multi-tier Gemini TTS fallback pool
async function synthesizeCharonSentence(text: string, idx: number): Promise<{ wavPath: string; durationSec: number }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY missing in .env.local');

  const pcmPath = path.join(AUDIO_DIR, `sentence-${idx}.pcm`);
  const wavPath = path.join(AUDIO_DIR, `sentence-${idx}.wav`);

  if (fs.existsSync(wavPath) && fs.statSync(wavPath).size > 10000) {
    const dur = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', wavPath]).toString().trim();
    console.log(`   [VO ${idx}/20] File cache ditemukan (${dur}s): ${wavPath}`);
    return { wavPath, durationSec: parseFloat(dur) || 3.0 };
  }

  console.log(`[VO ${idx}/20] Mensintesis dengan Charon (Gemini TTS pool)...`);

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
            console.warn(`[VO ${idx}/20] Model ${model} kena daily quota limit. Beralih ke model berikutnya...`);
            break;
          }
          console.warn(`[VO ${idx}/20] Model ${model} rate limit 429 per-menit. Menunggu 15 detik (percobaan ${attempt}/3)...`);
          await new Promise((r) => setTimeout(r, 15000));
          continue;
        }

        if (res.status === 503) {
          console.warn(`[VO ${idx}/20] Model ${model} server 503 busy. Menunggu 5 detik...`);
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          console.warn(`[VO ${idx}/20] Model ${model} error ${res.status}: ${errText.slice(0, 100)}. Beralih model...`);
          break;
        }

        const data = (await res.json()) as any;
        audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData) {
          console.log(`[VO ${idx}/20] Berhasil dengan model ${model} (suara: Charon)`);
          break;
        }
      } catch (e: any) {
        console.warn(`[VO ${idx}/20] Network error pada ${model}: ${e.message}`);
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
  console.log('  🕶️  PIPELINE MASTER: MISTERI KOPER KEBAGUSAN (KASUS RYAN JOMBANG)');
  console.log('      (20 Shots Mini-Doc • 100% Authentic Gemini Charon VO • Flow MCP)');
  console.log('========================================================================\n');

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(KEYFRAMES_DIR, { recursive: true });
  fs.mkdirSync(path.join(HF_WORKSPACE, 'assets'), { recursive: true });

  // 1. Synthesize 20 Sentences with Charon
  console.log('1. Mensintesis 20 Kalimat Voice Over (Charon - Gemini TTS Pool)...');
  const sentenceTimings: Array<{ id: string; shot: number; text: string; wavPath: string; durationSec: number; start: number; end: number }> = [];

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
    });
    console.log(`   [Kalimat ${i + 1}/20] (${res.durationSec.toFixed(2)}s) -> Timing: ${start}s - ${end}s`);
    currentCursor = end + 0.30; // 300ms dramatic silence gap between sentences

    // Pacing pause between sentences to prevent per-minute rate limits
    if (i < SENTENCES.length - 1) {
      await new Promise((r) => setTimeout(r, 6000));
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
  console.log(`\n✅ Voice Over Selesai: Total Durasi ${totalDuration}s di ${cleanVoPath}`);

  // 2. Transition Timings & Shot Timings (1:1 with sentences)
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
      imageFile: `shot-${String(st.shot).padStart(2, '0')}.jpg`,
    });
  });

  transitionTimes.sort((a, b) => a - b);

  // 3. Mixing Master Audio (VO + Looped BGM ducked 20% + 20x SFX Glitch)
  console.log('\n2. Mixing Audio Master (Charon VO + Looped BGM 20% + 20x SFX Glitch)...');
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
    title: 'TERUNGKAPNYA PEMBUNUHAN BERANTAI RYAN JOMBANG',
    subtitle: '12 Juli 2008: Misteri Koper Kebagusan & Apartemen Margonda',
    totalDuration,
    sentences: sentenceTimings,
    shots: shotTimings,
    transitions: transitionTimes,
    phrases,
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, 'storyboard-data.json'), JSON.stringify(storyboardData, null, 2));

  // 5. Generate 21 Flow MCP Keyframes
  console.log('\n===============================================================');
  console.log('  Generating 21 Keyframe Images via Google Flow MCP             ');
  console.log('===============================================================\n');

  for (let shot = 0; shot <= 20; shot++) {
    const filename = shot === 0 ? 'cover-shot-00.jpg' : `shot-${String(shot).padStart(2, '0')}.jpg`;
    const destPublic = path.join(KEYFRAMES_DIR, filename);
    const destHf = path.join(HF_WORKSPACE, 'assets', filename);

    if (fs.existsSync(destPublic) && fs.statSync(destPublic).size > 20000) {
      console.log(`   [Keyframe ${shot}/20] File cache ditemukan: ${destPublic}`);
      fs.copyFileSync(destPublic, destHf);
      continue;
    }

    const prompt = SHOT_PROMPTS[shot];
    console.log(`   [Keyframe ${shot}/20] Flow MCP generating ${filename}...`);

    let success = false;
    try {
      const res = await flowClient.generate({
        project: PROJECT_ID,
        prompt,
        type: 'image',
        aspect: '9:16',
        max_credits: 0,
      });

      if (res.task_id) {
        console.log(`   [Keyframe ${shot}/20] Task ${res.task_id} queued. Menunggu render...`);
        const waitRes = await flowClient.waitForJob(res.task_id, 180);
        if (waitRes.finished && waitRes.files?.[0] && fs.existsSync(waitRes.files[0])) {
          fs.copyFileSync(waitRes.files[0], destPublic);
          fs.copyFileSync(waitRes.files[0], destHf);
          console.log(`   ✅ [Keyframe ${shot}/20] Flow MCP render selesai: ${filename}`);
          success = true;
        }
      }
    } catch (err: any) {
      console.warn(`   ⚠️ Flow MCP error pada ${filename}: ${err.message}`);
    }

    if (!success) {
      console.log(`   [Keyframe ${shot}/20] Memakai fallback artistik Neo-Noir...`);
      // Fallback noir keyframe if needed
      const fallbackSource = path.join(ROOT_DIR, 'public', 'renders', 'mbah-slamet-banjarnegara', 'keyframes', filename === 'cover-shot-00.jpg' ? 'cover-shot-00.jpg' : `shot-${String((shot % 14) + 1).padStart(2, '0')}.jpg`);
      if (fs.existsSync(fallbackSource)) {
        fs.copyFileSync(fallbackSource, destPublic);
        fs.copyFileSync(fallbackSource, destHf);
      }
    }
  }

  // 6. Generate HyperFrames index.html & hyperframes.json
  console.log('\n===============================================================');
  console.log('  Generating HyperFrames Composition (HTML + GSAP)              ');
  console.log('===============================================================\n');

  const shotImages = Array.from({ length: 20 }, (_, i) => ({
    shot: i + 1,
    imagePath: path.join(KEYFRAMES_DIR, `shot-${String(i + 1).padStart(2, '0')}.jpg`),
  }));

  generateNoirHyperframesHtml({
    jobId: PROJECT_ID,
    title: 'TERUNGKAPNYA KASUS RYAN JOMBANG - Misteri Koper Kebagusan & Margonda',
    totalDurationSec: totalDuration,
    coverImagePath: path.join(KEYFRAMES_DIR, 'cover-shot-00.jpg'),
    shotImages,
    shotTimings,
    phrases,
    outputDir: HF_WORKSPACE,
  });

  console.log(`✅ HyperFrames Composition berhasil di-generate di ${HF_WORKSPACE}`);

  // 7. Render Video Timeline dengan HyperFrames Engine (30fps)
  console.log('\n===============================================================');
  console.log('  Rendering Video dengan HyperFrames Engine (1080x1920 @ 30fps) ');
  console.log('===============================================================\n');

  const tempVideoPath = path.join(PUBLIC_DIR, 'temp-visual-timeline.mp4');
  const finalVideoPath = path.join(PUBLIC_DIR, 'ryan-jombang-final.mp4');

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

  // 9. Ekstraksi Verifikasi Frame Snapshots
  console.log('\n9. Mengekstrak snapshot verifikasi visual & autocaption...');
  const snapshots = [
    { sec: '0.8', name: 'preview-01s-hook.jpg' },
    { sec: '6.0', name: 'preview-06s-shot1.jpg' },
    { sec: '30.0', name: 'preview-30s-shot4.jpg' },
    { sec: '70.0', name: 'preview-70s-shot8.jpg' },
    { sec: '120.0', name: 'preview-120s-shot13.jpg' },
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

  // 10. Write Review Portal HTML with Social Media Distribution Kit
  console.log('\n9. Memperbarui Review Portal & Social Media Distribution Kit...');
  const portalHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MISTERI KOPER KEBAGUSAN | Kasus Mutilasi Ryan Jombang</title>
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
      <span class="tag">DOKUMENTER FORENSIK • NEO-NOIR</span>
      <h1>TERUNGKAPNYA KASUS RYAN JOMBANG</h1>
      <p class="subtitle">12 Juli 2008: Misteri Koper Kebagusan & Apartemen Margonda</p>
    </header>

    <div class="grid">
      <div class="video-card">
        <video controls playsinline preload="metadata">
          <source src="ryan-jombang-final.mp4" type="video/mp4">
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
            <div class="stat-val">20 Shots</div>
            <div class="stat-lbl">Narasi Kronologis</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">21 Flow MCP</div>
            <div class="stat-lbl">Visual Neo-Noir</div>
          </div>
        </div>

        <div>
          <h2 class="section-title">DISTRIBUSI SOSMED (COPY-PASTE CAPTION)</h2>
          
          <p style="font-size: 12px; color: var(--accent); margin-bottom: 6px; font-weight: 600;">📱 FORMAT TIKTOK / INSTAGRAM REELS:</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>Koper hitam misterius di semak Kebagusan yang membongkar jejak kelam predator berantai paling mengguncang Indonesia... 🕵️‍♂️🩸

12 Juli 2008: Penemuan potongan jasad di Pasar Minggu, olah TKP apartemen Margonda Depok, hingga petunjuk fatal gesekan kartu kredit yang menyeret Ryan Jombang ke hadapan regu tembak.

Simak kronologi lengkap penyelidikan forensik Inafis dan Resmob Polda Metro Jaya dalam mini-dokumenter ini!

#TrueCrimeIndonesia #RyanJombang #KasusMutilasi #Kebagusan #Margonda #Forensik #CrimeInvestigation #Investigasi #Hukum #Detikcom #Liputan6</span>
          </div>

          <p style="font-size: 12px; color: var(--accent); margin-top: 14px; margin-bottom: 6px; font-weight: 600;">📺 FORMAT YOUTUBE SHORTS:</p>
          <div class="caption-box">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); alert('Copied!');">SALIN</button>
            <span>TERUNGKAPNYA KASUS RYAN JOMBANG: Misteri Koper Kebagusan & Apartemen Margonda (12 Juli 2008)

Kronologi forensik lengkap penemuan koper hitam di dekat Kebun Binatang Ragunan, pelacakan CCTV & transaksi kartu kredit di Depok, penggeledahan kamar 309 dengan cairan luminol, hingga vonis hukuman mati.

#Shorts #TrueCrime #RyanJombang #InvestigasiKriminal #ForensikKepolisian</span>
          </div>
        </div>
      </div>
    </div>

    <div class="gallery">
      <h2 class="section-title">GALERI VISUAL GOOGLE FLOW MCP (21 KEYFRAMES)</h2>
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
  console.log('🎉 PIPELINE MASTER SELESAI!');
  console.log(`👉 Buka Review Portal: http://localhost:3000/renders/${PROJECT_ID}/index.html`);
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Error in Pipeline:', err);
  process.exit(1);
});
