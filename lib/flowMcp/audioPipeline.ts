import fs from 'node:fs';
import path from 'node:path';
import { flowClient } from './client';
import { TranscribedWord } from './types';

export interface ProcessedAudio {
  audioPath: string;
  durationMs: number;
  words: TranscribedWord[];
  text: string;
}

export async function generateAudioAndAlignment(
  text: string,
  options: {
    voice?: string;
    backend?: 'gemini' | 'kokoro';
    outputDir?: string;
  } = {}
): Promise<ProcessedAudio> {
  // Step 1: Health check
  const health = await flowClient.checkHealth();
  if (!health.ok) {
    throw new Error(health.error);
  }

  // Step 2: Generate narration
  const narration = await flowClient.narrate({
    text,
    voice: options.voice ?? 'Puck',
    backend: options.backend ?? 'gemini',
  });

  if (!narration || !narration.path || !fs.existsSync(narration.path)) {
    throw new Error('Gagal men-generate file audio dari Flow MCP flow_narrate');
  }

  // Step 3: Transcribe for word-level alignment
  const transcript = await flowClient.transcribe({
    audio_path: narration.path,
    language: 'id',
  });

  // Step 4: Ensure audio is copied to designated project output if requested
  let targetAudioPath = narration.path;
  if (options.outputDir) {
    fs.mkdirSync(options.outputDir, { recursive: true });
    const targetFile = path.join(options.outputDir, path.basename(narration.path));
    fs.copyFileSync(narration.path, targetFile);
    targetAudioPath = targetFile;
  }

  return {
    audioPath: targetAudioPath,
    durationMs: narration.duration_ms || transcript.duration_ms || 0,
    words: transcript.words || [],
    text: transcript.text || text,
  };
}

