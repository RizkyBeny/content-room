import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { orchestrator } from '../lib/orchestrator';
import { loadAllJobs } from '../lib/orchestrator/state/jobStore';
import { ORCHESTRATOR_CONFIG } from '../lib/orchestrator/config';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function main() {
  const url = process.argv[2] || 'https://www.detik.com/kalimantan/hukum-dan-kriminal/d-8051299/demi-warisan-wanita-ini-bunuh-11-suami-selama-22-tahun';
  const chatId = process.env.TELEGRAM_CHAT_ID ? Number(process.env.TELEGRAM_CHAT_ID) : 0;

  console.log('====================================================================');
  console.log('🚀 TESTING AUTONOMOUS ORCHESTRATOR (KOLSOUM AKBARI / IRAN BLACK WIDOW)');
  console.log(`URL: ${url}`);
  console.log(`Telegram Chat ID: ${chatId}`);
  console.log('====================================================================\n');

  // Step 1: Ingest and run Stage 1
  console.log('--- [STAGE 1] INGESTION, DOSSIER, SCRIPT, & 5 SAMPLE KEYFRAMES ---');
  await orchestrator.handleArticleUrl(chatId, url);

  // Find the job that was just created
  const jobs = Object.values(loadAllJobs()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const currentJob = jobs[0];

  if (!currentJob) {
    throw new Error('Gagal menemukan job yang baru dibuat!');
  }

  console.log(`\n✅ Stage 1 Selesai! Job ID: ${currentJob.id}`);
  console.log(`   Judul Kasus: ${currentJob.script?.title}`);
  console.log(`   Naskah (${currentJob.script?.wordCount} kata): "${currentJob.script?.fullText}"`);
  console.log(`   Sample Keyframes: ${currentJob.sampleKeyframes?.length} shots`);

  // Step 2: Auto-Approve to run Stage 2 Full Production
  console.log('\n--- [STAGE 2] FULL PRODUCTION (VO CHARON, 15 FLOW MCP SHOTS, HYPERFRAMES) ---');
  await orchestrator.handleApproval(chatId, currentJob.id);

  console.log('\n====================================================================');
  console.log('🎉 PENGUJIAN ORCHESTRATOR SELESAI DENGAN SUKSES!');
  console.log(`Job ID: ${currentJob.id}`);
  console.log(`Web Viewer HTML: http://localhost:3000/renders/${currentJob.id}/index.html`);
  console.log('====================================================================');
}

main().catch((err) => {
  console.error('\n❌ Fatal Error pada pengujian orchestrator:', err);
  process.exit(1);
});
