import fs from 'node:fs';
import path from 'node:path';
import { flowClient } from '../lib/flowMcp/client';

const PROJECT_ID = 'eno-pelaku-berbagi-peran';
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public', 'renders', PROJECT_ID);
const KEYFRAMES_DIR = path.join(PUBLIC_DIR, 'keyframes');

fs.mkdirSync(KEYFRAMES_DIR, { recursive: true });

export const MOVING_SCENES = [
  {
    filename: 'moving-door-night.mp4',
    title: 'Beat 1 Hook: Pintu Mess Karyawan No. 7 (Image-to-Video Dolly-in)',
    firstFrameImage: 'mess-room-night.jpg',
    prompt:
      'Maintain exact 2D Graphic Novel Neo-Noir Forensic illustration style, colors, and inking textures from the first frame. Slow creeping forward dolly zoom camera motion towards weathered wooden door number 7 of the dormitory at midnight. Dim 5-watt tungsten bulb flickering above, subtle nocturnal rain dripping, heavy dark chiaroscuro shadows, soot black and charcoal palette, smooth ominous slow motion.',
  },
  {
    filename: 'moving-cangkul-backyard.mp4',
    title: 'Beat 7/8 Climax: Cangkul di Pekarangan Maut (Image-to-Video Tilt-down)',
    firstFrameImage: 'backyard-cangkul.jpg',
    prompt:
      'Maintain exact 2D Graphic Novel Neo-Noir Forensic illustration style, colors, and inking textures from the first frame. Slow downward camera tilt and pan focusing on the heavy iron hoe (cangkul) lying abandoned on wet muddy gravel ground under rainy nocturnal darkness, forensic amber beam sweeping across the wet iron blade, dramatic crime documentary motion.',
  },
];

export async function generateMovingKeyframes(force = false): Promise<{ success: boolean; files: string[] }> {
  console.log('========================================================================');
  console.log('  🎬 GENERASI 2 VIDEO BERGERAK VIA GOOGLE FLOW AI (IMAGE-TO-VIDEO / FRAMES MODE)');
  console.log('     (Style-Locked to 100% Graphic Novel Neo-Noir Forensic Stills)');
  console.log('========================================================================\n');

  const generatedFiles: string[] = [];

  for (const scene of MOVING_SCENES) {
    const targetFile = path.join(KEYFRAMES_DIR, scene.filename);
    const firstFramePath = path.resolve(KEYFRAMES_DIR, scene.firstFrameImage);

    if (!force && fs.existsSync(targetFile) && fs.statSync(targetFile).size > 50000) {
      console.log(`✅ Cache video ditemukan: ${scene.filename} (${(fs.statSync(targetFile).size / 1024 / 1024).toFixed(2)} MB)`);
      generatedFiles.push(targetFile);
      continue;
    }

    console.log(`🎥 Men-generate video bergerak (Frames Mode): ${scene.title}...`);
    console.log(`   🖼️ First Frame Reference: ${firstFramePath}`);

    try {
      const res = await flowClient.generate({
        project: PROJECT_ID,
        prompt: scene.prompt,
        type: 'video',
        aspect: '9:16',
        first_frame: firstFramePath,
        max_credits: 30,
      });

      if (res.task_id) {
        console.log(`   Task ${res.task_id} queued. Menunggu render video (~60-120 detik)...`);
        const waitRes = await flowClient.waitForJob(res.task_id, 300);
        if (waitRes.finished && waitRes.files?.[0] && fs.existsSync(waitRes.files[0])) {
          fs.copyFileSync(waitRes.files[0], targetFile);
          console.log(`   ✅ Selesai: ${scene.filename} (${(fs.statSync(targetFile).size / 1024 / 1024).toFixed(2)} MB)`);
          generatedFiles.push(targetFile);
        } else {
          console.warn(`   ⚠️ Render tidak menghasilkan file: ${waitRes.error || 'Unknown error'}`);
        }
      }
    } catch (err: any) {
      console.error(`   ❌ Gagal men-generate video ${scene.filename}:`, err.message);
    }
  }

  return { success: generatedFiles.length > 0, files: generatedFiles };
}

if (process.argv[1]?.endsWith('generate-flow-moving-keyframes.ts')) {
  const force = process.argv.includes('--force');
  generateMovingKeyframes(force).catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
