import dotenv from 'dotenv';
import path from 'node:path';
import { hookEngine } from '../lib/hookEngine';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  let caseId = 'bom-bali-amrozi';
  let sourceUrl: string | undefined;
  let rawBrief: string | undefined;
  let synthMedia = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--case' && args[i + 1]) {
      caseId = args[i + 1];
      i++;
    } else if (args[i] === '--url' && args[i + 1]) {
      sourceUrl = args[i + 1];
      i++;
    } else if (args[i] === '--brief' && args[i + 1]) {
      rawBrief = args[i + 1];
      i++;
    } else if (args[i] === '--synth') {
      synthMedia = true;
    }
  }

  console.log('========================================================================');
  console.log('  🎯 HOOK SUCCESSOR ENGINE: Empirical A/B Testing Simulator');
  console.log('     (4 Pillars • Calibrated Benchmark Delta • 100% Flow MCP Media)');
  console.log('========================================================================\n');

  const session = await hookEngine.createSession({
    caseId: sourceUrl ? undefined : caseId,
    sourceUrl,
    rawBrief,
    synthesizeMedia: synthMedia,
  });

  console.log(`\n📋 Kasus: ${session.dossier.title}`);
  console.log(`📍 Lokasi: ${session.dossier.location} | Korban: ${session.dossier.victim}`);
  console.log(`⚖️ Bukti Kunci: ${session.dossier.keyEvidence}`);
  console.log('------------------------------------------------------------------------\n');

  console.log('🏆 HASIL FORMULASI & SCORING EMPIRIS 5 ARKETIPE HOOK:\n');

  session.candidates.forEach((c, idx) => {
    const isWinner = c.id === session.recommendedWinnerId;
    const prefix = isWinner ? '⭐ [TOP WINNER]' : `   [Pilihan ${idx + 1}]`;
    console.log(`${prefix} ${c.archetypeName} (HSI: ${c.hookSuccessIndex}/100 | Retensi 3s: ${c.predictedRetention3s}%)`);
    console.log(`   🏷️  Giant Keyword : ${c.topGiantKeyword}`);
    console.log(`   💬 Hook Text     : "${c.hookText}"`);
    console.log(`   📊 Rincian Pilar : Stop-Velocity=${c.scores.scrollStopVelocity}/25 | Gap-Tension=${c.scores.cognitiveGapTension}/25 | Muted-Typo=${c.scores.mutedTypographyPunch}/25 | Debate=${c.scores.algorithmicCommentTrigger}/25`);
    console.log(`   📈 vs Benchmark  : ${c.benchmarkVsHistory.delta >= 0 ? '+' : ''}${c.benchmarkVsHistory.delta} poin vs ${c.benchmarkVsHistory.benchmarkCaseName}`);
    console.log(`   💡 Saran         : ${c.improvementSuggestion}`);
    if (c.media?.videoSnippetPath) {
      console.log(`   🎬 Video Snippet : ${c.media.videoSnippetPath}`);
    }
    console.log('');
  });

  console.log('========================================================================');
  console.log('👉 Buka Interactive Iteration Playground: http://localhost:3000/hook-engine');
  console.log('========================================================================');
}

main().catch(console.error);
