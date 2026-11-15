import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { renderHyperframes } from '../lib/hyperframes/renderEngine';

async function main() {
  console.log('=== Re-rendering Mujianto Explainer without Captions ===\n');

  const projectDir = path.resolve(process.cwd(), 'hyperframes-workspace', 'mujianto-serial-killer');
  const tempVideo = path.resolve(process.cwd(), 'public', 'renders', 'mujianto-serial-killer', 'temp-visual.mp4');
  const finalVideo = path.resolve(process.cwd(), 'public', 'renders', 'mujianto-serial-killer', 'mujianto-final.mp4');
  const masterAudio = path.resolve(process.cwd(), 'public', 'renders', 'mujianto-serial-killer', 'master-audio.mp3');

  if (!fs.existsSync(masterAudio)) {
    throw new Error(`Master audio not found at: ${masterAudio}`);
  }

  console.log('1. Rendering visual timeline with HyperFrames (1080x1920 @ 30fps)...');
  const startTime = Date.now();

  await renderHyperframes({
    projectDir,
    outputPath: tempVideo,
    fps: 30,
    onProgress: (p) => process.stdout.write(p),
  });

  const renderTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n✅ Visual render finished in ${renderTimeSec}s!`);

  console.log('\n2. Multiplexing master voice over + BGM with FFmpeg...');
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

  const sizeMb = (fs.statSync(finalVideo).size / (1024 * 1024)).toFixed(2);

  console.log(`\n🎉 FINAL CLEAN VIDEO COMPLETED!`);
  console.log(`Output: ${finalVideo}`);
  console.log(`Duration: ${durationStr} seconds`);
  console.log(`File Size: ${sizeMb} MB`);
}

main().catch((err) => {
  console.error('\n❌ Render Failed:', err);
  process.exit(1);
});
