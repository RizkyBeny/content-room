import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { groupWordsIntoPhrases, CaptionWord } from '../lib/orchestrator/audio/noirAudioPipeline';
import { generateNoirHyperframesHtml } from '../lib/orchestrator/video/noirVideoTemplate';
import { renderHyperframes } from '../lib/hyperframes/renderEngine';

async function main() {
  const PROJECT_ID = 'mujianto-serial-killer';
  const ROOT_DIR = process.cwd();
  const PUBLIC_DIR = path.join(ROOT_DIR, 'public', 'renders', PROJECT_ID);
  const HF_WORKSPACE = path.join(ROOT_DIR, 'hyperframes-workspace', PROJECT_ID);
  const STORYBOARD_FILE = path.join(PUBLIC_DIR, 'storyboard-data.json');

  if (!fs.existsSync(STORYBOARD_FILE)) {
    throw new Error(`Storyboard file not found at ${STORYBOARD_FILE}`);
  }

  const storyboard = JSON.parse(fs.readFileSync(STORYBOARD_FILE, 'utf8'));
  const totalDurationSec = storyboard.totalDurationSec || 83.856;
  const words: CaptionWord[] = storyboard.words || [];

  console.log(`[Re-render] Loaded ${words.length} words from storyboard-data.json`);

  // Group into short phrases (max 4 words per phrase or punctuated)
  const phrases = groupWordsIntoPhrases(words, 4);
  console.log(`[Re-render] Grouped into ${phrases.length} discrete caption phrases`);

  // Shot timings
  const shotTimings = storyboard.shotTimings.map((st: any) => ({
    shot: st.shot,
    startSec: st.startSec,
    endSec: st.endSec,
    durationSec: st.durationSec,
  }));

  const coverImagePath = path.join(PUBLIC_DIR, 'keyframes', 'cover-shot-00.jpg');
  const shotImages = Array.from({ length: 14 }, (_, i) => ({
    shot: i + 1,
    imagePath: path.join(PUBLIC_DIR, 'keyframes', `shot-${String(i + 1).padStart(2, '0')}.jpg`),
  }));

  console.log('[Re-render] Generating noir video HTML with discrete word-by-word karaoke captions...');
  generateNoirHyperframesHtml({
    jobId: PROJECT_ID,
    title: 'SERIAL KILLER NGANJUK - Peracun 23 Korban',
    totalDurationSec,
    coverImagePath,
    shotImages,
    shotTimings,
    phrases,
    outputDir: HF_WORKSPACE,
  });

  console.log(`[Re-render] Saved index.html to ${HF_WORKSPACE}`);

  // Render with HyperFrames CLI
  console.log('[Re-render] Rendering video with HyperFrames (30fps)...');
  const tempVideoPath = path.join(PUBLIC_DIR, 'temp-visual-timeline.mp4');
  const finalVideoPath = path.join(PUBLIC_DIR, 'mujianto-final.mp4');
  const masterAudioPath = path.join(PUBLIC_DIR, 'master-audio.mp3');

  const startTime = Date.now();
  await renderHyperframes({
    projectDir: HF_WORKSPACE,
    outputPath: tempVideoPath,
    fps: 30,
    onProgress: (p) => process.stdout.write(p),
  });

  const renderTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n[Re-render] Visual render finished in ${renderTimeSec}s!`);

  // Multiplex with master audio track using FFmpeg
  console.log('[Re-render] Multiplexing with FFmpeg...');
  const ffmpegBin = fs.existsSync('./bin/ffmpeg') ? './bin/ffmpeg' : 'ffmpeg';
  execFileSync(ffmpegBin, [
    '-y',
    '-i',
    tempVideoPath,
    '-i',
    masterAudioPath,
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-shortest',
    finalVideoPath,
  ]);

  if (fs.existsSync(tempVideoPath)) {
    fs.unlinkSync(tempVideoPath);
  }

  console.log(`[Re-render] ✅ Final video created: ${finalVideoPath}`);

  // Extract preview snapshots at different timestamps to verify word-by-word autocaption
  const timestamps = [
    { sec: '0.8', name: 'preview-01s-hook.jpg' },
    { sec: '4.5', name: 'preview-04s-shot1-caption.jpg' },
    { sec: '15.0', name: 'preview-15s-shot3-caption.jpg' },
    { sec: '45.0', name: 'preview-45s-shot8-caption.jpg' },
  ];

  for (const ts of timestamps) {
    const outImg = path.join(PUBLIC_DIR, ts.name);
    execFileSync(ffmpegBin, [
      '-y',
      '-ss',
      ts.sec,
      '-i',
      finalVideoPath,
      '-vframes',
      '1',
      '-q:v',
      '2',
      outImg,
    ]);
    console.log(`[Re-render] Snapshot extracted: ${outImg}`);
  }

  console.log('[Re-render] All done successfully!');
}

main().catch((err) => {
  console.error('[Re-render] Fatal error:', err);
  process.exit(1);
});
