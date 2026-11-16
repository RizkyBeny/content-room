import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { flowClient } from '../../flowMcp/client';
import { generateAudioAndAlignment, ProcessedAudio } from '../../flowMcp/audioPipeline';
import { produceNoirMasterAudio, ShotTiming } from '../audio/noirAudioPipeline';
import { KeyframeItem, OrchestratorJob } from '../types';
import { ORCHESTRATOR_CONFIG } from '../config';

const execFileAsync = promisify(execFile);

export interface NoirProcessedAudio extends ProcessedAudio {
  shotTimings: ShotTiming[];
}

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
      const filename = item.shot === 0 ? 'cover-shot-00.jpg' : `shot-${shotNumStr}.jpg`;
      const outPath = path.join(jobDir, filename);

      if (health.ok && !options.skipFlow) {
        try {
          console.log(`[AssetProducer] Memanggil Flow MCP untuk Shot ${shotNumStr} (${item.label})...`);
          const res = await flowClient.generate({
            project: 'content-automation',
            prompt: item.prompt,
            type: 'image',
            aspect: '9:16',
            max_credits: 0,
          });

          if (res.task_id) {
            const waitTimeout = options.flowTimeoutSec || 180;
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

      // Fallback jika belum terbuat atau Flow MCP offline / timeout
      if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 1000) {
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
      const filename = item.shot === 0 ? 'cover-shot-00.jpg' : `shot-${shotNumStr}.jpg`;
      const outPath = path.join(jobDir, filename);

      // Jika file sudah dibuat di tahap sample, gunakan kembali
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
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
            project: 'content-automation',
            prompt: item.prompt,
            type: 'image',
            aspect: '9:16',
            max_credits: 0,
          });
          if (res.task_id) {
            const waitTimeout = options.flowTimeoutSec || 180;
            const waitRes = await flowClient.waitForJob(res.task_id, waitTimeout);
            if (waitRes.finished && waitRes.files?.[0] && fs.existsSync(waitRes.files[0])) {
              fs.copyFileSync(waitRes.files[0], outPath);
            }
          }
        } catch (err) {
          console.warn(`[AssetProducer] Flow error Shot ${shotNumStr}, fallback:`, err);
        }
      }

      if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 1000) {
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
   * Mensintesis narasi audio berkarakter True Crime Neo-Noir (Charon + Ducked BGM + Glitch SFX)
   */
  async synthesizeVoiceAndAlign(job: OrchestratorJob): Promise<NoirProcessedAudio> {
    if (!job.script?.fullText) {
      throw new Error('Naskah belum dibuat pada job ini');
    }

    const audioDir = path.join(ORCHESTRATOR_CONFIG.paths.rendersDir, job.id, 'audio');
    fs.mkdirSync(audioDir, { recursive: true });

    console.log(`[AssetProducer] Mensintesis audio True Crime Neo-Noir via Charon + Ducked BGM + SFX untuk job ${job.id}...`);

    const result = await produceNoirMasterAudio(
      job.script.fullText,
      audioDir,
      job.script.beats?.length || 14
    );

    return {
      audioPath: result.masterAudioPath,
      durationMs: Math.round(result.totalDurationSec * 1000),
      words: result.words,
      text: job.script.fullText,
      shotTimings: result.shotTimings,
    };
  }

  /**
   * Menghasilkan binary JPEG 9:16 Graphic Novel Neo-Noir 1080x1920 via Python PIL
   */
  private async generateLocalNoirFallbackImage(
    outPath: string,
    item: KeyframeItem,
    job: OrchestratorJob
  ): Promise<void> {
    const headline = job.script?.title || 'INVESTIGASI PERKARA KRIMINAL';
    const subHeadline = job.script?.subHeadline || 'BERKAS POLISI TERTUTUP';
    const shotLabel = item.label || `Shot ${item.shot}`;
    const evidence = job.dossier?.keyEvidence?.[0] || 'Bukti digital & fisik TKP';
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'generate-noir-keyframe.py');

    try {
      await execFileAsync('python3', [
        scriptPath,
        '--out',
        outPath,
        '--shot',
        String(item.shot),
        '--label',
        shotLabel,
        '--headline',
        headline,
        '--subheadline',
        subHeadline,
        '--evidence',
        evidence,
      ]);
    } catch (err) {
      console.error('[AssetProducer] Error running python keyframe generator:', err);
    }
  }
}

export const assetProducer = new AssetProducerAgent();

