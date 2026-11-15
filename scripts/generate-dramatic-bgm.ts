import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Parameters
const SAMPLE_RATE = 48000;
const DURATION_SEC = 60.0;
const TOTAL_SAMPLES = Math.floor(SAMPLE_RATE * DURATION_SEC);
const BPM = 80;
const BEAT_SEC = 60 / BPM; // 0.75s per beat
const SAMPLES_PER_BEAT = Math.floor(SAMPLE_RATE * BEAT_SEC);

console.log(`Synthesizing Cinematic Crime Thriller BGM (${DURATION_SEC}s, 48kHz stereo, ${BPM} BPM)...`);

// Stereo buffers
const left = new Float32Array(TOTAL_SAMPLES);
const right = new Float32Array(TOTAL_SAMPLES);

// Note frequencies (Hz)
const NOTES = {
  D1: 36.71,
  Bb1: 58.27,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  G2: 98.00,
  A2: 110.00,
  Bb2: 116.54,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.00,
  A3: 220.00,
  Bb3: 233.08,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  Bb4: 466.16,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.00,
  Bb5: 932.33,
  C6: 1046.50,
  D6: 1174.66,
};

// Helper: Add sine wave with harmonics (Piano/Bell like)
function addBellNote(
  freq: number,
  startSec: number,
  durationSec: number,
  gain: number,
  pan: number = 0 // -1 to 1
) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + Math.floor(durationSec * SAMPLE_RATE));
  const panL = 0.5 * (1 - pan);
  const panR = 0.5 * (1 + pan);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    // Fast attack (3ms), exponential decay
    const attack = Math.min(1.0, t / 0.005);
    const decay = Math.exp(-t * (3.0 / durationSec));
    const env = attack * decay * gain;

    // Fundamental + harmonics (1st, 2nd, 3rd, 4th, 6th)
    const wave =
      Math.sin(2 * Math.PI * freq * t) * 0.6 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.25 +
      Math.sin(2 * Math.PI * freq * 3 * t) * 0.12 +
      Math.sin(2 * Math.PI * freq * 4.2 * t) * 0.06; // slight inharmonic metallic chime

    left[i] += wave * env * panL;
    right[i] += wave * env * panR;
  }
}

// Helper: Add pulsing cello/bass note with rich harmonics (sawtooth filtered)
function addBassPulse(
  freq: number,
  startSec: number,
  durationSec: number,
  gain: number
) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + Math.floor(durationSec * SAMPLE_RATE));

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const attack = Math.min(1.0, t / 0.04);
    const decay = Math.exp(-t * 2.2);
    const env = attack * decay * gain;

    // Sawtooth approximation with first 6 harmonics
    let wave = 0;
    for (let h = 1; h <= 6; h++) {
      const harmGain = (1 / h) * Math.exp(-h * 0.35); // warm low-pass roll-off
      wave += Math.sin(2 * Math.PI * freq * h * t) * harmGain;
    }

    left[i] += wave * env * 0.5;
    right[i] += wave * env * 0.5;
  }
}

// Helper: Add ticking clock transient
function addClockTick(startSec: number, gain: number) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const durSec = 0.025; // 25ms tick
  const endSample = Math.min(TOTAL_SAMPLES, startSample + Math.floor(durSec * SAMPLE_RATE));

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const env = Math.exp(-t * 180.0) * gain;
    // Resonant high click around 2200 Hz + noise
    const click = Math.sin(2 * Math.PI * 2200 * t) * 0.7 + (Math.random() * 2 - 1) * 0.3;
    left[i] += click * env * 0.45;
    right[i] += click * env * 0.55;
  }
}

// Helper: Dark String Pad (Sustained Minor Chords with slow chorused LFO)
function addStringPad(freqs: number[], startSec: number, durationSec: number, gain: number) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + Math.floor(durationSec * SAMPLE_RATE));
  const fadeInSec = 2.0;
  const fadeOutSec = 2.5;

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const totalDur = endSample - startSample;
    const relT = (i - startSample) / totalDur;

    // Envelope
    let env = 1.0;
    if (t < fadeInSec) env = t / fadeInSec;
    if (t > durationSec - fadeOutSec) env = (durationSec - t) / fadeOutSec;
    env = Math.max(0, env) * gain;

    let waveL = 0;
    let waveR = 0;

    for (let fIdx = 0; fIdx < freqs.length; fIdx++) {
      const f = freqs[fIdx];
      // Slow LFO for chorus shimmer (0.25 Hz)
      const lfoL = 1 + 0.003 * Math.sin(2 * Math.PI * 0.25 * t + fIdx);
      const lfoR = 1 + 0.003 * Math.cos(2 * Math.PI * 0.3 * t + fIdx);

      // Warm sound with 3 harmonics
      const noteL = Math.sin(2 * Math.PI * (f * lfoL) * t) * 0.7 + Math.sin(2 * Math.PI * (f * lfoL * 2) * t) * 0.25;
      const noteR = Math.sin(2 * Math.PI * (f * lfoR) * t) * 0.7 + Math.sin(2 * Math.PI * (f * lfoR * 2) * t) * 0.25;

      waveL += noteL;
      waveR += noteR;
    }

    left[i] += waveL * env * 0.25;
    right[i] += waveR * env * 0.25;
  }
}

