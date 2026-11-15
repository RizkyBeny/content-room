import fs from 'node:fs';
import path from 'node:path';
import { OrchestratorJob } from '../types';
import { ORCHESTRATOR_CONFIG } from '../config';

const storeFile = ORCHESTRATOR_CONFIG.paths.jobStore;

function ensureStoreDir(): void {
  const dir = path.dirname(storeFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadAllJobs(): Record<string, OrchestratorJob> {
  ensureStoreDir();
  if (!fs.existsSync(storeFile)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(storeFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveJob(job: OrchestratorJob): void {
  ensureStoreDir();
  const all = loadAllJobs();
  job.updatedAt = new Date().toISOString();
  all[job.id] = job;
  fs.writeFileSync(storeFile, JSON.stringify(all, null, 2), 'utf8');
}

export function getJob(jobId: string): OrchestratorJob | null {
  const all = loadAllJobs();
  return all[jobId] || null;
}

export function getActiveJobForChat(chatId: string | number): OrchestratorJob | null {
  const all = loadAllJobs();
  const jobs = Object.values(all).filter((j) => String(j.chatId) === String(chatId));
  // Sort descending by created
  jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const active = jobs.find((j) => j.status !== 'COMPLETED' && j.status !== 'FAILED' && j.status !== 'CANCELLED');
  return active || null;
}
