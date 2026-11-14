import { flowClient } from '../lib/flowMcp/client';

async function main() {
  console.log('=== Test Generasi Keyframe via GTAI-1/flow-mcp ===\n');

  console.log('1. Memeriksa status Google Flow Session...');
  const status = await flowClient.getStatus();
  console.log('Status Akun:', {
    plan: status.plan,
    signedIn: status.signedIn,
    credits: status.credits ?? (status as Record<string, unknown>).credits_remaining,
    projectUrl: (status as Record<string, unknown>).url,
  });

  const prompt =
    'A high-end editorial 2.5D documentary photo collage in the distinctive Vox visual journalism style, vertical 9:16 composition. An investigative desk setup examining illegal cigarette trade in Indonesia. In the midground, an iconic vintage tape recorder and thick manila folder marked with a red rubber stamp. In the foreground, torn edges of archival paper and a brass magnifying glass create strong foreground depth. In the background, shadowy institutional louvre blinds fade softly into warm atmospheric shadow. Tactile matte paper archival aesthetic, subtle 35mm film grain, dramatic documentary lighting with volumetric warm desk lamp glow. The top 35% of the frame is clean, dark, uncluttered negative space. Clean, realistic, editorial journalism collage, no floating text or subtitles.';

  console.log('\n2. Mengantrekan pembuatan keyframe gambar 9:16 via flow-mcp (type: image)...');
  const result = await flowClient.generate({
    project: 'vox-bea-cukai-test',
    prompt,
    type: 'image',
    aspect: '9:16',
    max_credits: 0,
  });

  console.log('Hasil antrean:', result);

  if (!result.task_id) {
    throw new Error('Tidak mendapatkan task_id dari Flow MCP.');
  }

  console.log(`\n3. Menunggu pengerjaan di Google Flow (Task ID: ${result.task_id})...`);
  const waitResult = await flowClient.waitForJob(result.task_id, 180);
  console.log('\n✅ Pengerjaan Selesai!');
  console.log('Hasil:', waitResult);
}

main().catch((err) => {
  console.error('\n❌ Terjadi kesalahan:', err);
  process.exit(1);
});

