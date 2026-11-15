import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const baseDir = path.resolve(process.cwd(), 'public', 'renders', 'twitter-killer-test');
const masterAudio = path.join(baseDir, 'twitter-killer-master.mp3');
const backupAudio = path.join(baseDir, 'twitter-killer-master-clean-vo.mp3');
const sfxPath = path.join(baseDir, 'audio-chunks', 'forensic-glitch-sfx.wav');

if (!fs.existsSync(backupAudio)) {
  fs.copyFileSync(masterAudio, backupAudio);
  console.log(`Saved clean VO backup to: ${backupAudio}`);
}

console.log('1. Generating forensic glitch / whoosh SFX using FFmpeg...');
// Synthesize a high-impact cinematic whoosh + digital tape glitch burst (0.28s)
execFileSync('./bin/ffmpeg', [
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

console.log(`✅ SFX generated: ${sfxPath}`);

// Transition timestamps (14 transitions)
const transitionTimes = [
  1.30,   // Cover Hook -> Shot 01
  4.25,   // Shot 01 -> Shot 02
  8.51,   // Shot 02 -> Shot 03
  12.76,  // Shot 03 -> Shot 04
  17.01,  // Shot 04 -> Shot 05
  21.27,  // Shot 05 -> Shot 06
  25.52,  // Shot 06 -> Shot 07
  29.77,  // Shot 07 -> Shot 08
  34.03,  // Shot 08 -> Shot 09
  38.28,  // Shot 09 -> Shot 10
  42.53,  // Shot 10 -> Shot 11
  46.78,  // Shot 11 -> Shot 12
  51.04,  // Shot 12 -> Shot 13
  55.29,  // Shot 13 -> Shot 14
];

console.log('\n2. Mixing transition SFX into master audio at 14 shot boundaries...');

// Build complex filter for adelay + amix
let filterStr = '[0:a]volume=1.0[vo];';
const delayedInputs: string[] = [];

transitionTimes.forEach((t, i) => {
  const delayMs = Math.round(t * 1000);
  filterStr += `[1:a]adelay=${delayMs}|${delayMs},volume=0.65[sfx_${i}];`;
  delayedInputs.push(`[sfx_${i}]`);
});

filterStr += `[vo]${delayedInputs.join('')}amix=inputs=${transitionTimes.length + 1}:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11[out]`;

const tempMaster = path.join(baseDir, 'temp-master-mixed.mp3');

execFileSync('./bin/ffmpeg', [
  '-y',
  '-i', backupAudio,
  '-i', sfxPath,
  '-filter_complex', filterStr,
  '-map', '[out]',
  '-c:a', 'libmp3lame',
  '-b:a', '192k',
  tempMaster,
]);

fs.renameSync(tempMaster, masterAudio);

console.log(`\n🎉 New master audio with synchronized transition SFX successfully saved!`);
console.log(`Output: ${masterAudio}`);
