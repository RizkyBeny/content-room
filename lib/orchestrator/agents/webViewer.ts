import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { OrchestratorJob } from '../types';
import { ORCHESTRATOR_CONFIG } from '../config';

export function getLocalIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateDownloadPage(job: OrchestratorJob): { htmlPath: string; localUrl: string; networkUrl: string } {
  const jobDir = path.join(ORCHESTRATOR_CONFIG.paths.rendersDir, job.id);
  fs.mkdirSync(jobDir, { recursive: true });

  const htmlPath = path.join(jobDir, 'index.html');
  const videoFilename = path.basename(job.finalVideoPath || 'noir-explainer-final.mp4');
  const localIp = getLocalIp();

  const localUrl = `http://localhost:3000/renders/${job.id}/index.html`;
  const networkUrl = `http://${localIp}:3000/renders/${job.id}/index.html`;

  const meta = job.metadata || {
    seoTitle: job.script?.title || 'Video True Crime 9:16',
    caption: job.script?.fullText || '',
    hashtags: ['#TrueCrime', '#KasusKriminal', '#NeoNoir'],
    summaryNote: '',
  };

  const beats = job.script?.beats || [];
  const allKeyframes = job.allKeyframes || [];
  const totalShots = beats.length || allKeyframes.length || 15;
  const wordCount = job.script?.fullText?.split(/\s+/).filter(Boolean).length || 140;
  const durationSec = (job.audioDurationSec || 59.5).toFixed(1);

  // Calculate video file size
  let videoSizeMb = '65.0';
  if (job.finalVideoPath && fs.existsSync(job.finalVideoPath)) {
    videoSizeMb = (fs.statSync(job.finalVideoPath).size / (1024 * 1024)).toFixed(1);
  }

  // Build Storyboard Cards
  const keyframeCards = beats.map((b) => {
    const kf = allKeyframes.find((k) => k.shot === b.shot);
    const shotNumStr = String(b.shot).padStart(2, '0');
    let imgSrc = '';

    if (kf?.imagePath && fs.existsSync(kf.imagePath)) {
      imgSrc = `/renders/${job.id}/keyframes/${path.basename(kf.imagePath)}`;
    } else {
      const fallbackPath = path.join(jobDir, 'keyframes', `shot-${shotNumStr}.jpg`);
      if (fs.existsSync(fallbackPath)) {
        imgSrc = `/renders/${job.id}/keyframes/shot-${shotNumStr}.jpg`;
      }
    }

    const dur = Math.max(0.5, b.endSec - b.startSec).toFixed(1);

    return `
      <!-- Shot ${shotNumStr} -->
      <div class="bg-[#12161E] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col hover:border-amber-500/40 transition">
        <div class="relative aspect-[9/16] bg-black overflow-hidden group">
          ${imgSrc
        ? `<img src="${imgSrc}" alt="Shot ${shotNumStr}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />`
        : `<div class="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">No Image</div>`
      }
          <div class="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur border border-slate-700 text-[11px] font-bold text-amber-400">
            Shot ${shotNumStr}
          </div>
          <div class="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 backdrop-blur text-[10px] mono text-slate-300">
            ${b.startSec}s - ${b.endSec}s (${dur}s)
          </div>
        </div>
        <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div class="text-[11px] font-bold uppercase tracking-wider text-amber-500/90 mb-1">
              ${escapeHtml(b.shotType || 'SCENE')}
            </div>
            <p class="text-xs text-slate-300 line-clamp-3">
              ${escapeHtml(b.visualCue)}
            </p>
          </div>
          <div class="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <span class="text-[10px] text-slate-400 font-mono block mb-1">Naskah Narasi:</span>
            <p class="text-[11px] text-slate-200 italic">
              "${escapeHtml(b.narration)}"
            </p>
          </div>
        </div>
      </div>
    `;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Review & Unduh: ${escapeHtml(job.script?.title || 'True Crime Explainer')}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-[#0A0D12] text-slate-100 min-h-screen p-4 md:p-8 flex flex-col items-center">
  <div class="max-w-7xl w-full space-y-8">
    <!-- Header -->
    <div class="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800 text-red-400 text-xs font-semibold mb-2">
          <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Template: Mystery True Crime (9:16) &bull; Rigid Pacing: 3&ndash;5 Detik / Image
        </div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">${escapeHtml(job.script?.title || 'Investigasi Perkara Kriminal')}</h1>
        <p class="text-slate-400 text-sm mt-1">
          Kasus: <em>${escapeHtml(job.script?.subHeadline || 'Kasus Kriminal')}</em> &bull; Target Durasi: <strong>60 Detik (YouTube Shorts)</strong>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <div class="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs mono text-slate-300">
          Total: <span class="text-amber-400 font-bold">${totalShots} Shots</span> &bull; <span class="text-cyan-400 font-bold">${wordCount} Kata</span> &bull; <span class="text-emerald-400 font-bold">~${durationSec}s</span>
        </div>
      </div>
    </div>

    <!-- Video Player Section -->
    <div class="bg-[#12161E] border border-amber-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold mb-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Render Selesai &bull; 1080&times;1920 (30fps) &bull; ${durationSec} Detik
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Final Video (HyperFrames + Voice Over Charon)</h2>
          <p class="text-xs text-slate-400 mt-1">
            Video 9:16 vertikal dengan 14 shot kamera dinamis, autocaption tersinkronisasi di bottom safe area (300px), dan audio broadcast-mastered.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a href="/renders/${job.id}/${videoFilename}" download="${videoFilename}"
            class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg flex items-center gap-2">
            <span>Unduh MP4 (${videoSizeMb} MB)</span>
          </a>
        </div>
      </div>

      <div class="flex flex-col md:flex-row items-center justify-center gap-8 pt-4 border-t border-slate-800">
        <!-- Vertical Video Container -->
        <div class="relative w-full max-w-[340px] aspect-[9/16] rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
          <video controls playsinline preload="auto" class="w-full h-full object-cover">
            <source src="/renders/${job.id}/${videoFilename}" type="video/mp4">
            Browser Anda tidak mendukung tag video.
          </video>
        </div>

        <!-- Audio & Metadata Controls -->
        <div class="space-y-4 max-w-md w-full text-xs text-slate-300">
          <!-- Standalone BGM Player Card -->
          <div class="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                Audio Khusus BGM (Ducked 20%)
              </span>
              <a href="/renders/${job.id}/audio/bgm-crime-tension.mp3" download="bgm-crime-tension.mp3"
                class="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold transition">
                Unduh MP3
              </a>
            </div>
            <p class="text-slate-300 text-[11px]">
              Dengarkan langsung track instrumen BGM tension (Cello pulse, piano eerie Mindhunter, ticking clock, dark pad D-minor):
            </p>
            <audio controls class="w-full h-8" preload="auto">
              <source src="/renders/${job.id}/audio/bgm-crime-tension.mp3" type="audio/mpeg">
              Browser tidak mendukung audio.
            </audio>
          </div>

          <!-- Standalone Voice Over Player Card -->
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white uppercase tracking-wider">Voice Over (Charon - Broadcast Master)</span>
              ${job.audioPath
      ? `<a href="/renders/${job.id}/audio/${path.basename(job.audioPath)}" download="${path.basename(job.audioPath)}" class="text-amber-400 hover:underline text-[11px]">Unduh VO</a>`
      : ''
    }
            </div>
            <audio controls class="w-full h-8" preload="auto">
              <source src="/renders/${job.id}/audio/${path.basename(job.audioPath || 'master-audio.mp3')}" type="audio/mpeg">
              Browser tidak mendukung audio.
            </audio>
          </div>

          <!-- One-Click Copy Metadata Card -->
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <span class="font-bold text-slate-200 uppercase tracking-wider block">Paket Metadata Siap Posting</span>
            
            <div class="space-y-1">
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-400">Judul Rekomendasi (SEO & Hook):</span>
                <button onclick="copyToClipboard('${escapeJs(meta.seoTitle)}', this)" class="text-amber-400 hover:text-amber-300 font-bold">Salin</button>
              </div>
              <div class="p-2 rounded bg-black/50 border border-slate-800 font-medium text-slate-200">
                ${escapeHtml(meta.seoTitle)}
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-400">Caption & Narasi:</span>
                <button onclick="copyToClipboard('${escapeJs(meta.caption)}', this)" class="text-amber-400 hover:text-amber-300 font-bold">Salin</button>
              </div>
              <div class="p-2 rounded bg-black/50 border border-slate-800 text-[11px] text-slate-300 max-h-24 overflow-y-auto">
                ${escapeHtml(meta.caption)}
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-400">Hashtags:</span>
                <button onclick="copyToClipboard('${escapeJs(meta.hashtags.join(' '))}', this)" class="text-amber-400 hover:text-amber-300 font-bold">Salin</button>
              </div>
              <div class="p-2 rounded bg-black/50 border border-slate-800 text-[11px] text-amber-300/90 mono">
                ${escapeHtml(meta.hashtags.join(' '))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Storyboard Keyframes Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xl font-bold text-white tracking-tight">Storyboard &amp; Keyframe Sequences (${totalShots} Shots)</h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Pacing deterministik 3&ndash;5 detik per shot dengan transisi forensic glitch dan Ken Burns camera.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        ${keyframeCards}
      </div>
    </div>
  </div>

  <script>
    function copyToClipboard(text, btn) {
      navigator.clipboard.writeText(text).then(() => {
        const original = btn.innerText;
        btn.innerText = 'Tersalin!';
        btn.classList.add('text-emerald-400');
        setTimeout(() => {
          btn.innerText = original;
          btn.classList.remove('text-emerald-400');
        }, 2000);
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(htmlPath, html, 'utf8');

  return { htmlPath, localUrl, networkUrl };
}

function escapeJs(str: string): string {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}
