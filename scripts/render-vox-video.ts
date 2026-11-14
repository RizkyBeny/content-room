import path from 'node:path';
import fs from 'node:fs';
import { generateHyperframesProject, StoryboardScene } from '../lib/hyperframes/templateGenerator';
import { renderHyperframes } from '../lib/hyperframes/renderEngine';

async function main() {
  console.log('=== Render Video HyperFrames (Vox 2.5D Archival Camera Movement) ===\n');

  const testDir = path.join(process.cwd(), 'hyperframes-workspace', 'vox-archival-test');
  const outputVideo = path.join(process.cwd(), 'public', 'renders', 'vox-archival-test', 'vox-explainer-output.mp4');
  const artifactVideo = path.join(
    '/Users/beny/.gemini/antigravity/brain/73c13ef1-4f15-45dc-a827-d5f734a1d787',
    'vox-explainer-output.mp4'
  );

  const scenes: StoryboardScene[] = [
    {
      id: 's1',
      beat: 'hook',
      start_ms: 0,
      end_ms: 5000,
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
      start_ms: 5000,
      end_ms: 10000,
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
      assetPath: '/Users/beny/flow-mcp-out/vox-bea-cukai-test/scene-02.jpeg',
    },
    {
      id: 's3',
      beat: 'problem',
      start_ms: 10000,
      end_ms: 15000,
      kicker: 'ANOMALI PENERIMAAN CUKAI',
      headline: 'Penerimaan Cukai Nyaris Mandek: Hanya Naik 0,9%',
      subtext: 'Tarif cukai tembakau tidak naik tahun 2026, memicu pergeseran pola beli.',
      metric: '+0,9%',
      metricLabel: 'Pertumbuhan Cukai',
      stampText: 'DEKLASIFIKASI',
      documentNumber: 'KMP-BC-2026-03',
      evidenceSource: 'Laporan Pajak & Cukai 2026',
      evidenceSummary: 'Penerimaan cukai tertahan di angka Rp 180,4 triliun.',
      parallaxVariant: 'macro-dossier',
      assetType: 'image',
      assetPath: '/Users/beny/flow-mcp-out/vox-bea-cukai-test/scene-03.jpeg',
    },
    {
      id: 's4',
      beat: 'evidence',
      start_ms: 15000,
      end_ms: 20000,
      kicker: 'INTELIJEN LAPANGAN',
      headline: '17.108 Kali Penindakan Rokok Ilegal Tanpa Cukai',
      subtext: 'Distribusi gelap bergeser ke ekspedisi kilat dan pelabuhan tikus.',
      metric: '17.108x',
      metricLabel: 'Giat Operasi Gabungan',
      stampText: 'RAHASIA',
      documentNumber: 'KMP-BC-2026-04',
      evidenceSource: 'Satgas Penindakan Bea Cukai',
      evidenceSummary: 'Potensi kerugian negara yang diselamatkan mencapai Rp 2,3 T.',
      parallaxVariant: 'investigative-desk',
      assetType: 'image',
      assetPath: '/Users/beny/flow-mcp-out/vox-bea-cukai-test/scene-04.jpeg',
    },
    {
      id: 's5',
      beat: 'resolution',
      start_ms: 20000,
      end_ms: 25000,
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
      assetPath: '/Users/beny/flow-mcp-out/vox-bea-cukai-test/scene-05.jpeg',
    },
  ];

  console.log('1. Menghasilkan kode proyek HyperFrames dengan koreografi kamera 2.5D...');
  const { htmlPath } = generateHyperframesProject({
    jobId: 'vox-archival-test',
    title: 'Vox Archival Parallax: Rokok Ilegal & Bea Cukai',
    themePresetId: 'vox-archival-parallax',
    totalDurationMs: 25000, // 25 detik (5 detik per scene, ringkas dan cepat dirender)
    scenes,
    outputDir: testDir,
  });

  console.log(`Proyek diperbarui di: ${htmlPath}`);

  console.log('\n2. Menjalankan renderHyperframes (MP4 1080x1920 @ 30 FPS)...');
  const startTime = Date.now();

  const result = await renderHyperframes({
    projectDir: testDir,
    outputPath: outputVideo,
    fps: 30,
    onProgress: (p) => process.stdout.write(p),
  });

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n\n✅ Render Berhasil Selesai dalam ${durationSec} detik!`);
  console.log('Output Video:', result.outputPath);

  // Copy to artifacts
  fs.copyFileSync(outputVideo, artifactVideo);
  const stats = fs.statSync(artifactVideo);
  console.log(`Salinan Artifact: ${artifactVideo} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
}

main().catch((err) => {
  console.error('\n❌ Terjadi kesalahan saat rendering:', err);
  process.exit(1);
});
