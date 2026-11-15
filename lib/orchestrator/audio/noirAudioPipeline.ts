import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import { ORCHESTRATOR_CONFIG } from '../config';
import { TranscribedWord } from '../../flowMcp/types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

export interface CaptionWord {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface CaptionPhrase {
  id: string;
  words: CaptionWord[];
  start: number;
  end: number;
}

export interface ShotTiming {
  shot: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  imagePath?: string;
  imageUrl?: string;
}

export interface NoirAudioResult {
  masterAudioPath: string;
  cleanVoPath: string;
  bgmPath: string;
  totalDurationSec: number;
  shotTimings: ShotTiming[];
  phrases: CaptionPhrase[];
  words: TranscribedWord[];
}

function resolveFfmpegBin(): { ffmpeg: string; ffprobe: string } {
  const localFfmpeg = path.resolve(process.cwd(), 'bin', 'ffmpeg');
  const localFfprobe = path.resolve(process.cwd(), 'bin', 'ffprobe');
  const ffmpeg = fs.existsSync(localFfmpeg) ? localFfmpeg : 'ffmpeg';
  const ffprobe = fs.existsSync(localFfprobe) ? localFfprobe : 'ffprobe';
  return { ffmpeg, ffprobe };
}

/**
 * Splits Indonesian text into dramatic narrative sentences
 */
export function splitIntoSentences(text: string): string[] {
  const rawSentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (rawSentences.length <= 6) {
    return rawSentences;
  }

  // Combine very short sentences (< 25 chars) to prevent staccato narration
  const combined: string[] = [];
  let buffer = '';

  for (const s of rawSentences) {
    if (!buffer) {
      buffer = s;
    } else if (buffer.length + s.length < 90) {
      buffer = `${buffer} ${s}`;
    } else {
      combined.push(buffer);
      buffer = s;
    }
  }

  if (buffer) {
    combined.push(buffer);
  }

  return combined;
}

/**
 * Direct Gemini TTS synthesis per sentence using Charon persona
 */
async function synthesizeSentenceChunk(
  text: string,
  index: number,
  outputDir: string,
  voiceName: string = 'Charon'
): Promise<{ wavPath: string; durationSec: number }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY missing in environment (.env.local)');

  const candidateModels = [
    'gemini-3.8-flash-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-3.8-flash-lite-tts',
    'gemini-2.5-flash-preview-tts',
  ];

  let audioBase64: string | undefined;
  let lastErr = '';

  for (const model of candidateModels) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
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
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        }),
      });

      if (!res.ok) {
        lastErr = await res.text().catch(() => '');
        continue;
      }

      const data = (await res.json()) as any;
      const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
      if (part?.inlineData?.data) {
        audioBase64 = part.inlineData.data;
        break;
      }
    } catch (err: any) {
      lastErr = err.message || String(err);
    }
  }

  if (!audioBase64) {
    console.warn(`[NoirAudioEngine] Gemini TTS quota/error encountered. Falling back to edge-tts (id-ID-ArdiNeural)...`);
    const tempMp3 = path.join(outputDir, `sentence-${index}-temp.mp3`);
    const edgeTtsBin = fs.existsSync('/Users/beny/Library/Python/3.9/bin/edge-tts')
      ? '/Users/beny/Library/Python/3.9/bin/edge-tts'
      : 'edge-tts';

    execFileSync(edgeTtsBin, [
      '--voice', 'id-ID-ArdiNeural',
      '--rate=-4%',
      '--text', text,
      '--write-media', tempMp3,
    ]);

    const { ffmpeg } = resolveFfmpegBin();
    execFileSync(ffmpeg, [
      '-y',
      '-i', tempMp3,
      '-af', 'highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11',
      '-ar', '48000',
      '-ac', '2',
      wavPath,
    ]);

    if (fs.existsSync(tempMp3)) {
      fs.unlinkSync(tempMp3);
    }
  } else {
    const pcmPath = path.join(outputDir, `sentence-${index}.pcm`);
    fs.writeFileSync(pcmPath, Buffer.from(audioBase64, 'base64'));

    const { ffmpeg } = resolveFfmpegBin();

    execFileSync(ffmpeg, [
      '-y',
      '-f', 's16le',
      '-ar', '24000',
      '-ac', '1',
      '-i', pcmPath,
      '-af', 'highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11',
      '-ar', '48000',
      '-ac', '2',
      wavPath,
    ]);

    if (fs.existsSync(pcmPath)) {
      fs.unlinkSync(pcmPath);
    }
  }

  const durStr = execFileSync(ffprobe, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    wavPath,
  ], { encoding: 'utf8' }).trim();

  return { wavPath, durationSec: Number(durStr) };
}

