import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getJob, saveJob } from '../lib/orchestrator/state/jobStore';
import { generateNoirHyperframesHtml } from '../lib/orchestrator/video/noirVideoTemplate';
import { groupWordsIntoPhrases, CaptionWord, ShotTiming } from '../lib/orchestrator/audio/noirAudioPipeline';
import { renderHyperframes } from '../lib/hyperframes/renderEngine';
import { generateDownloadPage } from '../lib/orchestrator/agents/webViewer';
import { telegramBot } from '../lib/orchestrator/agents/telegramBot';
import { escapeHtml } from '../lib/orchestrator/utils';

const execFileAsync = promisify(execFile);

async function main() {
  const jobId = process.argv[2] || 'noir_1794719302357';
  console.log(`\n===============================================================`);
  console.log(`🎨 RENDERING VIDEO WITH AUTHENTIC GOOGLE FLOW MCP STORYBOARD`);
  console.log(`===============================================================\n`);

  const job = getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  const jobDir = path.join(process.cwd(), 'public', 'renders', job.id);
  const audioDir = path.join(jobDir, 'audio');
  const keyframesDir = path.join(jobDir, 'keyframes');
  const projectDir = path.join(process.cwd(), 'hyperframes-workspace', job.id);
  const tempVideoPath = path.join(jobDir, 'temp-visual.mp4');
  const finalVideoPath = path.join(jobDir, 'noir-explainer-final.mp4');
  const masterAudio = path.join(audioDir, 'master-audio.mp3');

  const fairyTaleSentences = [
    'Sebuah dongeng kelam dari padang sunyi California.',
    'Konon, ada sepuluh periset rahasia yang lenyap satu demi satu, ditelan kabut malam tanpa jejak.',
    'Kisah bermula saat astronom ternama, Carl Grillmair, roboh bersimbah darah di beranda rumahnya.',
    'Jagat maya pun membakar histeria konspirasi, menuduh sindikat bayangan membungkam rahasia antariksa.',
    'Namun fiksi dongeng runtuh di tangan detektif. Pelakunya nyata: Freddy Snyder, pemuda lokal yang merampok demi uang tunai.',
    'Keluarga korban menolak keras mitos menjijikkan ini. Di ruang pengadilan, palu hakim bersiap menutup dongeng berdarah selamanya.'
  ];

  // 1. Calculate word timings and phrase groups
  let offset = 0;
  const captionWords: CaptionWord[] = [];

  fairyTaleSentences.forEach((text, i) => {
    const wav = path.join(audioDir, 'audio-chunks', `sentence-${i}.wav`);
    const durStr = execFileSync('./bin/ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      wav,
    ], { encoding: 'utf8' }).trim();
    const dur = Number(durStr);

    const rawWords = text.split(/\s+/).filter(Boolean);
    const weights = rawWords.map((w) => Math.max(2, w.length) + (/[.,;]/.test(w) ? 3 : 0));
    const totalW = weights.reduce((a, b) => a + b, 0);

    let cursor = offset;
    rawWords.forEach((w, widx) => {
      const wDur = (weights[widx] / totalW) * dur;
      const wStart = cursor;
      const wEnd = cursor + wDur;
      cursor = wEnd;
      captionWords.push({
        word: w,
        start: Number(wStart.toFixed(2)),
        end: Number(wEnd.toFixed(2)),
      });
    });
    offset = cursor + 0.3; // silence gap
  });

  const totalDurationSec = Number(
    execFileSync('./bin/ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      masterAudio,
    ], { encoding: 'utf8' }).trim()
  );

  console.log(`Master Audio Duration: ${totalDurationSec.toFixed(2)}s`);
  console.log(`Caption Words: ${captionWords.length} words`);

  const phrases = groupWordsIntoPhrases(captionWords, 4);
  console.log(`Grouped Phrases: ${phrases.length} phrases`);

  // 2. Map 14 shot timings across total duration
  const shotCount = 14;
  const shotDuration = totalDurationSec / shotCount;
  const shotTimings: ShotTiming[] = Array.from({ length: shotCount }, (_, i) => {
    const start = i * shotDuration;
    const end = (i + 1) * shotDuration;
    return {
      shot: i + 1,
      startSec: Number(start.toFixed(2)),
      endSec: Number(end.toFixed(2)),
      durationSec: Number(shotDuration.toFixed(2)),
    };
  });

  // 3. Collect 15 Flow MCP images
  const coverImagePath = path.join(keyframesDir, 'shot-00.jpg');
  const shotImages: Array<{ shot: number; imagePath: string }> = [];
  for (let s = 1; s <= 14; s++) {
    const shotNumStr = String(s).padStart(2, '0');
    shotImages.push({
      shot: s,
      imagePath: path.join(keyframesDir, `shot-${shotNumStr}.jpg`),
    });
  }

  // 4. Generate HyperFrames index.html template
  console.log('\nGenerating HyperFrames template with authentic Flow MCP images...');
  generateNoirHyperframesHtml({
    jobId: job.id,
    title: job.script?.title || 'DONGENG KELAM 10 ILMUWAN LENYAP',
    totalDurationSec,
    coverImagePath,
    shotImages,
    shotTimings,
    phrases,
    outputDir: projectDir,
  });

  // 5. Render video frames with Headless Chromium (30fps)
  console.log('\nRendering video in HyperFrames (1080x1920 @ 30fps)...');
  await renderHyperframes({
    projectDir,
    outputPath: tempVideoPath,
    fps: 30,
    onProgress: (p) => {
      process.stdout.write(`\r${p}`);
    },
  });

  // 6. Multiplex with master audio
  console.log('\n\nMultiplexing master audio with FFmpeg...');
  execFileSync('./bin/ffmpeg', [
    '-y',
    '-i', tempVideoPath,
    '-i', masterAudio,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    finalVideoPath,
  ]);

  if (fs.existsSync(tempVideoPath)) {
    fs.unlinkSync(tempVideoPath);
  }

  console.log(`✅ Final Video Ready: ${finalVideoPath}`);

  // 7. Update Job State & Web Review Page
  job.finalVideoPath = finalVideoPath;
  job.audioDurationSec = Math.round(totalDurationSec * 10) / 10;
  job.allKeyframes = [
    {
      shot: 0,
      label: 'cover',
      prompt: 'Cover Hook',
      imagePath: path.join(keyframesDir, 'shot-00.jpg'),
      imageUrl: `/renders/${job.id}/keyframes/shot-00.jpg`,
    },
    ...shotImages.map((s) => ({
      shot: s.shot,
      label: `Shot ${s.shot}`,
      prompt: `Scene ${s.shot}`,
      imagePath: s.imagePath,
      imageUrl: `/renders/${job.id}/keyframes/shot-${String(s.shot).padStart(2, '0')}.jpg`,
    })),
  ];
  job.sampleKeyframes = job.allKeyframes.slice(0, 5);
  saveJob(job);

  const { localUrl, networkUrl, htmlPath } = generateDownloadPage(job);
  console.log(`\n✅ Review Web Page Updated: ${htmlPath}`);
  console.log(`Local URL: ${localUrl}`);
  console.log(`Network URL: ${networkUrl}`);

  // 8. Deliver to Telegram
  const message =
    `🎉 <b>[STORYBOARD FLOW MCP & VIDEO FINAL SELESAI]</b>\n\n` +
    `🎨 <b>15 Keyframes:</b> <i>100% Real Generated Artwork dari Google Flow MCP</i>\n` +
    `📖 <b>Naskah:</b> <i>Dark Fairytale Storytelling (Durasi: ${job.audioDurationSec}s &lt; 1 Menit)</i>\n` +
    `📌 <b>Judul:</b>\n<code>${escapeHtml(job.metadata?.seoTitle || '')}</code>\n\n` +
    `🌐 <b>Link Review Storyboard & Pemutar Video:</b>\n` +
    `• Buka di Ponsel: <a href="${networkUrl}">${networkUrl}</a>\n` +
    `• Buka di Laptop: <a href="${localUrl}">${localUrl}</a>\n\n` +
    `<i>Silakan refresh browser untuk melihat gambar storyboard asli dari Google Flow dan video 9:16 final.</i>`;

  const buttons = [
    [
      {
        text: '🌐 Buka Storyboard di Browser',
        url: networkUrl,
      },
    ],
  ];

  await telegramBot.sendMessage(job.chatId, message, buttons);
  console.log('\n🎉 ALL DONE! Real Flow MCP storyboard and video delivered successfully.');
}

main().catch((err) => {
  console.error('\n❌ Execution error:', err);
  process.exit(1);
});
