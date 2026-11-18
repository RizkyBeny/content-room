import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

import { synthesizeElevenLabsSentence } from '../lib/elevenlabs/client';

async function main() {
  console.log('========================================================================');
  console.log('  🎙️ TESTING ELEVENLABS TTS API INTEGRATION');
  console.log('========================================================================\n');

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('❌ ELEVENLABS_API_KEY belum terisi di .env.local!');
    console.log('👉 Silakan buka .env.local dan isi: ELEVENLABS_API_KEY="sk_..."\n');
    process.exit(1);
  }

  console.log(`🔑 Key Prefix: ${apiKey.substring(0, 8)}...`);
  console.log(`🗣️ Voice ID  : ${process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'}`);
  console.log(`🤖 Model ID  : ${process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2'}\n`);

  const sampleText = 'Ini adalah uji coba suara narator ElevenLabs untuk video dokumenter kriminal.';
  console.log(`Mencoba sintesis: "${sampleText}"...`);

  const outDir = path.resolve(process.cwd(), 'public', 'renders', 'elevenlabs-test');
  fs.mkdirSync(outDir, { recursive: true });
  const outWav = path.join(outDir, 'test-sample.wav');

  try {
    const res = await synthesizeElevenLabsSentence(sampleText, {
      outputWavPath: outWav,
    });
    console.log(`\n✅ Berhasil! File tersimpan di: ${res.wavPath}`);
    console.log(`⏱️ Durasi: ${res.durationSec.toFixed(2)} detik`);
    console.log('========================================================================\n');
  } catch (err: any) {
    console.error(`\n❌ Gagal: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
