import { ExtractedArticle } from '../pipeline/articleExtractor';
import { PlannedAngle } from '../pipeline/anglePlanner';
import { ExplainerScript, ScriptSentence } from '../pipeline/scriptWriter';

function getDeepSeekConfig() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  };
}

export async function callDeepSeek(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature = 0.7
): Promise<string> {
  const { apiKey, baseUrl, model } = getDeepSeekConfig();

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY tidak dikonfigurasi di environment atau .env.local');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`DeepSeek API Error (HTTP ${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('DeepSeek tidak mengembalikan teks respons');
  }

  return content.trim();
}

/**
 * Plan Angle menggunakan DeepSeek LLM
 */
export async function planAngleWithDeepSeek(
  article: ExtractedArticle,
  brief?: string
): Promise<PlannedAngle> {
  const { apiKey } = getDeepSeekConfig();
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const prompt = `Kamu adalah Lead Editorial Video Producer untuk media berita modern.
Tugasmu: Tentukan angle paling memikat untuk video narasi explainer vertikal 9:16 (durasi 45-60 detik) berdasarkan artikel berikut.

Judul Artikel: "${article.title}"
Lead Berita: "${article.leadParagraph}"
Data Angka/Statistik: ${article.numbers.join(', ') || 'Tidak ada angka spesifik'}
Kutipan: ${article.quotes.join(' | ') || 'Tidak ada'}
${brief ? `Instruksi Khusus / Intent User: "${brief}"` : ''}

Format output HARUS JSON valid dengan struktur:
{
  "name": "Nama angle singkat (maksimal 4 kata)",
  "rationale": "Penjelasan mengapa angle ini dipilih dan relevan bagi penonton (1-2 kalimat)",
  "hookType": "surprising-statistic" | "urgent-question" | "key-impact" | "direct-quote"
}`;

  const raw = await callDeepSeek([
    { role: 'system', content: 'Kamu adalah produser konten video viral berita. Selalu balas dalam format JSON murni tanpa markdown formatting backticks jika memungkinkan.' },
    { role: 'user', content: prompt },
  ]);

  try {
    const cleanJson = raw.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      name: parsed.name || 'Sorotan Berita Terkini',
      rationale: parsed.rationale || 'Struktur explainer standar fokus pada esensi isu.',
      hookType: parsed.hookType || 'key-impact',
    };
  } catch {
    return {
      name: 'Sorotan Berita Utama',
      rationale: 'Angle disusun berdasarkan intisari artikel berita terkini.',
      hookType: 'key-impact',
    };
  }
}

/**
 * Menulis Script Narasi Explainer 45-60 detik menggunakan DeepSeek LLM
 */
export async function writeScriptWithDeepSeek(
  article: ExtractedArticle,
  angle: PlannedAngle
): Promise<ExplainerScript> {
  const { apiKey } = getDeepSeekConfig();
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const prompt = `Kamu adalah naskah writer profesional untuk video explainer vertikal (TikTok/Reels/Shorts).
Tulis naskah narasi suara (Voice Over) Bahasa Indonesia yang padat, mengalir alami, dan memikat penonton.

Panduan Wajib:
1. Total kata HARUS antara 110 hingga 140 kata (agar pas di durasi 45-55 detik dengan kecepatan normal 2.5 kata/detik). Maksimal keras 145 kata!
2. Bagi naskah menjadi tepat 5 beat/kalimat:
   - Kalimat 1 (Hook): Pembuka tajam yang menghentikan scroll (${angle.hookType}).
   - Kalimat 2 (Konteks): Penjelasan latar belakang isu utama.
   - Kalimat 3 (Data/Fakta): Rincian angka atau kutipan penting dari artikel.
   - Kalimat 4 (Dampak): Mengapa hal ini penting dan dampaknya bagi masyarakat.
   - Kalimat 5 (Outro): Call-to-action singkat dan pertanyaan pemicu interaksi komentar.
3. Seluruh fakta, angka, dan nama HARUS bersumber langsung dari artikel, dilarang halusinasi!

Artikel:
Judul: ${article.title}
Isi: ${article.paragraphs.join(' ')}
Angle terpilih: ${angle.name} (${angle.rationale})

Keluarkan format JSON murni:
{
  "sentences": [
    { "id": "s1", "text": "..." },
    { "id": "s2", "text": "..." },
    { "id": "s3", "text": "..." },
    { "id": "s4", "text": "..." },
    { "id": "s5", "text": "..." }
  ]
}`;

  const raw = await callDeepSeek([
    { role: 'system', content: 'Kamu adalah scriptwriter video explainer. Hasilkan naskah yang sangat engaging dalam Bahasa Indonesia santun namun lugas. Output JSON valid murni.' },
    { role: 'user', content: prompt },
  ]);

  try {
    const cleanJson = raw.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    const sentences: ScriptSentence[] = parsed.sentences.map((s: { id: string; text: string }, i: number) => ({
      id: s.id || `s${i + 1}`,
      text: s.text.trim(),
      wordCount: s.text.trim().split(/\s+/).filter(Boolean).length,
    }));

    const fullText = sentences.map((s) => s.text).join(' ');
    const totalWords = sentences.reduce((sum, s) => sum + s.wordCount, 0);
    const estimatedDurationSec = Math.round((totalWords / 2.5) * 10) / 10;

    return {
      sentences,
      fullText,
      totalWords,
      estimatedDurationSec,
      isDurationValid: estimatedDurationSec <= 60,
    };
  } catch (err) {
    throw new Error(`Gagal memparsing naskah dari DeepSeek: ${err instanceof Error ? err.message : String(err)}`);
  }
}
