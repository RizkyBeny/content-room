import { callDeepSeek } from '../../llm/deepseek';
import { CrimeCaseDossier } from '../types';

export interface NoirEditorialAngle {
  mainHeadline: string;
  subHeadline: string;
  caseHeroVisual: string;
  coreThesis: string;
  narrativeTone: string;
  hookSentences: string[];
}

export async function planNoirEditorial(dossier: CrimeCaseDossier): Promise<NoirEditorialAngle> {
  const systemPrompt = `Kamu adalah Creative Director & Master Storyteller untuk kanal dokumenter investigasi True Crime Neo-Noir.
Tugasmu merumuskan editorial angle, headline berdaya ledak tinggi (High-CTR), dan visual hero untuk video 9:16 (~60 detik).

ATURAN GAYA:
- Nada bicara: Dingin, berbobot, penuh suspensi, faktual, dramatisasi elegan.
- Headline wajib pendek, kapital, menghentak (maksimal 4-6 kata). Contoh: "JEJAK SADIS TWITTER KILLER" atau "MISTERI BRANKAS BERDARAH".
- Sub-headline untuk pita merah crimson (maksimal 5 kata). Contoh: "9 NYAWA DALAM 2 BULAN" atau "RAHASIA GELAP DI LANTAI 4".
- Visual Hero: Deskripsi siluet TKP atau objek sentral bernuansa Graphic Novel Neo-Noir chiaroscuro.

Format Output WAJIB JSON murni:
{
  "mainHeadline": "HEADLINE UTAMA KAPITAL",
  "subHeadline": "SUB HEADLINE PITA MERAH",
  "caseHeroVisual": "Deskripsi adegan hero visual TKP untuk Cover Shot 00",
  "coreThesis": "Tesis sentral narasi: mengapa kasus ini begitu mengguncang publik",
  "narrativeTone": "Dark Suspense / Cold Forensic",
  "hookSentences": ["Kalimat hook 1 (0-2s)", "Kalimat hook 2 (2-4s)"]
}`;

  const userPrompt = `Rancang editorial angle untuk berkas perkara ini:
Judul Kasus: ${dossier.headline}
Kategori: ${dossier.crimeType}
Lokasi: ${dossier.location}
Tersangka: ${dossier.suspects.join(', ')}
Korban: ${dossier.victims.join(', ')}
Barang Bukti: ${dossier.keyEvidence.join(', ')}
Kronologi: ${dossier.chronologySummary}
Fakta Menarik: ${dossier.hookIdea}`;

  try {
    const raw = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
    const clean = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.warn('⚠️ Gagal parse editorial angle LLM, menggunakan fallback:', err);
    return {
      mainHeadline: dossier.headline.toUpperCase().slice(0, 30),
      subHeadline: `KASUS ${dossier.crimeType.toUpperCase()}`.slice(0, 25),
      caseHeroVisual: `A chilling crime scene in ${dossier.location} with police tape and forensic shadows`,
      coreThesis: dossier.chronologySummary,
      narrativeTone: 'Dark Suspense',
      hookSentences: [
        'Sebuah rahasia kelam akhirnya terbongkar.',
        'Dan bukti yang ditemukan polisi mengubah segalanya.',
      ],
    };
  }
}
