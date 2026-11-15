import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import dotenv from 'dotenv';
import { flowClient } from './client';
import { TranscribedWord } from './types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const execFileAsync = promisify(execFile);

export interface ProcessedAudio {
  audioPath: string;
  durationMs: number;
  words: TranscribedWord[];
  text: string;
}

function resolveFfmpegBin(): { ffmpeg: string; ffprobe: string } {
  const localFfmpeg = path.resolve(process.cwd(), 'bin', 'ffmpeg');
  const localFfprobe = path.resolve(process.cwd(), 'bin', 'ffprobe');
  const ffmpeg = fs.existsSync(localFfmpeg) ? localFfmpeg : (process.env.FLOW_MCP_FFMPEG || 'ffmpeg');
  const ffprobe = fs.existsSync(localFfprobe) ? localFfprobe : (process.env.FLOW_MCP_FFPROBE || 'ffprobe');
  return { ffmpeg, ffprobe };
}

export function estimateWordTimings(text: string, durationMs: number): TranscribedWord[] {
  const rawWords = text.trim().split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return [];

  const weights = rawWords.map((w) => {
    let weight = Math.max(2, w.length);
    if (/[,;]/.test(w)) weight += 2;
    if (/[.!?]/.test(w)) weight += 4;
    return weight;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let currentMs = 120;
  const availableMs = Math.max(100, durationMs - 250);

  return rawWords.map((word, idx) => {
    const wordDuration = Math.round((weights[idx] / totalWeight) * availableMs);
    const start_ms = currentMs;
    const end_ms = Math.min(durationMs, currentMs + wordDuration);
    currentMs = end_ms;
    return {
      word: word.replace(/[^\w\s-]/gi, ''),
      start_ms,
      end_ms,
    };
  });
}

/**
 * Direct Gemini TTS synthesis via Google AI Studio API
 */
async function synthesizeWithGeminiDirect(
  text: string,
  voice: string,
  outputPath: string
): Promise<{ durationMs: number }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY tidak ditemukan di environment (.env.local)');
  }

  const candidateModels = [
    process.env.FLOW_MCP_GEMINI_TTS || 'gemini-3.8-flash-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-3.8-flash-lite-tts',
    'gemini-2.5-flash-preview-tts',
  ];

  let part: { inlineData?: { mimeType?: string; data?: string } } | undefined;
  let lastErr = '';

  for (const model of candidateModels) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-goog-api-key': key,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice },
                },
              },
            },
          }),
        }
      );

      if (!res.ok) {
        lastErr = await res.text().catch(() => '');
        continue;
      }

      const data = (await res.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              inlineData?: {
                mimeType?: string;
                data?: string;
              };
            }>;
          };
        }>;
      };

      part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (part?.inlineData?.data) {
        break;
      }
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }

  if (!part?.inlineData?.data) {
    throw new Error(`Gemini TTS API error across candidate models: ${lastErr}`);
  }

  const rateMatch = part.inlineData.mimeType?.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;

  const tempPcmPath = outputPath.replace(/\.[a-z0-9]+$/i, '') + '.temp.pcm';
  fs.writeFileSync(tempPcmPath, Buffer.from(part.inlineData.data, 'base64'));

  const { ffmpeg, ffprobe } = resolveFfmpegBin();

  try {
    await execFileAsync(ffmpeg, [
      '-y',
      '-f',
      's16le',
      '-ar',
      String(sampleRate),
      '-ac',
      '1',
      '-i',
      tempPcmPath,
      '-af',
      'highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11',
      '-ar',
      '48000',
      '-ac',
      '2',
      outputPath,
    ]);
  } finally {
    if (fs.existsSync(tempPcmPath)) {
      fs.unlinkSync(tempPcmPath);
    }
  }

  const probeResult = await execFileAsync(ffprobe, [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'csv=p=0',
    outputPath,
  ]);

  const durationSec = Number(probeResult.stdout.trim());
  const durationMs = Math.round(durationSec * 1000);

  return { durationMs };
}

export async function generateAudioAndAlignment(
  text: string,
  options: {
    voice?: string;
    backend?: 'gemini' | 'kokoro';
    outputDir?: string;
  } = {}
): Promise<ProcessedAudio> {
  const chosenVoice = options.voice ?? 'Puck';
  const outDir = options.outputDir ?? path.resolve(process.cwd(), 'public', 'renders', 'audio');
  fs.mkdirSync(outDir, { recursive: true });

  // Check if Flow MCP server is online
  const health = await flowClient.checkHealth().catch(() => ({ ok: false }));

  if (health.ok) {
    try {
      const narration = await flowClient.narrate({
        text,
        voice: chosenVoice,
        backend: options.backend ?? 'gemini',
      });

      if (narration && narration.path && fs.existsSync(narration.path)) {
        let words: TranscribedWord[] = [];
        try {
          const transcript = await flowClient.transcribe({
            audio_path: narration.path,
            language: 'id',
          });
          words = transcript.words || [];
        } catch {
          // If transcription fails (e.g. whisper-cli not found), use timing estimation
          words = estimateWordTimings(text, narration.duration_ms);
        }

        const targetFile = path.join(outDir, path.basename(narration.path));
        if (narration.path !== targetFile) {
          fs.copyFileSync(narration.path, targetFile);
        }

        return {
          audioPath: targetFile,
          durationMs: narration.duration_ms,
          words,
          text,
        };
      }
    } catch {
      // Flow MCP call failed, fall through to direct Gemini synthesis
    }
  }

  // Direct synthesis fallback
  const filename = `narration-${Date.now()}-${chosenVoice.toLowerCase()}.mp3`;
  const targetAudioPath = path.join(outDir, filename);

  const { durationMs } = await synthesizeWithGeminiDirect(text, chosenVoice, targetAudioPath);
  const words = estimateWordTimings(text, durationMs);

  return {
    audioPath: targetAudioPath,
    durationMs,
    words,
    text,
  };
}
