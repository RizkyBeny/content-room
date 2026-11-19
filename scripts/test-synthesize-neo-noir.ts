import path from 'node:path';
import fs from 'node:fs';
import { HookSuccessorEngine } from '../lib/hookEngine';

async function main() {
  console.log('🚀 Running 3-Option Hook Engine v3 Synthesis Test...');
  const engine = new HookSuccessorEngine();

  const session = await engine.createSession({
    caseId: 'kumparan-ruu-perampasan-aset',
    synthesizeMedia: true,
  });

  console.log(`\n✅ Session created: ${session.sessionId}`);
  console.log(`Candidates generated (Target 3): ${session.candidates.length}`);

  for (const c of session.candidates) {
    console.log(`\n📌 [${c.id}] ${c.archetypeName} (HSI: ${c.hookSuccessIndex}/100)`);
    console.log(`   Top Keyword: ${c.topGiantKeyword}`);
    console.log(`   Copy: "${c.hookText}"`);
    console.log(`   Ringkasan: ${c.conciseSummary || c.psychologicalReason}`);
    if (c.media) {
      console.log(`   🎨 Keyframe: ${c.media.imagePath} (exists: ${c.media.imagePath ? fs.existsSync(c.media.imagePath) : false})`);
      console.log(`   🎙️ Audio: ${c.media.audioPath} (${c.durationSecEstimate?.toFixed(1)}s)`);
      console.log(`   🎬 Video: ${c.media.videoSnippetPath} (size: ${c.media.videoSnippetPath ? fs.statSync(c.media.videoSnippetPath).size : 0} bytes)`);
    } else {
      console.log(`   ❌ No media synthesized!`);
    }
  }
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
