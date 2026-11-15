import path from 'node:path';
import { extractCrimeCaseDossier } from './agents/caseExtractor';
import { planNoirEditorial } from './agents/editorialNoir';
import { writeNoirScript } from './agents/scriptDirector';
import { generateAllKeyframeBlueprints, extractCore5SampleKeyframes } from './agents/blueprintAgent';
import { assetProducer } from './agents/assetProducer';
import { compositorNoir } from './agents/compositorNoir';
import { packagePostingMetadata } from './agents/metadataPackager';
import { telegramBot } from './agents/telegramBot';
import { saveJob, getJob, getActiveJobForChat } from './state/jobStore';
import { OrchestratorJob } from './types';

export class ContentOrchestrator {
  /**
   * Menangani URL artikel baru yang dikirimkan user via Telegram
   */
  async handleArticleUrl(chatId: number | string, url: string): Promise<void> {
    const jobId = `noir_${Date.now()}`;
    const now = new Date().toISOString();

    const job: OrchestratorJob = {
      id: jobId,
      articleUrl: url,
      chatId,
      status: 'ANALYZING_ARTICLE',
      createdAt: now,
      updatedAt: now,
    };
    saveJob(job);

    console.log(`\n===============================================================`);
    console.log(`🚀 [Orchestrator] Memulai Kasus Baru: ${jobId}`);
    console.log(`   URL: ${url}`);
    console.log(`===============================================================`);

    try {
      await telegramBot.sendChatAction(chatId, 'typing');

      // 1. Ekstraksi Kasus
      await telegramBot.sendMessage(
        chatId,
        `🗂️ <b>[BERKAS PERKARA DITERIMA]</b>\n` +
        `🌐 Sumber: <code>${new URL(url).hostname}</code>\n\n` +
        `⏳ <i>[1/3] Menganalisis kronologi perkara & mengekstrak entitas kasus...</i>`
      );

      await telegramBot.sendChatAction(chatId, 'typing');
      const dossier = await extractCrimeCaseDossier(url);
      job.dossier = dossier;
      job.status = 'SCRIPTING';
      saveJob(job);

      // 2. Editorial & Scripting
      await telegramBot.sendChatAction(chatId, 'typing');
      await telegramBot.sendMessage(
        chatId,
        `🔍 <b>[ANALISIS SELESAI: ${escapeHtml(dossier.headline.slice(0, 35))}]</b>\n\n` +
        `⏳ <i>[2/3] Merumuskan angle investigasi & naskah 15-beat Graphic Novel Neo-Noir...</i>`
      );

      const angle = await planNoirEditorial(dossier);
      const script = await writeNoirScript(dossier, angle);
      job.script = script;

      // 3. Blueprints & 5 Sample Keyframes
      const allBlueprints = generateAllKeyframeBlueprints(dossier, angle, script);
      const coreSamples = extractCore5SampleKeyframes(allBlueprints);
      job.allKeyframes = allBlueprints;
      job.sampleKeyframes = coreSamples;
      job.status = 'GENERATING_SAMPLES';
      saveJob(job);

      await telegramBot.sendChatAction(chatId, 'upload_photo');
      await telegramBot.sendMessage(
        chatId,
        `📜 <b>[NASKAH SELESAI: ${script.wordCount} KATA | 15 BEATS]</b>\n\n` +
        `⏳ <i>[3/3] Memanggil Google Flow MCP untuk me-render 5 Keyframe Kunci...</i>`
      );

      // 4. Generate 5 Keyframe Sampel
      const generatedSamples = await assetProducer.generateSampleKeyframes(job);
      job.sampleKeyframes = generatedSamples;
      job.status = 'AWAITING_STAGE1_APPROVAL';
      saveJob(job);

      // 5. Kirim Review Stage 1 ke Telegram
      await this.sendStage1ReviewToTelegram(job);

    } catch (err: unknown) {
      console.error(`[Orchestrator] Gagal memproses artikel:`, err);
      job.status = 'FAILED';
      job.errorMessage = err instanceof Error ? err.message : String(err);
      saveJob(job);

      await telegramBot.sendMessage(
        chatId,
        `❌ <b>Gagal Memproses Berkas:</b>\n<code>${escapeHtml(job.errorMessage)}</code>\n\nSilakan coba kirim ulang tautan artikel.`
      );
    }
  }

