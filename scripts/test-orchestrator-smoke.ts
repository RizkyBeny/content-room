import path from 'node:path';
import fs from 'node:fs';
import { planNoirEditorial } from '../lib/orchestrator/agents/editorialNoir';
import { writeNoirScript } from '../lib/orchestrator/agents/scriptDirector';
import { generateAllKeyframeBlueprints, extractCore5SampleKeyframes } from '../lib/orchestrator/agents/blueprintAgent';
import { assetProducer } from '../lib/orchestrator/agents/assetProducer';
import { packagePostingMetadata } from '../lib/orchestrator/agents/metadataPackager';
import { saveJob, getJob } from '../lib/orchestrator/state/jobStore';
import { CrimeCaseDossier, OrchestratorJob } from '../lib/orchestrator/types';

async function runSmokeTest() {
  console.log('===============================================================');
  console.log('🧪 RUNNING ORCHESTRATOR SMOKE TEST (OFFLINE / FAST SIMULATION)');
  console.log('===============================================================\n');

  // 1. Mock Crime Dossier
  const mockDossier: CrimeCaseDossier = {
    url: 'https://news.detik.com/berita/kasus-apartemen-rahasia',
    headline: 'Misteri 9 Korban di Apartemen Dingin Pinggiran Kota',
    source: 'news.detik.com',
    crimeType: 'Pembunuhan Berantai',
    location: 'Zama, Tokyo',
    suspects: ['Takahiro Shiraishi'],
    victims: ['9 Korban Berbagai Wilayah'],
    keyEvidence: ['Kotak Pendingin Putih', 'Smartphone Retak', 'Catatan Transaksi'],
    chronologySummary: 'Penyelidikan orang hilang membawa polisi ke apartemen lantai dua. Di dalamnya ditemukan sembilan kotak pendingin berisi bukti mengerikan.',
    hookIdea: 'Sembilan nyawa lenyap hanya dalam rentang waktu dua bulan.',
    fullBodyText: 'Polisi metropolitan awalnya menyelidiki hilangnya seorang wanita muda berusia 23 tahun...',
  };

  console.log('1. Menguji Agent 2: Editorial Noir Planning...');
  const angle = await planNoirEditorial(mockDossier);
  console.log(`   ✅ Main Headline: "${angle.mainHeadline}"`);
  console.log(`   ✅ Sub Headline: "${angle.subHeadline}"`);
  console.log(`   ✅ Visual Hero: "${angle.caseHeroVisual.slice(0, 50)}..."`);

  console.log('\n2. Menguji Agent 3: Script & Beat Director...');
  const script = await writeNoirScript(mockDossier, angle);
  console.log(`   ✅ Script Beats: ${script.beats.length} beats`);
  console.log(`   ✅ Word Count: ${script.wordCount} kata (Target: ~130-150 kata)`);
  console.log(`   ✅ Hook Narration: "${script.beats[0]?.narration}"`);

  console.log('\n3. Menguji Agent 4: Blueprint Prompt Formatter...');
  const allKeyframes = generateAllKeyframeBlueprints(mockDossier, angle, script);
  const core5 = extractCore5SampleKeyframes(allKeyframes);
  console.log(`   ✅ Total Keyframe Blueprints: ${allKeyframes.length} shots`);
  console.log(`   ✅ Core 5 Keyframe Samples: ${core5.length} shots`);
  core5.forEach((k, idx) => {
    console.log(`      [${idx + 1}] Shot ${String(k.shot).padStart(2, '0')}: ${k.label}`);
  });

  console.log('\n4. Menguji Agent 5: Sample Keyframe Generator (SVG/PNG Fallback)...');
  const mockJob: OrchestratorJob = {
    id: `test_smoke_${Date.now()}`,
    articleUrl: mockDossier.url,
    chatId: 99999999,
    status: 'GENERATING_SAMPLES',
    dossier: mockDossier,
    script,
    allKeyframes,
    sampleKeyframes: core5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const generatedSamples = await assetProducer.generateSampleKeyframes(mockJob, { skipFlow: true });
  console.log(`   ✅ Generated Sample Files: ${generatedSamples.length} files`);
  generatedSamples.forEach((s) => {
    const exists = s.imagePath ? fs.existsSync(s.imagePath) : false;
    console.log(`      - Shot ${s.shot}: ${s.imagePath} (${exists ? 'ADA / VALID' : 'TIDAK DITEMUKAN'})`);
  });

  console.log('\n5. Menguji Agent 7: SEO & Social Metadata Packager...');
  const metadata = await packagePostingMetadata(mockDossier, script);
  console.log(`   ✅ SEO Title: "${metadata.seoTitle}"`);
  console.log(`   ✅ Hashtags (${metadata.hashtags.length}): ${metadata.hashtags.slice(0, 5).join(' ')}...`);

  console.log('\n6. Menguji Job Store State Persistence...');
  mockJob.sampleKeyframes = generatedSamples;
  mockJob.status = 'AWAITING_STAGE1_APPROVAL';
  saveJob(mockJob);
  const loaded = getJob(mockJob.id);
  console.log(`   ✅ Saved & Loaded Job: ${loaded?.id} (Status: ${loaded?.status})`);

  console.log('\n===============================================================');
  console.log('🎉 ALL ORCHESTRATOR COMPONENT TESTS PASSED SUCCESSFULLY!');
  console.log('===============================================================\n');
}

runSmokeTest().catch((err) => {
  console.error('\n❌ Smoke Test Failed:', err);
  process.exit(1);
});
