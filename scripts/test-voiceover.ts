import fs from 'node:fs';
import path from 'node:path';
import { generateAudioAndAlignment } from '../lib/flowMcp/audioPipeline';

async function main() {
  const customText = process.argv[2] ||
    'Pemerintah resmi memberlakukan penyesuaian tarif bea cukai untuk barang impor kiriman e-commerce demi melindungi pelaku UMKM lokal.';
  const voice = process.argv[3] || 'Puck';

  console.log('=== Synthesizing Voice Over ===');
  console.log('Voice:', voice);
  console.log('Text:', customText);

  const outDir = path.resolve(process.cwd(), 'public', 'renders', 'voice-samples');
  fs.mkdirSync(outDir, { recursive: true });

  const result = await generateAudioAndAlignment(customText, {
    voice,
    outputDir: outDir,
  });

  console.log('\n✅ Voice Over Berhasil Dibuat:');
  console.log('Audio file:', result.audioPath);
  console.log('Durasi:', (result.durationMs / 1000).toFixed(2), 'detik');
  console.log('Word count:', result.words.length);
}

main().catch((err) => {
  console.error('❌ Gagal:', err);
  process.exit(1);
});
