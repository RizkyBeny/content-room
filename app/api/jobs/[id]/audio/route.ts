import { NextResponse } from 'next/server';
import path from 'node:path';
import { getJob, saveJob } from '@/lib/db/storage';
import { generateAudioAndAlignment } from '@/lib/flowMcp/audioPipeline';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = getJob(id);

    if (!job || !job.script) {
      return NextResponse.json({ error: 'Job atau script tidak ditemukan' }, { status: 404 });
    }

    const { voice = 'Puck', backend = 'gemini' } = await req.json().catch(() => ({}));

    job.status = 'AUDIO_GENERATING';
    job.progress = { step: 'Men-generate audio narator dari Flow MCP...', index: 1, total: 2 };
    saveJob(job);

    const outputDir = path.join(process.cwd(), 'public', 'renders', job.id);

    try {
      const audioResult = await generateAudioAndAlignment(job.script.fullText, {
        voice,
        backend,
        outputDir,
      });

      const audioFileName = path.basename(audioResult.audioPath);
      job.audio = {
        path: audioResult.audioPath,
        url: `/renders/${job.id}/${audioFileName}`,
        durationSec: Math.round((audioResult.durationMs / 1000) * 10) / 10,
      };

      if (job.storyboard) {
        job.storyboard.totalDurationMs = audioResult.durationMs;
      }

      job.status = 'AUDIO_READY';
      job.progress = { step: 'Audio narasi siap', index: 2, total: 2 };
      saveJob(job);

      return NextResponse.json({ job });
    } catch (flowError: unknown) {
      const flowMessage = flowError instanceof Error ? flowError.message : String(flowError);
      job.status = 'FAILED';
      job.error = {
        stage: 'AUDIO',
        message: flowMessage,
      };
      saveJob(job);
      return NextResponse.json({ error: flowMessage, job }, { status: 500 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memproses audio';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

