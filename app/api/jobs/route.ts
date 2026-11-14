import { NextResponse } from 'next/server';
import { extractArticle } from '@/lib/pipeline/articleExtractor';
import { planAngle } from '@/lib/pipeline/anglePlanner';
import { writeScript } from '@/lib/pipeline/scriptWriter';
import { resolveStoryboard } from '@/lib/pipeline/storyboardResolver';
import { planAngleWithDeepSeek, writeScriptWithDeepSeek } from '@/lib/llm/deepseek';
import { saveJob, getAllJobs, VideoJob } from '@/lib/db/storage';

export async function GET() {
  const jobs = getAllJobs();
  return NextResponse.json({ jobs: Object.values(jobs) });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { articleUrl, brief, themePresetId = 'modern-dark' } = body;

    if (!articleUrl || typeof articleUrl !== 'string') {
      return NextResponse.json({ error: 'URL artikel wajib diisi' }, { status: 400 });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const job: VideoJob = {
      id: jobId,
      articleUrl,
      brief,
      themePresetId,
      status: 'SCRIPT_GENERATING',
      progress: {
        step: 'Mengekstrak isi artikel...',
        index: 1,
        total: 4,
      },
      createdAt: now,
      updatedAt: now,
    };
    saveJob(job);

    // 1. Run article extraction
    const article = await extractArticle(articleUrl);
    job.progress = { step: 'Menentukan angle dan intent (DeepSeek LLM)...', index: 2, total: 4 };
    saveJob(job);

    // 2. Plan Angle (DeepSeek with fallback)
    let angle;
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        angle = await planAngleWithDeepSeek(article, brief);
      } catch (llmErr) {
        console.warn('DeepSeek angle planning failed, fallback to heuristic:', llmErr);
        angle = planAngle(article, brief);
      }
    } else {
      angle = planAngle(article, brief);
    }
    job.angle = angle;
    job.progress = { step: 'Menulis naskah narasi padat (DeepSeek LLM)...', index: 3, total: 4 };
    saveJob(job);

    // 3. Write Script (DeepSeek with fallback)
    let script;
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        script = await writeScriptWithDeepSeek(article, angle);
      } catch (llmErr) {
        console.warn('DeepSeek script writing failed, fallback to heuristic:', llmErr);
        script = writeScript(article, angle);
      }
    } else {
      script = writeScript(article, angle);
    }
    job.script = script;

    // 4. Resolve Storyboard
    const storyboard = resolveStoryboard(script, angle, article);
    job.storyboard = storyboard;
    job.status = 'SCRIPT_READY';
    job.progress = { step: 'Naskah siap ditinjau', index: 4, total: 4 };
    saveJob(job);

    return NextResponse.json({ job });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses artikel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
