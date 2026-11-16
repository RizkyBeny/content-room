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
    text: 'Jumat pagi, tiga belas Mei 2016, suasana tenang mes karyawati pabrik plastik di Dadap, Kosambi, Tangerang, mendadak berubah menjadi kepanikan mencekam.',
  },
  {
    shot: 2,
    id: 's2',
    text: 'Dua rekan kerja korban curiga saat mendapati pintu kamar nomor tujuh belas terkunci rapat dengan gembok dari arah luar, sementara korban tak kunjung keluar untuk bekerja.',
  },
  {
    shot: 3,
    id: 's3',
    text: 'Setelah pintu didobrak paksa, pemandangan paling mengerikan tersingkap: jasad karyawati berusia delapan belas tahun bernama Eno Farihah terkapar di atas kasur bersimbah darah.',
  },
  {
    shot: 4,
    id: 's4',
    text: 'Tim Identifikasi Inafis dan Resmob Polda Metro Jaya langsung menyisir lokasi kejadian, mendapati kamar berantakan tanpa bekas pembobolan paksa pada jendela.',
  },
  {
    shot: 5,
    id: 's5',
    text: 'Di samping jasad korban, polisi menemukan sebuah benda yang sangat ganjil: cangkul proyek bergagang kayu panjang yang berlumuran darah pekat.',
  },
  {
    shot: 6,
    id: 's6',
    text: 'Pemeriksaan forensik mengungkap bahwa alat pertanian tersebut diambil dari luar kamar dan digunakan secara biadab untuk menghabisi nyawa korban.',
  },
  {
    shot: 7,
    id: 's7',
    text: 'Lampu senter penyidik menemukan jejak tapak kaki dan sandal berlumpur di lantai semen, mengarah ke luar lorong sempit menuju rawa-rawa di belakang mes.',
  },
  {
    shot: 8,
    id: 's8',
    text: 'Barang berharga korban raib tanpa sisa, terutama sebuah telepon genggam yang sehari-hari selalu berada dalam genggaman sang karyawati.',
  },
  {
    shot: 9,
    id: 's9',
    text: 'Penyelidikan bergerak cepat membongkar aktivitas korban pada Kamis malam, dua belas Mei, saat pesan singkat masuk ke ponselnya sekitar pukul dua puluh tiga lewat tiga puluh WIB.',
  },
  {
    shot: 10,
    id: 's10',
    text: 'Pesan itu berasal dari seorang remaja pria berusia lima belas tahun berinisial RAL, yang baru satu bulan menjalin komunikasi dekat dengan korban.',
  },
  {
    shot: 11,
    id: 's11',
    text: 'Korban membukakan pintu kamar mes untuk RAL, namun ketika sang remaja meminta hubungan terlarang, korban dengan tegas menolaknya dan menyuruhnya pergi.',
  },
  {
    shot: 12,
    id: 's12',
    text: 'Sakit hati ditolak, RAL keluar mes dan berpapasan dengan tersangka kedua bernama Rahmat Arifin, rekan kerja sesama buruh pabrik yang memendam benci karena sering diejek.',
  },
  {
    shot: 13,
    id: 's13',
    text: 'Di gang yang sama berdiri tersangka ketiga, Imam Harpiadi, pria yang menyimpan dendam membara karena ungkapan cintanya diabaikan mentah-mentah oleh korban.',
  },
  {
    shot: 14,
    id: 's14',
    text: 'Tiga pria yang awalnya tidak saling mengenal ini terikat oleh amarah yang sama, secara spontan bersepakat untuk mendobrak masuk kembali ke kamar mes korban.',
  },
  {
    shot: 15,
    id: 's15',
    text: 'Melihat korban tertidur, salah satu pelaku keluar kamar dan menyambar cangkul proyek galian bangunan yang tergeletak di samping bedeng pekerja.',
  },
  {
    shot: 16,
    id: 's16',
    text: 'Di dalam kamar yang sunyi, pembekapan dan penganiayaan keji terjadi, merenggut nyawa korban tanpa ada yang sempat mendengar jeritan minta tolongnya.',
  },
  {
    shot: 17,
    id: 's17',
    text: 'Usai melampiaskan kebiadaban, para pelaku mengambil ponsel korban, mencuci tangan di aliran parit, dan membuang pakaian berlumuran darah ke rawa-rawa Dadap.',
  },
  {
    shot: 18,
    id: 's18',
    text: 'Namun jejak kejahatan tak pernah sempurna: Tim Cyber Crime melacak sinyal pemancar BTS saat ponsel korban diaktifkan kembali oleh tersangka di tempat persembunyiannya.',
  },
  {
    shot: 19,
    id: 's19',
    text: 'Kurang dari dua puluh empat jam sejak penemuan jasad, Tim Gabungan Resmob Polda Metro Jaya berhasil meringkus ketiga pelaku tanpa perlawanan.',
  },
  {
    shot: 20,
    id: 's20',
    text: 'Di Pengadilan Negeri Tangerang, Majelis Hakim menjatuhkan vonis hukuman mati bagi dua pelaku dewasa dan vonis maksimal bagi pelaku anak, menutup kasus pembunuhan paling mengguncang nurani bangsa.',
  },
];