/**
 * Group words into 3–5 word karaoke phrases
 */
export function groupWordsIntoPhrases(words: CaptionWord[], maxWordsPerPhrase: number = 4): CaptionPhrase[] {
  const phrases: CaptionPhrase[] = [];
  let currentWords: CaptionWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    currentWords.push(w);

    const hasPunctuation = /[.,!?;:]$/.test(w.word);
    const reachedMax = currentWords.length >= maxWordsPerPhrase;
    const isLast = i === words.length - 1;

    if (hasPunctuation || reachedMax || isLast) {
      const pStart = currentWords[0].start;
      const pEnd = currentWords[currentWords.length - 1].end;
      phrases.push({
        id: `phrase-${phrases.length}`,
        words: [...currentWords],
        start: Number(pStart.toFixed(2)),
        end: Number(pEnd.toFixed(2)),
      });
      currentWords = [];
    }
  }

  return phrases;
}

/**
 * Generates dramatic noir broadcast audio track with Charon VO + Ducked BGM (-14dB) + Glitch SFX
 */
export async function produceNoirMasterAudio(
  textOrSentences: string | string[] | Array<{ text: string; shots: number[] }>,
  outputDir: string,
  totalShots: number = 14
): Promise<NoirAudioResult> {
  const { ffmpeg, ffprobe } = resolveFfmpegBin();
  const chunksDir = path.join(outputDir, 'audio-chunks');
  fs.mkdirSync(chunksDir, { recursive: true });

  const isStructured =
    Array.isArray(textOrSentences) &&
    textOrSentences.length > 0 &&
    typeof textOrSentences[0] === 'object' &&
    'shots' in textOrSentences[0];

  const sentences: string[] = isStructured
    ? (textOrSentences as Array<{ text: string; shots: number[] }>).map((s) => s.text.trim()).filter(Boolean)
    : Array.isArray(textOrSentences)
    ? (textOrSentences as string[]).map((s) => s.trim()).filter(Boolean)
    : splitIntoSentences(textOrSentences);

  let useFallbackVoice = false;
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      useFallbackVoice = true;
    } else {
      const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'test' }] }],
          generationConfig: { responseModalities: ['AUDIO'] },
        }),
      });
      if (testRes.status === 429 || !testRes.ok) {
        useFallbackVoice = true;
      }
    }
  } catch {
    useFallbackVoice = true;
  }

  if (useFallbackVoice) {
    console.log(`[NoirAudioEngine] Gemini TTS quota exhausted (429). Using edge-tts (id-ID-ArdiNeural) for all ${sentences.length} sentences for consistent Indonesian storytelling.`);
  } else {
    console.log(`[NoirAudioEngine] Synthesizing ${sentences.length} sentence chunks using voice Charon...`);
  }

  const sentenceResults: Array<{ id: string; text: string; wavPath: string; durationSec: number }> = [];

  for (let i = 0; i < sentences.length; i++) {
    const sText = sentences[i];
    console.log(`[NoirAudioEngine] (${i + 1}/${sentences.length}) "${sText.slice(0, 45)}..."`);

    let res: { wavPath: string; durationSec: number };
    if (useFallbackVoice) {
      const tempMp3 = path.join(chunksDir, `sentence-${i}-temp.mp3`);
      const wavPath = path.join(chunksDir, `sentence-${i}.wav`);
      const edgeTtsBin = fs.existsSync('/Users/beny/Library/Python/3.9/bin/edge-tts')
        ? '/Users/beny/Library/Python/3.9/bin/edge-tts'
        : 'edge-tts';

      execFileSync(edgeTtsBin, [
        '--voice', 'id-ID-ArdiNeural',
        '--rate=-4%',
        '--text', sText,
        '--write-media', tempMp3,
      ]);

      execFileSync(ffmpeg, [
        '-y',
        '-i', tempMp3,
        '-af', 'highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11',
        '-ar', '48000',
        '-ac', '2',
        wavPath,
      ]);

      if (fs.existsSync(tempMp3)) {
        fs.unlinkSync(tempMp3);
      }

      const durStr = execFileSync(ffprobe, [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'csv=p=0',
        wavPath,
      ], { encoding: 'utf8' }).trim();

      res = { wavPath, durationSec: parseFloat(durStr) || 4.0 };
    } else {
      res = await synthesizeSentenceChunk(sText, i, chunksDir, ORCHESTRATOR_CONFIG.voice.preferredVoice);
    }

    sentenceResults.push({
      id: `s${i + 1}`,
      text: sText,
      wavPath: res.wavPath,
      durationSec: res.durationSec,
    });
  }

  // 1. Create 300ms dramatic silence gap
  const silenceWav = path.join(chunksDir, 'silence.wav');
  execFileSync(ffmpeg, [
    '-y',
    '-f', 'lavfi',
    '-i', 'anullsrc=r=48000:cl=stereo',
    '-t', '0.3',
    silenceWav,
  ]);

  // 2. Concatenate sentence WAVs with 300ms silence
  const concatListFile = path.join(chunksDir, 'concat_list.txt');
  const lines: string[] = [];
  sentenceResults.forEach((s, idx) => {
    lines.push(`file '${s.wavPath}'`);
    if (idx < sentenceResults.length - 1) {
      lines.push(`file '${silenceWav}'`);
    }
  });
  fs.writeFileSync(concatListFile, lines.join('\n'));

  const cleanVoPath = path.join(outputDir, 'clean-vo.mp3');
  execFileSync(ffmpeg, [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatListFile,
    '-c:a', 'libmp3lame',
    '-b:a', '192k',
    cleanVoPath,
  ]);

  const totalDuration = Number(
    execFileSync(ffprobe, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      cleanVoPath,
    ], { encoding: 'utf8' }).trim()
  );

  console.log(`[NoirAudioEngine] Clean VO created: ${cleanVoPath} (Duration: ${totalDuration.toFixed(2)}s)`);

  // Calculate sentence start and end offsets based on actual audio duration
  let currentOffset = 0;
  const sentenceTimings = sentenceResults.map((s) => {
    const start = currentOffset;
    const end = start + s.durationSec;
    currentOffset = end + 0.3; // silence gap
    return { ...s, start, end };
  });

  // 3. Generate Forensic Glitch / Whoosh SFX
  const sfxPath = path.join(chunksDir, 'forensic-glitch-sfx.wav');
  execFileSync(ffmpeg, [
    '-y',
    '-f', 'lavfi',
    '-i', 'anoisesrc=d=0.28:c=pink:r=48000:a=0.18',
    '-f', 'lavfi',
    '-i', 'sine=f=80:d=0.28',
    '-filter_complex',
    '[0:a]bandpass=f=1200:w=800,volume=1.2[noise];' +
    '[1:a]lowpass=f=220,volume=1.5[sub];' +
    '[noise][sub]amix=inputs=2:duration=first,' +
    'afade=t=in:ss=0:d=0.04,afade=t=out:st=0.20:d=0.08,' +
    'flanger=delay=3:depth=2:speed=8[sfx]',
    '-map', '[sfx]',
    '-ar', '48000',
    '-ac', '2',
    sfxPath,
  ]);

  // 4. Ensure BGM bed exists
  const benchmarkBgm = ORCHESTRATOR_CONFIG.voice.bgmPath;
  const localBgm = path.join(outputDir, 'bgm-crime-tension.mp3');
  if (fs.existsSync(benchmarkBgm)) {
    fs.copyFileSync(benchmarkBgm, localBgm);
  } else {
    // Generate fallback BGM if not found
    execFileSync('npx', ['tsx', 'scripts/generate-dramatic-bgm.ts']);
    if (fs.existsSync(benchmarkBgm)) {
      fs.copyFileSync(benchmarkBgm, localBgm);
    }
  }

  // 5. Calculate shot intervals and cut transition timestamps (Sentence-to-Shot Semantic Binding)
  let shotTimings: ShotTiming[] = [];
  const transitionTimes: number[] = [1.3]; // Cut from Hook Shot 00 to Shot 01

  if (isStructured) {
    const structuredSentences = textOrSentences as Array<{ text: string; shots: number[] }>;
    structuredSentences.forEach((s, idx) => {
      const st = sentenceTimings[idx];
      const assignedShots = s.shots && s.shots.length > 0 ? s.shots : [idx + 1];
      const perShotDur = st.durationSec / assignedShots.length;

      assignedShots.forEach((shotNum, j) => {
        const start = Number((st.start + j * perShotDur).toFixed(2));
        const end = Number((st.start + (j + 1) * perShotDur).toFixed(2));
        const durationSec = Number((end - start).toFixed(2));

        if (start > 0.1 && !transitionTimes.includes(start)) {
          transitionTimes.push(start);
        }

        shotTimings.push({
          shot: shotNum,
          startSec: start,
          endSec: end,
          durationSec,
        });
      });
    });

    transitionTimes.sort((a, b) => a - b);
  } else {
    const shotCount = Math.max(12, Math.min(15, totalShots));
    const shotDuration = totalDuration / shotCount;
    for (let i = 1; i < shotCount; i++) {
      transitionTimes.push(Number((i * shotDuration).toFixed(2)));
    }
    shotTimings = Array.from({ length: shotCount }, (_, i) => {
      const start = i * shotDuration;
      const end = (i + 1) * shotDuration;
      return {
        shot: i + 1,
        startSec: Number(start.toFixed(2)),
        endSec: Number(end.toFixed(2)),
        durationSec: Number(shotDuration.toFixed(2)),
      };
    });
  }

  // 6. Multiplex clean VO + BGM (ducked at 20%) + Transition SFX
  console.log(`[NoirAudioEngine] Mixing VO + BGM (20% ducked) + ${transitionTimes.length} Transition SFX...`);

  const bgmFadeOutStart = Math.max(0, totalDuration - 2.5);
  let filterStr = `[0:a]volume=1.0[vo];[2:a]volume=0.20,afade=t=in:ss=0:d=1.5,afade=t=out:st=${bgmFadeOutStart.toFixed(1)}:d=2.5[bgm_bed];`;
  const delayedInputs: string[] = [];

  transitionTimes.forEach((t, i) => {
    const delayMs = Math.round(t * 1000);
    filterStr += `[1:a]adelay=${delayMs}|${delayMs},volume=0.65[sfx_${i}];`;
    delayedInputs.push(`[sfx_${i}]`);
  });

  filterStr += `[vo][bgm_bed]${delayedInputs.join('')}amix=inputs=${transitionTimes.length + 2}:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11[out]`;

  const masterAudioPath = path.join(outputDir, 'master-audio.mp3');
  execFileSync(ffmpeg, [
    '-y',
    '-i', cleanVoPath,
    '-i', sfxPath,
    '-i', localBgm,
    '-filter_complex', filterStr,
    '-map', '[out]',
    '-c:a', 'libmp3lame',
    '-b:a', '192k',
    masterAudioPath,
  ]);

  console.log(`[NoirAudioEngine] ✅ Mastered audio saved: ${masterAudioPath}`);

  // 7. Calculate word timings for karaoke captions
  const allWords: CaptionWord[] = [];
  sentenceTimings.forEach((st) => {
    const rawWords = st.text.split(/\s+/).filter(Boolean);
    const weights = rawWords.map((w) => Math.max(2, w.length) + (/[.,;]/.test(w) ? 3 : 0));
    const totalW = weights.reduce((a, b) => a + b, 0);
    const available = st.durationSec;
    let wordCursor = st.start;
    rawWords.forEach((w, widx) => {
      const wDur = (weights[widx] / totalW) * available;
      const wStart = wordCursor;
      const wEnd = wordCursor + wDur;
      wordCursor = wEnd;
      allWords.push({
        word: w,
        start: Number(wStart.toFixed(2)),
        end: Number(wEnd.toFixed(2)),
      });
    });
  });

  const phrases = groupWordsIntoPhrases(allWords, 4);

  const transcribedWords: TranscribedWord[] = allWords.map((w) => ({
    word: w.word.replace(/[^\w\s-]/gi, ''),
    start_ms: Math.round(w.start * 1000),
    end_ms: Math.round(w.end * 1000),
  }));

  return {
    masterAudioPath,
    cleanVoPath,
    bgmPath: localBgm,
    totalDurationSec: totalDuration,
    shotTimings,
    phrases,
    words: transcribedWords,
  };
}
