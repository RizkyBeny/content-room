import path from 'node:path';
import dotenv from 'dotenv';
import { telegramBot } from '../lib/orchestrator/agents/telegramBot';
import { orchestrator } from '../lib/orchestrator/index';
import { flowClient } from '../lib/flowMcp/client';
import { ORCHESTRATOR_CONFIG } from '../lib/orchestrator/config';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function main() {
  console.log('========================================================================');
  console.log('  🕶️  TRUE CRIME NEO-NOIR AUTONOMOUS CONTENT ORCHESTRATOR DAEMON       ');
  console.log('========================================================================\n');

  // 1. Validasi Token Telegram
  if (!telegramBot.isConfigured()) {
    console.error('❌ TELEGRAM_BOT_TOKEN belum disetel di .env.local!');
    console.log('\n💡 CARA MENGATUR TELEGRAM BOT:');
    console.log('   1. Buka Telegram dan cari @BotFather.');
    console.log('   2. Kirim /newbot dan ikuti instruksi hingga mendapat HTTP API token.');
    console.log('   3. Tambahkan ke file .env.local Anda:');
    console.log('      TELEGRAM_BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"');
    console.log('      TELEGRAM_AUTHORIZED_CHAT_ID="<ID_TELEGRAM_ANDA>" (opsional)');
    console.log('   4. Jalankan ulang script ini.\n');
    process.exit(1);
  }

  // 2. Health Check Bot
  console.log('1. Menghubungi Telegram API...');
  const botInfo = await telegramBot.getMe();
  if (!botInfo.ok || !botInfo.result) {
    console.error('❌ Gagal menghubungi bot Telegram dengan token yang diberikan.');
    console.error('   Periksa kembali nilai TELEGRAM_BOT_TOKEN di .env.local\n');
    process.exit(1);
  }

  console.log(`   ✅ Bot Terhubung: @${botInfo.result.username} (ID: ${botInfo.result.id})`);

  // 3. Health Check Flow MCP Server
  console.log('\n2. Memeriksa Google Flow MCP Engine (http://127.0.0.1:8787)...');
  const flowHealth = await flowClient.checkHealth();
  if (flowHealth.ok) {
    console.log('   ✅ Flow MCP daemon aktif dan siap men-generate keyframes!');
  } else {
    console.warn('   ⚠️ Flow MCP sedang offline atau belum dinyalakan.');
    console.log('   (Sistem tetap dapat berjalan dengan local graphic SVG/PNG fallback.');
    console.log("    Untuk hasil visual optimal via Imagen/Veo, jalankan 'pnpm flow:studio' di terminal lain)\n");
  }

  // 4. Memulai Listener Bot
  console.log('3. Daemon aktif! Siap menerima URL kasus kriminal dari Telegram...');
  console.log('------------------------------------------------------------------------');
  console.log('📲 Buka Telegram dan kirimkan tautan artikel berita apa saja ke @' + botInfo.result.username);
  console.log('Tekan Ctrl+C untuk menghentikan daemon.');
  console.log('------------------------------------------------------------------------\n');

  await telegramBot.startPolling({
    onUrlReceived: async (chatId, url) => {
      console.log(`[DAEMON] Menerima URL dari Chat ID ${chatId}: ${url}`);
      await orchestrator.handleArticleUrl(chatId, url);
    },
    onCallbackReceived: async (chatId, callbackData, queryId) => {
      console.log(`[DAEMON] Menerima Callback dari Chat ID ${chatId}: ${callbackData}`);
      const [action, jobId] = callbackData.split(':');

      if (action === 'approve') {
        await orchestrator.handleApproval(chatId, jobId);
      } else if (action === 'regenerate') {
        await orchestrator.handleRegenerate(chatId, jobId);
      } else if (action === 'cancel') {
        await orchestrator.handleCancel(chatId, jobId);
      }
    },
    onCommandReceived: async (chatId, command) => {
      if (command === '/status') {
        await telegramBot.sendMessage(chatId, '🟢 <b>Orchestrator Status:</b> Aktif & Standby 24/7.');
      } else if (command === '/start' || command === '/help') {
        await telegramBot.sendMessage(
          chatId,
          '🕵️‍♂️ <b>True Crime Neo-Noir Video Orchestrator</b>\n\n' +
          'Kirimkan tautan artikel kasus (Kumparan, Detik, Kompas, dll).\n\n' +
          '<b>Alur Kerja:</b>\n' +
          '1. Ekstraksi fakta & penulisan naskah 15 beats.\n' +
          '2. Generasi 5 keyframe kunci (Shot 00 Cover, Hook, Meja Forensik 45°, Modus, Mahkamah).\n' +
          '3. Anda review naskah & 5 foto di sini -> Klik [Approve].\n' +
          '4. Sistem merender MP4 final 1080x1920 (suara dark suspense + autocaption) dan mengirimkannya langsung ke sini!'
        );
      }
    },
  });
}

main().catch((err) => {
  console.error('\n❌ Fatal Daemon Error:', err);
  process.exit(1);
});
