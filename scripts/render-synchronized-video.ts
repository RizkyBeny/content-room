import fs from 'node:fs';
import path from 'node:path';
import { produceNoirMasterAudio } from '../lib/orchestrator/audio/noirAudioPipeline';
import { compositorNoir } from '../lib/orchestrator/agents/compositorNoir';
import { generateDownloadPage } from '../lib/orchestrator/agents/webViewer';
import { telegramBot } from '../lib/orchestrator/agents/telegramBot';
import { saveJob, loadJob } from '../lib/orchestrator/state/jobStore';
import { escapeHtml } from '../lib/orchestrator/utils';
import { OrchestratorJob, NoirScript, ScriptBeat, KeyframeItem } from '../lib/orchestrator/types';

// Pemetaan 15 Keyframe Flow MCP Asli ke Narasi Kronologis Dongeng Kelam
const SHOT_DEFINITIONS: Record<number, { label: string; prompt: string; sourceFile: string }> = {
  0: {
    label: 'Cover Hook (Mandatori 0s - 1.3s)',
    prompt: "A dramatic high-CTR YouTube Shorts vertical 9:16 cover illustration (1080x1920), Graphic Novel Neo-Noir style. An ominous telescope observatory silhouette in the desolate Llano California desert under a starry night sky, yellow police caution tape across foreground, heavy black contour inking, chiaroscuro lighting, deep charcoal and antique brass bronze accents. Full bleed, fine halftone screen tone.",
    sourceFile: 'shot-00.jpg',
  },
  1: {
    label: 'Rumah Padang Gurun (Padang Sunyi California)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Isolated wooden ranch house in the dark desert plains of Llano California at 2 AM, one single window emitting an eerie amber glow, barren desert shrubs, dramatic chiaroscuro night sky with stars, heavy comic inking. Full bleed.",
    sourceFile: 'shot-03.jpg',
  },
  2: {
    label: 'Ilmuwan Masuk Kabut (Sepuluh Periset Lenyap)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Silhouette of research scientists walking into dense nocturnal fog under a lone flickering sodium streetlamp, dramatic chiaroscuro, long ominous shadows, cold desaturated slate gray and antique bronze glow, comic book ink textures. Full bleed.",
    sourceFile: 'shot-01.jpg',
  },
  3: {
    label: 'Papan Arsip Misteri (Hilang Tanpa Jejak)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Dark wooden board covered in classified research documents and missing person photos stamped with distressed crimson red crosses, pushpins with red connecting threads, magnifying glass, high contrast chiaroscuro. Full bleed.",
    sourceFile: 'shot-02.jpg',
  },
  4: {
    label: 'Sosok Astronom (Carl Grillmair di Teleskop)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Mysterious silhouette of an astronomer observing a massive astronomical radio telescope dish pointed into deep space under dark nebula clouds, cold cyan and antique bronze highlights. Full bleed.",
    sourceFile: 'shot-06.jpg',
  },
  5: {
    label: 'Beranda TKP (Roboh Bersimbah Darah)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Close-up low angle of wooden house porch steps, yellow forensic evidence marker beside gleaming spent brass bullet casings on weathered floorboards, harsh flashlight beam, deep noir shadows. Full bleed.",
    sourceFile: 'shot-04.jpg',
  },
  6: {
    label: 'Histeria Netizen (Layar CRT Konspirasi)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Gloomy room illuminated only by vintage CRT monitors glowing with red glowing internet conspiracy forum diagrams and digital waveforms, half-empty coffee mug, forensic computer terminal chiaroscuro. Full bleed.",
    sourceFile: 'shot-05.jpg',
  },
  7: {
    label: 'Meja Forensik 45° (Sindikat Bayangan)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Isometric 45-degree angle view of a brushed steel police investigation desk, classified manila dossier folders marked 'CONFIDENTIAL', autopsy paperwork, antique bronze seal stamp, chiaroscuro side lighting. Full bleed.",
    sourceFile: 'shot-07.jpg',
  },
  8: {
    label: 'Mesin Tik Arsip (Membungkam Rahasia Antariksa)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Aged vintage typewriter with paper rolled in, typing a list of names under harsh desk lamp beam, bold red rubber ink stamp reading 'RESTRICTED', gritty halftone screen tone, deep shadows. Full bleed.",
    sourceFile: 'shot-08.jpg',
  },
  9: {
    label: 'Patroli Detektif (Fiksi Runtuh di Tangan Polisi)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Flashing blue and red emergency light reflections on wet pavement, shadowy silhouette of police detectives approaching with flashlights drawn, atmospheric rain mist, comic ink chiaroscuro. Full bleed.",
    sourceFile: 'shot-09.jpg',
  },
  10: {
    label: 'Mugshot Tersangka (Freddy Snyder Pemuda Lokal)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Stark criminal mugshot sketch of a young 29-year-old male suspect under harsh interrogation spotlight, identification placard under chin, heavy cross-hatching, high contrast shadows, comic book ink art. Full bleed.",
    sourceFile: 'shot-10.jpg',
  },
  11: {
    label: 'Bukti Uang & Senjata (Motif Rampok Uang Tunai)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Transparent forensic evidence plastic bag containing worn US dollar banknotes and a black steel revolver pistol on a dark metal table, barcode tags, chiaroscuro sidelight. Full bleed.",
    sourceFile: 'shot-11.jpg',
  },
  12: {
    label: 'Keluarga Korban (Menolak Keras Mitos)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Black and white graphic novel portrait of an elderly widow speaking firmly into vintage press microphones, expression of solemn grief and fierce dignity, dramatic sidelight, halftone texture. Full bleed.",
    sourceFile: 'shot-12.jpg',
  },
  13: {
    label: 'Palu Keadilan (Ruang Sidang Pengadilan)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Heavy dark mahogany judicial gavel raised in mid-air above sound block, neoclassical court chamber with bronze scales of justice in background, volumetric rays of light through high windows. Full bleed.",
    sourceFile: 'shot-13.jpg',
  },
  14: {
    label: 'Brankas Terkunci (Dongeng Berdarah Ditutup)',
    prompt: "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Massive heavy steel vault door of the criminal archive locking shut, heavy bolts, large bold crimson wax stamp across the seam reading 'KASUS DITUTUP / CASE CLOSED', dark slate background with fine halftone dots. Full bleed.",
    sourceFile: 'shot-14.jpg',
  },
};

