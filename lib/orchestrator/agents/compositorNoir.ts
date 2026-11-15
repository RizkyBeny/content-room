import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { generateHyperframesProject, StoryboardScene } from '../../hyperframes/templateGenerator';
import { renderHyperframes } from '../../hyperframes/renderEngine';
import { OrchestratorJob } from '../types';
import { ORCHESTRATOR_CONFIG } from '../config';
import { TranscribedWord } from '../../flowMcp/types';

const execFileAsync = promisify(execFile);

function resolveFfmpegBin(): { ffmpeg: string; ffprobe: string } {
  const localFfmpeg = path.resolve(process.cwd(), 'bin', 'ffmpeg');
  const localFfprobe = path.resolve(process.cwd(), 'bin', 'ffprobe');
  const ffmpeg = fs.existsSync(localFfmpeg) ? localFfmpeg : 'ffmpeg';
  const ffprobe = fs.existsSync(localFfprobe) ? localFfprobe : 'ffprobe';
  return { ffmpeg, ffprobe };
}

export class CompositorNoirAgent {
  /**
   * Mengompilasi dan me-render video explainer 9:16 Neo-Noir menggunakan HyperFrames
   */
  async composeAndRenderVideo(
    job: OrchestratorJob,
    words: TranscribedWord[],
    onProgress?: (progressText: string) => void
  ): Promise<string> {
    const projectDir = path.join(ORCHESTRATOR_CONFIG.paths.workspaceDir, job.id);
    const finalDir = path.join(ORCHESTRATOR_CONFIG.paths.rendersDir, job.id);
    fs.mkdirSync(finalDir, { recursive: true });

    const tempVideoPath = path.join(finalDir, 'temp-visual.mp4');
    const finalVideoPath = path.join(finalDir, 'noir-explainer-final.mp4');

    const beats = job.script?.beats || [];
    const allKeyframes = job.allKeyframes || [];

    // 1. Susun StoryboardScene untuk HyperFrames template generator
    const scenes: StoryboardScene[] = beats.map((beat, idx) => {
      const keyframe = allKeyframes.find((k) => k.shot === beat.shot) || allKeyframes[idx];
      return {
        id: `scene_${String(beat.shot).padStart(2, '0')}`,
        beat: beat.shotType,
        start_ms: Math.round(beat.startSec * 1000),
        end_ms: Math.round(beat.endSec * 1000),
        kicker: beat.shot === 0 ? '/// INVESTIGATION DOSSIER ///' : 'KASUS PERKARA',
        headline: beat.narration.slice(0, 40),
        subtext: beat.narration,
        assetType: 'image',
        assetPath: keyframe?.imagePath,
        visualIntent: beat.visualCue,
      };
    });

    const totalDurationMs = Math.round((job.audioDurationSec || 59) * 1000);

    console.log(`[CompositorNoir] Membangun project HyperFrames di ${projectDir}...`);
    generateHyperframesProject({
      jobId: job.id,
      title: job.script?.title || 'True Crime Neo-Noir Explainer',
      themePresetId: 'mystery-true-crime',
      totalDurationMs,
      audioPath: job.audioPath,
      scenes,
      words,
      outputDir: projectDir,
    });

    // 2. Render visual timeline dengan HyperFrames (1080x1920 @ 30fps)
    console.log(`[CompositorNoir] Rendering frame demi frame via Headless Chromium...`);
    onProgress?.('Rendering visual timeline dengan HyperFrames...');

    await renderHyperframes({
      projectDir,
      outputPath: tempVideoPath,
      fps: 30,
      onProgress: (p) => {
        onProgress?.(`Rendering: ${p}`);
      },
    });

    // 3. Multiplexing audio master track dengan FFmpeg
    console.log(`[CompositorNoir] Multiplexing audio master dengan FFmpeg...`);
    onProgress?.('Menggabungkan audio master track dan normalisasi...');

    const { ffmpeg, ffprobe } = resolveFfmpegBin();

    if (job.audioPath && fs.existsSync(job.audioPath)) {
      await execFileAsync(ffmpeg, [
        '-y',
        '-i',
        tempVideoPath,
        '-i',
        job.audioPath,
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
    } else {
      // Jika tidak ada audio khusus, rename tempVideoPath ke finalVideoPath
      fs.renameSync(tempVideoPath, finalVideoPath);
    }

    console.log(`[CompositorNoir] Video final selesai di-render: ${finalVideoPath}`);
    return finalVideoPath;
  }
}

export const compositorNoir = new CompositorNoirAgent();
