import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { callDeepSeek } from '../lib/llm/deepseek';

async function main() {
  console.log('=== DeepSeek LLM Connectivity Test ===\n');
  console.log('Base URL:', process.env.DEEPSEEK_BASE_URL);
  console.log('Model:', process.env.DEEPSEEK_MODEL || 'deepseek-chat');
  console.log('API Key present:', Boolean(process.env.DEEPSEEK_API_KEY));

  try {
    const response = await callDeepSeek([
      { role: 'system', content: 'Kamu adalah asisten AI yang cerdas dan ringkas.' },
      { role: 'user', content: 'Halo DeepSeek! Jelaskan dalam 1 kalimat apa itu video explainer.' },
    ]);

    console.log('\n✅ Respons DeepSeek:');
    console.log(response);
    console.log('\n=== DeepSeek Siap Digunakan! ===');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('\n❌ Gagal menghubungi DeepSeek:', msg);
  }
}

main().catch(console.error);