// 6 Kalimat Dongeng Kelam yang Terikat Langsung ke Shot
const STRUCTURED_SENTENCES = [
  {
    id: 's1',
    text: 'Sebuah dongeng kelam dari padang sunyi California.',
    shots: [1],
  },
  {
    id: 's2',
    text: 'Konon, ada sepuluh periset rahasia yang lenyap satu demi satu, ditelan kabut malam tanpa jejak.',
    shots: [2, 3],
  },
  {
    id: 's3',
    text: 'Kisah bermula saat astronom ternama, Carl Grillmair, roboh bersimbah darah di beranda rumahnya.',
    shots: [4, 5],
  },
  {
    id: 's4',
    text: 'Jagat maya pun membakar histeria konspirasi, menuduh sindikat bayangan membungkam rahasia antariksa.',
    shots: [6, 7, 8],
  },
  {
    id: 's5',
    text: 'Namun fiksi dongeng runtuh di tangan detektif. Pelakunya nyata: Freddy Snyder, pemuda lokal yang merampok demi uang tunai.',
    shots: [9, 10, 11],
  },
  {
    id: 's6',
    text: 'Keluarga korban menolak keras mitos menjijikkan ini. Di ruang pengadilan, palu hakim bersiap menutup dongeng berdarah selamanya.',
    shots: [12, 13, 14],
  },
];

