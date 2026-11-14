import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import ffprobe from '@ffprobe-installer/ffprobe';

export interface RenderOptions {
  projectDir: string;
  outputPath: string;
  fps?: number;
  format?: 'mp4' | 'webm';
  onProgress?: (progressText: string) => void;
}

export async function renderHyperframes(options: RenderOptions): Promise<{ outputPath: string; durationSec: number }> {
  const { projectDir, outputPath, fps = 30 } = options;

  const resolvedProjectDir = path.resolve(projectDir);
  const resolvedOutputPath = path.resolve(outputPath);

  if (!fs.existsSync(resolvedProjectDir)) {
    throw new Error(`Project directory HyperFrames tidak ditemukan: ${resolvedProjectDir}`);
  }

  fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });

  const ffmpegPath = ffmpeg.path;
  const ffprobePath = ffprobe.path;

  return new Promise((resolve, reject) => {
    // Pass resolvedProjectDir as DIR argument to hyperframes render
    const args = [
      'exec',
      'hyperframes',
      'render',
      resolvedProjectDir,
      '-o',
      resolvedOutputPath,
      '-f',
      String(fps),
    ];

    const proc = spawn('pnpm', args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        HYPERFRAMES_FFMPEG_PATH: ffmpegPath,
        HYPERFRAMES_FFPROBE_PATH: ffprobePath,
      },
    });

    let stderrBuffer = '';
    let stdoutBuffer = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdoutBuffer += text;
      if (options.onProgress) {
        options.onProgress(text);
      }
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderrBuffer += text;
      if (options.onProgress) {
        options.onProgress(text);
      }
    });

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(resolvedOutputPath)) {
        resolve({ outputPath: resolvedOutputPath, durationSec: 0 });
      } else {
        reject(
          new Error(
            `HyperFrames render gagal dengan exit code ${code}.\nStdout:\n${stdoutBuffer}\nStderr:\n${stderrBuffer}`
          )
        );
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Gagal menjalankan hyperframes render: ${err.message}`));
    });
  });
}
