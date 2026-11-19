import { CaseDossierInput } from './types';

export interface HistoricalBenchmarkCase extends CaseDossierInput {
  caseId: string;
  benchmarkHSI: number;
  benchmark3sRetention: number;
  winningHookText: string;
  winningKeyword: string;
  archetype: string;
  caseDescription: string;
}

export const HISTORICAL_BENCHMARKS: HistoricalBenchmarkCase[] = [
  {
    caseId: 'bom-bali-amrozi',
    title: 'Kronologi Kasus Bom Bali Amrozi (The Smiling Terrorist)',
    location: 'Legian, Kuta, Bali',
    victim: '202 Korban Jiwa dari 21 Negara',
    suspect: 'Amrozi bin Nurhasyim & Trio Bersaudara',
    keyEvidence: 'Serpihan Pelat Nomor Rangka Mobil Mitsubishi L300 & 1 Ton Bahan Kimia',
    coreConflict: 'Tragedi teror kemanusiaan terbesar dihadapi dengan senyuman santai dan acungan jempol ke wartawan',
    benchmarkHSI: 98,
    benchmark3sRetention: 91,
    winningHookText:
      'Dua ratus dua nyawa melayang di Legian... Tapi pria ini... justru tertawa lebar di depan kamera polisi. Dunia menyebutnya... The Smiling Terrorist.',
    winningKeyword: '202 NYAWA & SENYUMAN',
    archetype: 'The Cognitive Dissonance Paradox',
    caseDescription: 'Tragedi bom kembar Sari Club & Paddys Pub Kuta 2002 dan senyuman dingin Amrozi di hadapan kamera.',
  },
  {
    caseId: 'eno-pelaku-berbagi-peran',
    title: 'Tragedi Kematian Eno Farihah: Konspirasi Tiga Pria di Mess Karyawan',
    location: 'Mess Karyawan Polyta Global Mandiri, Kosambi, Tangerang',
    victim: 'Eno Farihah (19 Tahun)',
    suspect: 'RA (16), Rahmat Arifin (24), Imam Hapriadi (24)',
    keyEvidence: 'Cangkul bergagang kayu di atas kasur, sidik jari berlumur darah',
    coreConflict: 'Tiga pria dengan motif berbeda (cinta ditolak, sakit hati dihina) berkonspirasi dalam kamar mess terkunci',
    benchmarkHSI: 95,
    benchmark3sRetention: 88,
    winningHookText:
      'Kamar nomor tujuh itu... terkunci rapat dari luar. Di lorong mess karyawan yang basah oleh hujan... sebuah cangkul tergeletak di sudut kasur berdarah.',
    winningKeyword: 'KAMAR NO. 7',
    archetype: 'The Odd Specific Detail',
    caseDescription: 'Kasus pembunuhan berencana paling mengguncang di Tangerang dengan TKP kamar terkunci dan barang bukti cangkul.',
  },
  {
    caseId: 'mujianto-serial-killer',
    title: 'Mujianto: Pembunuh Berantai Racun Tikus Kopi di Nganjuk',
    location: 'Nganjuk, Jawa Timur',
    victim: '4 Tewas, Belasan Kritis',
    suspect: 'Mujianto alias Genthon',
    keyEvidence: 'Cangkir kopi beracun arsenik/racun tikus, botol racun di pekarangan',
    coreConflict: 'Kecemburuan terhadap pria-pria idaman majikannya dieksekusi dengan racun tak berbau dalam seduhan kopi hangat',
    benchmarkHSI: 94,
    benchmark3sRetention: 87,
    winningHookText:
      'Segelas kopi hangat disajikan dengan ramah di ruang tamu... Tapi sebelum cangkir itu tandas... empat pria roboh tanpa sempat meminta tolong.',
    winningKeyword: 'KOPI BERACUN',
    archetype: 'The Whispered Crime Scene',
    caseDescription: 'Kasus pembunuhan berantai Nganjuk yang menargetkan pria kenalan majikan dengan modus kopi bertabur racun.',
  },
  {
    caseId: 'kumparan-ruu-perampasan-aset',
    title: 'Pemerintah-DPR Sepakati RUU Perampasan Aset Dibawa ke Paripurna Jadi UU',
    location: 'Komisi III DPR RI, Senayan, Jakarta',
    victim: 'Keuangan Negara & Korban Penipuan / Investasi Bodong Massal',
    suspect: 'Pelaku Korupsi, TPPU, dan Kejahatan Finansial Berdampak Luas',
    keyEvidence: 'Naskah RUU Perampasan Aset, Mekanisme Non-Conviction Based, Ketukan Palu Sidang Tingkat I',
    coreConflict: 'Setelah bertahun-tahun mandek dan alot, 8 fraksi DPR mendadak serentak menyatakan setuju menyita aset tanpa vonis pidana',
    benchmarkHSI: 97,
    benchmark3sRetention: 91,
    winningHookText:
      'Bertahun-tahun alot dan mandek di Senayan... Tiba-tiba seluruh fraksi DPR kompak berteriak "SETUJU". RUU Perampasan Aset siap diketok... Pertanyaannya: Mengapa mereka mendadak sepakat?',
    winningKeyword: 'DPR MENDADAK SEPAKAT',
    archetype: 'The Cognitive Dissonance Paradox',
    caseDescription: 'Kesepakatan kilat DPR dan Pemerintah membawa RUU Perampasan Aset ke Paripurna dengan klausul sita tanpa vonis dan ancaman pidana mati.',
  },
];

export function getBenchmarkById(caseId: string): HistoricalBenchmarkCase | undefined {
  return HISTORICAL_BENCHMARKS.find((b) => b.caseId === caseId);
}
