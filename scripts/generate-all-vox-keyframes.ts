import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { flowClient } from '../lib/flowMcp/client';
import { generateHyperframesProject, StoryboardScene } from '../lib/hyperframes/templateGenerator';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import ffprobe from '@ffprobe-installer/ffprobe';

async function main() {
  console.log('=== Generasi Lengkap 5 Keyframe Vox Archival via GTAI-1/flow-mcp ===\n');

  const project = 'vox-bea-cukai-test';
  const outDir = path.join('/Users/beny/flow-mcp-out', project);
  fs.mkdirSync(outDir, { recursive: true });

  const scenesPromptData = [
    {
      id: 's1',
      stem: 'scene-01.jpeg',
      prompt:
        'A high-end editorial 2.5D documentary photo collage in the distinctive Vox visual journalism style, vertical 9:16 composition. An investigative desk setup examining illegal cigarette trade in Indonesia. In the midground, an iconic vintage tape recorder and thick manila folder marked with a red rubber stamp. In the foreground, torn edges of archival paper and a brass magnifying glass create strong foreground depth. In the background, shadowy institutional louvre blinds fade softly into warm atmospheric shadow. Tactile matte paper archival aesthetic, subtle 35mm film grain, dramatic documentary lighting with volumetric warm desk lamp glow. The top 35% of the frame is clean, dark, uncluttered negative space. Clean, realistic, editorial journalism collage, no floating text or subtitles.',
    },
    {
      id: 's2',
      stem: 'scene-02.jpeg',
      prompt:
        'A high-end editorial 2.5D documentary photo collage in the distinctive Vox visual journalism style, vertical 9:16 composition. An investigative archival desk setup examining Indonesian state revenue and customs collection reaching 267.2 trillion rupiah. In the midground, official ledger books, vintage financial documents with red data charts, and a vintage analog calculating machine with brass keys. In the foreground, torn edges of official state gazette papers and an ink fountain pen. In the background, tall government ministry archival shelves and soft chiaroscuro lamp lighting. The top 35% of the frame is dark, clean negative space. Editorial documentary collage, authentic historical look, no floating text or subtitles.',
    },
    {
      id: 's3',
      stem: 'scene-03.jpeg',
      prompt:
        'A high-end editorial 2.5D documentary photo collage in the distinctive Vox visual journalism style, vertical 9:16 composition. An investigative macro archive setup examining tobacco excise tax stagnation at 0.9 percent growth. In the midground, an iconic vintage reel-to-reel magnetic tape recorder next to a thick manila dossier marked with an official red ink stamp. Beside the file are macro tax tariff charts and tobacco trade receipts with paperclip attachments. In the foreground, dark telephone wire coils and torn archival paper. In the background, shadowy office blinds fade softly into warm atmospheric glow. Rich 35mm film texture, chiaroscuro lighting, distinct 3-plane depth. The top 35% is clean, dark negative space. Editorial documentary collage, no floating letters.',
    },
    {
      id: 's4',
      stem: 'scene-04.jpeg',
      prompt:
        'A high-end editorial 2.5D documentary photo collage in the distinctive Vox visual journalism style, vertical 9:16 composition. An intelligence field operation desk setup examining 17,108 customs raids against illicit cigarette smuggling. In the midground, vintage surveillance radio equipment with analog dials, wiretapping headsets, and black-and-white cutout photos of coastal patrol vessels and shipping containers. In the foreground, a dark coiled telephone cord, magnifying glass, and torn nautical shipping charts. In the background, aged Indonesian newspaper clippings and atmospheric shadows. Rich documentary photojournalism feel, 35mm film grain, chiaroscuro lighting. Top 35% is dark clean negative space. No floating text.',
    },
    {
      id: 's5',
      stem: 'scene-05.jpeg',
      prompt:
        'A high-end editorial 2.5D documentary photo collage in the distinctive Vox visual journalism style, vertical 9:16 composition. A concluding investigative dossier setup examining fiscal resilience and national budget compliance reaching 83.2 percent of APBN. In the midground, a master leather-bound national budget folio with red ribbons, archival stamps, and official seals. In the foreground, antique brass scales of justice and torn aged paper. In the background, warm tungsten desk lamp glow illuminating institutional library archives. Rich tactile archival look, dramatic documentary lighting, top 35% dark clean negative space. No floating text.',
    },
  ];

  console.log('1. Memeriksa keberadaan file yang sudah di-generate sebelumnya...');
  const generatedFiles: Record<string, string> = {};

  for (const s of scenesPromptData) {
    const localTarget = path.join(outDir, s.stem);
    if (fs.existsSync(localTarget)) {
      console.log(` - ${s.id} sudah ada: ${localTarget}`);
      generatedFiles[s.id] = localTarget;
    } else {
      console.log(` - ${s.id} belum ada, mengantrekan ke Flow MCP...`);
      const res = await flowClient.generate({
        project,
        prompt: s.prompt,
        type: 'image',
        aspect: '9:16',
        max_credits: 0,
      });

      if (!res.task_id) {
        throw new Error(`Gagal mengantrekan ${s.id}`);
      }
      console.log(`   Task ID: ${res.task_id}, menunggu hasil...`);
      const waitRes = await flowClient.waitForJob(res.task_id, 180);
      if (waitRes.files && waitRes.files[0]) {
        console.log(`   ✅ Selesai: ${waitRes.files[0]}`);
        generatedFiles[s.id] = waitRes.files[0];
      } else {
        throw new Error(`Gagal mendapatkan file gambar untuk ${s.id}: ${waitRes.error}`);
      }
    }
  }

  console.log('\n2. Menyiapkan Storyboard Scenes dengan Background Plates dari Flow...');
  const scenes: StoryboardScene[] = [
    {
      id: 's1',
      beat: 'hook',
      start_ms: 0,
      end_ms: 7000,
      kicker: 'DOSIR KHUSUS: PENINDAKAN CUKAI',
      headline: 'Rokok Ilegal Melonjak 80%: Perburuan 1,7 Miliar Batang',
      subtext: 'Operasi penindakan rokok ilegal meledak drastis di berbagai perbatasan nusantara.',
      metric: '1,7 MILIAR',
      metricLabel: 'Batang Disita',
      stampText: 'RAHASIA',
      documentNumber: 'KMP-BC-2026-01',
      evidenceSource: 'Kemenkeu RI / Ditjen Bea Cukai',
      evidenceSummary: '17.108 kali operasi penindakan dilakukan hingga Oktober 2026.',
      parallaxVariant: 'macro-dossier',
      assetType: 'image',
      assetPath: generatedFiles['s1'],
    },
    {
      id: 's2',
      beat: 'context',
      start_ms: 7000,
      end_ms: 14000,
      kicker: 'NERACA PENERIMAAN NEGARA',
      headline: 'Penerimaan Bea Cukai Capai Rp 267,2 Triliun',
      subtext: 'Tumbuh 7,2% secara tahunan di tengah maraknya peredaran barang tanpa cukai.',
      metric: 'Rp 267,2 T',
      metricLabel: 'Penerimaan s.d. Okt 2026',
      stampText: 'VERIFIKASI',
      documentNumber: 'KMP-BC-2026-02',
      evidenceSource: 'Katalog Data APBN Kita',
      evidenceSummary: 'Realisasi penerimaan mencapai 83,2% dari target APBN 2026.',
      parallaxVariant: 'investigative-desk',
      assetType: 'image',
      assetPath: generatedFiles['s2'],
    },
    {
      id: 's3',
      beat: 'problem',
      start_ms: 14000,
      end_ms: 22000,
      kicker: 'ANOMALI PENERIMAAN CUKAI',
      headline: 'Penerimaan Cukai Nyaris Mandek: Hanya Naik 0,9%',
      subtext: 'Tarif cukai hasil tembakau tidak dinaikkan tahun 2026, memicu pergeseran pola beli.',
      metric: '+0,9%',
      metricLabel: 'Pertumbuhan Cukai',
      stampText: 'DEKLASIFIKASI',
      documentNumber: 'KMP-BC-2026-03',
      evidenceSource: 'Laporan Pajak & Cukai 2026',
      evidenceSummary: 'Penerimaan cukai tertahan di angka Rp 180,4 triliun.',
      parallaxVariant: 'macro-dossier',
      assetType: 'image',
      assetPath: generatedFiles['s3'],
    },
    {
      id: 's4',
      beat: 'evidence',
      start_ms: 22000,
      end_ms: 29000,
      kicker: 'INTELIJEN LAPANGAN',
      headline: '17.108 Kali Penindakan Rokok Ilegal Tanpa Cukai',
      subtext: 'Distribusi gelap bergeser ke jasa ekspedisi kilat dan pelabuhan rakyat tak resmi.',
      metric: '17.108x',
      metricLabel: 'Giat Operasi Gabungan',
      stampText: 'RAHASIA',
      documentNumber: 'KMP-BC-2026-04',
      evidenceSource: 'Satgas Penindakan Bea Cukai',
      evidenceSummary: 'Potensi kerugian negara yang diselamatkan mencapai Rp 2,3 T.',
      parallaxVariant: 'investigative-desk',
      assetType: 'image',
      assetPath: generatedFiles['s4'],
    },
    {
      id: 's5',
      beat: 'resolution',
      start_ms: 29000,
      end_ms: 36000,
      kicker: 'KESIMPULAN INVESTIGASI',
      headline: 'Tantangan Kepatuhan Pajak & Ketahanan Fiskal 2026',
      subtext: 'Penegakan hukum agresif menjadi benteng utama menjaga stabilitas anggaran negara.',
      metric: '83,2%',
      metricLabel: 'Target APBN Terpenuhi',
      stampText: 'DEKLASIFIKASI',
      documentNumber: 'KMP-BC-2026-05',
      evidenceSource: 'Kumparan Bisnis Explainer',
      evidenceSummary: 'Analisis komprehensif penerimaan bea cukai & rokok ilegal.',
      parallaxVariant: 'macro-dossier',
      assetType: 'image',
      assetPath: generatedFiles['s5'],
    },
  ];

  const testDir = path.join(process.cwd(), 'hyperframes-workspace', 'vox-archival-test');
  const snapshotsDir = path.join(process.cwd(), 'public', 'renders', 'vox-archival-test', 'snapshots');
  const artifactSnapshotsDir = path.join(
    '/Users/beny/.gemini/antigravity/brain/73c13ef1-4f15-45dc-a827-d5f734a1d787',
    'snapshots-vox'
  );

  console.log('\n3. Mengupdate Proyek HyperFrames dengan Plates Flow...');
  generateHyperframesProject({
    jobId: 'vox-archival-test',
    title: 'Vox Archival Parallax: Rokok Ilegal & Bea Cukai',
    themePresetId: 'vox-archival-parallax',
    totalDurationMs: 36000,
    scenes,
    outputDir: testDir,
  });

  console.log('\n4. Mengambil visual keyframe snapshots via hyperframes snapshot...');
  const timestamps = '3.5,10.5,18.0,25.5,32.5';
  const snapshotCmd = `pnpm exec hyperframes snapshot "${testDir}" --at ${timestamps} --no-end -o "${snapshotsDir}"`;

  execSync(snapshotCmd, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HYPERFRAMES_FFMPEG_PATH: ffmpeg.path,
      HYPERFRAMES_FFPROBE_PATH: ffprobe.path,
    },
    stdio: 'inherit',
  });

  console.log('\n5. Menyalin snapshots & raw plates ke folder artifact...');
  const snapshotFiles = fs.readdirSync(snapshotsDir);
  for (const file of snapshotFiles) {
    if (file.endsWith('.png') || file.endsWith('.jpg')) {
      const src = path.join(snapshotsDir, file);
      const dst = path.join(artifactSnapshotsDir, file);
      fs.copyFileSync(src, dst);
      console.log(` - Tersalin: ${file}`);
    }
  }

  // Juga salin raw plates dari Flow
  for (const [id, fPath] of Object.entries(generatedFiles)) {
    const ext = path.extname(fPath);
    const dest = path.join(artifactSnapshotsDir, `flow-plate-${id}${ext}`);
    fs.copyFileSync(fPath, dest);
    console.log(` - Raw Flow Plate ${id} tersalin: ${dest}`);
  }

  console.log('\n🎉 Selesai! Semua 5 keyframe berhasil di-generate dengan Flow MCP & HyperFrames!');
}

main().catch((err) => {
  console.error('\n❌ Terjadi kesalahan:', err);
  process.exit(1);
});

