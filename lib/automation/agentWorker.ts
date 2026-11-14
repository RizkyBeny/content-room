import { extractArticle } from '../pipeline/articleExtractor';
import { planAngle } from '../pipeline/anglePlanner';
import { writeScript } from '../pipeline/scriptWriter';
import { resolveStoryboard } from '../pipeline/storyboardResolver';
import { generateAudioAndAlignment } from '../flowMcp/audioPipeline';
import { generateHyperframesProject } from '../hyperframes/templateGenerator';
import { renderHyperframes } from '../hyperframes/renderEngine';
import { saveJob, VideoJob } from '../db/storage';
import path from 'node:path';
import fs from 'node:fs';

export interface AutomationJobInput {
  articleUrl: string;
  brief?: string;
  themePresetId?: string;
  voice?: string;
}

export async function runAutomatedExplainerPipeline(
  input: AutomationJobInput,
  onProgress?: (step: string) => void
): Promise<VideoJob> {
  const jobId = `auto_${Date.now()}`;
  const now = new Date().toISOString();

  const job: VideoJob = {
    id: jobId,
    articleUrl: input.articleUrl,
    brief: input.brief,
    themePresetId: input.themePresetId || 'modern-dark',
    status: 'SCRIPT_GENERATING',
    createdAt: now,
    updatedAt: now,
  };
  saveJob(job);

  // 1. Extract Article
  onProgress?.('Extracting article content...');
  const article = await extractArticle(input.articleUrl);

  // 2. Plan Angle
  onProgress?.('Planning angle & hook...');
  const angle = planAngle(article, input.brief);
  job.angle = angle;

  // 3. Write Script
  onProgress?.('Writing narrative script...');
  const script = writeScript(article, angle);
  job.script = script;
  job.status = 'SCRIPT_READY';
  saveJob(job);

  // 4. Voice Over & Alignment
  onProgress?.('Synthesizing voice over & aligning speech timestamps...');
  job.status = 'AUDIO_GENERATING';
  const audioDir = path.join(process.cwd(), 'public', 'renders', job.id);
  const audioResult = await generateAudioAndAlignment(script.fullText, {
    voice: input.voice || 'Puck',
    outputDir: audioDir,
  });

  job.audio = {
    path: audioResult.audioPath,
    url: `/renders/${job.id}/${path.basename(audioResult.audioPath)}`,
    durationSec: Math.round((audioResult.durationMs / 1000) * 10) / 10,
  };
  job.status = 'AUDIO_READY';

  // 5. Storyboard Resolution
  onProgress?.('Composing storyboard scenes...');
  const storyboard = resolveStoryboard(script, angle, article, {
    actualDurationMs: audioResult.durationMs,
  });
  job.storyboard = storyboard;
  saveJob(job);

  // 6. HyperFrames Composition & Render
  onProgress?.('Building HyperFrames project & deterministic render...');
  job.status = 'VIDEO_GENERATING';
  const projectDir = path.join(process.cwd(), 'hyperframes-workspace', job.id);
  const finalVideoDir = path.join(process.cwd(), 'public', 'renders', job.id);
  fs.mkdirSync(finalVideoDir, { recursive: true });
  const finalVideoPath = path.join(finalVideoDir, 'final.mp4');

  generateHyperframesProject({
    jobId: job.id,
    title: angle.name,
    themePresetId: job.themePresetId,
    totalDurationMs: storyboard.totalDurationMs,
    audioPath: job.audio.path,
    scenes: storyboard.scenes,
    words: audioResult.words,
    outputDir: projectDir,
  });

  await renderHyperframes({
    projectDir,
    outputPath: finalVideoPath,
    fps: 30,
  });

  job.video = {
    path: finalVideoPath,
    url: `/renders/${job.id}/final.mp4`,
    durationSec: job.audio.durationSec,
  };
  job.status = 'VIDEO_READY';
  saveJob(job);

  onProgress?.(`Video explainer ready: ${job.video.url}`);
  return job;
}

