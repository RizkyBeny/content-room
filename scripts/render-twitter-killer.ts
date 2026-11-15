import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { renderHyperframes } from '../lib/hyperframes/renderEngine';

async function main() {
  console.log('=== Rendering Twitter Killer Explainer in HyperFrames ===\n');

  const projectDir = path.resolve(process.cwd(), 'hyperframes-workspace', 'twitter-killer-investigation');
  const tempVideo = path.resolve(process.cwd(), 'public', 'renders', 'twitter-killer-test', 'temp-visual.mp4');
  const finalVideo = path.resolve(process.cwd(), 'public', 'renders', 'twitter-killer-test', 'twitter-killer-final.mp4');
  const masterAudio = path.resolve(process.cwd(), 'public', 'renders', 'twitter-killer-test', 'twitter-killer-master.mp3');

  if (!fs.existsSync(masterAudio)) {
    throw new Error(`Master audio not found at: ${masterAudio}`);
  }

  console.log('1. Rendering visual timeline with HyperFrames (1080x1920 @ 30fps)...');
  console.log(`Project: ${projectDir}`);
  console.log(`Temp Visual Output: ${tempVideo}`);

  const startTime = Date.now();

  await renderHyperframes({
    projectDir,
    outputPath: tempVideo,
    fps: 30,
    onProgress: (p) => {
      process.stdout.write(p);
    },
  });

  const renderTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n✅ Visual render finished in ${renderTimeSec}s!`);

  console.log('\n2. Multiplexing master voice over (Charon - Broadcast Master) with FFmpeg...');
  execFileSync('./bin/ffmpeg', [
    '-y',
    '-i', tempVideo,
    '-i', masterAudio,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    finalVideo,
  ]);

  if (fs.existsSync(tempVideo)) {
    fs.unlinkSync(tempVideo);
  }

  const durationStr = execFileSync('./bin/ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    finalVideo,
  ], { encoding: 'utf8' }).trim();

  const sizeBytes = fs.statSync(finalVideo).size;
  const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2);

  console.log(`\n🎉 FINAL VIDEO COMPLETED!`);
  console.log(`Output: ${finalVideo}`);
  console.log(`Duration: ${durationStr} seconds`);
  console.log(`File Size: ${sizeMb} MB`);
}

main().catch((err) => {
  console.error('\n❌ Render Failed:', err);
  process.exit(1);
});
