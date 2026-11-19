import dotenv from 'dotenv';
import path from 'node:path';
import { CaseDossierInput, HookCandidate, HookArchetypeKey } from './types';
import { HOOK_ARCHETYPES, CANONICAL_3_ARCHETYPE_KEYS, CANONICAL_UGC_ARCHETYPE_KEYS } from './archetypes';
import { CONTENT_SEGMENTS } from './segments';
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
 * dynamically tailored to the selected content segment (Video Reels, Commerce UGC, News Anchor, Carousel, Article, Single Post)
 * and enriched with cmlabs hook content formulas.
 */
export async function generateHookCandidates(dossier: CaseDossierInput): Promise<HookCandidate[]> {
  const segmentKey = dossier.segment || 'video_reels';
  const isUGC = segmentKey === 'commerce_ugc';
  const segmentDef = CONTENT_SEGMENTS[segmentKey] || CONTENT_SEGMENTS.video_reels;

  let rawList: RawHookOutput[] = [];

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey) {
    try {
      let systemPrompt: string;
      let userPrompt: string;

      if (isUGC) {
        systemPrompt = `Anda adalah Lead UGC Creative Strategist & Direct-Response Ad Scriptwriter untuk TikTok Ads, Instagram Reels Shopping, dan Shopee Video.
Misi Anda: Menghentikan jempol konsumen dalam 1.0 detik pertama (Scroll-Stop) dan memicu rasa penasaran akut tanpa terkesan seperti iklan TV norak.

TARGET SEGMEN KONTEN: Commerce & UGC Video Ad (9:16 Vertical)
- Batasan Format: 12-18 kata, durasi berbicara 4.0-6.0 detik.
- PANDUAN INTONASI & GAYA BICARA KREATOR ASLI (ANTI-ROBOT):
  * Tulis naskah PERSIS seperti cara bicara kreator TikTok/Reels saat spill racun belanjaan ke teman dekat, bukan bahasa tulisan formal kaku!
  * Sisipkan pembuka percakapan ekspresif: "Sumpah ya...", "Plis jangan...", "Liat deh...", "Gila sih...", "Bener-bener gak nyangka!"
  * Gunakan partikel lisan natural: lho, deh, nih, kan, banget, sih.
  * Gunakan HURUF BESAR pada 1 kata kunci untuk penekanan vokal tajam (misal: "Jangan PERNAH beli...", "Beneran MEWAH banget!").
  * Gunakan tanda seru (!) untuk energi antusias, tanda tanya (?) untuk rasa penasaran, dan titik tiga (...) untuk jeda nafas natural.
- Frasa Kunci: Tentukan 1 frasa "topGiantKeyword" (2-3 kata HURUF BESAR) untuk sticker caption feed.

TUGAS: Formulasikan TEPAT 3 variasi HOOK UGC berbasis 3 arketipe kanonikal:
1. ugc_negative_warning:
   Formula Negative Warning / Stop Doing This. Tabrak kesalahan fatal konsumen yang membuat masalah mereka makin parah.
2. ugc_gatekept_secret:
   Formula Gatekept Secret / Specific Hack. Ungkap satu kandungan bahan aktif / fitur spesifik tersembunyi yang belum banyak orang tahu.
3. ugc_before_after_countdown:
   Formula Micro-Story Transformation / Urgent FOMO. Ceritakan titik terendah / momen panik sebelum menemukan produk, atau hitungan mundur batas promo.

Format Output WAJIB JSON murni tanpa markdown wrapper:
{
  "candidates": [
    {
      "archetypeKey": "ugc_negative_warning",
      "hookText": "Sumpah ya... jangan PERNAH beli tas kerja biasa sebelum liat yang satu ini! Modelnya MEWAH banget... tapi harganya ramah kantong.",
      "topGiantKeyword": "JANGAN BELI DULU"
    },
    {
      "archetypeKey": "ugc_gatekept_secret",
      "hookText": "Gila sih... kenapa gak ada yang spill tas se-elegan ini? Liat deh jahitannya... bener-bener rapi dan muat banyak barang!",
      "topGiantKeyword": "SPILL TAS MEWAH"
    },
    {
      "archetypeKey": "ugc_before_after_countdown",
      "hookText": "Dulu sering bingung cari tas kerja yang muat banyak tapi tetep modis... Untung nemu ini! Lagi diskon spesial lho hari ini.",
      "topGiantKeyword": "DISKON SPESIAL HARI INI"
    }
  ]
}`;

        const pData = dossier.productData;
        userPrompt = `Data Produk / Brief UGC:
Nama Produk: ${pData?.productName || dossier.title}
Kategori / Niche: ${pData?.category || 'general'}
Target Konsumen: ${pData?.targetPersona || dossier.victim || 'Konsumen'}
Masalah Utama (Pain Point): ${pData?.painPoint || dossier.coreConflict}
Solusi / Keunggulan Unik (USP): ${pData?.uspBenefit || dossier.keyEvidence}
Penawaran / Promo: ${pData?.offerPrice || 'Promo terbatas hari ini'}
Detail Tambahan: ${dossier.rawBrief || '-'}`;
      } else {
        systemPrompt = `Anda adalah Lead Hook Strategist & High-Retention Scriptwriter kelas dunia.
Spesialisasi Format: ${segmentDef.name} (${segmentDef.targetMedium}).
Gaya narasi Anda terinspirasi dari formula viral cmlabs (Cara Membuat Hook Konten) & storytelling psikologis berbobot: dingin, berjarak, tanpa basa-basi klise, dengan jeda nafas elipsis (...) yang presisi.

TARGET SEGMEN KONTEN:
- Format & Medium: ${segmentDef.targetMedium}
- Batasan Format: ${segmentDef.guidelines.formatConstraints}
- Penempatan Frasa Kunci: ${segmentDef.guidelines.keywordPlacement}
- Pemicu Psikologis Utama: ${segmentDef.guidelines.primaryTrigger}
- Arahan Spesifik Segmen: ${segmentDef.promptDirective}

TUGAS: Buat TEPAT 3 variasi HOOK pembuka berdasarkan 3 arketipe kanonikal berikut:
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
- Gunakan Bahasa Indonesia investigatif/profesional yang dingin, berjarak, dan mengalir.
- Zero-Fluff: DILARANG KERAS menggunakan kata pengantar klise ("Halo guys", "Tahukah Anda", "Kali ini kita akan bahas"). Mulai detik 0 langsung tabrak konflik!
- Gunakan rekayasa tanda baca titik tiga (...) untuk jeda nafas (0.4s - 0.6s pause).
- Tentukan 1 frasa kunci "topGiantKeyword" (2-3 kata HURUF BESAR) untuk judul visual / hook mode hening.
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

        userPrompt = `Kasus Perkara:
Judul: ${dossier.title}
Lokasi: ${dossier.location}
Korban: ${dossier.victim}
Tersangka: ${dossier.suspect}
Barang Bukti Utama: ${dossier.keyEvidence}
Konflik/Misteri: ${dossier.coreConflict}
Detail Tambahan: ${dossier.rawBrief || '-'}
Target Segmen Konten: ${segmentDef.name} (${segmentDef.targetMedium})`;
      }

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
    if (isUGC) {
      const p = dossier.productData;
      const isSkincare = /(retinol|serum|kulit|flek|jerawat|skincare|glowing)/i.test((p?.productName || dossier.title || ''));
      const isGadget = /(tws|earbuds|headphone|anc|bising|audio|laptop|gadget)/i.test((p?.productName || dossier.title || ''));

      if (isSkincare) {
        rawList = [
          {
            archetypeKey: 'ugc_negative_warning',
            hookText: 'Stop buang duit jutaan buat facial... kalau bekas jerawat kamu masih dibiarin kayak gini. Kulit kamu itu butuh retinol encapsulated... bukan racikan abal-abal.',
            topGiantKeyword: 'STOP BUANG DUIT',
          },
          {
            archetypeKey: 'ugc_gatekept_secret',
            hookText: 'Kenapa gak ada dokter kulit yang ngasih tahu hack ini? Cuma modal satu tetes serum encapsulated sebelum tidur... flek hitam menahun bisa samar dalam seminggu.',
            topGiantKeyword: 'TRIK RAHASIA MALAM',
          },
          {
            archetypeKey: 'ugc_before_after_countdown',
            hookText: 'H-3 ketemu calon mertua tapi muka kusam parah... Untung langsung checkout botol ini. Sekarang kulit glowing natural tanpa dempul bedak tebal.',
            topGiantKeyword: 'H-3 PANIK GLOWING',
          },
        ];
      } else if (isGadget) {
        rawList = [
          {
            archetypeKey: 'ugc_negative_warning',
            hookText: 'Jangan beli TWS harga jutaan dulu... sebelum kamu lihat headphone 100 ribuan ini. Noise cancelling-nya... bikin orang kantor mikir kamu budek.',
            topGiantKeyword: 'JANGAN BELI DULU',
          },
          {
            archetypeKey: 'ugc_gatekept_secret',
            hookText: 'Ternyata ini alasan anak IT gak pernah pakai headset mahal kantor. Ada satu tombol rahasia di earbud ini... yang langsung membungkam suara bising di sekitar.',
            topGiantKeyword: 'TOMBOL RAHASIA IT',
          },
          {
            archetypeKey: 'ugc_before_after_countdown',
            hookText: 'Tiga hari lagi promo clearance sale ini ditutup selamanya... Baterai tahan 48 jam dan bass sedalam ini di bawah 200 ribu? Cek keranjang kuning sebelum kehabisan.',
            topGiantKeyword: 'SISA 3 HARI LAGI',
          },
        ];
      } else {
        rawList = [
          {
            archetypeKey: 'ugc_negative_warning',
            hookText: `Stop buang-buang waktu pakai cara lama... kalau masalah kamu masih belum beres. Produk ini punya satu solusi simpel... yang bikin semuanya jadi mudah.`,
            topGiantKeyword: 'STOP CARA LAMA',
          },
          {
            archetypeKey: 'ugc_gatekept_secret',
            hookText: `Ternyata ini rahasia yang gak pernah dibahas di media sosial. Ada satu fitur tersembunyi di ${p?.productName || dossier.title}... yang bikin kualitasnya beda jauh.`,
            topGiantKeyword: 'FITUR TERSEMBUNYI',
          },
          {
            archetypeKey: 'ugc_before_after_countdown',
            hookText: `Dulu frustrasi banget tiap hari ngadepin masalah ini... sampai akhirnya nemu produk ini. Jangan sampai nyesel kehabisan promo hari ini ya.`,
            topGiantKeyword: 'SOLUSI HARI INI',
          },
        ];
      }
    } else {
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
  }

  // Score each candidate against 4 empirical pillars
  const fallbackArchetypeKeys: HookArchetypeKey[] = isUGC ? CANONICAL_UGC_ARCHETYPE_KEYS : CANONICAL_3_ARCHETYPE_KEYS;
  return rawList.slice(0, 3).map((raw, idx) => {
    const archetypeKey = raw.archetypeKey || fallbackArchetypeKeys[idx % fallbackArchetypeKeys.length];
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
