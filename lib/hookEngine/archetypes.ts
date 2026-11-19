import { HookArchetypeDefinition, HookArchetypeKey } from './types';

export const HOOK_ARCHETYPES: Record<HookArchetypeKey, HookArchetypeDefinition> = {
  cognitive_dissonance_paradox: {
    key: 'cognitive_dissonance_paradox',
    name: 'The Cognitive Dissonance Paradox',
    description: 'Membenturkan dua realitas ekstrem yang saling menolak akal sehat (moral atau logika). Mengadopsi prinsip cmlabs: Pernyataan Kontroversial & Fakta Mengejutkan.',
    psychologicalTrigger: 'Incongruity Resolution, Moral Outrage & Cognitive Shock',
    formula: '[Tragedi / Skala Korban / Penolakan Bertahun-tahun] + [Respon Santai / Persetujuan Kilat Tiba-tiba] + [Pertanyaan Penasaran]',
    example:
      'Bertahun-tahun negara berpura-pura tuli... Kini delapan fraksi serentak setuju menyita aset tanpa vonis. Apa yang mereka takutkan... hingga berubah pikiran dalam satu ketukan palu?',
  },
  odd_specific_detail: {
    key: 'odd_specific_detail',
    name: 'The Odd Specific Detail & Curiosity Gap',
    description: 'Menyorot satu objek fisik atau nomor pasal/dokumen yang sangat janggal dan tak semestinya ada di sana. Mengadopsi prinsip cmlabs: Pertanyaan Penasaran & Objek Konkrit.',
    psychologicalTrigger: 'Curiosity Gap on Concrete Mystery Objects & Secret Clauses',
    formula: '[Nomor Ruangan / Lokasi / Pasal Spesifik] + [Satu Objek / Fakta Tersembunyi] + [Pertanyaan / Teaser Tak Terduga]',
    example:
      'Ada satu pasal bernomor ganjil di halaman belakang naskah RUU itu... yang tak pernah dibahas di depan kamera. Padahal pasal itulah... yang paling ditakuti para koruptor.',
  },
  micro_story_countdown: {
    key: 'micro_story_countdown',
    name: 'The Micro-Story & High-Stakes Countdown',
    description: 'Membuka dengan setting detik-detik genting di TKP atau ruang rahasia dengan batas waktu konsekuensi dingin. Mengadopsi prinsip cmlabs: Kisah Pendek & Statistik Waktu.',
    psychologicalTrigger: 'Urgency, High-Stakes Dread & Time-Pressure Retention',
    formula: '[Setting Waktu / Momen Genting] + [Konsekuensi Batas Waktu atau Angka Menakutkan] + [Dampak Bagi Penonton]',
    example:
      'Malam sebelum ketukan palu di Senayan... sebuah draf rahasia diselipkan. Mulai detik ini... 30 hari adalah vonis mati bagi aset mencurigakan.',
  },
  ugc_negative_warning: {
    key: 'ugc_negative_warning',
    name: 'The Negative Warning (Stop Doing This)',
    description: 'Menabrak kesalahan fatal konsumen yang membuat masalah mereka makin parah. Mengadopsi prinsip Loss Aversion & Fear of Mistake.',
    psychologicalTrigger: 'Loss Aversion, Mistake Prevention & Shocking Contrast',
    formula: '["STOP" / "JANGAN BELI"] + [Kebiasaan Sia-sia Konsumen] + [Konsekuensi Buruk] + [Solusi Alternatif]',
    example:
      'Stop buang duit jutaan buat facial... kalau bekas jerawat kamu masih dibiarin kayak gini. Kulit kamu itu butuh retinol encapsulated... bukan racikan abal-abal.',
  },
  ugc_gatekept_secret: {
    key: 'ugc_gatekept_secret',
    name: 'The Gatekept Secret & Specific Hack',
    description: 'Mengungkap 1 bahan aktif atau fitur unik tersembunyi layaknya rahasia orang dalam industri.',
    psychologicalTrigger: 'Information-Gap Theory & Insider Privilege',
    formula: '["Kenapa gak ada yang ngasih tahu..."] + [Satu Fitur / Kandungan Rahasia] + [Hasil Nyata Terlalu Bagus]',
    example:
      'Kenapa gak ada dokter kulit yang ngasih tahu hack ini? Cuma modal satu tetes serum encapsulated sebelum tidur... flek hitam menahun bisa samar dalam seminggu.',
  },
  ugc_before_after_countdown: {
    key: 'ugc_before_after_countdown',
    name: 'The Micro-Story Transformation & Urgent FOMO',
    description: 'Menceritakan momen titik terendah / panik H-1 sebelum menemukan produk, dipadukan batas waktu promo.',
    psychologicalTrigger: 'Empathy, Transformation Proof & Time Scarcity FOMO',
    formula: '[Momen Panik H-1 / Titik Terendah] + [Momen Penemuan Tak Terduga] + [Transformasi / Batas Promo]',
    example:
      'H-3 wisuda muka break-out parah sampai gak berani keluar kamar... Untung langsung checkout botol ini. Sekarang kulit glowing natural tanpa dempul bedak tebal.',
  },
  whispered_crime_scene: {
    key: 'whispered_crime_scene',
    name: 'The Whispered Crime Scene',
    description: 'Membangun atmosfer lorong sepi atau malam mencekam di mana saksi bisu menyimpan rahasia kelam',
    psychologicalTrigger: 'Nocturnal Atmospheric Immersion & Sensory Tension',
    formula: '[Kondisi Malam / Cuaca Sunyi] + [Aktivitas Terlarang yang Terjadi Tanpa Ada yang Menyadari]',
    example:
      'Malam itu hujan deras membungkam suara jeritan dari mess pabrik... Sebelum subuh tiba... tiga bayangan gelap keluar menyelinap.',
  },
  multi_motive_escalation: {
    key: 'multi_motive_escalation',
    name: 'The Multi-Motive Escalation',
    description: 'Menghadirkan akumulasi sakit hati atau konspirasi lebih dari satu orang yang bertemu di satu malam',
    psychologicalTrigger: 'Interpersonal Conflict Web & Conspiratorial Betrayal',
    formula: '[Tiga Motif Sakit Hati Berbeda] + [Satu Target yang Sama di Malam Tersebut]',
    example:
      'Pria pertama sakit hati karena cintanya ditolak... Pria kedua dendam karena dihina... Dan pria ketiga... hanya ingin melampiaskan amarahnya.',
  },
  cold_forensic_warning: {
    key: 'cold_forensic_warning',
    name: 'The Cold Forensic Warning',
    description: 'Pernyataan dingin fakta laboratorium forensik atau barang bukti mikroskopis yang membuka kedok pelaku',
    psychologicalTrigger: 'Clinical Forensic Intrigue & Unmasking',
    formula: '[Satu Kepingan Pelat / Zat Tak Kasat Mata] + [Bagaimana Jejak Itu Menyeret Sang Monster]',
    example:
      'Di balik puing yang hangus terbakar... tim forensik menemukan satu serpihan pelat besi tipis... Yang dalam waktu singkat... menuntun polisi ke sebuah bengkel di pelosok Jawa Timur.',
  },
};

/**
 * The 3 canonical hook archetypes used in the modernized Hook Engine v3
 */
export const CANONICAL_3_ARCHETYPE_KEYS: HookArchetypeKey[] = [
  'cognitive_dissonance_paradox',
  'odd_specific_detail',
  'micro_story_countdown',
];

/**
 * The 3 canonical hook archetypes used for UGC / Commerce
 */
export const CANONICAL_UGC_ARCHETYPE_KEYS: HookArchetypeKey[] = [
  'ugc_negative_warning',
  'ugc_gatekept_secret',
  'ugc_before_after_countdown',
];
