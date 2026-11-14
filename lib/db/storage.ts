import fs from 'node:fs';
import path from 'node:path';
import { ExplainerScript } from '../pipeline/scriptWriter';
import { PlannedAngle } from '../pipeline/anglePlanner';
import { ResolvedStoryboard } from '../pipeline/storyboardResolver';

export type JobStatus =
  | 'SCRIPT_GENERATING'
  | 'SCRIPT_READY'
  | 'AUDIO_GENERATING'
  | 'AUDIO_READY'
  | 'VIDEO_GENERATING'
  | 'VIDEO_READY'
  | 'FAILED';

export interface VideoJob {
  id: string;
  articleUrl: string;
  brief?: string;
  themePresetId: string;
  status: JobStatus;
  progress?: {
    step: string;
    index: number;
    total: number;
  };
  angle?: PlannedAngle;
  script?: ExplainerScript;
  audio?: {
    path: string;
    url: string;
    durationSec: number;
  };
  storyboard?: ResolvedStoryboard;
  video?: {
    path: string;
    url: string;
    durationSec: number;
  };
  error?: {
    stage: 'SCRIPT' | 'AUDIO' | 'VIDEO';
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(JOBS_FILE)) {
    fs.writeFileSync(JOBS_FILE, JSON.stringify({}), 'utf8');
  }
}

export function getAllJobs(): Record<string, VideoJob> {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(JOBS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getJob(id: string): VideoJob | null {
  const jobs = getAllJobs();
  return jobs[id] || null;
}

export function saveJob(job: VideoJob): void {
  ensureDataFile();
  const jobs = getAllJobs();
  job.updatedAt = new Date().toISOString();
  jobs[job.id] = job;
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf8');
}

