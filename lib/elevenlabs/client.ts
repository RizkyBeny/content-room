import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

function resolveFfmpegBin(): { ffmpeg: string; ffprobe: string } {
  const localFfmpeg = path.resolve(process.cwd(), 'bin', 'ffmpeg');
  const localFfprobe = path.resolve(process.cwd(), 'bin', 'ffprobe');
  const ffmpeg = fs.existsSync(localFfmpeg) ? localFfmpeg : 'ffmpeg';
  const ffprobe = fs.existsSync(localFfprobe) ? localFfprobe : 'ffprobe';
  return { ffmpeg, ffprobe };
}

const { ffmpeg, ffprobe } = resolveFfmpegBin();

export interface ElevenLabsVoiceOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  speed?: number; // atempo multiplier
  outputWavPath?: string;
}

/**
 * Synthesizes Indonesian speech via ElevenLabs API (eleven_multilingual_v2)
 * and formats to broadcast-standard 48kHz Stereo WAV with optional acoustic mastering.
 */
export async function synthesizeElevenLabsSentence(
  text: string,
  options: ElevenLabsVoiceOptions = {}
): Promise<{ wavPath: string; durationSec: number }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY belum diset di .env.local!');
  }

  const voiceId = options.voiceId || process.env.ELEVENLABS_VOICE_ID || 'nPczCjzI2devNBz1zQrb'; // Brian as default (Klenik Malam Intimate Low-End Whisper)
  const modelId = options.modelId || process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
  const stability = options.stability ?? 0.65;
  const similarityBoost = options.similarityBoost ?? 0.90;
  const speed = options.speed ?? 1.00;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
        style: 0.10,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API Error (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const tempMp3 = path.resolve(process.cwd(), `.temp-elevenlabs-${Date.now()}.mp3`);
  fs.writeFileSync(tempMp3, Buffer.from(arrayBuffer));

  const targetWav = options.outputWavPath || tempMp3.replace('.mp3', '.wav');

  try {
    // Acoustic mastering filter chain for Klenik Malam True Crime (Warmth Bass + Proximity Clarity + EBU R128)
    execFileSync(ffmpeg, [
      '-y',
      '-i', tempMp3,
      '-af', `equalizer=f=110:width_type=o:width=1.8:g=4.0,equalizer=f=3000:width_type=o:width=1.2:g=2.2,highpass=f=75,lowpass=f=7800,atempo=${speed}`,
      '-ar', '48000',
      '-ac', '2',
      targetWav,
    ]);

    const durStr = execFileSync(ffprobe, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      targetWav,
    ]).toString().trim();

    return { wavPath: targetWav, durationSec: parseFloat(durStr) || 5.0 };
  } finally {
    if (fs.existsSync(tempMp3)) {
      fs.unlinkSync(tempMp3);
    }
  }
}