// --- 1. COMPOSE THE STRING PADS (Harmonic Bed) ---
// D minor (D3, A3, F4) -> Bb major (Bb2, F3, D4) -> G minor (G2, D3, Bb3) -> A minor/sus (A2, E3, A3)
addStringPad([NOTES.D3, NOTES.A3, NOTES.F4], 0.0, 16.0, 0.45);
addStringPad([NOTES.Bb2, NOTES.F3, NOTES.D4], 15.0, 16.0, 0.50);
addStringPad([NOTES.G2, NOTES.D3, NOTES.Bb3], 30.0, 16.0, 0.52);
addStringPad([NOTES.A2, NOTES.E3, NOTES.A3, NOTES.D4], 45.0, 14.5, 0.55);

// --- 2. COMPOSE TENSE BASS OSTINATO (Pulsing every 8th note) ---
// Pattern in 4/4: 8 pulses per bar (every 0.375s)
const eighthSec = BEAT_SEC / 2; // 0.375s
const totalEighths = Math.floor(58.0 / eighthSec);

for (let e = 0; e < totalEighths; e++) {
  const t = e * eighthSec;
  // Bass pitch progression:
  let root = NOTES.D2;
  if (t >= 15.0 && t < 30.0) root = NOTES.Bb1 * 2; // Bb2
  else if (t >= 30.0 && t < 45.0) root = NOTES.G2;
  else if (t >= 45.0) root = NOTES.A2;

  // Alternate between root and 5th/octave
  const note = (e % 4 === 0) ? root : (e % 2 === 0 ? root * 1.5 : root);
  const accent = (e % 4 === 0) ? 0.48 : 0.35;
  addBassPulse(note, t, eighthSec * 1.2, accent);
}

// --- 3. COMPOSE CLOCK TICKING / INVESTIGATION TIMELINE ---
// Constant heartbeat & ticking clock starting at t=1.0s
for (let b = 0; b < Math.floor(58.0 / BEAT_SEC); b++) {
  const t = b * BEAT_SEC;
  // Tick on every beat
  addClockTick(t, 0.35);
  // Double tick (16th swing) on alternating beats
  if (b % 2 === 1) {
    addClockTick(t + BEAT_SEC * 0.5, 0.22);
  }
}

// --- 4. COMPOSE HAUNTING PIANO MOTIF (Mindhunter / True Crime) ---
// High eerie notes with delay
const pianoMotif: [number, number, number, number][] = [
  // [frequency, timeSec, durationSec, gain]
  [NOTES.D5, 1.5, 3.5, 0.55],
  [NOTES.A5, 3.0, 3.0, 0.50],
  [NOTES.F5, 4.5, 4.0, 0.52],
  [NOTES.E5, 7.5, 5.0, 0.50],

  [NOTES.D5, 10.5, 3.5, 0.55],
  [NOTES.Bb5, 12.0, 3.0, 0.55],
  [NOTES.A5, 13.5, 4.5, 0.52],

  // Second movement (Climax / Reveal)
  [NOTES.D5, 18.0, 3.0, 0.60],
  [NOTES.F5, 19.5, 3.0, 0.58],
  [NOTES.A5, 21.0, 4.0, 0.62],
  [NOTES.G5, 24.0, 4.0, 0.55],
  [NOTES.E5, 27.0, 5.0, 0.55],

  // Third movement (Investigation tightening)
  [NOTES.D6, 31.5, 3.5, 0.58],
  [NOTES.Bb5, 33.0, 3.0, 0.55],
  [NOTES.A5, 35.0, 4.0, 0.60],
  [NOTES.F5, 38.0, 3.5, 0.55],
  [NOTES.E5, 41.0, 5.0, 0.58],

  // Final movement (Tiang Gantungan / Verdict)
  [NOTES.D5, 46.5, 4.0, 0.65],
  [NOTES.A4, 48.0, 4.0, 0.55],
  [NOTES.F5, 50.0, 4.5, 0.65],
  [NOTES.E5, 52.5, 4.5, 0.60],
  [NOTES.D5, 55.0, 4.5, 0.65],
];

