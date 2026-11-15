import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { renderHyperframes } from '../../hyperframes/renderEngine';
import { OrchestratorJob } from '../types';
import { ORCHESTRATOR_CONFIG } from '../config';
import { TranscribedWord } from '../../flowMcp/types';
import { generateNoirHyperframesHtml } from '../video/noirVideoTemplate';
import { groupWordsIntoPhrases, CaptionWord, ShotTiming } from '../audio/noirAudioPipeline';

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
   * Mengikuti standard benchmark: twitter-killer-test
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

    const totalDurationSec = job.audioDurationSec || 59.5;
    const allKeyframes = job.allKeyframes || [];

    // Find cover image (Shot 00)
    let coverImagePath = '';
    const shot0 = allKeyframes.find((k) => k.shot === 0);
    if (shot0?.imagePath && fs.existsSync(shot0.imagePath)) {
      coverImagePath = shot0.imagePath;
    } else {
      const fallbackShot0 = path.join(finalDir, 'keyframes', 'shot-00.jpg');
      if (fs.existsSync(fallbackShot0)) {
        coverImagePath = fallbackShot0;
      }
    }

    // Shots 1 to 14
    const shotImages: Array<{ shot: number; imagePath: string }> = [];
    for (let s = 1; s <= 14; s++) {
      const kf = allKeyframes.find((k) => k.shot === s);
      const shotNumStr = String(s).padStart(2, '0');
      let imgPath = kf?.imagePath || '';
      if (!imgPath || !fs.existsSync(imgPath)) {
        imgPath = path.join(finalDir, 'keyframes', `shot-${shotNumStr}.jpg`);
      }
      shotImages.push({ shot: s, imagePath: imgPath });
    }

    // Shot Timings (14 shots across totalDurationSec)
    const shotDuration = totalDurationSec / 14;
    const shotTimings: ShotTiming[] = Array.from({ length: 14 }, (_, i) => {
      const start = i * shotDuration;
      const end = (i + 1) * shotDuration;
      return {
        shot: i + 1,
        startSec: Number(start.toFixed(2)),
        endSec: Number(end.toFixed(2)),
        durationSec: Number(shotDuration.toFixed(2)),
      };
    });

    // Caption Words & Phrases
    const captionWords: CaptionWord[] = (words || []).map((w) => ({
      word: w.word,
      start: w.start_ms / 1000,
      end: w.end_ms / 1000,
    }));

    const phrases = groupWordsIntoPhrases(captionWords, 4);

    console.log(`[CompositorNoir] Menghasilkan template visual benchmark standard di ${projectDir}...`);
    generateNoirHyperframesHtml({
      jobId: job.id,
      title: job.script?.title || 'Graphic Noir True Crime Explainer',
      totalDurationSec,
      coverImagePath,
      shotImages,
      shotTimings,
      phrases,
      outputDir: projectDir,
    });

    // 2. Render visual timeline dengan HyperFrames (1080x1920 @ 30fps)
    console.log(`[CompositorNoir] Rendering frame demi frame via Headless Chromium (30fps)...`);
    onProgress?.('Rendering visual timeline dengan HyperFrames (30fps)...');

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

    const { ffmpeg } = resolveFfmpegBin();

    if (job.audioPath && fs.existsSync(job.audioPath)) {
      await execFileAsync(ffmpeg, [
        '-y',
        '-i', tempVideoPath,
        '-i', job.audioPath,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        finalVideoPath,
      ]);

      if (fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }
    } else {
      fs.renameSync(tempVideoPath, finalVideoPath);
    }

    console.log(`[CompositorNoir] Video final selesai di-render: ${finalVideoPath}`);
    return finalVideoPath;
  }
}

export const compositorNoir = new CompositorNoirAgent();
