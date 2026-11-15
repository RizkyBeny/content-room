import { callDeepSeek } from '../../llm/deepseek';
import { CrimeCaseDossier, NoirScript, PostingMetadata } from '../types';

export async function packagePostingMetadata(
  dossier: CrimeCaseDossier,
  script: NoirScript
): Promise<PostingMetadata> {
  const systemPrompt = `Kamu adalah Social Media Growth Hacker & Master Copywriter untuk kanal True Crime & Mystery Indonesia di YouTube Shorts, TikTok, dan Instagram Reels.
Tugasmu adalah menghasilkan judul berdaya pikat tinggi (High-CTR), deskripsi narasi 2 paragraf yang memicu rasa ingin tahu, dan 15 hashtag relevan.

Format Output WAJIB JSON murni:
{
  "seoTitle": "JUDUL VIRAL KAPITAL (MAKSIMAL 60 KARAKTER)",
  "caption": "Paragraf 1 membuka hook misteri.\\n\\nParagraf 2 mengajak penonton menonton kronologi lengkap dan memberikan opini di kolom komentar.",
  "hashtags": ["#TrueCrime", "#KasusKriminal", "#Misteri", "..."],
  "summaryNote": "Ringkasan 1 kalimat berkas kasus"
}`;

  const userPrompt = `Buat metadata postingan untuk video kasus ini:
Judul Kasus: ${dossier.headline}
Kategori: ${dossier.crimeType}
Lokasi: ${dossier.location}
Naskah Singkat: "${script.fullText.slice(0, 300)}..."`;

  try {
    const raw = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
    const clean = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      seoTitle: parsed.seoTitle || `${script.title} — KRONOLOGI LENGKAP KASUS 🚨`,
      caption: parsed.caption || `${script.fullText.slice(0, 200)}...\n\nBagaimana menurut kalian tentang kasus ini? Tulis di kolom komentar!`,
      hashtags: Array.isArray(parsed.hashtags) && parsed.hashtags.length ? parsed.hashtags : [
        '#TrueCrime', '#KasusKriminal', '#Misteri', '#Investigasi', '#NeoNoir',
        '#GraphicNovel', '#Shorts', '#TikTokKriminal', '#KronologiKasus', '#CrimeInvestigation',
      ],
      summaryNote: parsed.summaryNote || dossier.chronologySummary,
    };
  } catch (err) {
    console.warn('⚠️ Gagal generate metadata LLM, menggunakan template fallback:', err);
    return {
      seoTitle: `${script.title} 🚨 TERBONGKAR!`,
      caption: `Kronologi pengungkapan kasus ${dossier.crimeType} di ${dossier.location}. Barang bukti dan jejak digital yang tertinggal akhirnya mengungkap dalang di baliknya.\n\nSimak rangkuman lengkap investigasi kepolisian!`,
      hashtags: [
        '#TrueCrime', '#KasusKriminal', '#Misteri', '#Investigasi', '#NeoNoir',
        '#GraphicNovel', '#Shorts', '#TikTokKriminal', '#KronologiKasus', '#BeritaKriminal',
      ],
      summaryNote: dossier.chronologySummary,
    };
  }
}
