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

async function main() {
  console.log('========================================================================');
  console.log('  🕶️  EXPANDED & DEEPENED NARRATIVE: SERIAL KILLER MBAH SLAMET');
  console.log('      (14 Shots 1:1 with 14 Sentences • Deep Unified Persona VO)');
  console.log('========================================================================\n');

  // 14 Deep, evocative sentences matching 14 Flow MCP Shots 1:1
  const SENTENCES = [
    {
      id: 's1',
      shot: 1,
      text: 'Awal April 2023, ketenangan lereng Desa Balun di Banjarnegara seketika runtuh oleh temuan kuburan massal paling mengerikan dalam sejarah kriminal Jawa Tengah.',
    },
    {
      id: 's2',
      shot: 2,
      text: 'Sosok di balik kekejaman ini adalah Slamet Tohari alias Mbah Slamet, seorang pria paruh baya yang bertahun-tahun hidup di balik topeng kesalehan.',
    },
    {
      id: 's3',
      shot: 3,
      text: 'Mbah Slamet mengklaim dirinya dukun sakti berilmu gaib tinggi, yang mampu menggandakan uang puluhan juta rupiah menjadi lima miliar secara instan.',
    },
    {
      id: 's4',
      shot: 4,
      text: 'Tergiur iming-iming kekayaan instan yang dipromosikan perantaranya lewat media sosial, para korban dari berbagai kota berbondong-bondong menyerahkan seluruh tabungan hidup mereka.',
    },
    {
      id: 's5',
      shot: 5,
      text: 'Namun ketika waktu yang dijanjikan tiba dan para korban mendesak uangnya dikembalikan, sang dukun mulai merancang skenario eksekusi berdarah dingin.',
    },
    {
      id: 's6',
      shot: 6,
      text: 'Dengan dalih mengambil uang gaib pada malam hari, para korban dipancing datang sendirian menempuh perjalanan ratusan kilometer menuju lereng sunyi Banjarnegara.',
    },
    {
      id: 's7',
      shot: 7,
      text: 'Di tengah dinginnya perkebunan sepi, sang dukun menyuguhkan minuman ritual yang diam-diam telah dicampur serbuk potasium sianida mematikan.',
    },
    {
      id: 's8',
      shot: 8,
      text: 'Reaksi racun potas bekerja luar biasa cepat; hanya dalam hitungan lima menit, para korban meregang nyawa dalam kejang hebat tanpa sempat berteriak minta tolong.',
    },
    {
      id: 's9',
      shot: 9,
      text: 'Teror bukit kematian ini akhirnya terbongkar berkat firasat korban terakhir bernama Paryanto, yang sempat mengirim pesan suara dan titik lokasi GPS ke anaknya.',
    },
    {
      id: 's10',
      shot: 10,
      text: "Pesan pilu berbunyi 'Takut ayah mati, jika tidak ada kabar bawa polisi ke sini' menjadi kunci bagi Tim Reskrim untuk mendobrak kediaman sang dukun.",
    },
    {
      id: 's11',
      shot: 11,
      text: 'Saat diseret ke perbukitan, Mbah Slamet bahkan sempat lupa titik liang kubur saking banyaknya korban yang telah ia bantai dan tumpuk di bukit sayur tersebut.',
    },
    {
      id: 's12',
      shot: 12,
      text: 'Total dua belas liang kubur dibongkar, mengungkap fakta mengerikan bahwa seluruh korban tewas diracun demi merampas sisa uang di dompet mereka.',
    },
    {
      id: 's13',
      shot: 13,
      text: 'Di hadapan Majelis Hakim Pengadilan Negeri Banjarnegara, Jaksa Penuntut Umum menuntut Slamet Tohari dengan tuntutan maksimal hukuman mati tanpa ampun.',
    },
    {
      id: 's14',
      shot: 14,
      text: 'Palu pengadilan akhirnya diketuk tegas menjatuhkan vonis mati, mengakhiri riwayat kelam salah satu serial killer paling berdarah dalam sejarah modern Indonesia.',
    },
  ];

  // 1. Process 14 Sentences Audio Timings
  console.log('1. Memproses 14 Kalimat Voice Over Konsisten & Timing...');
  const sentenceTimings: Array<{ id: string; shot: number; text: string; wavPath: string; durationSec: number; start: number; end: number }> = [];

  // Cover hook: 0.0s to 1.3s is reserved strictly for Shot 00 (no caption, full graphic novel hook)
  let currentCursor = 1.30;

  for (let i = 0; i < SENTENCES.length; i++) {
    const s = SENTENCES[i];
    const wavPath = path.join(AUDIO_DIR, `sentence-${i + 1}.wav`);
    if (!fs.existsSync(wavPath)) {
      throw new Error(`File audio tidak ditemukan: ${wavPath}`);
    }

    const durStr = execFileSync(ffprobe, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      wavPath,
    ]).toString().trim();
    const durationSec = parseFloat(durStr) || 3.0;

    const start = Number(currentCursor.toFixed(2));
    const end = Number((currentCursor + durationSec).toFixed(2));
    sentenceTimings.push({
      id: s.id,
      shot: s.shot,
      text: s.text,
      wavPath,
      durationSec,
      start,
      end,
    });
    console.log(`   [Kalimat ${i + 1}/14] (${durationSec.toFixed(2)}s) -> Timing: ${start}s - ${end}s`);
    currentCursor = end + 0.30; // 300ms dramatic silence gap between sentences
  }

  // Prepend 1.30s silence for the cover hook
  const coverSilenceWav = path.join(AUDIO_DIR, 'cover-silence.wav');
  execFileSync(ffmpeg, [
    '-y',
    '-f', 'lavfi',
    '-i', 'anullsrc=r=48000:cl=stereo',
    '-t', '1.30',
    coverSilenceWav,
  ]);

  // Inter-sentence silence
  const silenceWav = path.join(AUDIO_DIR, 'silence.wav');
  execFileSync(ffmpeg, [
    '-y',
    '-f', 'lavfi',
    '-i', 'anullsrc=r=48000:cl=stereo',
    '-t', '0.30',
    silenceWav,
  ]);

  const concatListTxt = path.join(AUDIO_DIR, 'concat_vo.txt');
  let concatLines = `file '${coverSilenceWav}'\n`;
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

  const totalDuration = Number((currentCursor + 0.5).toFixed(2));
  console.log(`\n✅ Voice Over Selesai: Total Durasi ${totalDuration}s di ${cleanVoPath}`);

  // 2. Transition Timings & Shot Timings (1:1 with sentences)
  const transitionTimes: number[] = [1.3]; // Cut dari Shot 00 ke Shot 01
  const shotTimings: Array<{ shot: number; startSec: number; endSec: number; durationSec: number; imageFile: string }> = [];

  sentenceTimings.forEach((st, idx) => {
    const isLast = idx === sentenceTimings.length - 1;
    const start = st.start;
    // Stretch the shot to include the 0.3s silence gap for seamless transition to next shot
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

  // 3. Mixing Master Audio (VO + Looped BGM ducked 20% + 14x SFX Glitch)
  console.log('\n2. Mixing Audio Master (Charon VO + Looped BGM 20% + 14x SFX Glitch)...');
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
    title: 'SERIAL KILLER BANJARNEGARA - 12 Korban Dukun Mbah Slamet (Expanded Master)',
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
    { sec: '30.0', name: 'preview-20s-shot4.jpg' },
    { sec: '70.0', name: 'preview-45s-shot9.jpg' },
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

  // 9. Update Portal HTML with Deepened Story & Distribution Kit
  console.log('\n9. Memperbarui Review Portal & Social Media Distribution Kit...');
  const portalHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SERIAL KILLER BANJARNEGARA: 12 Nyawa Ditelan Bukit Kematian | Review Portal</title>
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
          <span class="px-3 py-1 bg-red-950/80 border border-red-800 text-red-400 text-xs font-black tracking-widest rounded-full uppercase">Crime Noir Master</span>
          <span class="text-xs text-slate-400 font-mono">1080x1920 (9:16) • ${totalDuration.toFixed(1)}s • 30fps</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-black mt-2 tracking-tight text-white">SERIAL KILLER BANJARNEGARA: 12 NYAWA DITELAN BUKIT KEMATIAN</h1>
        <p class="text-slate-400 text-sm mt-1">Studi Kasus Pembunuhan Berantai Dukun Pengganda Uang Mbah Slamet (Slamet Tohari) • Detikcom Archive</p>
      </div>
      <div class="flex items-center gap-3">
        <a href="mbah-slamet-final.mp4" download class="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20">
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
            <source src="mbah-slamet-final.mp4?v=${Date.now()}" type="video/mp4">
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
              <span class="text-amber-400 font-bold text-sm">15 Flow MCP</span>
            </div>
            <div class="p-3 bg-black/40 rounded-xl border border-slate-800/80">
              <span class="text-slate-400 block">Voice Over</span>
              <span class="text-emerald-400 font-bold text-sm">Charon (Unified)</span>
            </div>
            <div class="p-3 bg-black/40 rounded-xl border border-slate-800/80">
              <span class="text-slate-400 block">Subtitles</span>
              <span class="text-white font-bold text-sm">${phrases.length} Frasa Karaoke</span>
            </div>
          </div>
          <div class="space-y-2 text-xs text-slate-300 leading-relaxed">
            <p><strong class="text-amber-400">Babak 1 (0-15s):</strong> Teror lereng kubis Desa Balun & terungkapnya sosok tersangka Mbah Slamet.</p>
            <p><strong class="text-amber-400">Babak 2 (15-45s):</strong> Modus ritual penggandaan 5 miliar, promosi medsos, & pancingan perjalanan jauh.</p>
            <p><strong class="text-amber-400">Babak 3 (45-65s):</strong> Eksekusi racun potasium sianida dalam cangkir ritual di tengah kebun sunyi.</p>
            <p><strong class="text-amber-400">Babak 4 (65-90s):</strong> Firasat pesan WA Paryanto ("Takut ayah mati"), penggerebekan, & 12 liang lahat dibongkar.</p>
            <p><strong class="text-amber-400">Babak 5 (90s+):</strong> Tuntutan pidana mati & palu vonis mati Majelis Hakim PN Banjarnegara.</p>
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
              <img src="preview-05s-shot1.jpg" class="rounded-xl border border-slate-800 aspect-[9/16] object-cover w-full">
              <span class="text-[10px] text-slate-400 block text-center font-mono">5.0s Desa Balun</span>
            </div>
            <div class="space-y-1">
              <img src="preview-20s-shot4.jpg" class="rounded-xl border border-slate-800 aspect-[9/16] object-cover w-full">
              <span class="text-[10px] text-slate-400 block text-center font-mono">30.0s Barbut Forensik</span>
            </div>
            <div class="space-y-1">
              <img src="preview-45s-shot9.jpg" class="rounded-xl border border-slate-800 aspect-[9/16] object-cover w-full">
              <span class="text-[10px] text-slate-400 block text-center font-mono">70.0s Chat Paryanto</span>
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
            <div class="text-xs text-slate-400 font-mono">Judul: <strong class="text-white">SERIAL KILLER BANJARNEGARA: 12 Korban Dukun Pengganda Uang Mbah Slamet Dituntut Hukuman Mati</strong></div>
            <pre id="yt-desc" class="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">Di lereng perbukitan Desa Balun, Wanayasa, Banjarnegara, terbongkar kasus pembunuhan berantai paling menggemparkan di Jawa Tengah.

Slamet Tohari alias Mbah Slamet, dukun pengganda uang yang membantai 12 korbannya menggunakan racun potasium sianida di tengah perkebunan dingin.

Firasat dan pesan terakhir Paryanto ke anaknya: "Takut ayah mati. Kalau ayah nggak ada kabar, bawa polisi ke sini" menjadi kunci terbongkarnya bukit kematian.

Simak kronologi lengkap investigasi dan vonis mati sang serial killer.

#MbahSlamet #SerialKiller #TrueCrimeIndonesia #Banjarnegara #Detikcom #KasusKriminal #Investigasi #HukumDanKriminal</pre>
          </div>

          <!-- TikTok Tab -->
          <div class="space-y-3 border-t border-slate-800/80 pt-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-cyan-400"></span> TikTok
              </span>
              <button onclick="copyToClipboard('tiktok-desc', this)" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition">Salin Copy</button>
            </div>
            <pre id="tiktok-desc" class="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">12 nyawa ditelan bukit kematian Banjarnegara... 😱 Firasat pesan WA korban terakhir: "Takut ayah mati, bawa polisi ke sini" berhasil membongkar kedok dukun maut Mbah Slamet!

Semua korban diracun potas di kebun kubis saat menagih uang gaib. Jaksa dan Hakim jatuhkan vonis mati tanpa ampun! ⚖️

#truecrime #mbahslamet #kasusviral #misteri #kriminal #banjarnegara #kisahnyata #hukumanmati</pre>
          </div>

          <!-- Instagram Reels Tab -->
          <div class="space-y-3 border-t border-slate-800/80 pt-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-pink-400"></span> Instagram Reels
              </span>
              <button onclick="copyToClipboard('ig-desc', this)" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition">Salin Copy</button>
            </div>
            <pre id="ig-desc" class="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">Kisah Nyata: Serial Killer Mbah Slamet Banjarnegara.

Di balik dinginnya perbukitan Desa Balun, tersembunyi liang kubur belasan korban penipuan berkedok dukun sakti pengganda uang.

Para korban disuguhi teh potasium sianida dosis tinggi, lalu dikubur di lereng bukit saat meregang nyawa. Pengadilan Negeri Banjarnegara resmi menjatuhkan vonis mati atas pembunuhan berencana paling keji ini.

Source: Detikcom Arsip Investigasi Kriminal.
.
.
#TrueCrime #KasusKriminal #MbahSlamet #Banjarnegara #Detikcom #Investigasi #HukumMati #Storytelling #ViralIndonesia</pre>
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
  console.log('🎉 RE-RENDER EXPANDED MASTER SERIAL KILLER SELESAI!');
  console.log(`👉 Buka Review Portal: http://localhost:3000/renders/${PROJECT_ID}/index.html`);
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal Error in Canonical Re-render:', err);
  process.exit(1);
});
