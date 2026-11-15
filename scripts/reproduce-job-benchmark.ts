import path from 'node:path';
import fs from 'node:fs';
import { getJob, saveJob } from '../lib/orchestrator/state/jobStore';
import { assetProducer } from '../lib/orchestrator/agents/assetProducer';
import { compositorNoir } from '../lib/orchestrator/agents/compositorNoir';
import { packagePostingMetadata } from '../lib/orchestrator/agents/metadataPackager';
import { generateDownloadPage } from '../lib/orchestrator/agents/webViewer';
import { telegramBot } from '../lib/orchestrator/agents/telegramBot';
import { escapeHtml } from '../lib/orchestrator/utils';

async function main() {
  const jobId = process.argv[2] || 'noir_1794719302357';
  console.log(`\n===============================================================`);
  console.log(`🎬 Re-rendering Job ${jobId} to Benchmark Standard (twitter-killer-test)`);
  console.log(`===============================================================\n`);

  const job = getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found in store`);
  }

  // 1. Synthesize Charon VO + Ducked BGM + Glitch SFX
  console.log('1. Synthesizing voice over & producing master audio (Charon + BGM + SFX)...');
  job.status = 'SYNTHESIZING_AUDIO';
  saveJob(job);

  const audioResult = await assetProducer.synthesizeVoiceAndAlign(job);
  job.audioPath = audioResult.audioPath;
  job.audioDurationSec = Math.round((audioResult.durationMs / 1000) * 10) / 10;
  saveJob(job);

  console.log(`✅ Audio synthesized: ${job.audioPath} (${job.audioDurationSec}s)`);

  // 2. Compose and render video with bottom safe area (300px) autocaptions & glitch
  console.log('\n2. Composing and rendering HyperFrames video (1080x1920 @ 30fps)...');
  job.status = 'COMPOSING_VIDEO';
  saveJob(job);

  const finalVideo = await compositorNoir.composeAndRenderVideo(job, audioResult.words, (progress) => {
    process.stdout.write(`\r[Compositor] ${progress}`);
  });

  job.finalVideoPath = finalVideo;
  console.log(`\n✅ Video rendered: ${finalVideo}`);

  // 3. Package metadata
  console.log('\n3. Packaging metadata...');
  job.status = 'PACKAGING_METADATA';
  if (!job.metadata) {
    job.metadata = await packagePostingMetadata(job.dossier!, job.script!);
  }
  saveJob(job);

  // 4. Generate download & review page
  console.log('\n4. Generating benchmark review web page...');
  const { localUrl, networkUrl, htmlPath } = generateDownloadPage(job);
  console.log(`✅ Review page created at: ${htmlPath}`);
  console.log(`Local URL: ${localUrl}`);
  console.log(`Network URL: ${networkUrl}`);

  job.status = 'COMPLETED';
  saveJob(job);

  // 5. Notify Telegram
  console.log('\n5. Sending review link & metadata to Telegram...');
  const meta = job.metadata;
  const message =
    `🎉 <b>[PRODUKSI SELESAI — VIDEO FINAL STANDARD BENCHMARK]</b>\n\n` +
    `📌 <b>Rekomendasi Judul:</b>\n<code>${escapeHtml(meta.seoTitle)}</code>\n\n` +
    `📝 <b>Caption Siap Copy:</b>\n${escapeHtml(meta.caption)}\n\n` +
    `🏷️ <b>Hashtags:</b>\n<code>${escapeHtml(meta.hashtags.join(' '))}</code>\n\n` +
    `🌐 <b>Link Pemutar Video & Unduhan MP4 1080x1920 (Standard Twitter Killer):</b>\n` +
    `• Buka di Ponsel (Wi-Fi): <a href="${networkUrl}">${networkUrl}</a>\n` +
    `• Buka di Laptop: <a href="${localUrl}">${localUrl}</a>\n\n` +
    `<i>Fitur: Autocaption Karaoke di Bottom Safe Area (300px), Voice Charon, BGM Ducked 20%, 14 Forensic Glitches.</i>`;

  const buttons = [
    [
      {
        text: '🌐 Buka & Unduh Video di Browser',
        url: networkUrl,
      },
    ],
  ];

  await telegramBot.sendMessage(job.chatId, message, buttons);
  console.log(`\n🎉 All done! Job ${jobId} successfully aligned to standard.`);
}

main().catch((err) => {
  console.error('\n❌ Execution failed:', err);
  process.exit(1);
});
