import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { getJob, saveJob } from '../lib/orchestrator/state/jobStore';
import { produceNoirMasterAudio } from '../lib/orchestrator/audio/noirAudioPipeline';
import { compositorNoir } from '../lib/orchestrator/agents/compositorNoir';
import { generateDownloadPage } from '../lib/orchestrator/agents/webViewer';
import { telegramBot } from '../lib/orchestrator/agents/telegramBot';
import { escapeHtml } from '../lib/orchestrator/utils';
import { KeyframeItem, NoirScript, ScriptBeat } from '../lib/orchestrator/types';
import { flowClient } from '../lib/flowMcp/client';

async function main() {
  const jobId = process.argv[2] || 'noir_1794719302357';
  console.log(`\n===============================================================`);
  console.log(`📖 RE-CREATING JOB ${jobId} WITH ENGAGING FAIRYTALE NOIR STORY`);
  console.log(`===============================================================\n`);

  const job = getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  // --- STEP 1: CRAFT ENGAGING FAIRYTALE NOIR SCRIPT (STRICTLY < 60s) ---
  console.log('1. Crafting engaging "Dark Fairytale" Noir Script (82 words, ~52-54s)...');

  const fairyTaleSentences = [
    'Sebuah dongeng kelam dari padang sunyi California.',
    'Konon, ada sepuluh periset rahasia yang lenyap satu demi satu, ditelan kabut malam tanpa jejak.',
    'Kisah bermula saat astronom ternama, Carl Grillmair, roboh bersimbah darah di beranda rumahnya.',
    'Jagat maya pun membakar histeria konspirasi, menuduh sindikat bayangan membungkam rahasia antariksa.',
    'Namun fiksi dongeng runtuh di tangan detektif. Pelakunya nyata: Freddy Snyder, pemuda lokal yang merampok demi uang tunai.',
    'Keluarga korban menolak keras mitos menjijikkan ini. Di ruang pengadilan, palu hakim bersiap menutup dongeng berdarah selamanya.'
  ];

  const fullText = fairyTaleSentences.join(' ');
  const wordCount = fullText.split(/\s+/).length;

  console.log(`Script Word Count: ${wordCount} words (Target duration: 50-55s)`);

  // Map 15 visual beats across the fairytale story
  const beats: ScriptBeat[] = [
    {
      shot: 0,
      startSec: 0,
      endSec: 1.5,
      narration: 'Sebuah dongeng kelam dari padang sunyi California.',
      visualCue: "Headline cover graphic neo-noir: 'DONGENG KELAM 10 ILMUWAN LENYAP' dengan siluet teleskop dan garis polisi merah.",
      shotType: 'cover',
    },
    {
      shot: 1,
      startSec: 1.5,
      endSec: 5.5,
      narration: 'Konon, ada sepuluh periset rahasia yang lenyap satu demi satu...',
      visualCue: 'Siluet figur peneliti dalam kabut tebal malam, diterangi lampu jalan neon temaram, bayangan panjang.',
      shotType: 'hook',
    },
    {
      shot: 2,
      startSec: 5.5,
      endSec: 9.5,
      narration: '...ditelan kabut malam tanpa jejak.',
      visualCue: 'Papan arsip dokumen rahasia dengan foto-foto peneliti bertanda silang merah terkelupas.',
      shotType: 'mystery',
    },
    {
      shot: 3,
      startSec: 9.5,
      endSec: 13.5,
      narration: 'Kisah bermula saat astronom ternama, Carl Grillmair...',
      visualCue: 'Rumah kayu terisolasi di padang gurun Llano California di malam hari, satu jendela menyala remang.',
      shotType: 'crime-scene',
    },
    {
      shot: 4,
      startSec: 13.5,
      endSec: 17.5,
      narration: '...roboh bersimbah darah di beranda rumahnya.',
      visualCue: 'Close-up beranda kayu malam hari dengan garis polisi kuning dan bekas selongsong peluru berkilat.',
      shotType: 'evidence',
    },
    {
      shot: 5,
      startSec: 17.5,
      endSec: 21.5,
      narration: 'Jagat maya pun membakar histeria konspirasi...',
      visualCue: 'Layar monitor CRT di ruangan gelap menampilkan forum diskusi internet dan grafik konspirasi memerah.',
      shotType: 'digital-frenzy',
    },
    {
      shot: 6,
      startSec: 21.5,
      endSec: 25.5,
      narration: '...menuduh sindikat bayangan membungkam rahasia antariksa.',
      visualCue: 'Siluet pria berjas misterius mengawasi kubah observatorium bawah langit berbintang kelam.',
      shotType: 'syndicate',
    },
    {
      shot: 7,
      startSec: 25.5,
      endSec: 29.5,
      narration: 'Daftar nama terlarang pun tersebar luas tanpa kendali.',
      visualCue: 'Daftar nama terketik mesin tik tua dengan tinta hitam pudar dan stempel merah berdarah.',
      shotType: 'the-list',
    },
    {
      shot: 8,
      startSec: 29.5,
      endSec: 33.5,
      narration: 'Namun fiksi dongeng runtuh di tangan detektif.',
      visualCue: 'Sorotan lampu mobil patroli polisi menyinari dinding bata gang sempit di malam buta.',
      shotType: 'investigation',
    },
    {
      shot: 9,
      startSec: 33.5,
      endSec: 37.5,
      narration: 'Pelakunya nyata: Freddy Snyder, pemuda lokal...',
      visualCue: 'Mugshot profil interogasi Freddy Snyder, sorotan lampu temaram, bayangan tajam neo-noir.',
      shotType: 'suspect',
    },
    {
      shot: 10,
      startSec: 37.5,
      endSec: 41.5,
      narration: '...yang merampok demi uang tunai.',
      visualCue: 'Tumpukan uang kertas dolar kusam dan pistol revolver tergeletak di atas meja interogasi besi.',
      shotType: 'motive',
    },
    {
      shot: 11,
      startSec: 41.5,
      endSec: 45.5,
      narration: 'Keluarga korban menolak keras mitos menjijikkan ini.',
      visualCue: 'Potret hitam putih Louise Grillmair di depan mikrofon pers dengan ekspresi duka dan ketegasan.',
      shotType: 'grief-reality',
    },
    {
      shot: 12,
      startSec: 45.5,
      endSec: 49.5,
      narration: 'Di ruang pengadilan...',
      visualCue: 'Palu sidang hakim kayu mahoni terangkat di ruang sidang remang dengan timbangan keadilan perunggu.',
      shotType: 'courtroom',
    },
    {
      shot: 13,
      startSec: 49.5,
      endSec: 52.5,
      narration: '...palu hakim bersiap menutup dongeng berdarah selamanya.',
      visualCue: 'Palu hakim mengetuk meja pengadilan dengan latar bayangan bendera pengadilan.',
      shotType: 'justice',
    },
    {
      shot: 14,
      startSec: 52.5,
      endSec: 55.0,
      narration: 'Keadilan ditegakkan. Dongeng kelam telah usai.',
      visualCue: 'Pintu brankas arsip baja terkunci rapat dengan cap KASUS DITUTUP dalam bayangan dramatis.',
      shotType: 'vault-closed',
    },
  ];

  const newScript: NoirScript = {
    title: 'DONGENG KELAM 10 ILMUWAN LENYAP',
    subHeadline: 'MISTERI PEMBUNUHAN ASTRONOM & HISPERIA DUNIA MAYA',
    fullText,
    targetDurationSec: 53,
    wordCount,
    beats,
  };

  job.script = newScript;
  saveJob(job);

  // --- STEP 2: GENERATE STORYBOARD KEYFRAMES ---
  console.log('\n2. Producing 15 Storyboard Keyframes (Cover Hook + 14 Shots)...');
  const jobDir = path.join(process.cwd(), 'public', 'renders', job.id);
  const keyframesDir = path.join(jobDir, 'keyframes');
  fs.mkdirSync(keyframesDir, { recursive: true });

  const allKeyframes: KeyframeItem[] = [];

  for (const b of beats) {
    const shotNumStr = String(b.shot).padStart(2, '0');
    const filename = `shot-${shotNumStr}.jpg`;
    const outPath = path.join(keyframesDir, filename);

    const prompt = `Graphic novel neo-noir cinematic vertical illustration 9:16, high contrast chiaroscuro, heavy black shadows, muted charcoal and antique bronze color grading, atmospheric mist: ${b.visualCue}. 8k resolution, comic book ink aesthetics, detailed textures, cinematic composition.`;

    // Generate authentic graphic noir poster for each shot
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'generate-noir-keyframe.py');
    execFileSync('python3', [
      scriptPath,
      '--out', outPath,
      '--shot', String(b.shot),
      '--label', b.shotType,
      '--headline', newScript.title,
      '--subheadline', newScript.subHeadline,
      '--evidence', b.visualCue.slice(0, 60),
    ]);

    allKeyframes.push({
      shot: b.shot,
      label: b.shotType,
      prompt,
      imagePath: outPath,
      imageUrl: `/renders/${job.id}/keyframes/${filename}`,
    });
  }

  job.allKeyframes = allKeyframes;
  job.sampleKeyframes = allKeyframes.slice(0, 5);
  saveJob(job);
  console.log(`✅ All ${allKeyframes.length} keyframes ready in ${keyframesDir}`);

  // --- STEP 3: SYNTHESIZE CHARON VO + DUCKED BGM + TRANSITION SFX ---
  console.log('\n3. Synthesizing Charon Voiceover & Mixing Master Audio...');
  job.status = 'SYNTHESIZING_AUDIO';
  saveJob(job);

  const audioDir = path.join(jobDir, 'audio');
  fs.mkdirSync(audioDir, { recursive: true });

  const audioResult = await produceNoirMasterAudio(fairyTaleSentences, audioDir, 14);
  job.audioPath = audioResult.masterAudioPath;
  job.audioDurationSec = Math.round(audioResult.totalDurationSec * 10) / 10;
  saveJob(job);

  console.log(`\n✅ Audio Track Produced:`);
  console.log(`- Master Audio: ${job.audioPath}`);
  console.log(`- Duration: ${job.audioDurationSec} seconds (Strictly < 60s ✅)`);

  if (job.audioDurationSec > 60) {
    throw new Error(`Duration ${job.audioDurationSec}s still exceeds 60s limit!`);
  }

  // --- STEP 4: COMPOSE & RENDER HYPERFRAMES VIDEO (1080x1920 @ 30fps) ---
  console.log('\n4. Composing and Rendering Video in HyperFrames (1080x1920 @ 30fps)...');
  job.status = 'COMPOSING_VIDEO';
  saveJob(job);

  const finalVideo = await compositorNoir.composeAndRenderVideo(job, audioResult.words, (prog) => {
    process.stdout.write(`\r${prog}`);
  });

  job.finalVideoPath = finalVideo;
  saveJob(job);
  console.log(`\n✅ Final Video Rendered: ${finalVideo}`);

  // --- STEP 5: PACKAGE METADATA & GENERATE REVIEW PAGE ---
  console.log('\n5. Packaging Metadata & Generating Review Web Page...');
  job.status = 'PACKAGING_METADATA';
  job.metadata = {
    seoTitle: "Dongeng Kelam 10 Ilmuwan Lenyap: Mitos Internet vs Fakta Kriminal",
    caption: `Sebuah dongeng kelam dari padang sunyi California. Konon, sepuluh periset rahasia lenyap ditelan malam, membakar histeria konspirasi antariksa saat astronom Carl Grillmair tewas di rumahnya. Namun dongeng fiksi itu runtuh di tangan polisi saat pelaku nyata, Freddy Snyder, tertangkap merampok demi uang tunai.\n\nSaksikan bagaimana fakta pengadilan membongkar mitos internet!\n\n#TrueCrime #KasusKriminal #MisteriIlmuwan #CarlGrillmair #NeoNoir #Investigasi #EksplanasiKriminal #FaktaHukum #KriminalDunia #Shorts`,
    hashtags: [
      '#TrueCrime', '#KasusKriminal', '#MisteriIlmuwan', '#CarlGrillmair',
      '#NeoNoir', '#Investigasi', '#EksplanasiKriminal', '#FaktaHukum',
      '#KriminalDunia', '#DokumenterKriminal', '#Misteri', '#CrimeStory',
      '#Shorts', '#Reels', '#TikTok'
    ],
    summaryNote: 'Naskah bergaya dongeng kelam (dark fairytale suspense) dengan durasi di bawah 1 menit siap multichannel posting.',
  };
  saveJob(job);

  const { localUrl, networkUrl, htmlPath } = generateDownloadPage(job);
  console.log(`✅ Review page created at: ${htmlPath}`);

  job.status = 'COMPLETED';
  saveJob(job);

  // --- STEP 6: DELIVER NOTIFICATION TO TELEGRAM ---
  console.log('\n6. Delivering Notification to Telegram...');
  const message =
    `🎉 <b>[PRODUKSI SELESAI — NASKAH DONGENG KELAM &lt; 1 MENIT]</b>\n\n` +
    `📖 <b>Gaya Cerita:</b> <i>Dark Fairytale Storytelling (Durasi: ${job.audioDurationSec} Detik &lt; 1 Menit)</i>\n` +
    `📌 <b>Judul:</b>\n<code>${escapeHtml(job.metadata.seoTitle)}</code>\n\n` +
    `📝 <b>Caption Siap Copy:</b>\n${escapeHtml(job.metadata.caption)}\n\n` +
    `🏷️ <b>Hashtags:</b>\n<code>${escapeHtml(job.metadata.hashtags.join(' '))}</code>\n\n` +
    `🌐 <b>Link Pemutar Video & Unduhan MP4 1080x1920:</b>\n` +
    `• Buka di Ponsel (Wi-Fi): <a href="${networkUrl}">${networkUrl}</a>\n` +
    `• Buka di Laptop: <a href="${localUrl}">${localUrl}</a>\n\n` +
    `<i>✨ Standar: Voiceover Charon membawakan dongeng kelam, BGM ducked 20%, Autocaption Karaoke Antique Bronze di Safe Area (300px), durasi pas ${job.audioDurationSec} detik siap post multichannel!</i>`;

  const buttons = [
    [
      {
        text: '🌐 Buka & Unduh Video di Browser',
        url: networkUrl,
      },
    ],
  ];

  await telegramBot.sendMessage(job.chatId, message, buttons);

  console.log(`\n🎉 ALL DONE! Job ${jobId} successfully produced with engaging fairytale storytelling under 60s.`);
}

main().catch((err) => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
