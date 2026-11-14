import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { getJob, saveJob } from '@/lib/db/storage';
import { generateHyperframesProject } from '@/lib/hyperframes/templateGenerator';
import { renderHyperframes } from '@/lib/hyperframes/renderEngine';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = getJob(id);

    if (!job || !job.storyboard) {
      return NextResponse.json({ error: 'Job atau storyboard tidak ditemukan' }, { status: 404 });
    }

    job.status = 'VIDEO_GENERATING';
    job.progress = { step: 'Menyusun komposisi HyperFrames...', index: 1, total: 3 };
    saveJob(job);

    const projectDir = path.join(process.cwd(), 'hyperframes-workspace', job.id);
    const finalVideoDir = path.join(process.cwd(), 'public', 'renders', job.id);
    fs.mkdirSync(finalVideoDir, { recursive: true });
    const finalVideoPath = path.join(finalVideoDir, 'final.mp4');

    // Generate Hyperframes files (index.html, styles.css, main.js)
    generateHyperframesProject({
      jobId: job.id,
      title: job.angle?.name || 'Explainer Video',
      themePresetId: job.themePresetId || 'modern-dark',
      totalDurationMs: job.storyboard.totalDurationMs || 30000,
      audioPath: job.audio?.path,
      scenes: job.storyboard.scenes,
      outputDir: projectDir,
    });

    job.progress = { step: 'Merender frame-by-frame via HyperFrames...', index: 2, total: 3 };
    saveJob(job);

    // Render video
    try {
      await renderHyperframes({
        projectDir,
        outputPath: finalVideoPath,
        fps: 30,
      });

      job.video = {
        path: finalVideoPath,
        url: `/renders/${job.id}/final.mp4`,
        durationSec: Math.round(((job.storyboard.totalDurationMs || 30000) / 1000) * 10) / 10,
      };

      job.status = 'VIDEO_READY';
      job.progress = { step: 'Video explainer selesai!', index: 3, total: 3 };
      saveJob(job);

      return NextResponse.json({ job });
    } catch (renderError: unknown) {
      const renderMsg = renderError instanceof Error ? renderError.message : String(renderError);
      job.status = 'FAILED';
      job.error = {
        stage: 'VIDEO',
        message: renderMsg,
      };
      saveJob(job);
      return NextResponse.json({ error: renderMsg, job }, { status: 500 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal merender video';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

