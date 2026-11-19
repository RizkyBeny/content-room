import dotenv from 'dotenv';
import path from 'node:path';
import { CaseDossierInput, HookCandidate, HookArchetypeKey } from './types';
import { HOOK_ARCHETYPES, CANONICAL_3_ARCHETYPE_KEYS } from './archetypes';
import { scoreHookCandidate } from './empiricalScorer';
import { callDeepSeek } from '../llm/deepseek';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

interface RawHookOutput {
  archetypeKey: HookArchetypeKey;
  hookText: string;
  topGiantKeyword: string;
}

/**
 * Generates exactly 3 canonical psychological hook candidates for a given case dossier,
 * enriched with cmlabs hook content formulas (Curiosity Question, Micro-Story, Data Anchor, Controversy).
 */
export async function generateHookCandidates(dossier: CaseDossierInput): Promise<HookCandidate[]> {
  const archetypeKeys: HookArchetypeKey[] = CANONICAL_3_ARCHETYPE_KEYS;

  let rawList: RawHookOutput[] = [];

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey) {
    try {
      const systemPrompt = `Anda adalah Lead Hook Strategist & High-Retention Scriptwriter untuk Instagram Reels, TikTok, dan YouTube Shorts.
Gaya Anda terinspirasi dari @klenik_malam & formula viral cmlabs (Cara Membuat Hook Konten): dingin, berbobot, penuh tensi psikologis, tanpa basa-basi klise, dengan jeda nafas elipsis (...) yang presisi.

Tugas: Buat TEPAT 3 variasi HOOK pembuka video (durasi 5-8 detik berbicara, ~15-22 kata) berdasarkan 3 arketipe kanonikal berikut:
1. cognitive_dissonance_paradox:
   Formula cmlabs: Pernyataan Kontroversial & Fakta Mengejutkan.
   Membenturkan dua realitas ekstrem yang saling bertolak belakang (misal: 10 tahun penolakan DPR vs kesepakatan kilat satu malam, atau tragedi ratusan korban vs senyuman dingin pelaku). Akhiri dengan pertanyaan penasaran tajam.
2. odd_specific_detail:
   Formula cmlabs: Pertanyaan Penasaran & Objek Misteri Konkrit.
   Menyorot satu objek fisik janggal, nomor ruangan, atau nomor pasal tersembunyi yang tak lazim di TKP / naskah regulasi.
3. micro_story_countdown:
   Formula cmlabs: Kisah Cerita Pendek (Micro-Storytelling) & Statistik Batas Waktu.
   Membuka narasi dengan setting menit-menit genting di TKP / ruang sidang, diikuti konsekuensi batas waktu dingin (misal: "30 hari batas pembuktian atau seluruh aset disita negara").

PANDUAN PENULISAN WAJIB:
- Gunakan Bahasa Indonesia investigatif sastrawi yang dingin, berjarak, dan mengalir.
- Zero-Fluff: DILARANG KERAS menggunakan kata pengantar klise ("Halo guys", "Tahukah Anda", "Kali ini kita akan bahas"). Mulai detik 0 langsung tabrak konflik!
- Gunakan rekayasa tanda baca titik tiga (...) untuk jeda nafas misterius (0.4s - 0.6s pause).
- Tentukan 1 frasa kunci "topGiantKeyword" (2-3 kata HURUF BESAR) untuk ditampilkan di sepertiga atas layar feed mode hening.
- Anti-Empty Clickbait: Naskah hook harus menjanjikan fakta riil yang ada dalam dossier perkara.

Format Output WAJIB JSON murni tanpa markdown wrapper:
{
  "candidates": [
    {
      "archetypeKey": "cognitive_dissonance_paradox",
      "hookText": "Delapan fraksi... serentak setuju menyita aset tanpa vonis... Setelah bertahun-tahun mandek. Apa yang mereka takutkan... hingga berubah pikiran dalam satu ketukan palu?",
      "topGiantKeyword": "DELAPAN FRAKSI BERUBAH"
    },
    {
      "archetypeKey": "odd_specific_detail",
      "hookText": "Ada satu pasal bernomor ganjil di halaman belakang naskah RUU itu... yang tak pernah dibahas di depan kamera. Nomor pasalnya... ganjil. Dan itu bukan kebetulan.",
      "topGiantKeyword": "PASAL YANG TERKUBUR"
    },
    {
      "archetypeKey": "micro_story_countdown",
      "hookText": "Malam sebelum ketukan palu di Senayan... sebuah draf rahasia diselipkan. Mulai detik ini... 30 hari adalah vonis mati bagi rekening mencurigakan.",
      "topGiantKeyword": "HITUNGAN MUNDUR SENAYAN"
    }
  ]
}`;

      const userPrompt = `Kasus Perkara:
Judul: ${dossier.title}
Lokasi: ${dossier.location}
Korban: ${dossier.victim}
Tersangka: ${dossier.suspect}
Barang Bukti Utama: ${dossier.keyEvidence}
Konflik/Misteri: ${dossier.coreConflict}
Detail Tambahan: ${dossier.rawBrief || '-'}`;

      const responseText = await callDeepSeek([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      const cleanJson = responseText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed.candidates) && parsed.candidates.length >= 3) {
        rawList = parsed.candidates.slice(0, 3);
      }
    } catch (err: any) {
      console.warn('⚠️ Gagal generate hook via DeepSeek, menggunakan heuristic archetypes:', err.message);
    }
  }

  // Fallback heuristic generation if LLM is unavailable or returned fewer than 3
  if (rawList.length < 3) {
    const isCorruption = /(ruu|dpr|aset|korupsi|paripurna|senayan)/i.test(dossier.title || '');

    rawList = [
      {
        archetypeKey: 'cognitive_dissonance_paradox',
        hookText: isCorruption
          ? `Delapan fraksi... serentak setuju menyita aset tanpa vonis... Setelah bertahun-tahun mandek. Apa yang mereka takutkan... hingga berubah pikiran dalam satu ketukan palu?`
          : `${dossier.victim}... Tapi pria ini... justru tersenyum dingin tanpa penyesalan di depan kamera penyidik. Dunia menyebutnya sang teroris tertawa.`,
        topGiantKeyword: isCorruption ? 'DELAPAN FRAKSI BERUBAH' : 'SENYUMAN DINGIN',
      },
      {
        archetypeKey: 'odd_specific_detail',
        hookText: isCorruption
          ? `Ada satu pasal bernomor ganjil di halaman belakang naskah RUU itu... yang tak pernah dibahas di kamera. Nomor pasalnya... ganjil. Dan itu bukan kebetulan.`
          : `Di tengah keheningan ${dossier.location}... sebuah ${dossier.keyEvidence} tergeletak sebagai saksi bisu tragedi berdarah yang terkunci rapat dari luar.`,
        topGiantKeyword: isCorruption ? 'PASAL YANG TERKUBUR' : 'BARANG BUKTI KUNCI',
      },
      {
        archetypeKey: 'micro_story_countdown',
        hookText: isCorruption
          ? `Malam sebelum ketukan palu di Senayan... sebuah draf rahasia diselipkan ke meja pimpinan. Mulai detik ini... 30 hari adalah vonis mati bagi aset mencurigakan.`
          : `Malam itu ${dossier.location} diselimuti hawa dingin yang mencekam... Sebelum fajar tiba... hitungan mundur maut itu telah dimulai tanpa ada yang menyadari.`,
        topGiantKeyword: isCorruption ? 'HITUNGAN MUNDUR SENAYAN' : 'HITUNGAN MUNDUR MAUT',
      },
    ];
  }

  // Score each candidate against 4 empirical pillars
  return rawList.slice(0, 3).map((raw, idx) => {
    const archetypeKey = raw.archetypeKey || archetypeKeys[idx % archetypeKeys.length];
    const def = HOOK_ARCHETYPES[archetypeKey] || HOOK_ARCHETYPES.cognitive_dissonance_paradox;
    const evaluation = scoreHookCandidate({
      hookText: raw.hookText,
      topGiantKeyword: raw.topGiantKeyword,
      archetypeKey,
      dossier,
    });

    const wordCount = raw.hookText.split(/\s+/).length;
    const durationSecEstimate = Number((wordCount * 0.45).toFixed(1));

    return {
      id: `hook-${idx + 1}`,
      archetype: archetypeKey,
      archetypeName: def.name,
      hookText: raw.hookText,
      topGiantKeyword: raw.topGiantKeyword,
      durationSecEstimate,
      scores: evaluation.scores,
      scoringAudit: evaluation.scoringAudit,
      retentionCurve: evaluation.retentionCurve,
      simulatedComments: evaluation.simulatedComments,
      audiencePersonas: evaluation.audiencePersonas,
      hookSuccessIndex: evaluation.hookSuccessIndex,
      predictedRetention3s: evaluation.predictedRetention3s,
      predictedCompletionRate: evaluation.predictedCompletionRate,
      shareDebateRatioIndex: evaluation.shareDebateRatioIndex,
      psychologicalReason: evaluation.psychologicalReason,
      algorithmicReason: evaluation.algorithmicReason,
      conciseSummary: evaluation.conciseSummary,
      improvementSuggestion: evaluation.improvementSuggestion,
      benchmarkVsHistory: evaluation.benchmarkVsHistory,
    };
  });
}
