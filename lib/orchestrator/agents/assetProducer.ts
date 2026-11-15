import fs from 'node:fs';
import path from 'node:path';
import { flowClient } from '../../flowMcp/client';
import { generateAudioAndAlignment, ProcessedAudio } from '../../flowMcp/audioPipeline';
import { KeyframeItem, OrchestratorJob } from '../types';
import { ORCHESTRATOR_CONFIG } from '../config';

export class AssetProducerAgent {
  /**
   * Menghasilkan 5 sampel keyframe utama untuk Tahap 1 Review
   */
  async generateSampleKeyframes(
    job: OrchestratorJob,
    options: { skipFlow?: boolean; flowTimeoutSec?: number } = {}
  ): Promise<KeyframeItem[]> {
    const samples = job.sampleKeyframes || [];
    const jobDir = path.join(ORCHESTRATOR_CONFIG.paths.rendersDir, job.id, 'keyframes');
    fs.mkdirSync(jobDir, { recursive: true });

    console.log(`[AssetProducer] Memeriksa status Flow MCP untuk 5 sample keyframes job ${job.id}...`);
    const health = options.skipFlow
      ? { ok: false }
      : await flowClient.checkHealth().catch(() => ({ ok: false }));

    const updatedSamples: KeyframeItem[] = [];

    for (const item of samples) {
      const shotNumStr = String(item.shot).padStart(2, '0');
      const filename = `shot-${shotNumStr}.png`;
      const outPath = path.join(jobDir, filename);

      if (health.ok && !options.skipFlow) {
        try {
          console.log(`[AssetProducer] Memanggil Flow MCP untuk Shot ${shotNumStr} (${item.label})...`);
          const res = await flowClient.generate({
            project: `noir-${job.id}`,
            prompt: item.prompt,
            type: 'image',
            aspect: '9:16',
          });

          if (res.task_id) {
            const waitTimeout = options.flowTimeoutSec || 20;
            const waitRes = await flowClient.waitForJob(res.task_id, waitTimeout);
            if (waitRes.finished && waitRes.files?.[0]) {
              const sourceFile = waitRes.files[0];
              if (fs.existsSync(sourceFile)) {
                fs.copyFileSync(sourceFile, outPath);
              }
            }
          }
        } catch (err) {
          console.warn(`[AssetProducer] Gagal generate via Flow MCP Shot ${shotNumStr}, fallback local graphic:`, err);
        }
      }

      // Fallback jika belum terbuat atau Flow MCP offline
      if (!fs.existsSync(outPath)) {
        await this.generateLocalNoirFallbackImage(outPath, item, job);
      }

      updatedSamples.push({
        ...item,
        imagePath: outPath,
        imageUrl: `/renders/${job.id}/keyframes/${filename}`,
      });
    }

    return updatedSamples;
  }

  /**
   * Menghasilkan seluruh 15 keyframes (melengkapi sisa dari 5 sample)
   */
  async generateAllKeyframes(
    job: OrchestratorJob,
    options: { skipFlow?: boolean; flowTimeoutSec?: number } = {}
  ): Promise<KeyframeItem[]> {
    const all = job.allKeyframes || [];
    const jobDir = path.join(ORCHESTRATOR_CONFIG.paths.rendersDir, job.id, 'keyframes');
    fs.mkdirSync(jobDir, { recursive: true });

    console.log(`[AssetProducer] Melengkapi seluruh 15 keyframes untuk job ${job.id}...`);
    const health = options.skipFlow
      ? { ok: false }
      : await flowClient.checkHealth().catch(() => ({ ok: false }));

    const updatedAll: KeyframeItem[] = [];

    for (const item of all) {
      const shotNumStr = String(item.shot).padStart(2, '0');
      const filename = `shot-${shotNumStr}.png`;
      const outPath = path.join(jobDir, filename);

      // Jika file sudah dibuat di tahap sample, gunakan kembali
      if (fs.existsSync(outPath)) {
        updatedAll.push({
          ...item,
          imagePath: outPath,
          imageUrl: `/renders/${job.id}/keyframes/${filename}`,
        });
        continue;
      }

      if (health.ok && !options.skipFlow) {
        try {
          console.log(`[AssetProducer] Flow MCP generating Shot ${shotNumStr}...`);
          const res = await flowClient.generate({
            project: `noir-${job.id}`,
            prompt: item.prompt,
            type: 'image',
            aspect: '9:16',
          });
          if (res.task_id) {
            const waitTimeout = options.flowTimeoutSec || 20;
            const waitRes = await flowClient.waitForJob(res.task_id, waitTimeout);
            if (waitRes.finished && waitRes.files?.[0] && fs.existsSync(waitRes.files[0])) {
              fs.copyFileSync(waitRes.files[0], outPath);
            }
          }
        } catch (err) {
          console.warn(`[AssetProducer] Flow error Shot ${shotNumStr}, fallback:`, err);
        }
      }

      if (!fs.existsSync(outPath)) {
        await this.generateLocalNoirFallbackImage(outPath, item, job);
      }

      updatedAll.push({
        ...item,
        imagePath: outPath,
        imageUrl: `/renders/${job.id}/keyframes/${filename}`,
      });
    }

    return updatedAll;
  }

  /**
   * Mensintesis narasi audio berkarakter Dark Suspense + ekstraksi timestamps Whisper
   */
  async synthesizeVoiceAndAlign(job: OrchestratorJob): Promise<ProcessedAudio> {
    if (!job.script?.fullText) {
      throw new Error('Naskah belum dibuat pada job ini');
    }

    const audioDir = path.join(ORCHESTRATOR_CONFIG.paths.rendersDir, job.id, 'audio');
    fs.mkdirSync(audioDir, { recursive: true });

    console.log(`[AssetProducer] Mensintesis audio suara berat (Puck/Gemini) untuk job ${job.id}...`);

    return generateAudioAndAlignment(job.script.fullText, {
      voice: ORCHESTRATOR_CONFIG.voice.preferredVoice,
      backend: ORCHESTRATOR_CONFIG.voice.backend,
      outputDir: audioDir,
    });
  }