  /**
   * Mengirim 5 keyframe dan naskah untuk persetujuan pengguna
   */
  private async sendStage1ReviewToTelegram(job: OrchestratorJob): Promise<void> {
    const samples = job.sampleKeyframes || [];
    const script = job.script!;
    const dossier = job.dossier!;

    // 1. Kirim 5 Foto Keyframe
    const validPhotos = samples
      .filter((s) => s.imagePath)
      .map((s, idx) => ({
        path: s.imagePath!,
        caption: `<b>Frame ${idx + 1}/5</b>: ${escapeHtml(s.label)}`,
      }));

    if (validPhotos.length > 0) {
      await telegramBot.sendMediaGroup(job.chatId, validPhotos);
    }

    // 2. Kirim Naskah & Tombol Inline Action
    const reviewMessage =
      `🗂️ <b>[TAHAP 1: REVIEW BERKAS & KEYFRAME KUNCI]</b>\n\n` +
      `📌 <b>Judul:</b> ${escapeHtml(script.title)}\n` +
      `🏷️ <b>Sub-Headline:</b> ${escapeHtml(script.subHeadline)}\n` +
      `⏱️ <b>Estimasi Durasi:</b> ~${script.targetDurationSec} Detik (15 Beats)\n` +
      `📍 <b>Lokasi:</b> ${escapeHtml(dossier.location)} | <b>Kategori:</b> ${escapeHtml(dossier.crimeType)}\n\n` +
      `📜 <b>Naskah Narasi:</b>\n<i>"${escapeHtml(script.fullText)}"</i>\n\n` +
      `5 Keyframe kunci telah terlampir di atas (Cover Shot 00, Hook TKP, Meja Forensik 45°, Modus/Klimaks, Mahkamah Keadilan).\n\n` +
      `Silakan pilih tindakan:`;

    const buttons = [
      [
        {
          text: '✅ Approve & Render Full Video',
          callback_data: `approve:${job.id}`,
        },
      ],
      [
        {
          text: '🔄 Regenerasi Naskah & Visual',
          callback_data: `regenerate:${job.id}`,
        },
        {
          text: '❌ Batalkan Kasus',
          callback_data: `cancel:${job.id}`,
        },
      ],
    ];

    await telegramBot.sendMessage(job.chatId, reviewMessage, buttons);
  }