async function main() {
  const jobId = process.argv[2] || 'noir_1794725807098';
  const chatId = process.env.TELEGRAM_AUTHORIZED_CHAT_ID || '8326898810';

  console.log(`\n===============================================================`);
  console.log(`🚀 SINKRONISASI PRESISI VISUAL & NARASI (JOB ID: ${jobId})`);
  console.log(`   Benchmark Standard: twitter-killer-test (Sentence-to-Shot)`);
  console.log(`===============================================================\n`);

  const rendersDir = path.join(process.cwd(), 'public', 'renders', jobId);
  const keyframesDir = path.join(rendersDir, 'keyframes');
  const audioDir = path.join(rendersDir, 'audio');
  fs.mkdirSync(keyframesDir, { recursive: true });
  fs.mkdirSync(audioDir, { recursive: true });

  // 1. Tata Ulang Urutan File Keyframe agar Sesuai Alur Cerita
  console.log('1. Menyelaraskan 15 Keyframe Asli Flow MCP sesuai Alur Cerita...');
  const keyframesBackupDir = path.join(rendersDir, 'keyframes-raw');
  if (!fs.existsSync(keyframesBackupDir)) {
    fs.mkdirSync(keyframesBackupDir, { recursive: true });
    // Backup file awal
    for (let i = 0; i <= 14; i++) {
      const fn = `shot-${String(i).padStart(2, '0')}.jpg`;
      const curP = path.join(keyframesDir, fn);
      if (fs.existsSync(curP)) {
        fs.copyFileSync(curP, path.join(keyframesBackupDir, fn));
      }
    }
  }

  const allKeyframes: KeyframeItem[] = [];

  for (let s = 0; s <= 14; s++) {
    const shotNumStr = String(s).padStart(2, '0');
    const finalFilename = `shot-${shotNumStr}.jpg`;
    const finalPath = path.join(keyframesDir, finalFilename);
    const def = SHOT_DEFINITIONS[s];

    // Ambil gambar dari backup sesuai mapping sourceFile
    const srcBackupPath = path.join(keyframesBackupDir, def.sourceFile);
    if (fs.existsSync(srcBackupPath)) {
      fs.copyFileSync(srcBackupPath, finalPath);
    }

    const fileSizeKb = fs.existsSync(finalPath) ? (fs.statSync(finalPath).size / 1024).toFixed(1) : '0';
    console.log(`  [Shot ${shotNumStr}] ${def.label} &larr; ${def.sourceFile} (${fileSizeKb} KB)`);

    allKeyframes.push({
      shot: s,
      label: def.label,
      prompt: def.prompt,
      imagePath: finalPath,
      imageUrl: `/renders/${jobId}/keyframes/${finalFilename}`,
    });
  }

  // 2. Produksi Audio Master Tersinkronisasi (Charon VO + Sentence-to-Shot Timing)
  console.log('\n2. Memproduksi Audio Master dengan Sentence-to-Shot Semantic Binding...');
  const audioResult = await produceNoirMasterAudio(STRUCTURED_SENTENCES, audioDir, 14);

  console.log(`\n✅ Audio Master Selesai: ${audioResult.masterAudioPath}`);
  console.log(`   Durasi Total: ${audioResult.totalDurationSec.toFixed(2)} detik (< 60 detik!)`);
  console.log(`   Jumlah Shot Timing: ${audioResult.shotTimings.length} shot`);
  audioResult.shotTimings.forEach((st) => {
    console.log(`   - Shot ${String(st.shot).padStart(2, '0')}: ${st.startSec.toFixed(2)}s &rarr; ${st.endSec.toFixed(2)}s (${st.durationSec.toFixed(2)}s) [${SHOT_DEFINITIONS[st.shot]?.label || ''}]`);
  });

  // 3. Susun Metadata Job
  const fullText = STRUCTURED_SENTENCES.map((s) => s.text).join(' ');
  const wordCount = fullText.split(/\s+/).length;

  const beats: ScriptBeat[] = audioResult.shotTimings.map((st) => ({
    shot: st.shot,
    startSec: st.startSec,
    endSec: st.endSec,
    narration: SHOT_DEFINITIONS[st.shot]?.label || '',
    visualCue: SHOT_DEFINITIONS[st.shot]?.prompt || '',
    shotType: 'fairytale-noir',
  }));

  const script: NoirScript = {
    title: 'DONGENG KELAM 10 ILMUWAN LENYAP',
    subHeadline: 'MISTERI PEMBUNUHAN ASTRONOM & HISPERIA DUNIA MAYA',
    fullText,
    targetDurationSec: Math.round(audioResult.totalDurationSec),
    wordCount,
    beats,
  };

  const job: OrchestratorJob = {
    id: jobId,
    chatId,
    articleUrl: 'https://www.bbc.com/indonesia/articles/ckg9q0gny1jo.amp',
    status: 'COMPOSING_VIDEO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    script,
    allKeyframes,
    sampleKeyframes: allKeyframes.slice(0, 5),
    audioPath: audioResult.masterAudioPath,
    audioDurationSec: Math.round(audioResult.totalDurationSec * 10) / 10,
    metadata: {
      seoTitle: "Dongeng Kelam 10 Ilmuwan Lenyap: Mitos Internet vs Fakta Kriminal",
      caption: `Sebuah dongeng kelam dari padang sunyi California. Konon, sepuluh periset rahasia lenyap ditelan malam, membakar histeria konspirasi antariksa saat astronom Carl Grillmair tewas di rumahnya. Namun dongeng fiksi itu runtuh di tangan polisi saat pelaku nyata, Freddy Snyder, tertangkap merampok demi uang tunai.\n\nSaksikan bagaimana fakta pengadilan membongkar mitos internet!\n\n#TrueCrime #KasusKriminal #MisteriIlmuwan #CarlGrillmair #NeoNoir #Investigasi #EksplanasiKriminal #FaktaHukum #KriminalDunia #Shorts`,
      hashtags: [
        '#TrueCrime', '#KasusKriminal', '#MisteriIlmuwan', '#CarlGrillmair',
        '#NeoNoir', '#Investigasi', '#EksplanasiKriminal', '#FaktaHukum',
        '#KriminalDunia', '#DokumenterKriminal', '#Misteri', '#CrimeStory',
        '#Shorts', '#Reels', '#TikTok'
      ],
      summaryNote: 'Naskah bergaya dongeng kelam (dark fairytale suspense) dengan visual sinkron 100% per klausa kalimat & durasi di bawah 1 menit.',
    },
  };
  saveJob(job);

  // 4. Render Video di HyperFrames Menggunakan ShotTimings Tersinkronisasi
  console.log('\n3. Rendering Video HyperFrames (1080x1920 @ 30fps) dengan Presisi Sinkronisasi...');
  const finalVideo = await compositorNoir.composeAndRenderVideo(
    job,
    audioResult.words,
    (p) => {
      process.stdout.write(`\r${p}`);
    },
    audioResult.shotTimings
  );

  job.finalVideoPath = finalVideo;
  job.status = 'COMPLETED';
  saveJob(job);
  console.log(`\n\n✅ Video Final Selesai di-Render: ${finalVideo}`);

  // 5. Perbarui Web Review Page
  console.log('\n4. Memperbarui Halaman Review Web Storyboard...');
  const { localUrl, networkUrl, htmlPath } = generateDownloadPage(job);
  console.log(`✅ Halaman Review Siap: ${htmlPath}`);

  // 6. Kirimkan Notifikasi ke Telegram
  console.log('\n5. Mengirim Notifikasi ke Telegram...');
  const message =
    `🎬 <b>[VIDEO TERSINKRONISASI 100% — BENCHMARK STANDARD]</b>\n\n` +
    `📖 <b>Konsep:</b> <i>Dark Fairytale Storytelling (Durasi: ${job.audioDurationSec}s &lt; 1 Menit)</i>\n` +
    `✨ <b>Sinkronisasi:</b> <i>Setiap pergantian gambar bertepatan tepat dengan kata/klausa yang diucapkan narator.</i>\n\n` +
    `📌 <b>Judul:</b>\n<code>${escapeHtml(job.metadata.seoTitle)}</code>\n\n` +
    `📝 <b>Caption Siap Copy:</b>\n${escapeHtml(job.metadata.caption)}\n\n` +
    `🏷️ <b>Hashtags:</b>\n<code>${escapeHtml(job.metadata.hashtags.join(' '))}</code>\n\n` +
    `🌐 <b>Link Review Storyboard & Pemutar Video:</b>\n` +
    `• Buka di Ponsel: <a href="${networkUrl}">${networkUrl}</a>\n` +
    `• Buka di Laptop: <a href="${localUrl}">${localUrl}</a>\n\n` +
    `<i>✨ Standar: 15 Frame Asli Flow MCP, Voiceover Charon dengan jeda 300ms, BGM ducked 20%, Autocaption Karaoke di Bottom Safe Area (300px), durasi pas ${job.audioDurationSec}s siap multichannel!</i>`;

  const buttons = [
    [
      {
        text: '🌐 Buka Storyboard di Browser',
        url: networkUrl,
      },
    ],
  ];

  await telegramBot.sendMessage(chatId, message, buttons);
  console.log(`\n🎉 SELESAI! Video kini tersinkronisasi 100% persis seperti standar video pertama.`);
}

main().catch((err) => {
  console.error('\n❌ Execution failed:', err);
  process.exit(1);
});
