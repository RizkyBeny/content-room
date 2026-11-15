import fs from 'node:fs';
import path from 'node:path';
import { ORCHESTRATOR_CONFIG } from '../config';

export interface TelegramInlineButton {
  text: string;
  callback_data: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; username?: string; first_name?: string };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: { id: number; username?: string };
    message?: {
      message_id: number;
      chat: { id: number };
      text?: string;
    };
    data?: string;
  };
}

export class TelegramBotService {
  private botToken: string;
  private baseUrl: string;
  private isPolling = false;

  constructor(token = ORCHESTRATOR_CONFIG.telegram.botToken) {
    this.botToken = token;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  isConfigured(): boolean {
    return Boolean(this.botToken && this.botToken.length > 10);
  }

  async getMe(): Promise<{ ok: boolean; result?: { username: string; id: number } }> {
    try {
      const res = await fetch(`${this.baseUrl}/getMe`, { signal: AbortSignal.timeout(10000) });
      return await res.json();
    } catch {
      return { ok: false };
    }
  }

  async sendChatAction(
    chatId: number | string,
    action: 'typing' | 'upload_photo' | 'upload_video' | 'record_voice' | 'upload_document' = 'typing'
  ): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/sendChatAction`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action }),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      // Ignore chat action failures
    }
  }

  async sendMessage(
    chatId: number | string,
    text: string,
    buttons?: TelegramInlineButton[][]
  ): Promise<{ ok: boolean; result?: { message_id: number } }> {
    try {
      const payload: Record<string, unknown> = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      };
      if (buttons && buttons.length > 0) {
        payload.reply_markup = {
          inline_keyboard: buttons,
        };
      }

      const res = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      return await res.json();
    } catch (err) {
      console.error('[TelegramBot] Error sending message:', err);
      return { ok: false };
    }
  }

  async sendPhoto(
    chatId: number | string,
    photoPath: string,
    caption?: string
  ): Promise<{ ok: boolean; result?: { message_id: number } }> {
    try {
      const form = new FormData();
      form.append('chat_id', String(chatId));
      if (caption) {
        form.append('caption', caption);
        form.append('parse_mode', 'HTML');
      }

      const buffer = fs.readFileSync(photoPath);
      const blob = new Blob([buffer]);
      form.append('photo', blob, path.basename(photoPath));

      const res = await fetch(`${this.baseUrl}/sendPhoto`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(30000),
      });
      return await res.json();
    } catch (err) {
      console.error('[TelegramBot] Error sending photo:', err);
      return { ok: false };
    }
  }

  async sendMediaGroup(
    chatId: number | string,
    photos: Array<{ path: string; caption?: string }>
  ): Promise<{ ok: boolean }> {
    try {
      const form = new FormData();
      form.append('chat_id', String(chatId));

      const mediaPayload = photos.map((p, idx) => {
        const attachName = `photo_${idx}`;
        const buffer = fs.readFileSync(p.path);
        const blob = new Blob([buffer]);
        form.append(attachName, blob, path.basename(p.path));

        return {
          type: 'photo',
          media: `attach://${attachName}`,
          caption: p.caption,
          parse_mode: 'HTML',
        };
      });

      form.append('media', JSON.stringify(mediaPayload));

      const res = await fetch(`${this.baseUrl}/sendMediaGroup`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      return { ok: Boolean(data.ok) };
    } catch (err) {
      console.warn('[TelegramBot] sendMediaGroup error, fallback to sequential sendPhoto:', err);
      // Fallback: kirim satu per satu
      for (const p of photos) {
        await this.sendPhoto(chatId, p.path, p.caption);
      }
      return { ok: true };
    }
  }

  async sendVideo(
    chatId: number | string,
    videoPath: string,
    caption?: string
  ): Promise<{ ok: boolean; result?: { message_id: number } }> {
    try {
      const form = new FormData();
      form.append('chat_id', String(chatId));
      if (caption) {
        form.append('caption', caption);
        form.append('parse_mode', 'HTML');
      }

      const buffer = fs.readFileSync(videoPath);
      const blob = new Blob([buffer]);
      form.append('video', blob, path.basename(videoPath));

      const res = await fetch(`${this.baseUrl}/sendVideo`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(180000), // 3 minutes timeout for video upload
      });
      const data = await res.json();
      if (!data.ok) {
        console.warn('[TelegramBot] sendVideo returned error, trying sendDocument as fallback:', data);
        return this.sendDocument(chatId, videoPath, caption);
      }
      return data;
    } catch (err) {
      console.warn('[TelegramBot] sendVideo exception, trying sendDocument fallback:', err);
      return this.sendDocument(chatId, videoPath, caption);
    }
  }

  async sendDocument(
    chatId: number | string,
    filePath: string,
    caption?: string
  ): Promise<{ ok: boolean; result?: { message_id: number } }> {
    try {
      const form = new FormData();
      form.append('chat_id', String(chatId));
      if (caption) {
        form.append('caption', caption);
        form.append('parse_mode', 'HTML');
      }

      const buffer = fs.readFileSync(filePath);
      const blob = new Blob([buffer]);
      form.append('document', blob, path.basename(filePath));

      const res = await fetch(`${this.baseUrl}/sendDocument`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(180000),
      });
      return await res.json();
    } catch (err) {
      console.error('[TelegramBot] Error sending document:', err);
      return { ok: false };
    }
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text || 'Pilihan Anda sedang diproses...',
        }),
      });
    } catch (err) {
      console.warn('[TelegramBot] Error answering callback query:', err);
    }
  }

  /**
   * Long-polling loop untuk mendengarkan pesan dan callback pengguna
   */
  async startPolling(
    handlers: {
      onUrlReceived: (chatId: number | string, url: string) => Promise<void>;
      onCallbackReceived: (chatId: number | string, callbackData: string, queryId: string) => Promise<void>;
      onCommandReceived?: (chatId: number | string, command: string) => Promise<void>;
    }
  ): Promise<void> {
    if (this.isPolling) return;
    this.isPolling = true;

    let offset = 0;
    console.log('[TelegramBot] Memulai listener polling Telegram...');

    while (this.isPolling) {
      try {
        const res = await fetch(`${this.baseUrl}/getUpdates?offset=${offset}&timeout=20`, {
          signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) {
          await new Promise((r) => setTimeout(r, 4000));
          continue;
        }

        const data = (await res.json()) as { ok: boolean; result: TelegramUpdate[] };
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            offset = update.update_id + 1;

            // Handle Callback Query (Klik tombol inline)
            if (update.callback_query?.data && update.callback_query.message) {
              const query = update.callback_query;
              const chatId = query.message?.chat.id || query.from.id;
              await this.answerCallbackQuery(query.id);
              await handlers.onCallbackReceived(chatId, query.data!, query.id);
              continue;
            }

            // Handle Text Message
            if (update.message?.text) {
              const text = update.message.text.trim();
              const chatId = update.message.chat.id;

              // Check authorized chat id jika dikonfigurasi
              if (
                ORCHESTRATOR_CONFIG.telegram.authorizedChatId &&
                String(chatId) !== String(ORCHESTRATOR_CONFIG.telegram.authorizedChatId)
              ) {
                await this.sendMessage(
                  chatId,
                  `⛔ <b>Akses Terbatas:</b> Bot ini dikonfigurasi khusus untuk pengguna berwenang.\nChat ID Anda: <code>${chatId}</code>`
                );
                continue;
              }

              // Deteksi URL
              const urlMatch = text.match(/https?:\/\/[^\s]+/i);
              if (urlMatch) {
                const targetUrl = urlMatch[0];
                await handlers.onUrlReceived(chatId, targetUrl);
              } else if (text.startsWith('/')) {
                handlers.onCommandReceived?.(chatId, text);
              } else {
                await this.sendMessage(
                  chatId,
                  '👋 <b>Selamat datang di True Crime Content Orchestrator!</b>\n\n' +
                  'Kirimkan tautan artikel kasus (misal: Kompas, Detik, Kumparan, dll.) ke sini.\n' +
                  'Sistem akan otomatis mengekstrak berkas perkara, menyusun naskah neo-noir, dan men-generate 5 keyframe sampel untuk persetujuan Anda.'
                );
              }
            }
          }
        }
      } catch (err: unknown) {
        if (!this.isPolling) break;
        // Tunggu sebentar jika network timeout atau disconnect
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  stopPolling(): void {
    this.isPolling = false;
  }
}

export const telegramBot = new TelegramBotService();