// Add piano notes + stereo delay
const DELAY_SEC = 0.375; // 1 dotted 8th note delay
const FEEDBACK = 0.42;

pianoMotif.forEach(([freq, t, dur, gain], idx) => {
  const pan = (idx % 2 === 0) ? -0.3 : 0.3;
  addBellNote(freq, t, dur, gain, pan);
  // Delay tap 1
  addBellNote(freq, t + DELAY_SEC, dur * 0.8, gain * FEEDBACK, -pan);
  // Delay tap 2
  addBellNote(freq, t + DELAY_SEC * 2, dur * 0.6, gain * FEEDBACK * FEEDBACK, pan);
});

// --- 5. WRITE TO 16-BIT STEREO WAV ---
console.log('Writing raw audio to WAV...');
const wavBuffer = Buffer.alloc(44 + TOTAL_SAMPLES * 4); // 2 channels * 2 bytes = 4 bytes per sample frame

// RIFF header
wavBuffer.write('RIFF', 0);
wavBuffer.writeUInt32LE(36 + TOTAL_SAMPLES * 4, 4);
wavBuffer.write('WAVE', 8);
wavBuffer.write('fmt ', 12);
wavBuffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
wavBuffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
wavBuffer.writeUInt16LE(2, 22);  // NumChannels (2)
wavBuffer.writeUInt32LE(SAMPLE_RATE, 24); // SampleRate
wavBuffer.writeUInt32LE(SAMPLE_RATE * 4, 28); // ByteRate
wavBuffer.writeUInt16LE(4, 32);  // BlockAlign
wavBuffer.writeUInt16LE(16, 34); // BitsPerSample
wavBuffer.write('data', 36);
wavBuffer.writeUInt32LE(TOTAL_SAMPLES * 4, 40);

// Normalize peak to -1.0 dB
let maxPeak = 0.0001;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const absL = Math.abs(left[i]);
  const absR = Math.abs(right[i]);
  if (absL > maxPeak) maxPeak = absL;
  if (absR > maxPeak) maxPeak = absR;
}
const normScale = (0.89 / maxPeak); // -1.0 dB peak

console.log(`Peak detected: ${(20 * Math.log10(maxPeak)).toFixed(2)} dB, normalising with scale factor: ${normScale.toFixed(3)}`);

let offset = 44;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  // Fade out gently at the very end
  let masterEnv = 1.0;
  const t = i / SAMPLE_RATE;
  if (t > 57.0) masterEnv = Math.max(0, (60.0 - t) / 3.0);

  const sampleL = Math.max(-1.0, Math.min(1.0, left[i] * normScale * masterEnv));
  const sampleR = Math.max(-1.0, Math.min(1.0, right[i] * normScale * masterEnv));

  const intL = Math.floor(sampleL < 0 ? sampleL * 32768 : sampleL * 32767);
  const intR = Math.floor(sampleR < 0 ? sampleR * 32768 : sampleR * 32767);

  wavBuffer.writeInt16LE(intL, offset);
  wavBuffer.writeInt16LE(intR, offset + 2);
  offset += 4;
}

const rawWavPath = path.resolve(process.cwd(), 'public', 'renders', 'twitter-killer-test', 'bgm-crime-tension-raw.wav');
const finalMp3Path = path.resolve(process.cwd(), 'public', 'renders', 'twitter-killer-test', 'bgm-crime-tension.mp3');
const hfBgmPath = path.resolve(process.cwd(), 'hyperframes-workspace', 'twitter-killer-investigation', 'assets', 'bgm-crime-tension.mp3');

fs.writeFileSync(rawWavPath, wavBuffer);
console.log(`Raw WAV generated: ${rawWavPath} (${(wavBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);

// Convert to high quality 320kbps MP3 with studio compression and mastering
console.log('Mastering MP3 with FFmpeg stereo widening and broadcast limiter...');
execFileSync('./bin/ffmpeg', [
  '-y',
  '-i', rawWavPath,
  '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9',
  '-c:a', 'libmp3lame',
  '-b:a', '320k',
  finalMp3Path,
]);

fs.copyFileSync(finalMp3Path, hfBgmPath);
console.log(`✅ Mastered MP3 saved to: ${finalMp3Path}`);
console.log(`✅ Copied to HyperFrames assets: ${hfBgmPath}`);
