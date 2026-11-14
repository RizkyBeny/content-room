import path from 'node:path';
import fs from 'node:fs';
import { generateHyperframesProject } from '../lib/hyperframes/templateGenerator';
import { renderHyperframes } from '../lib/hyperframes/renderEngine';

async function main() {
  console.log('=== HyperFrames Compositor Smoke Test ===\n');

  const testDir = path.join(process.cwd(), 'hyperframes-workspace', 'smoke-test');
  const outputVideo = path.join(process.cwd(), 'public', 'renders', 'smoke-test', 'test-output.mp4');

  fs.mkdirSync(testDir, { recursive: true });

  console.log('1. Menyiapkan proyek HyperFrames sampel 9:16...');
  generateHyperframesProject({
    jobId: 'smoke-test',
    title: 'HyperFrames Smoke Test',
    themePresetId: 'modern-dark',
    totalDurationMs: 4000,
    scenes: [
      {
        id: 's1',
        beat: 'hook',
        start_ms: 0,
        end_ms: 2000,
        kicker: 'HYPERFRAMES TEST',
        headline: 'Rendering Deterministic 9:16 Video',
        subtext: 'Uji coba motion graphics presisi dengan GSAP timeline.',
        assetType: 'graphic_only',
      },
      {
        id: 's2',
        beat: 'data',
        start_ms: 2000,
        end_ms: 4000,
        kicker: 'PERFORMA ENGINE',
        headline: '100% Standar Web (HTML, CSS, GSAP)',
        metric: '1080x1920',
        metricLabel: 'Resolusi Vertikal',
        assetType: 'graphic_only',
      },
    ],
    outputDir: testDir,
  });

  console.log('2. Menjalankan renderEngine (npx hyperframes render)...');
  const startTime = Date.now();
  const result = await renderHyperframes({
    projectDir: testDir,
    outputPath: outputVideo,
    fps: 30,
    onProgress: (p) => process.stdout.write(p),
  });

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n✅ Render berhasil dalam ${durationSec} detik!`);
  console.log('File output MP4:', result.outputPath);
}

main().catch(console.error);