  /**
   * Menghasilkan fallback poster grafis Noir SVG/PNG 9:16 beresolusi 1080x1920
   */
  private async generateLocalNoirFallbackImage(
    outPath: string,
    item: KeyframeItem,
    job: OrchestratorJob
  ): Promise<void> {
    const headline = job.script?.title || 'INVESTIGASI PERKARA KRIMINAL';
    const subHeadline = job.script?.subHeadline || 'BERKAS POLISI TERTUTUP';
    const shotLabel = item.label || `Shot ${item.shot}`;

    // SVG grafis kanonik Neo-Noir 1080x1920
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
      <defs>
        <radialGradient id="vignette" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="#161B22" stop-opacity="0.8"/>
          <stop offset="70%" stop-color="#0D1117" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#05070A" stop-opacity="1"/>
        </radialGradient>
        <pattern id="halftone" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="2.2" fill="#E6EDF3" fill-opacity="0.06"/>
        </pattern>
        <linearGradient id="crimsonTape" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#8B2635"/>
          <stop offset="100%" stop-color="#5A1520"/>
        </linearGradient>
      </defs>

      <!-- Background Charcoal Canvas -->
      <rect width="1080" height="1920" fill="#0D1117"/>
      <rect width="1080" height="1920" fill="url(#vignette)"/>
      <rect width="1080" height="1920" fill="url(#halftone)"/>

      <!-- Police Evidence Frame Lines -->
      <rect x="40" y="40" width="1000" height="1840" fill="none" stroke="#C59B27" stroke-width="2" stroke-opacity="0.3"/>
      <rect x="50" y="50" width="980" height="1820" fill="none" stroke="#E6EDF3" stroke-width="1" stroke-opacity="0.15" stroke-dasharray="10 10"/>

      <!-- Top Warning Header -->
      <rect x="80" y="90" width="920" height="60" fill="#161B22" stroke="#C59B27" stroke-width="1.5"/>
      <text x="540" y="130" font-family="Courier, monospace" font-size="24" font-weight="900" fill="#C59B27" letter-spacing="6" text-anchor="middle">
        /// POLICE INVESTIGATION DOSSIER ///
      </text>

      <!-- Chiaroscuro Center Scene Silhouette / Illustration -->
      <g transform="translate(540, 750)">
        <!-- Monolithic Backdrop -->
        <circle cx="0" cy="0" r="320" fill="#161B22" stroke="#C59B27" stroke-width="1" stroke-opacity="0.2"/>
        <!-- Silhouette Shapes -->
        <path d="M -120 180 L -80 -120 L 0 -190 L 80 -120 L 120 180 Z" fill="#090D12" stroke="#C59B27" stroke-width="3"/>
        <circle cx="0" cy="-210" r="60" fill="#090D12" stroke="#C59B27" stroke-width="2"/>
        <!-- Crime Seal Tag -->
        <rect x="-180" y="90" width="360" height="50" fill="url(#crimsonTape)"/>
        <text x="0" y="124" font-family="Impact, sans-serif" font-size="28" fill="#E6EDF3" letter-spacing="4" text-anchor="middle">
          EVIDENCE ITEM #${String(item.shot).padStart(2, '0')}
        </text>
      </g>

      <!-- Shot Description Card -->
      <rect x="100" y="1180" width="880" height="240" fill="#090D12" fill-opacity="0.85" stroke="#C59B27" stroke-width="1.5"/>
      <text x="140" y="1230" font-family="Courier, monospace" font-size="22" font-weight="bold" fill="#C59B27" letter-spacing="2">
        SCENE ANALYSIS:
      </text>
      <text x="140" y="1275" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="bold" fill="#E6EDF3">
        ${escapeXml(shotLabel)}
      </text>
      <text x="140" y="1330" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#8B949E">
        Graphic Novel Neo-Noir • Full Bleed 1080x1920
      </text>

      <!-- Headline Typography (Khusus Cover Shot 00 atau Hero Beats) -->
      <g transform="translate(540, 1530)">
        <text x="0" y="0" font-family="Impact, sans-serif" font-size="64" font-weight="bold" fill="#E6EDF3" letter-spacing="3" text-anchor="middle">
          ${escapeXml(headline.slice(0, 26))}
        </text>
        <rect x="-350" y="30" width="700" height="60" fill="url(#crimsonTape)"/>
        <text x="0" y="72" font-family="Impact, sans-serif" font-size="32" fill="#E6EDF3" letter-spacing="4" text-anchor="middle">
          ${escapeXml(subHeadline.slice(0, 32))}
        </text>
      </g>

      <!-- Bottom Timestamp / Police Case Footer -->
      <text x="540" y="1810" font-family="Courier, monospace" font-size="18" fill="#484F58" text-anchor="middle" letter-spacing="3">
        CASE FILE ID: ${job.id.toUpperCase()} • EVIDENCE ARCHIVE
      </text>
    </svg>`;

    const svgPath = outPath.replace(/\.[a-z0-9]+$/i, '.svg');
    fs.writeFileSync(svgPath, svg, 'utf8');

    // Buat file PNG/JPG dari SVG jika ada tools, atau copy sebagai image
    // HyperFrames dan Chromium mendukung langsung SVG atau PNG
    fs.writeFileSync(outPath, svg, 'utf8');
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const assetProducer = new AssetProducerAgent();
