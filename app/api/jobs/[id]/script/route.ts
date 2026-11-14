import { NextResponse } from 'next/server';
import { getJob, saveJob } from '@/lib/db/storage';
import { resolveStoryboard } from '@/lib/pipeline/storyboardResolver';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = getJob(id);

    if (!job) {
      return NextResponse.json({ error: 'Job tidak ditemukan' }, { status: 404 });
    }

    const { fullText } = await req.json();
    if (!fullText || typeof fullText !== 'string') {
      return NextResponse.json({ error: 'Teks script wajib diisi' }, { status: 400 });
    }

    // Split text into sentences
    const rawSentences = fullText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const sentences = rawSentences.map((text, idx) => ({
      id: `s${idx + 1}`,
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    }));

    const totalWords = sentences.reduce((sum, s) => sum + s.wordCount, 0);
    const estimatedDurationSec = Math.round((totalWords / 2.5) * 10) / 10;

    if (estimatedDurationSec > 60) {
      return NextResponse.json(
        { error: `Durasi estimasi (${estimatedDurationSec}s) melebihi batas 60 detik. Mohon perpendek naskah.` },
        { status: 400 }
      );
    }

    job.script = {
      sentences,
      fullText,
      totalWords,
      estimatedDurationSec,
      isDurationValid: true,
    };

    // Stale previous audio & video
    job.audio = undefined;
    job.video = undefined;
    job.status = 'SCRIPT_READY';

    // Re-resolve storyboard draft
    if (job.angle) {
      job.storyboard = resolveStoryboard(job.script, job.angle, {
        url: job.articleUrl,
        title: job.angle.name,
        leadParagraph: '',
        paragraphs: [],
        numbers: [],
        quotes: [],
        sourceDomain: '',
      });
    }

    saveJob(job);
    return NextResponse.json({ job });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui script';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