  /**
   * Menangani approval pengguna dari Telegram untuk memulai Tahap 2
   */
  async handleApproval(chatId: number | string, jobId: string): Promise<void> {
    const job = getJob(jobId);
    if (!job) {
      await telegramBot.sendMessage(chatId, '⚠️ Berkas pekerjaan tidak ditemukan.');
      return;
    }

    if (job.status === 'COMPLETED') {
      await telegramBot.sendMessage(chatId, '✅ Kasus ini sudah selesai diproduksi sebelumnya.');
      return;
    }

    console.log(`\n===============================================================`);
    console.log(`🎬 [Orchestrator] User Approved Job: ${jobId}`);
    console.log(`===============================================================`);

    try {
      // Step A: Voice Over & Whisper Alignment
      job.status = 'SYNTHESIZING_AUDIO';
      saveJob(job);

      await telegramBot.sendMessage(
        chatId,
        `🚀 <b>[PERSETUJUAN DITERIMA]</b>\n\n` +
        `🎙️ <i>[1/3] Mensintesis Dark Suspense Voiceover & ekstraksi timestamps kata demi kata (Whisper)...</i>`
      );

      const audioResult = await assetProducer.synthesizeVoiceAndAlign(job);
      job.audioPath = audioResult.audioPath;
      job.audioDurationSec = Math.round((audioResult.durationMs / 1000) * 10) / 10;

      // Step B: Lengkapi seluruh 15 Keyframes
      job.status = 'GENERATING_ALL_KEYFRAMES';
      saveJob(job);

      await telegramBot.sendMessage(
        chatId,
        `🎨 <i>[2/3] Melengkapi sisa 10 keyframes visual Graphic Novel Neo-Noir via Flow MCP...</i>`
      );

      const completedKeyframes = await assetProducer.generateAllKeyframes(job);
      job.allKeyframes = completedKeyframes;

      // Step C: Render Deterministic HyperFrames Video
      job.status = 'COMPOSING_VIDEO';
      saveJob(job);

      await telegramBot.sendMessage(
        chatId,
        `🎬 <i>[3/3] Merender video 9:16 final via HyperFrames & FFmpeg (1080x1920 @ 30fps)...</i>`
      );

      const finalVideoPath = await compositorNoir.composeAndRenderVideo(job, audioResult.words, (progress) => {
        console.log(`[Orchestrator] Render Progress: ${progress}`);
      });

      job.finalVideoPath = finalVideoPath;
      job.status = 'PACKAGING_METADATA';
      saveJob(job);

      // Step D: Buat Metadata Posting (SEO Title, Caption, Hashtags)
      const metadata = await packagePostingMetadata(job.dossier!, job.script!);
      job.metadata = metadata;
      job.status = 'DELIVERING_FINAL';
      saveJob(job);

      // Step E: Kirim Hasil Final ke Telegram
      await this.deliverFinalVideoToTelegram(job);

      job.status = 'COMPLETED';
      saveJob(job);

    } catch (err: unknown) {
      console.error(`[Orchestrator] Gagal pada tahap produksi:`, err);
      job.status = 'FAILED';
      job.errorMessage = err instanceof Error ? err.message : String(err);
      saveJob(job);

      await telegramBot.sendMessage(
        chatId,
        `❌ <b>Produksi Video Gagal:</b>\n<code>${escapeHtml(job.errorMessage)}</code>`
      );
    }
  }

  /**
   * Mengirimkan video final 1080x1920 MP4 dan paket metadata ke Telegram
   */
  private async deliverFinalVideoToTelegram(job: OrchestratorJob): Promise<void> {
    const meta = job.metadata!;
    const videoPath = job.finalVideoPath!;

    await telegramBot.sendMessage(
      job.chatId,
      `🎉 <b>[PRODUKSI SELESAI — VIDEO FINAL SIAP POSTING]</b>\n\n` +
      `📌 <b>Rekomendasi Judul:</b>\n<code>${escapeHtml(meta.seoTitle)}</code>\n\n` +
      `📝 <b>Caption Siap Copy:</b>\n${escapeHtml(meta.caption)}\n\n` +
      `🏷️ <b>Hashtags:</b>\n<code>${escapeHtml(meta.hashtags.join(' '))}</code>\n\n` +
      `⏳ <i>Sedang mengunggah file video MP4 1080x1920 kualitas penuh ke chat...</i>`
    );

    // Kirim Video File
    const caption = `🎬 ${meta.seoTitle.slice(0, 80)}\n\n${meta.hashtags.slice(0, 5).join(' ')}`;
    await telegramBot.sendVideo(job.chatId, videoPath, caption);
  }

  /**
   * Menangani regenerasi naskah/visual jika user meminta revisi
   */
  async handleRegenerate(chatId: number | string, jobId: string): Promise<void> {
    const job = getJob(jobId);
    if (!job || !job.articleUrl) return;

    await telegramBot.sendMessage(chatId, '🔄 <i>Memulai ulang penyusunan naskah & kurasi keyframe...</i>');
    await this.handleArticleUrl(chatId, job.articleUrl);
  }

  /**
   * Membatalkan job
   */
  async handleCancel(chatId: number | string, jobId: string): Promise<void> {
    const job = getJob(jobId);
    if (job) {
      job.status = 'CANCELLED';
      saveJob(job);
    }
    await telegramBot.sendMessage(chatId, '🗑️ <b>Kasus berhasil dibatalkan dan diarsipkan.</b>');
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const orchestrator = new ContentOrchestrator();
