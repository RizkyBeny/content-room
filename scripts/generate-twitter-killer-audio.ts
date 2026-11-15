import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error('GEMINI_API_KEY missing');

const sentences = [
  {
    id: 's1',
    text: 'Pemerintah Jepang resmi mengeksekusi mati Takahiro Shiraishi, pembunuh berantai berdarah dingin yang dikenal dunia sebagai Twitter Killer.',
    shots: [1, 2],
  },
  {
    id: 's2',
    text: 'Tahun 2017, Shiraishi mengintai media sosial, menargetkan para pengguna yang mengunggah pesan keputusasaan dan berniat mengakhiri hidup.',
    shots: [3, 4, 5],
  },
  {
    id: 's3',
    text: 'Dengan dalih ingin menemani mati bersama, sembilan korban usia 15 hingga 26 tahun dipancing ke apartemen sempitnya di Kota Zama.',
    shots: [6, 7],
  },
  {
    id: 's4',
    text: 'Di sanalah aksi keji terjadi. Korban dicekik, dirampok, dan dimutilasi demi memuaskan hasrat seksual serta keuntungan finansial semata.',
    shots: [8, 9, 10],
  },
  {
    id: 's5',
    text: 'Polisi akhirnya membongkar apartemen horor ini. Tahun 2020, pengadilan Tokyo menjatuhkan vonis hukuman mati tanpa celah pengampunan.',
    shots: [11, 12],
  },
  {
    id: 's6',
    text: 'Tiang gantungan kini menutup jejak salah satu kasus kriminal paling kelam dan mengguncang dalam sejarah modern Jepang.',
    shots: [13, 14],
  },
];

const outDir = path.resolve(process.cwd(), 'public', 'renders', 'twitter-killer-test');
const chunksDir = path.join(outDir, 'audio-chunks');
fs.mkdirSync(chunksDir, { recursive: true });

async function synthesizeChunk(text: string, idx: number): Promise<{ wavPath: string; durationSec: number }> {
  console.log(`Synthesizing sentence ${idx + 1}/${sentences.length}...`);
  const models = ['gemini-3.8-flash-tts', 'gemini-3.1-flash-tts-preview', 'gemini-3.8-flash-lite-tts'];
  let audioData: string | undefined;

  for (const m of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key || '' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
          },
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
      if (part?.inlineData?.data) {
        audioData = part.inlineData.data;
        break;
      }
    } catch {
      // try next
    }
  }

  if (!audioData) {
    throw new Error(`Failed to synthesize sentence ${idx + 1}`);
  }

  const pcmPath = path.join(chunksDir, `sentence-${idx}.pcm`);
  const wavPath = path.join(chunksDir, `sentence-${idx}.wav`);
  fs.writeFileSync(pcmPath, Buffer.from(audioData, 'base64'));

  execFileSync('./bin/ffmpeg', [
    '-y', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcmPath,
    '-af', 'highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '2', wavPath,
  ]);
  fs.unlinkSync(pcmPath);

  const durStr = execFileSync('./bin/ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wavPath,
  ], { encoding: 'utf8' }).trim();

  return { wavPath, durationSec: Number(durStr) };
}

async function main() {
  const sentenceResults: Array<{ id: string; text: string; wavPath: string; durationSec: number }> = [];

  for (let i = 0; i < sentences.length; i++) {
    const res = await synthesizeChunk(sentences[i].text, i);
    sentenceResults.push({
      id: sentences[i].id,
      text: sentences[i].text,
      wavPath: res.wavPath,
      durationSec: res.durationSec,
    });
    console.log(`Sentence ${i + 1} done: ${res.durationSec.toFixed(2)}s`);
  }

  // Create concat list with 300ms silence between sentences
  const silenceWav = path.join(chunksDir, 'silence.wav');
  execFileSync('./bin/ffmpeg', [
    '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '0.3', silenceWav,
  ]);

  const concatListFile = path.join(chunksDir, 'concat_list.txt');
  const lines: string[] = [];
  sentenceResults.forEach((s, idx) => {
    lines.push(`file '${s.wavPath}'`);
    if (idx < sentenceResults.length - 1) {
      lines.push(`file '${silenceWav}'`);
    }
  });
  fs.writeFileSync(concatListFile, lines.join('\n'));

  const masterAudioPath = path.join(outDir, 'twitter-killer-master.mp3');
  execFileSync('./bin/ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', concatListFile,
    '-c:a', 'libmp3lame', '-b:a', '192k', masterAudioPath,
  ]);

  const totalDuration = Number(execFileSync('./bin/ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', masterAudioPath,
  ], { encoding: 'utf8' }).trim());

  console.log(`\n✅ Master Voice Over Created: ${masterAudioPath}`);
  console.log(`Total Master Duration: ${totalDuration.toFixed(2)}s\n`);

  // Build 14 shot timing & word-level caption metadata
  let currentOffset = 0;
  const sentenceTimings = sentenceResults.map((s) => {
    const start = currentOffset;
    const end = start + s.durationSec;
    currentOffset = end + 0.3; // silence gap
    return { ...s, start, end };
  });

  // Calculate 14 shot intervals mapped smoothly across the totalDuration
  const shotDurations = totalDuration / 14;
  const shotTimings = Array.from({ length: 14 }, (_, i) => {
    const start = i * shotDurations;
    const end = (i + 1) * shotDurations;
    return {
      shot: i + 1,
      startSec: Number(start.toFixed(2)),
      endSec: Number(end.toFixed(2)),
      durationSec: Number(shotDurations.toFixed(2)),
      imagePath: `/renders/twitter-killer-test/shot-${String(i + 1).padStart(2, '0')}.jpg`,
    };
  });

  // Build words list with timing
  const allWords: Array<{ word: string; start: number; end: number }> = [];
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

  const metadata = {
    title: "Jejak Sadis 'Twitter Killer' Jepang Dieksekusi Mati",
    voice: 'Charon',
    masterAudio: masterAudioPath,
    masterAudioUrl: '/renders/twitter-killer-test/twitter-killer-master.mp3',
    totalDurationSec: totalDuration,
    shotTimings,
    sentenceTimings: sentenceTimings.map(({ wavPath, ...rest }) => rest),
    words: allWords,
  };

  fs.writeFileSync(path.join(outDir, 'storyboard-data.json'), JSON.stringify(metadata, null, 2));
  console.log(`Saved storyboard & caption alignment metadata to ${path.join(outDir, 'storyboard-data.json')}`);
}

main().catch(console.error);
