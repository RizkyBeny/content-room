import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import { flowClient } from '../flowMcp/client';
import { HookCandidate, CaseDossierInput } from './types';
import { generateKeyframeImage } from './keyframeGenerator';

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

export interface SynthesizedHookMedia {
  audioPath: string;
  audioUrl: string;
  imagePath: string;
  imageUrl: string;
  videoSnippetPath: string;
  videoSnippetUrl: string;
  durationSec: number;
}

/**
 * Synthesizes 100% Flow MCP Media for a Hook Candidate:
 * 1. Audio Charon (Gemini TTS) with Klenik Low-End Warmth EQ
 * 2. Visual Keyframe 9:16 (Graphic Novel Neo-Noir Forensic)
 * 3. 5-8s Rapid MP4 Video Snippet with Giant Keyword Flash
 */
export async function synthesizeHookMedia(
  candidate: HookCandidate,
  dossier: CaseDossierInput
): Promise<SynthesizedHookMedia> {
  const caseId = dossier.caseId || 'custom-case';
  const outDir = path.resolve(process.cwd(), 'public', 'renders', 'hook-simulator', caseId, candidate.id);
  fs.mkdirSync(outDir, { recursive: true });

  const audioPath = path.join(outDir, 'hook-audio.wav');
  const imagePath = path.join(outDir, 'hook-visual.jpg');
  const videoSnippetPath = path.join(outDir, 'hook-preview.mp4');

  // 1. Synthesize Audio via Flow MCP (or Gemini TTS direct fallback)
  console.log(`🎙️ [Flow MCP] Mensintesis audio hook ${candidate.id} (${candidate.archetypeName})...`);
  let audioDurationSec = 6.0;

  // Voice Persona & Acoustic Equalizer selection
  let voiceName = 'Charon';
  let eqFilter = 'volume=-1.5dB,highpass=f=75,equalizer=f=110:width_type=o:width=1.8:g=4.0,equalizer=f=3000:width_type=o:width=1.2:g=2.2,lowpass=f=7800,loudnorm=I=-16:TP=-1.5:LRA=11';

  if (dossier.segment === 'commerce_ugc') {
    const explicitVoice = dossier.productData?.voicePersona;
    const textCorpus = `${dossier.title} ${dossier.victim} ${dossier.rawBrief || ''} ${dossier.productData?.targetPersona || ''} ${dossier.productData?.productName || ''}`.toLowerCase();

    const isExplicitFemale = explicitVoice === 'female_creator';
    const isExplicitMale = explicitVoice === 'male_creator';

    // Check if the product is female oriented (tas cewek, wanita, skincare, beauty, dress, hijab, dll)
    const isFemaleProduct =
      /(tas cewek|tas wanita|tas sling|tote|handbag|cewek|wanita|skincare|serum|retinol|beauty|flek|jerawat|glowing|dress|hijab|shoulder|clutch|makeup|lipstik|cushion|blouse|gamis)/i.test(
        textCorpus
      ) || dossier.productData?.category === 'beauty_skincare';

    const useFemaleVoice = isExplicitFemale || (!isExplicitMale && isFemaleProduct);

    if (useFemaleVoice) {
      voiceName = 'Aoede'; // Natural warm & friendly female creator voice
      eqFilter = 'volume=-1.5dB,highpass=f=80,equalizer=f=220:width_type=o:width=1.5:g=1.5,equalizer=f=4500:width_type=o:width=1.2:g=1.8,lowpass=f=8500,loudnorm=I=-16:TP=-1.5:LRA=11';
    } else {
      voiceName = 'Puck'; // Energetic & friendly male creator voice
      eqFilter = 'volume=-1.5dB,highpass=f=80,equalizer=f=180:width_type=o:width=1.5:g=1.5,equalizer=f=3200:width_type=o:width=1.2:g=1.2,lowpass=f=8200,loudnorm=I=-16:TP=-1.5:LRA=11';
    }
    console.log(`🎙️ [UGC Audio Engine] Menggunakan vokal Natural Creator: ${voiceName} (${useFemaleVoice ? 'Female Creator (Aoede)' : 'Male Creator (Puck)'})`);
  }

  // Try multi-tier TTS: Gemini TTS pool -> ElevenLabs fallback
  const key = process.env.GEMINI_API_KEY;
  let rawPcm: Buffer | undefined;

  if (key) {
    const ttsModels = [
      'gemini-3.1-flash-tts-preview',
      'gemini-2.5-flash-preview-tts',
      'gemini-3.8-flash-lite-tts',
      'gemini-3.8-flash-tts',
    ];

    for (const model of ttsModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: candidate.hookText }] }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                  },
                },
              },
            }),
          }
        );

        if (res.ok) {
          const data = (await res.json()) as any;
          const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (b64) {
            rawPcm = Buffer.from(b64, 'base64');
            console.log(`✅ [Gemini TTS] Sukses mensintesis vokal ${voiceName} dengan model: ${model}`);
            break;
          }
        }
      } catch (err: any) {
        // try next model
      }
    }
  }

  // If Gemini TTS succeeded, convert PCM to 48kHz Stereo WAV with tailored EQ
  if (rawPcm) {
    const tempPcm = path.join(outDir, `.temp-charon-${candidate.id}.pcm`);
    fs.writeFileSync(tempPcm, rawPcm);
    execFileSync(ffmpeg, [
      '-y',
      '-f',
      's16le',
      '-ar',
      '24000',
      '-ac',
      '1',
      '-i',
      tempPcm,
      '-af',
      eqFilter,
      '-ar',
      '48000',
      '-ac',
      '2',
      audioPath,
    ]);
    if (fs.existsSync(tempPcm)) fs.unlinkSync(tempPcm);
  } else {
    // Try ElevenLabs fallback if available
    try {
      const { synthesizeElevenLabsSentence } = await import('../elevenlabs/client');
      const elRes = await synthesizeElevenLabsSentence(candidate.hookText, {
        outputWavPath: audioPath,
      });
      if (elRes?.wavPath && fs.existsSync(elRes.wavPath)) {
        console.log(`✅ [ElevenLabs] Sukses mensintesis audio Charon Cloned`);
      }
    } catch (elErr: any) {
      console.warn(`⚠️ ElevenLabs fallback skipped: ${elErr.message}`);
    }
  }

  // Probe audio duration
  if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 10000) {
    const durStr = execFileSync(ffprobe, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      audioPath,
    ])
      .toString()
      .trim();
    audioDurationSec = parseFloat(durStr) || 6.0;
  } else {
    throw new Error(`Gagal memproduksi audio vokal Charon untuk candidate ${candidate.id}`);
  }

  // 2. Synthesize Visual Keyframe (1080x1920 Vertikal) via Keyframe Generator Engine
  console.log(`🎨 [Keyframe Engine] Menghasilkan visual keyframe 1080x1920 untuk ${candidate.id}...`);
  if (!fs.existsSync(imagePath) || fs.statSync(imagePath).size < 20000) {
    try {
      await generateKeyframeImage({
        candidate,
        dossier,
        targetImagePath: imagePath,
      });
    } catch (kErr: any) {
      console.warn(`⚠️ Keyframe generator error (${kErr.message}), mencoba Flow MCP...`);
      // Optional Flow MCP fallback with 5s timeout
      try {
        const prompt = `Dramatic vertical 9:16 illustration (1080x1920), Graphic Novel Noir style for "${candidate.hookText}".`;
        const res = await flowClient.generate({
          project: `hook-${caseId}`,
          prompt,
          type: 'image',
          aspect: '9:16',
          max_credits: 0,
        });
        if (res.task_id) {
          const wait = await flowClient.waitForJob(res.task_id, 5);
          if (wait.finished && wait.files?.[0] && fs.existsSync(wait.files[0])) {
            fs.copyFileSync(wait.files[0], imagePath);
          }
        }
      } catch (flowErr: any) {
        console.warn(`⚠️ Flow MCP generate fallback skipped: ${flowErr.message}`);
      }
    }
  }

  // Ensure imagePath exists with fallback if Flow generation didn't output a file
  if (!fs.existsSync(imagePath) || fs.statSync(imagePath).size < 10000) {
    const fallbackSrc = path.resolve(
      process.cwd(),
      'public',
      'renders',
      caseId,
      'keyframes',
      'cover-shot-00.jpg'
    );
    const globalFallback = path.resolve(
      process.cwd(),
      'public',
      'renders',
      'bom-bali-amrozi',
      'keyframes',
      'cover-shot-00.jpg'
    );
    if (fs.existsSync(fallbackSrc)) {
      fs.copyFileSync(fallbackSrc, imagePath);
    } else if (fs.existsSync(globalFallback)) {
      fs.copyFileSync(globalFallback, imagePath);
    }
  }

  // 3. Assemble 5s-8s Rapid Video Snippet (MP4) with Giant Keyword Flash & Discreet Subtitles
  console.log(`🎬 [Compositor] Membuat video preview snippet 5 detik: ${videoSnippetPath}...`);
  const bgmTrack = path.resolve(
    process.cwd(),
    'public',
    'renders',
    'noir_1794719302357',
    'audio',
    'bgm-crime-tension.mp3'
  );
  const sfxTrack = path.resolve(
    process.cwd(),
    'public',
    'renders',
    'mujianto-serial-killer',
    'audio-chunks',
    'forensic-glitch-sfx.wav'
  );

  const durationStr = audioDurationSec.toFixed(2);

  // Cinematic Slow Zoompan on High-Precision Keyframe (1080x1920 Vertical)
  const filterComplex = [
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0006,1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(
      audioDurationSec * 30
    )}:s=1080x1920:fps=30[v];`,
    // Audio Mix: Voice + BGM bed (ducked) + Opening SFX Glitch
    `[1:a]volume=1.0[vo];`,
    fs.existsSync(bgmTrack) ? `[2:a]volume=0.18[bgm];` : '',
    fs.existsSync(sfxTrack) ? `[3:a]volume=0.6[sfx];` : '',
    `[vo]${fs.existsSync(bgmTrack) ? '[bgm]' : ''}${
      fs.existsSync(sfxTrack) ? '[sfx]' : ''
    }amix=inputs=${1 + (fs.existsSync(bgmTrack) ? 1 : 0) + (fs.existsSync(sfxTrack) ? 1 : 0)}:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]`,
  ]
    .filter(Boolean)
    .join('');

  const ffmpegArgs: string[] = [
    '-y',
    '-loop',
    '1',
    '-i',
    imagePath,
    '-i',
    audioPath,
  ];

  if (fs.existsSync(bgmTrack)) {
    ffmpegArgs.push('-stream_loop', '-1', '-i', bgmTrack);
  }
  if (fs.existsSync(sfxTrack)) {
    ffmpegArgs.push('-i', sfxTrack);
  }

  ffmpegArgs.push(
    '-filter_complex',
    filterComplex,
    '-map',
    '[v]',
    '-map',
    '[a]',
    '-t',
    durationStr,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '22',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    videoSnippetPath
  );

  try {
    execFileSync(ffmpeg, ffmpegArgs);
    console.log(`✅ [Video Snippet Siap]: ${videoSnippetPath}`);
  } catch (err: any) {
    console.warn(`⚠️ FFmpeg preview snippet filter gagal (${err.message}), memakai render langsung...`);
    try {
      execFileSync(ffmpeg, [
        '-y',
        '-loop',
        '1',
        '-i',
        imagePath,
        '-i',
        audioPath,
        '-t',
        durationStr,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-shortest',
        videoSnippetPath,
      ]);
      console.log(`✅ [Video Snippet Fallback Siap]: ${videoSnippetPath}`);
    } catch (fbErr: any) {
      console.error(`❌ Gagal merender snippet fallback: ${fbErr.message}`);
    }
  }

  const relBase = `/renders/hook-simulator/${caseId}/${candidate.id}`;

  return {
    audioPath,
    audioUrl: `${relBase}/hook-audio.wav`,
    imagePath,
    imageUrl: `${relBase}/hook-visual.jpg`,
    videoSnippetPath,
    videoSnippetUrl: `${relBase}/hook-preview.mp4`,
    durationSec: audioDurationSec,
  };
}