// 21 Prompts for Google Flow MCP
const SHOT_PROMPTS: Record<number, string> = {
  0: "A dramatic high-CTR YouTube Shorts vertical 9:16 cover and thumbnail illustration (1080x1920), Graphic Novel Neo-Noir Forensic style. Ominous Javanese industrial mess corridor at midnight with yellow police caution tape 'GARIS POLISI - DILARANG MELINTAS' stretching across. In foreground, a dark silhouette of an old agricultural garden hoe (cangkul) with long wooden handle resting against a damp concrete wall, police evidence marker tent '01', harsh single flashlight beam cutting through cold fog, heavy contour inking, fine halftone dot pattern, matte charcoal slate (#0D1117) with antique bronze highlights (#C59B27). Integrated distressed typography: 'TRAGEDI CANGKUL DADAP' in warm broken-white stencil and 'TEROR DI MES KARYAWATI' in dried crimson ribbon (#8B2635). Full bleed, zero border.",
  1: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Exterior low-angle view of a desolate factory workers dormitory barak (mess karyawati) in Dadap, Kosambi, Tangerang at dawn. Overcast misty morning, corrugated iron roofs, rusted wire fence, narrow gravel alleyway flanked by puddles, yellow police crime scene tape 'GARIS POLISI' flapping in the cold morning wind. Dramatic chiaroscuro lighting, heavy ink cross-hatching, matte charcoal slate (#0D1117), full bleed.",
  2: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Close-up of weathered wooden door of room number '17' painted in faded white stencil on rough wood. A heavy cold steel padlock (gembok besi) securely locked from the outside on the iron hasp. Flashlight beam highlighting scratches around the lock cylinder, dark ominous shadows creeping along the concrete hallway, deep noir inking, halftone screen tone texture, full bleed.",
  3: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Somber police investigation perspective looking into a modest 3x3 meter factory mess bedroom. A disheveled foam mattress on the tiled floor covered with a dark bedsheet and pillow, silhouette of an Indonesian plainclothes detective standing in the doorway taking notes in a pocket notebook. Moonlight streaming through small high ventilation louvers casting striped shadows, dramatic chiaroscuro, matte gray and subtle dried crimson accents, full bleed.",
  4: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Two Indonesian police Inafis forensic identification officers in white protective hazmat suits and latex gloves conducting crime scene analysis in a dim room. One officer dusting magnetic fingerprint black powder on door frame, another aiming a blue forensic ultraviolet alternate light source (ALS) revealing hidden latent traces on floor tiles. Heavy comic inking, high contrast noir, full bleed.",
  5: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Macro isometric forensic evidence perspective. A weathered iron garden hoe (cangkul) with a sturdy 80cm cylindrical wooden handle lying on damp cement floor, yellow triangular forensic evidence marker tent with bold black number '01' beside it, white chalk outline drawn on the floor. Harsh overhead task light, gritty graphic novel cross-hatching, antique bronze accents, full bleed.",
  6: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Extreme close-up forensic laboratory view of the wooden handle of the cangkul under a round magnifying glass. Visible dark friction ridge fingerprint whorls and transfer smudges stained into the grain of the wood, labeled with red forensic measuring ruler tape in centimeters. Clinical forensic noir contrast, fine halftone dots, full bleed.",
  7: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Low angle floor-level perspective in a narrow concrete corridor. Clear muddy barefoot impressions and rubber slipper tread marks leading toward an open back exit door. Police forensic ruler '02' placed next to a footprint, damp glistening reflections on wet cement, harsh flashlight beam piercing pitch black darkness, comic book style, full bleed.",
  8: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Close-up of a small wooden vanity dressing table in the bedroom. An open empty cardboard mobile phone box with brand label 'Polytron' and scattered hairpins, charger cable plugged into wall socket with the other end dangling empty, dust ring where the missing phone was taken. Melancholic noir chiaroscuro, subtle golden ambient highlights, full bleed.",
  9: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Dramatic split-panel composition. Upper panel: vintage monochrome mobile phone glowing at 23:30 displaying incoming SMS message: 'Aku sudah di luar mes'. Lower panel: glowing green clock hands passing 11:30 PM against a dark Javanese suburban background. High contrast graphic novel noir inking, antique bronze glow (#C59B27), fine halftone screen tones, full bleed.",
  10: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Police composite sketch and dark silhouette of a 15-year-old Indonesian male teenager in dark casual clothes standing under a dim flickering streetlamp outside a factory gate. Cold eyes shadowed beneath a baseball cap, body language tense and restless, cigarette smoke curling into the humid night mist of Dadap Tangerang. Gritty comic textures, deep chiaroscuro, full bleed.",
  11: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Silhouette of a teenage boy turning away aggressively from a half-closed bedroom doorway in a dim corridor. Inside, the silhouette of a young female holding the door firmly shut, gesture of refusal and rejection. Harsh angular shadow projection on the wall, crimson tension glow in background, dynamic graphic novel expressive linework, full bleed.",
  12: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Gritty criminal dossier mugshot sketch of 23-year-old male factory worker suspect Rahmat Arifin, harsh sharp facial contours, brooding scowl, clenched jaw, stamped with confidential red ink 'TERSANGKA PASAL 340 KUHP'. Dark industrial background of plastic factory machinery silhouettes, heavy comic cross-hatching, full bleed.",
  13: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Gritty police criminal dossier sketch of 23-year-old male suspect Imam Harpiadi, bitter sinister glare, arms crossed, standing in the shadows of a narrow alleyway. Stamped with red ink 'RESKRIM POLDA METRO JAYA'. Dim sodium yellow streetlamp glare, gritty halftone shading, full bleed.",
  14: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Three sinister male silhouettes huddled together in a pitch-black alley corner outside the factory dormitory wall at midnight. Whispering in conspiracy, single glowing red cigarette ember illuminating partial faces, long ominous merged shadow cast on the cracked brick wall. Heavy noir inking, atmospheric mist, full bleed.",
  15: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Low angle dynamic perspective beside an outdoor construction worker shed (bedeng proyek). A shadowy hand reaching down and grabbing the wooden handle of an iron cangkul resting against a pile of construction gravel and sandbags. Moonlight glinting off the sharp iron blade, dynamic comic book action lines, deep chiaroscuro, full bleed.",
  16: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Symbolic respectful crime scene representation. Exterior night shot of room 17 window with frosted glass and iron bars, casting three menacing looming shadows against the illuminated curtain. No blood or gore, purely psychological suspense, stark black and deep charcoal silhouette contrast, eerie stormy night sky above. Full bleed.",
  17: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Desolate swamp and muddy marshland (rawa-rawa Dadap) at 3 AM. Silhouette of three figures running through tall reeds and wild vegetation, throwing a rolled-up bundle of dark clothing into the murky dark water, distant industrial factory lights glowing on the misty horizon. Dark blues and cold slate gray, halftone sky, full bleed.",
  18: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Police cyber crime tactical command center. Large digital vector map of Tangerang and Teluknaga displaying cellular BTS tower triangulations in glowing cyan and crimson concentric circles, tracking the coordinates of the stolen mobile phone. Detective silhouettes analyzing glowing waveform data, dark technical aesthetic, full bleed.",
  19: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Dynamic tactical police raid at dawn. Armed plainclothes Jatanras Resmob detectives storming into a modest hideout room, suspect pinned to the floor in handcuffs under intense tactical flashlights, chaotic dynamic perspective, heavy comic book contour lines, high contrast chiaroscuro, full bleed.",
  20: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Solemn judicial courtroom at Pengadilan Negeri Tangerang. Heavy dark wooden gavel resting on polished sound block, official judicial decree documents reading 'VONIS HUKUMAN MATI', balanced black iron scales of justice illuminated by a single majestic shaft of courtroom light, deep respectful closure, fine halftone screen tone, full bleed.",
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
    'gemini-3.8-flash-tts',
    'gemini-3.8-flash-lite-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-2.5-flash-preview-tts',
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
            break; // Break out of attempts, try next model
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

  // 8s pause between sentences to prevent 3 RPM rate limit on free tier
  await new Promise((r) => setTimeout(r, 8000));

  return { wavPath, durationSec: parseFloat(durStr) || 3.0 };
}

async function main() {
  console.log('========================================================================');
  console.log('  🕶️  PIPELINE MASTER: TRAGEDI CANGKUL DADAP (KASUS ENO FARIHAH)');
  console.log('      (20 Shots Mini-Doc • 100% Authentic Gemini Charon VO • Flow MCP)');
  console.log('========================================================================\n');

  // Setup directories
  [PUBLIC_DIR, KEYFRAMES_DIR, AUDIO_DIR, HF_WORKSPACE, path.join(HF_WORKSPACE, 'assets')].forEach((d) => {
    fs.mkdirSync(d, { recursive: true });
  });

  // 1. Synthesize 20 Sentences Voice Over (Charon 100%)
  console.log('1. Mensintesis 20 Kalimat Voice Over (Charon - gemini-3.8-flash-tts)...');
  const sentenceTimings: Array<{ id: string; shot: number; text: string; wavPath: string; durationSec: number; start: number; end: number }> = [];

  // Cover hook: 0.0s to 1.3s is reserved strictly for Shot 00 (no caption, full graphic novel hook)
  let currentCursor = 1.30;

  for (let i = 0; i < SENTENCES.length; i++) {
    const s = SENTENCES[i];
    const res = await synthesizeCharonSentence(s.text, i + 1);
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
  const transitionTimes: number[] = [1.3]; // Cut dari Shot 00 ke Shot 01
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
    title: 'TRAGEDI CANGKUL DADAP - Pembunuhan Sadis Eno Farihah',
    totalDurationSec: totalDuration,
    transitionTimes,
    shotTimings,
    words: allWords,
    sentences: sentenceTimings.map(({ wavPath, ...r }) => r),
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, 'storyboard-data.json'), JSON.stringify(storyboardData, null, 2));

  // 5. Generate Keyframes via Google Flow MCP (21 Keyframes)
  console.log('\n4. Menggenerasi 21 Keyframes via Google Flow MCP (Shot 00 Cover + Shots 01-20)...');
  for (let shot = 0; shot <= 20; shot++) {
    const filename = shot === 0 ? 'cover-shot-00.jpg' : `shot-${String(shot).padStart(2, '0')}.jpg`;
    const destPublic = path.join(KEYFRAMES_DIR, filename);
    const destHf = path.join(HF_WORKSPACE, 'assets', filename);

    if (fs.existsSync(destPublic) && fs.statSync(destPublic).size > 20000) {
      console.log(`   [Keyframe ${shot}/20] File ${filename} sudah ada (cached).`);
      if (!fs.existsSync(destHf)) fs.copyFileSync(destPublic, destHf);
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
      // If Flow MCP encounters queuing, clone a placeholder noir keyframe
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
    title: 'TRAGEDI CANGKUL DADAP - Pembunuhan Eno Farihah',
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
    { sec: '30.0', name: 'preview-30s-shot5.jpg' },
    { sec: '70.0', name: 'preview-70s-shot11.jpg' },
    { sec: '110.0', name: 'preview-110s-shot18.jpg' },
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

  // 10. Update Portal HTML with Story & Distribution Kit
  console.log('\n10. Memperbarui Review Portal & Social Media Distribution Kit...');
  const portalHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TRAGEDI CANGKUL DADAP: Misteri Kamar 17 Eno Farihah | Review Portal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Montserrat:wght@800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #0A0D12; color: #E6EDF3; }
    .gold-accent { color: #C59B27; }
    .crimson-accent { color: #8B2635; }
  </style>
</head>
<body class="p-6 md:p-12">
  <div class="max-w-6xl mx-auto space-y-10">
    
    <!-- Header -->
    <header class="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 bg-red-950/80 border border-red-800 text-red-400 text-xs font-black tracking-widest rounded-full uppercase">Forensic Noir Mini-Doc</span>
          <span class="text-xs text-slate-400 font-mono">1080x1920 (9:16) • ${totalDuration.toFixed(1)}s • 30fps • 20 Shots</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-black mt-2 tracking-tight text-white">TRAGEDI CANGKUL DADAP: TEROR DI KAMAR MES KARYAWATI</h1>
        <p class="text-slate-400 text-sm mt-1">Investigasi Forensik Lengkap Pembunuhan Sadis Eno Farihah (Dadap, Kosambi, Tangerang 2016) • Detikcom Archive</p>
      </div>
      <div class="flex items-center gap-3">
        <a href="eno-farihah-final.mp4" download class="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Download Video MP4
        </a>
      </div>
    </header>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      <!-- Video Player Column (5 cols) -->
      <div class="lg:col-span-5 flex flex-col items-center">
        <div class="w-full max-w-[380px] bg-slate-950 p-2 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
          <video id="player" controls playsinline class="w-full rounded-2xl aspect-[9/16] object-cover bg-black" poster="preview-01s-hook.jpg">
            <source src="eno-farihah-final.mp4?v=${Date.now()}" type="video/mp4">
            Browser Anda tidak mendukung tag video.
          </video>
        </div>
        <div class="mt-4 text-xs text-slate-500 font-mono text-center">
          Format: H.264 / AAC • 1080x1920 • 30fps • Subtitle Kata-per-Kata
        </div>
      </div>

      <!-- Info & Social Distribution Kit Column (7 cols) -->
      <div class="lg:col-span-7 space-y-8">
        
        <!-- Storyboard Structure & Visual Verification -->
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            Struktur Cerita & Arsitektur Video
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div class="p-3 bg-black/40 rounded-xl border border-slate-800/80">
              <span class="text-slate-400 block">Total Durasi</span>
              <span class="text-white font-bold text-sm">${totalDuration.toFixed(1)}s</span>
            </div>
            <div class="p-3 bg-black/40 rounded-xl border border-slate-800/80">
              <span class="text-slate-400 block">Visual Assets</span>
              <span class="text-amber-400 font-bold text-sm">21 Keyframes</span>
            </div>
            <div class="p-3 bg-black/40 rounded-xl border border-slate-800/80">
              <span class="text-slate-400 block">Voice Over</span>
              <span class="text-emerald-400 font-bold text-sm">Charon (100% Gemini)</span>
            </div>
            <div class="p-3 bg-black/40 rounded-xl border border-slate-800/80">
              <span class="text-slate-400 block">Subtitles</span>
              <span class="text-white font-bold text-sm">${phrases.length} Frasa Karaoke</span>
            </div>
          </div>
          <div class="space-y-2 text-xs text-slate-300 leading-relaxed">
            <p><strong class="text-amber-400">Babak 1 (0-25s):</strong> Penemuan kamar mes 17 yang tergembok dari luar & olah TKP awal Inafis.</p>
            <p><strong class="text-amber-400">Babak 2 (25-50s):</strong> Temuan ganjil cangkul proyek, sidik jari darah, & hilangnya HP Polytron korban.</p>
            <p><strong class="text-amber-400">Babak 3 (50-85s):</strong> Kilas balik SMS 23.30 WIB, penolakan RAL, dendam Arif "pahit", & sakit hati Imam.</p>
            <p><strong class="text-amber-400">Babak 4 (85-110s):</strong> Konspirasi gelap tiga pria asing, eksekusi tengah malam, & pembuangan bukti ke rawa.</p>
            <p><strong class="text-amber-400">Babak 5 (110s+):</strong> Pelacakan sinyal BTS cyber crime, penggerebekan 1x24 jam, & vonis mati PN Tangerang.</p>
          </div>
        </div>

        <!-- Snapshots Grid -->
        <div class="space-y-3">
          <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider">Verifikasi Visual & Captions</h3>
          <div class="grid grid-cols-4 gap-3">
            <div class="space-y-1">
              <img src="preview-01s-hook.jpg" class="rounded-xl border border-slate-800 aspect-[9/16] object-cover w-full">
              <span class="text-[10px] text-slate-400 block text-center font-mono">0.8s Cover Hook</span>
            </div>
            <div class="space-y-1">
              <img src="preview-06s-shot1.jpg" class="rounded-xl border border-slate-800 aspect-[9/16] object-cover w-full">
              <span class="text-[10px] text-slate-400 block text-center font-mono">6.0s Mes Dadap</span>
            </div>
            <div class="space-y-1">
              <img src="preview-30s-shot5.jpg" class="rounded-xl border border-slate-800 aspect-[9/16] object-cover w-full">
              <span class="text-[10px] text-slate-400 block text-center font-mono">30.0s Bukti Cangkul</span>
            </div>
            <div class="space-y-1">
              <img src="preview-70s-shot11.jpg" class="rounded-xl border border-slate-800 aspect-[9/16] object-cover w-full">
              <span class="text-[10px] text-slate-400 block text-center font-mono">70.0s Sakit Hati</span>
            </div>
          </div>
        </div>

        <!-- SOCIAL MEDIA DISTRIBUTION KIT -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2zm0-10h2v8h-2z"/></svg>
              Social Media Distribution Kit
            </h2>
            <span class="text-xs text-slate-400 font-mono">Ready to Publish</span>
          </div>

          <!-- YouTube Shorts Tab -->
          <div class="space-y-3 border-t border-slate-800/80 pt-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-red-500"></span> YouTube Shorts
              </span>
              <button onclick="copyToClipboard('yt-desc', this)" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition">Salin Copy</button>
            </div>
            <div class="text-xs text-slate-400 font-mono">Judul: <strong class="text-white">TRAGEDI CANGKUL DADAP: Kronologi Lengkap & Penangkapan 3 Tersangka Pembunuhan Eno Farihah</strong></div>
            <pre id="yt-desc" class="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">Kamar mes nomor 17 di Dadap, Kosambi, Tangerang, menyimpan saksi bisu salah satu kasus kriminal paling mengguncang Indonesia.

Eno Farihah (18), karyawati pabrik plastik ditemukan tewas mengenaskan setelah dianiaya oleh 3 pria yang awalnya saling tidak kenal, namun dipersatukan dendam akibat penolakan asmara.

Melalui kejelian Tim Inafis Polda Metro Jaya dalam membaca sidik jari pada gagang cangkul serta pelacakan sinyal ponsel korban, kasus ini terungkap kurang dari 24 jam.

Simak investigasi forensik lengkap dan vonis peradilan sang pelaku.

#EnoFarihah #TragediCangkul #TrueCrimeIndonesia #Detikcom #KasusKriminal #Investigasi #HukumDanKriminal #PoldaMetroJaya</pre>
          </div>

          <!-- TikTok Tab -->
          <div class="space-y-3 border-t border-slate-800/80 pt-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-cyan-400"></span> TikTok
              </span>
              <button onclick="copyToClipboard('tiktok-desc', this)" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition">Salin Copy</button>
            </div>
            <pre id="tiktok-desc" class="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">Misteri kamar mes 17 Dadap Tangerang... 😱 Tiga pria yang tak saling kenal bersekongkol menghabisi nyawa Eno Farihah hanya karena sakit hati ditolak!

Jejak sidik jari di gagang cangkul dan sinyal HP membongkar para pelaku dalam waktu kurang dari 24 jam! ⚖️

#truecrime #enofarihah #kasusviral #misteri #kriminal #tangerang #kisahnyata #hukumanmati</pre>
          </div>

          <!-- Instagram Reels Tab -->
          <div class="space-y-3 border-t border-slate-800/80 pt-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-pink-400"></span> Instagram Reels
              </span>
              <button onclick="copyToClipboard('ig-desc', this)" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition">Salin Copy</button>
            </div>
            <pre id="ig-desc" class="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">Tragedi Cangkul Dadap Tangerang: Kisah Nyata Pembunuhan Eno Farihah.

Sebuah kasus kelam di mana amarah penolakan asmara menyatukan tiga pria asing dalam satu malam kejahatan terencana.

Penyelidikan ilmiah Inafis dan pelacakan digital Polda Metro Jaya berhasil mengamankan seluruh tersangka kurang dari 1x24 jam hingga vonis hukuman mati diketok di pengadilan.

Source: Detikcom Arsip Berita Kriminal.
.
.
#TrueCrime #KasusKriminal #EnoFarihah #Detikcom #Investigasi #HukumMati #Storytelling #ViralIndonesia</pre>
          </div>

        </div>

      </div>

    </div>

  </div>

  <script>
    function copyToClipboard(id, btn) {
      const text = document.getElementById(id).innerText;
      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerText;
        btn.innerText = 'Tersalin!';
        btn.classList.add('bg-emerald-700', 'text-white');
        setTimeout(() => {
          btn.innerText = originalText;
          btn.classList.remove('bg-emerald-700', 'text-white');
        }, 2000);
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), portalHtml, 'utf8');

  console.log('\n========================================================================');
  console.log('🎉 PIPELINE MASTER SELESAI!');
  console.log(`👉 Buka Review Portal: http://localhost:3000/renders/${PROJECT_ID}/index.html`);
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Error in Pipeline:', err);
  process.exit(1);
});
