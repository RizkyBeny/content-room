import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { generateHyperframesProject, StoryboardScene } from '../lib/hyperframes/templateGenerator';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import ffprobe from '@ffprobe-installer/ffprobe';

async function main() {
  console.log('=== Vox Archival Parallax Template Smoke Test ===\n');

  const testDir = path.join(process.cwd(), 'hyperframes-workspace', 'vox-archival-test');
  const snapshotsDir = path.join(process.cwd(), 'public', 'renders', 'vox-archival-test', 'snapshots');
  const artifactSnapshotsDir = path.join(
    '/Users/beny/.gemini/antigravity/brain/73c13ef1-4f15-45dc-a827-d5f734a1d787',
    'snapshots-vox'
  );

  fs.mkdirSync(testDir, { recursive: true });
  fs.mkdirSync(snapshotsDir, { recursive: true });
  fs.mkdirSync(artifactSnapshotsDir, { recursive: true });

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
      assetPath: '/Users/beny/flow-mcp-out/vox-bea-cukai-test/scene-01.jpeg',
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
      assetType: 'graphic_only',
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
      assetType: 'graphic_only',
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
      assetType: 'graphic_only',
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
      assetType: 'graphic_only',
    },
  ];

  console.log('1. Menghasilkan kode proyek HyperFrames Vox Archival Parallax...');
  const htmlPath = generateHyperframesProject({
    jobId: 'vox-archival-test',
    title: 'Vox Archival Parallax: Rokok Ilegal & Bea Cukai',
    themePresetId: 'vox-archival-parallax',
    totalDurationMs: 36000,
    scenes,
    outputDir: testDir,
  });

  console.log(`Proyek selesai dibuat di: ${htmlPath}`);

  console.log('\n2. Menjalankan hyperframes snapshot untuk mengambil visual keyframe...');
  // Capture keyframes at t = 3.5s (s1), 10.5s (s2), 18.0s (s3), 25.5s (s4), 32.5s (s5)
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

  console.log(`\n3. Menyalin snapshots ke artifact folder: ${artifactSnapshotsDir}`);
  const snapshotFiles = fs.readdirSync(snapshotsDir);
  for (const file of snapshotFiles) {
    if (file.endsWith('.png') || file.endsWith('.jpg')) {
      const src = path.join(snapshotsDir, file);
      const dst = path.join(artifactSnapshotsDir, file);
      fs.copyFileSync(src, dst);
      console.log(` - Tersalin: ${file}`);
    }
  }

  console.log('\n✅ Uji Coba Vox Archival Parallax Sukses!');
}

main().catch((err) => {
  console.error('\n❌ Terjadi kesalahan:', err);
  process.exit(1);
});
