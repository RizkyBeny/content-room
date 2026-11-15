import { extractArticle } from '../../pipeline/articleExtractor';
import { callDeepSeek } from '../../llm/deepseek';
import { CrimeCaseDossier } from '../types';

export async function extractCrimeCaseDossier(url: string): Promise<CrimeCaseDossier> {
  // 1. Ekstraksi konten artikel dari URL
  const rawArticle = await extractArticle(url);

  // 2. Analisis berkas perkara menggunakan LLM
  const systemPrompt = `Kamu adalah Forensic Dossier Analyst dan Lead Investigator untuk dokumenter True Crime Neo-Noir.
Tugasmu adalah menganalisis berita/artikel kriminalitas dan mengekstrak entitas kunci ke dalam format JSON terstruktur.
Gunakan Bahasa Indonesia yang tajam, faktual, dan presisi tinggi tanpa halusinasi nama atau tempat yang tidak ada di artikel.

Format Output WAJIB JSON murni tanpa markdown wrapper:
{
  "headline": "Judul investigasi singkat & dramatis",
  "crimeType": "Kategori kejahatan (misal: Pembunuhan Berencana, Penipuan Berantai, dll)",
  "location": "Kota, daerah, atau negara tempat perkara terjadi",
  "suspects": ["Nama/Inisial/Deskripsi tersangka 1", "..."],
  "victims": ["Nama/Inisial korban atau jumlah korban", "..."],
  "keyEvidence": ["Barang bukti 1 (misal: smartphone retak)", "Barang bukti 2 (misal: kantong plastik berlabel)", "..."],
  "chronologySummary": "Ringkasan kronologis singkat kejadian 3-4 kalimat",
  "hookIdea": "Fakta paling mencekam atau mengejutkan untuk hook detik 0-3"
}`;

  const userPrompt = `Analisis artikel berikut:
Judul Asli: "${rawArticle.title}"
Lead Berita: "${rawArticle.leadParagraph}"
Data Angka/Waktu: ${rawArticle.numbers.join(', ')}
Kutipan Sumber: ${rawArticle.quotes.join(' | ')}
Teks Lengkap:
${rawArticle.paragraphs.slice(0, 10).join('\n\n')}`;

  let parsed: Partial<CrimeCaseDossier> = {};
  try {
    const rawResponse = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const cleanJson = rawResponse.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    console.warn('⚠️ Gagal parse JSON DeepSeek, menggunakan heuristic fallback:', err);
    parsed = {
      headline: rawArticle.title,
      crimeType: 'Investigasi Kriminal Khusus',
      location: 'Indonesia',
      suspects: ['Pelaku dalam Penyelidikan'],
      victims: ['Korban Teridentifikasi'],
      keyEvidence: ['Bukti Dokumen & Rekonstruksi TKP'],
      chronologySummary: rawArticle.leadParagraph,
      hookIdea: rawArticle.title,
    };
  }

  return {
    url,
    headline: parsed.headline || rawArticle.title,
    source: new URL(url).hostname.replace('www.', ''),
    crimeType: parsed.crimeType || 'Investigasi Kasus Misteri',
    location: parsed.location || 'Lokasi Perkara',
    suspects: Array.isArray(parsed.suspects) && parsed.suspects.length ? parsed.suspects : ['Pelaku'],
    victims: Array.isArray(parsed.victims) && parsed.victims.length ? parsed.victims : ['Korban'],
    keyEvidence: Array.isArray(parsed.keyEvidence) && parsed.keyEvidence.length ? parsed.keyEvidence : ['Berkas Bukti Kepolisian'],
    chronologySummary: parsed.chronologySummary || rawArticle.leadParagraph,
    hookIdea: parsed.hookIdea || rawArticle.title,
    fullBodyText: rawArticle.paragraphs.join('\n\n'),
  };
}
