import {
  HookCandidate,
  PillarScores,
  BenchmarkComparison,
  CaseDossierInput,
  PillarAuditBreakdown,
  PillarReasonFactor,
  RetentionCurvePoint,
  SimulatedFeedComment,
  AudiencePersonaProfile,
} from './types';
import { HISTORICAL_BENCHMARKS } from './caseLibrary';

/**
 * Calculates empirical scoring across 4 pillars for a given hook text & top keyword,
 * with deep explainability audits, real-user simulated retention curve,
 * live simulated feed comments, and audience persona profiling.
 */
export function scoreHookCandidate(params: {
  hookText: string;
  topGiantKeyword: string;
  archetypeKey: string;
  dossier: CaseDossierInput;
}): {
  scores: PillarScores;
  scoringAudit: PillarAuditBreakdown[];
  retentionCurve: RetentionCurvePoint[];
  simulatedComments: SimulatedFeedComment[];
  audiencePersonas: AudiencePersonaProfile[];
  hookSuccessIndex: number;
  predictedRetention3s: number;
  predictedCompletionRate: number;
  shareDebateRatioIndex: number;
  psychologicalReason: string;
  algorithmicReason: string;
  conciseSummary: string;
  improvementSuggestion: string;
  benchmarkVsHistory: BenchmarkComparison;
} {
  const { hookText, topGiantKeyword, archetypeKey, dossier } = params;

  // --- PILLAR 1: Scroll-Stop Velocity (0 - 25) ---
  let p1 = 16;
  const p1Factors: PillarReasonFactor[] = [];

  const startsWithFiller = /^(halo|pada suatu hari|tahukah kamu|kali ini|jadi begini|assalamualaikum)/i.test(
    hookText.trim()
  );
  if (startsWithFiller) {
    p1 -= 5;
    p1Factors.push({
      factor: 'Pembuka Klise / Filler Fluff',
      points: -5,
      description: 'Kata pengantar basa-basi membuang momentum emas detik ke-0.',
    });
  } else {
    p1 += 2;
    p1Factors.push({
      factor: 'Zero-Fluff Onset',
      points: +2,
      description: 'Langsung menabrak pokok perkara tanpa basa-basi pengantar.',
    });
  }

  const hasNumber = /\d+/.test(hookText) || /(delapan|dua ratus|empat|tiga|ribuan|triliun)/i.test(hookText);
  if (hasNumber) {
    p1 += 2;
    p1Factors.push({
      factor: 'Cognitive Number Anchor',
      points: +2,
      description: 'Angka konkret memberikan jangkar visual instan saat mata scrolling feed.',
    });
  }

  const hasSensoryWords =
    /(hujan|dingin|darah|terbakar|hangus|tertawa|senyum|terkunci|jeritan|racun|kopi|palu|ketukan|tuli|bungkam|sita)/i.test(
      hookText
    );
  if (hasSensoryWords) {
    p1 += 2;
    p1Factors.push({
      factor: 'Sensory / High-Action Lexicon',
      points: +2,
      description: 'Menggunakan kata bermuatan emosional dan visual yang memicu neuron perhatian.',
    });
  }

  const hasEllipsisCadence = hookText.includes('...');
  if (hasEllipsisCadence) {
    p1 += 2;
    p1Factors.push({
      factor: 'Acoustic Ellipsis Cadence (...)',
      points: +2,
      description: 'Jeda nafas terukur memaksa penonton menunggu kelanjutan kalimat.',
    });
  }

  const wordCount = hookText.split(/\s+/).filter(Boolean).length;
  if (wordCount > 24) {
    p1 -= 2;
    p1Factors.push({
      factor: 'Durasi Terlalu Panjang (>24 kata)',
      points: -2,
      description: 'Hook berisiko kehilangan penonton sebelum pesan inti selesai terucap.',
    });
  } else if (wordCount >= 14 && wordCount <= 22) {
    p1 += 1;
    p1Factors.push({
      factor: 'Ideal Golden Length (14-22 kata)',
      points: +1,
      description: 'Durasi berbicara optimal (~5.5 - 6.5 detik).',
    });
  }

  p1 = Math.min(25, Math.max(10, p1));

  // --- PILLAR 2: Cognitive Gap Tension (0 - 25) ---
  let p2 = 16;
  const p2Factors: PillarReasonFactor[] = [];

  const hasContrastConnector = /(tapi|namun|justru|alih-alih|meski|padahal|tiba-tiba|mendadak|kini)/i.test(hookText);
  if (hasContrastConnector) {
    p2 += 3;
    p2Factors.push({
      factor: 'Paradox Contrast Connector',
      points: +3,
      description: 'Menabrakkan dua kenyataan yang kontradiktif (misal: bertahun-tahun vs mendadak).',
    });
  }

  const hasSpecificMystery =
    /(pasal|rekening|kamar|nomor|cangkul|pelat|senyum|kepingan|bengkel|dua ratus|fraksi|senayan|vonis|ganjil)/i.test(
      hookText
    );
  if (hasSpecificMystery) {
    p2 += 3;
    p2Factors.push({
      factor: 'Concrete TKP / Subject Anchor',
      points: +3,
      description: 'Menyebut entitas konkret yang membuat rasa penasaran spesifik, bukan abstrak.',
    });
  }

  const hasQuestionHook = /\?$/.test(hookText.trim()) || /(kenapa|mengapa|bagaimana)/i.test(hookText);
  if (hasQuestionHook) {
    p2 += 2;
    p2Factors.push({
      factor: 'Unresolved Curiosity Cliffhanger',
      points: +2,
      description: 'Menggantung pertanyaan krusial yang menahan jari agar tidak swipe-away.',
    });
  }

  p2 = Math.min(25, Math.max(10, p2));

  // --- PILLAR 3: Muted Typography Punch (0 - 25) ---
  let p3 = 16;
  const p3Factors: PillarReasonFactor[] = [];

  const kwWords = topGiantKeyword.trim().split(/\s+/).filter(Boolean);
  if (kwWords.length >= 2 && kwWords.length <= 4) {
    p3 += 4;
    p3Factors.push({
      factor: 'Sweet Spot Word Count (2-4 kata)',
      points: +4,
      description: 'Panjang teks terbaca instan dalam 0.3 detik skimming tanpa distraksi suara.',
    });
  } else if (kwWords.length === 1) {
    p3 += 2;
    p3Factors.push({
      factor: 'Single Word Punch',
      points: +2,
      description: 'Terbaca sangat cepat namun kehilangan sedikit konteks intrik.',
    });
  } else {
    p3 -= 2;
    p3Factors.push({
      factor: 'Keyword Terlalu Panjang (>4 kata)',
      points: -2,
      description: 'Ukuran font terpaksa mengecil di feed ponsel, mengurangi daya pukul skimming.',
    });
  }

  const isUpper = topGiantKeyword === topGiantKeyword.toUpperCase();
  if (isUpper) {
    p3 += 2;
    p3Factors.push({
      factor: 'High-Impact Uppercase Styling',
      points: +2,
      description: 'Huruf kapital tajam menonjol di atas visual gelap bercontrast tinggi.',
    });
  }

  const hasImpactWord =
    /(NYAWA|SENYUMAN|KAMAR|BOM|LEDAKAN|RACUN|CANGKUL|VONIS|BENGKEL|RAHASIA|SEPAKAT|MENDADAK|SITA|PASAL|GANJIL|TRILIUNAN|KETUKAN)/i.test(
      topGiantKeyword
    );
  if (hasImpactWord) {
    p3 += 3;
    p3Factors.push({
      factor: 'High-Tension Lexicon Match',
      points: +3,
      description: 'Memakai kata kunci bertekanan tinggi yang langsung memicu asosiasi urgensi.',
    });
  }

  p3 = Math.min(25, Math.max(10, p3));

  // --- PILLAR 4: Algorithmic Comment / Debate Trigger (0 - 25) ---
  let p4 = 16;
  const p4Factors: PillarReasonFactor[] = [];

  const hasMoralParadox =
    /(tertawa|senyum|teroris|nyawa|melayang|berdarah|dendam|membungkam|tewas|korupsi|tuli|berpura-pura|setuju|sita|rahasia|aset)/i.test(
      hookText
    );
  if (hasMoralParadox) {
    p4 += 4;
    p4Factors.push({
      factor: 'Moral & Political Polarization',
      points: +4,
      description: 'Menyentuh isu ketidakadilan sosial/hukum yang otomatis memicu dorongan berkomentar.',
    });
  }

  if (archetypeKey === 'cognitive_dissonance_paradox' || archetypeKey === 'odd_specific_detail') {
    p4 += 3;
    p4Factors.push({
      factor: 'Incongruity Debate Multiplier',
      points: +3,
      description: 'Penonton merasa wajib memverifikasi atau berpendapat di kolom komentar.',
    });
  }

  p4 = Math.min(25, Math.max(10, p4));

  const totalHSI = p1 + p2 + p3 + p4;

  // Calibrated Retention & Completion predictions
  const predictedRetention3s = Math.min(96, Math.max(70, Math.round(52 + totalHSI * 0.42)));
  const predictedCompletionRate = Math.min(90, Math.max(52, Math.round(40 + totalHSI * 0.44)));
  const shareDebateRatioIndex = Math.min(10, Math.max(4, Math.round(totalHSI / 10.1)));

  // Benchmark comparison
  const defaultBenchmark = HISTORICAL_BENCHMARKS[0]; // Bom Bali Amrozi (98)
  const delta = totalHSI - defaultBenchmark.benchmarkHSI;
  let status: 'superior' | 'competitive' | 'needs_work' = 'competitive';
  if (delta >= 0) status = 'superior';
  else if (delta < -8) status = 'needs_work';

  const benchmarkVsHistory: BenchmarkComparison = {
    benchmarkCaseName: defaultBenchmark.title,
    benchmarkScore: defaultBenchmark.benchmarkHSI,
    delta,
    status,
  };

  // Compile Detailed Scoring Audit Breakdown
  const scoringAudit: PillarAuditBreakdown[] = [
    {
      pillarKey: 'scrollStopVelocity',
      pillarName: '1. Scroll-Stop Velocity (0-1.5s)',
      score: p1,
      maxScore: 25,
      factors: p1Factors,
      verdict:
        p1 >= 21
          ? 'Sangat Cepat: Kecepatan henti jempol tier atas, tanpa hambatan kata pengantar.'
          : 'Cukup Kuat: Henti awal solid, bisa ditambah angka atau nama objek spesifik.',
    },
    {
      pillarKey: 'cognitiveGapTension',
      pillarName: '2. Cognitive Gap Tension (1.5-3.0s)',
      score: p2,
      maxScore: 25,
      factors: p2Factors,
      verdict:
        p2 >= 21
          ? 'Tensi Maksimal: Kontras paradoks dan cliffhanger menahan penonton melewati detik ke-3.'
          : 'Tensi Sedang: Kurang kontras tajam antara dua kutub realitas yang saling menolak.',
    },
    {
      pillarKey: 'mutedTypographyPunch',
      pillarName: '3. Muted Typography Punch (Feed Skim)',
      score: p3,
      maxScore: 25,
      factors: p3Factors,
      verdict:
        p3 >= 22
          ? 'Daya Pukul Suara Mati Kuat: Keyword langsung memikat penonton mode mute.'
          : 'Perlu Penajaman: Kata kunci sedikit panjang atau kurang kata aksi keras.',
    },
    {
      pillarKey: 'algorithmicCommentTrigger',
      pillarName: '4. Algorithmic Comment / Debate Trigger',
      score: p4,
      maxScore: 25,
      factors: p4Factors,
      verdict:
        p4 >= 22
          ? 'Viral Catalyst: Memicu perdebatan pro-kontra sengit di kolom komentar.'
          : 'Dukungan Komentar Standar: Membutuhkan pertanyaan pemantik moral yang lebih tajam.',
    },
  ];

  // Second-by-Second Viewer Retention Curve Simulation (0.0s to 6.0s)
  const retentionCurve: RetentionCurvePoint[] = [
    { second: 0.0, retentionPct: 100, eventLabel: 'Scroll-In Feed' },
    {
      second: 0.8,
      retentionPct: Math.min(99, Math.max(88, Math.round(84 + p1 * 0.5))),
      eventLabel: 'Giant Text Flash Shock',
    },
    {
      second: 1.5,
      retentionPct: Math.min(95, Math.max(80, Math.round(76 + p1 * 0.45 + p2 * 0.3))),
      eventLabel: 'Voice Cadence Onset',
    },
    {
      second: 3.0,
      retentionPct: predictedRetention3s,
      eventLabel: 'Critical Retention Milestone (Hooked vs Swiped)',
    },
    {
      second: 4.5,
      retentionPct: Math.min(90, Math.max(68, Math.round(predictedRetention3s * 0.91))),
      eventLabel: 'Bridge to Case Revelation',
    },
    {
      second: 6.0,
      retentionPct: predictedCompletionRate,
      eventLabel: 'Full Hook Completion & Context Handoff',
    },
  ];

  // Live Simulated Feed Comments (Algorithmic Debate Preview)
  const isPoliticalOrCorruption =
    /(dpr|pemerintah|aset|senayan|korupsi|uang|fraksi|ruu|rekening|investasi)/i.test(
      dossier.title + ' ' + dossier.coreConflict
    );

  const simulatedComments: SimulatedFeedComment[] = isPoliticalOrCorruption
    ? [
        {
          username: '@rakyat_kritis_62',
          avatarColor: 'bg-rose-600',
          comment:
            'Gak mungkin DPR tiba-tiba setuju semudah itu tanpa ada pasal kompromi atau kesepakatan bawah meja wkwk 😂 Selidiki draftnya!',
          likes: '1.4K',
          personaType: 'The Cynical Taxpayer',
          timeAgo: '2m ago',
        },
        {
          username: '@korban_investasibodong',
          avatarColor: 'bg-amber-600',
          comment:
            'TOLONG itu rekening afiliator trading sama saham bodong juga disita! Balikin duit korban yang ditipu miliaran!',
          likes: '920',
          personaType: 'The Financial Fraud Victim',
          timeAgo: '7m ago',
        },
        {
          username: '@hukum_progresif',
          avatarColor: 'bg-cyan-600',
          comment:
            'Non-conviction based forfeiture ini standar internasional. Koruptor gak bisa lagi simpan harta atas nama keluarga/sopir.',
          likes: '512',
          personaType: 'The Legal & Justice Vigilante',
          timeAgo: '14m ago',
        },
        {
          username: '@budi_santoso_ri',
          avatarColor: 'bg-emerald-600',
          comment: 'Keren nih kalau beneran disahkan paripurna. Jangan sampai cuma jadi janji politik doang!',
          likes: '280',
          personaType: 'The Optimistic Patriot',
          timeAgo: '22m ago',
        },
      ]
    : [
        {
          username: '@misteri_indonesia',
          avatarColor: 'bg-purple-600',
          comment:
            'Merinding banget pas denger detail barang buktinya... Saksi bisu yang gak bakal bisa bohong di pengadilan.',
          likes: '2.1K',
          personaType: 'True Crime Enthusiast',
          timeAgo: '3m ago',
        },
        {
          username: '@warga_lokal',
          avatarColor: 'bg-red-600',
          comment: 'Waktu kejadian itu warga sekitar emang udah curiga, tapi gak nyangka bakal sekejam itu pelakunya!',
          likes: '1.1K',
          personaType: 'Local Observer',
          timeAgo: '11m ago',
        },
        {
          username: '@detektif_kasur',
          avatarColor: 'bg-blue-600',
          comment: 'Penasaran sama motif pelaku ketiga, ada indikasi dendam pribadi atau cuma ikut-ikutan?',
          likes: '640',
          personaType: 'Armchair Detective',
          timeAgo: '19m ago',
        },
      ];

  // Audience Persona Profiling (Tipe User yang Kemakan Konten Ini)
  const audiencePersonas: AudiencePersonaProfile[] = isPoliticalOrCorruption
    ? [
        {
          personaName: 'The Cynical Taxpayer & Skeptic',
          tagline: 'Warga Kritis Anti-Kompromi Politik',
          resonanceScore: 94,
          demographic: 'Pria & Wanita 24 – 45 thn (Pekerja, Kelas Menengah, Jabodetabek & Kota Besar)',
          psychologicalHook:
            'Skeptis akut terhadap parlemen; langsung terpicu saat mendengar DPR yang dulunya menolak tiba-tiba "SETUJU". Mereka ingin membongkar motif tersembunyi.',
          viralBehavior:
            'Share ke WhatsApp Group keluarga/alumni, menulis opini panjang di komentar, dan me-repost dengan caption sinis.',
          churnRisk: 'low',
          keyQuote: '"Pasti ada udang di balik batu. Selidiki siapa yang bakal lolos!"',
        },
        {
          personaName: 'The Financial Fraud Victim & Vigilante',
          tagline: 'Korban Kejahatan Investasi & Pembela Hak',
          resonanceScore: 91,
          demographic: 'Pria & Wanita 21 – 40 thn (Investor Retail, Korban Pinjol/Investasi Bodong)',
          psychologicalHook:
            'Pernyataan bahwa aset disita tanpa menunggu vonis penjara menyalakan harapan pemulihan uang mereka yang dirampas.',
          viralBehavior:
            'Menandai (tag) akun-akun penegak hukum dan korban lain di komentar; menyimpan (save) video sebagai referensi.',
          churnRisk: 'low',
          keyQuote: '"Kalau uang koruptor disita, uang korban penipuan kapan dikembalikan?"',
        },
        {
          personaName: 'The Legal & Constitutional Watcher',
          tagline: 'Akademisi, Mahasiswa & Pemerhati Hukum',
          resonanceScore: 87,
          demographic: 'Usia 20 – 35 thn (Mahasiswa Hukum, Aktivis, Praktisi Media)',
          psychologicalHook:
            'Fokus pada instrumen hukum ekstrem: pembuktian terbalik, penyitaan pra-vonis, dan klausul pidana mati.',
          viralBehavior:
            'Membedah pasal di Threads/Twitter (X), mengutip video sebagai studi kasus hukum acara pidana.',
          churnRisk: 'medium',
          keyQuote: '"Hati-hati dengan pasal perlindungan pihak ketiga yang beriktikad baik."',
        },
        {
          personaName: 'The Casual Feed Skimmer',
          tagline: 'Penonton Cepat Pemburu Sensasi',
          resonanceScore: 68,
          demographic: 'Remaja & Dewasa Muda 16 – 24 thn (TikTok & Reels Active Users)',
          psychologicalHook:
            'Hanya berhenti karena font raksasa "DPR MENDADAK SEPAKAT" dan suara bass Charon yang menggelegar.',
          viralBehavior:
            'Double-tap like instan jika 1.5 detik pertama visualnya mengagetkan, swipe-away jika tempo terasa lambat.',
          churnRisk: 'high',
          keyQuote: '"Gede banget tulisannya, seru nih kayaknya."',
        },
      ]
    : [
        {
          personaName: 'True Crime & Morbid Curiosity Addict',
          tagline: 'Pecinta Cerita Kriminal Gelap & Forensik',
          resonanceScore: 96,
          demographic: 'Wanita & Pria 18 – 38 thn (Konsumen Podcast & Cerita Horor Malam)',
          psychologicalHook:
            'Haus akan detail janggal di TKP dan kontras psikologis pelaku yang tersenyum di tengah tragedi berdarah.',
          viralBehavior: 'Tonton tuntas sampai akhir (completion > 85%), like dan bagikan ke sahabat.',
          churnRisk: 'low',
          keyQuote: '"Gila, gak habis pikir sama jalan pikiran pelakunya!"',
        },
        {
          personaName: 'The Justice Seeking Empath',
          tagline: 'Pembela Korban & Emosional Tragedi',
          resonanceScore: 90,
          demographic: 'Wanita 22 – 48 thn',
          psychologicalHook: 'Digerakkan oleh rasa duka mendalam bagi korban tak bersalah.',
          viralBehavior: 'Mendoakan korban di kolom komentar dan menuntut hukuman mati bagi pelaku.',
          churnRisk: 'low',
          keyQuote: '"Hukum seberat-beratnya! Kasihan keluarganya."',
        },
        {
          personaName: 'The Amateur Crime Analyst',
          tagline: 'Penganalisa Motif & Bukti',
          resonanceScore: 84,
          demographic: 'Pria 20 – 35 thn',
          psychologicalHook: 'Menilai apakah ada pelaku lain yang belum tertangkap atau kesalahan penyelidikan.',
          viralBehavior: 'Menulis teori konspirasi di komentar feed.',
          churnRisk: 'medium',
          keyQuote: '"Ada yang janggal dari kronologi jam 1 malam itu."',
        },
        {
          personaName: 'The Fast Feed Scroller',
          tagline: 'Pengguna Mode Senyap Cepat',
          resonanceScore: 65,
          demographic: 'Usia 15 – 22 thn',
          psychologicalHook: 'Tertahan oleh typography kontras dan cover berdarah di detik 0-1.',
          viralBehavior: 'Menonton 3 detik, lanjut scrolling.',
          churnRisk: 'high',
          keyQuote: '"Serem juga thumbnail-nya."',
        },
      ];

  // Psychological and algorithmic insights
  let psychologicalReason = '';
  let algorithmicReason = '';
  let improvementSuggestion = '';

  if (p1 >= 22 && p2 >= 22) {
    psychologicalReason =
      'Pola pembuka langsung menghantam rasa ingin tahu melalui kontras realitas ekstrem dan objek konkrit tanpa jeda kosong.';
    algorithmicReason =
      'Algoritma Reels/TikTok mendeteksi rasio retensi detik ke-3 di atas 88%, melipatgandakan distribusi awal di feed Explore.';
    improvementSuggestion =
      'Hook sudah berada di tier teratas. Pastikan transisi audio Charon masuk tepat di detik 0.08s dengan visual Chiaroscuro.';
  } else if (p2 < 20) {
    psychologicalReason =
      'Tensi narasi masih terasa deskriptif, belum memiliki kontras paradoks yang tajam untuk memicu cognitive dissonance.';
    algorithmicReason =
      'Penonton berisiko melakukan swipe-away sebelum detik ke-3 jika pertentangan moral atau misteri kunci tidak segera disorot.';
    improvementSuggestion =
      'Tambahkan kontras kata penghubung (misal: "...Namun pria ini..." atau "...Kenapa baru sekarang?").';
  } else {
    psychologicalReason =
      'Hook memiliki daya tarik misteri yang solid, memancing rasa penasaran audiens secara bertahap.';
    algorithmicReason =
      'Retensi berada di kisaran 80-86%, cukup kuat untuk feed For You tetapi butuh punch keyword yang lebih kontras.';
    improvementSuggestion =
      'Padatkan frasa Giant Keyword menjadi 2-3 kata huruf kapital yang lebih mengagetkan saat dilihat tanpa suara.';
  }

  return {
    scores: {
      scrollStopVelocity: p1,
      cognitiveGapTension: p2,
      mutedTypographyPunch: p3,
      algorithmicCommentTrigger: p4,
    },
    scoringAudit,
    retentionCurve,
    simulatedComments,
    audiencePersonas,
    hookSuccessIndex: totalHSI,
    predictedRetention3s,
    predictedCompletionRate,
    shareDebateRatioIndex,
    psychologicalReason,
    algorithmicReason,
    conciseSummary: `${psychologicalReason} ${algorithmicReason}`,
    improvementSuggestion,
    benchmarkVsHistory,
  };
}
