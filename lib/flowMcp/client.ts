import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  FlowSessionStatus,
  FlowNarrateResult,
  FlowTranscribeResult,
  FlowGenerateInput,
  FlowGenerateResult,
  FlowWaitResult,
} from './types';

export interface FlowJobView {
  id: string;
  status: 'queued' | 'running' | 'done' | 'failed' | 'cancelled';
  project: string;
  scene?: string;
  prompt: string;
  attempts?: number;
  credits?: number;
  progress?: number;
  files: string[];
  note?: string;
  error?: string;
  failed_scenes?: number[];
}

export class FlowMcpClient {
  private baseUrl: string;
  private tokenPath: string;

  constructor(port = Number(process.env.FLOW_MCP_PORT ?? 8787)) {
    this.baseUrl = `http://127.0.0.1:${port}`;
    this.tokenPath = path.join(os.homedir(), '.flow-mcp', 'token');
  }

  private getToken(): string {
    if (!fs.existsSync(this.tokenPath)) {
      throw new Error(
        `flow-mcp token tidak ditemukan di ${this.tokenPath}. Pastikan flow-mcp sudah berjalan (jalankan 'pnpm flow:studio').`
      );
    }
    return fs.readFileSync(this.tokenPath, 'utf8').trim();
  }

  async checkHealth(): Promise<{ ok: boolean; info?: unknown; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) {
        return { ok: false, error: `Health check gagal: HTTP ${res.status}` };
      }
      const data = await res.json();
      return { ok: true, info: data };
    } catch {
      return {
        ok: false,
        error:
          "Server flow-mcp tidak aktif di 127.0.0.1:8787. Jalankan 'pnpm flow:studio' atau 'cd ~/flow-mcp && npm run studio'.",
      };
    }
  }

  private async callTool<T>(toolName: string, args: Record<string, unknown> = {}): Promise<T> {
    const token = this.getToken();
    const res = await fetch(`${this.baseUrl}/api/${toolName}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-flow-token': token,
      },
      body: JSON.stringify(args),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Flow MCP error (${toolName} - HTTP ${res.status}): ${errText}`);
    }

    return (await res.json()) as T;
  }

  async getStatus(): Promise<FlowSessionStatus> {
    const data = await this.callTool<{ flow?: FlowSessionStatus }>('status', { detailed: true });
    return data.flow || {};
  }

  /**
   * Antrekan generasi video / gambar untuk 1 scene atau lebih via flow-mcp generate
   */
  async generate(input: FlowGenerateInput & { project?: string }): Promise<FlowGenerateResult> {
    const project = input.project ?? 'content-automation';
    const scene = {
      prompt: input.prompt,
      type: input.type,
      aspect_ratio: input.aspect ?? '9:16',
      duration: input.duration ?? 6,
      model: input.model,
      max_credits: input.max_credits ?? 25,
      reference_images: input.reference_images,
    };

    const data = await this.callTool<{ output_dir: string; jobs: FlowJobView[] }>('generate', {
      project,
      scenes: [scene],
    });

    const job = data.jobs[0];
    return {
      task_id: job?.id,
      finished: job?.status === 'done',
      files: job?.files,
      credits_used: job?.credits,
      error: job?.error,
    };
  }

  /**
   * Antrekan batch keyframe gambar untuk multiple scene (dengan match reference previous)
   */
  async generateImageBatch(args: {
    project: string;
    scenes: Array<{
      prompt: string;
      reference_previous?: boolean;
    }>;
    aspect_ratio?: '9:16' | '16:9' | '1:1';
  }): Promise<{ output_dir: string; jobs: FlowJobView[] }> {
    const scenes = args.scenes.map((s, idx) => ({
      prompt: s.prompt,
      type: 'image' as const,
      aspect_ratio: args.aspect_ratio ?? '9:16',
      reference_previous: idx > 0 ? (s.reference_previous ?? true) : false,
      max_credits: 0,
    }));

    return this.callTool<{ output_dir: string; jobs: FlowJobView[] }>('generate', {
      project: args.project,
      scenes,
    });
  }

  /**
   * Fast batch images via Google Flow Agent mode (0 credits, paralel)
   */
  async generateAgentImages(args: {
    project: string;
    scenes: string[];
    aspect_ratio?: '9:16' | '16:9' | '1:1';
  }): Promise<{ output_dir: string; jobs: FlowJobView[] }> {
    return this.callTool<{ output_dir: string; jobs: FlowJobView[] }>('agent', {
      project: args.project,
      scenes: args.scenes,
      aspect_ratio: args.aspect_ratio ?? '9:16',
    });
  }

  /**
   * Menunggu pekerjaan queue Flow MCP selesai
   */
  async waitForJob(taskId: string, timeoutSec = 180): Promise<FlowWaitResult> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutSec * 1000) {
      const res = await this.callTool<{ finished: boolean; jobs: FlowJobView[] }>('wait', {
        job_ids: [taskId],
        timeout_seconds: 15,
      });

      const job = res.jobs.find((j) => j.id === taskId);
      if (job && (job.status === 'done' || job.status === 'failed')) {
        return {
          finished: job.status === 'done',
          files: job.files,
          credits_used: job.credits,
          error: job.error,
        };
      }

      if (res.finished) {
        return {
          finished: true,
          files: job?.files,
          credits_used: job?.credits,
          error: job?.error,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    throw new Error(`Timeout waiting for Flow MCP job ${taskId} after ${timeoutSec}s`);
  }

  async waitForAllJobs(jobIds: string[], timeoutSec = 300): Promise<{ finished: boolean; jobs: FlowJobView[] }> {
    const deadline = Date.now() + timeoutSec * 1000;
    while (Date.now() < deadline) {
      const res = await this.callTool<{ finished: boolean; jobs: FlowJobView[] }>('wait', {
        job_ids: jobIds,
        timeout_seconds: 20,
      });
      if (res.finished || res.jobs.every((j) => j.status === 'done' || j.status === 'failed')) {
        return res;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    throw new Error(`Timeout waiting for Flow MCP jobs after ${timeoutSec}s`);
  }

  async narrate(args: {
    project?: string;
    text: string;
    voice?: string;
    engine?: 'gemini' | 'kokoro';
    backend?: 'gemini' | 'kokoro';
    style?: string;
    speed?: number;
  }): Promise<FlowNarrateResult> {
    const engine = args.engine ?? args.backend ?? 'gemini';
    return this.callTool<FlowNarrateResult>('narrate', {
      project: args.project ?? 'content-automation',
      text: args.text,
      voice: args.voice ?? (engine === 'kokoro' ? 'am_michael' : 'Charon'),
      engine,
      style: args.style,
      speed: args.speed ?? 1.0,
    });
  }

  async transcribe(args: {
    video?: string;
    audio_path?: string;
    language?: string;
  }): Promise<FlowTranscribeResult> {
    const file = args.video ?? args.audio_path ?? '';
    return this.callTool<FlowTranscribeResult>('transcribe', {
      video: file,
      language: args.language ?? 'id',
      words: true,
    });
  }
}

export const flowClient = new FlowMcpClient();
