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
  {
    caseId: 'ugc-skincare-retinol',
    segment: 'commerce_ugc',
    title: 'Serum Retinol 1% Encapsulated (Solusi Flek Hitam & Bekas Jerawat)',
    location: 'TikTok Shop / Shopee Mall',
    victim: 'Wanita 20-35 Tahun Pejuang Flek Hitam & Breakout',
    suspect: 'Skincare Abal-Abal & Facial Mahal Tanpa Hasil',
    keyEvidence: 'Formula Encapsulated Slow-Release, Uji Klinis 14 Hari Tanpa Purging',
    coreConflict: 'Habis jutaan rupiah facial di klinik kecantikan, tapi flek hitam menahun justru membandel karena barrier kulit rusak',
    productData: {
      productName: 'GlowMatrix Retinol Encapsulated 1%',
      category: 'beauty_skincare',
      targetPersona: 'Wanita & Pria 20-35 tahun pejuang jerawat dan flek hitam',
      painPoint: 'Bekas jerawat hitam gak hilang-hilang dan takut kulit ngelupas merah karena retinol keras',
      uspBenefit: 'Retinol encapsulated slow-release aman untuk kulit sensitif, samarkan flek dalam 14 hari',
      offerPrice: 'Diskon 45% + Beli 1 Gratis Re-fill pouch khusus hari ini',
      productUrl: 'https://shopee.co.id/glowmatrix-retinol-serum',
    },
    benchmarkHSI: 94,
    benchmark3sRetention: 89,
    winningHookText:
      'Stop buang duit jutaan buat facial... kalau bekas jerawat kamu masih dibiarin kayak gini. Kulit kamu itu butuh retinol encapsulated... bukan racikan abal-abal.',
    winningKeyword: 'STOP BUANG DUIT',
    archetype: 'The Negative Warning (Stop Doing This)',
    caseDescription: 'UGC Skincare Hook dengan formula Negative Warning membenturkan biaya facial mahal dengan solusi retinol terjangkau.',
  },
  {
    caseId: 'ugc-gadget-anc-earbuds',
    segment: 'commerce_ugc',
    title: 'TWS Hybrid ANC 45dB Wireless Earbuds (Peredam Bising Kereta & Kantor)',
    location: 'TikTok Shop / Tokopedia Official',
    victim: 'Komuter KRL & Pekerja Kantor yang Lelah Suara Bising',
    suspect: 'Earbuds Mahal Bermerek Jutaan Rupiah yang Overpriced',
    keyEvidence: 'Chipset Peredam Bising Hybrid 45dB, Baterai 48 Jam, Game Mode 38ms',
    coreConflict: 'Ingin kerja fokus di tengah kebisingan kantor dan KRL tanpa harus bayar headphone 4 juta rupiah',
    productData: {
      productName: 'SonicPro Silence X TWS ANC',
      category: 'gadget_tech',
      targetPersona: 'Karyawan kantor, mahasiswa, komuter KRL & pecinta musik',
      painPoint: 'Stres suara bising di KRL dan kantor, tapi TWS bermerek luar harganya 3-4 juta',
      uspBenefit: 'Active Noise Cancelling 45dB setara headphone 3 jutaan, baterai 48 jam, harga 199 ribu',
      offerPrice: 'Flash Sale Rp199.000 + Garansi Rusak Ganti Baru 12 Bulan',
      productUrl: 'https://tokopedia.com/sonicpro-silence-x',
    },
    benchmarkHSI: 93,
    benchmark3sRetention: 88,
    winningHookText:
      'Jangan beli TWS harga jutaan dulu... sebelum kamu lihat headphone 100 ribuan ini. Noise cancelling-nya... bikin orang kantor mikir kamu budek.',
    winningKeyword: 'JANGAN BELI DULU',
    archetype: 'The Gatekept Secret & Specific Hack',
    caseDescription: 'UGC Gadget Hook dengan formula Stop Call membenturkan TWS jutaan dengan alternatif 100 ribuan berkemampuan ANC sebanding.',
  },
  {
    caseId: 'ugc-fashion-anti-theft-bag',
    segment: 'commerce_ugc',
    title: 'Ergonomic Anti-Theft Waterproof Backpack 28L (Ransel Anti-Copet)',
    location: 'TikTok Shop Creator Affiliate',
    victim: 'Komuter KRL & Traveler yang Khawatir Barang Elektronik Dicuri / Basah',
    suspect: 'Tas Ransel Standar dengan Resleting Terbuka & Bahan Tembus Air',
    keyEvidence: 'Resleting Rahasia Menempel Punggung, Lapisan Oxford Tahan Air IPX6, Port Charger USB',
    coreConflict: 'Setiap naik transportasi umum harus mendekap tas di depan dada karena takut laptop dicopet atau kehujanan',
    productData: {
      productName: 'AeroShield Urban Anti-Theft Backpack',
      category: 'fashion_apparel',
      targetPersona: 'Komuter harian, traveler, backpacker, pekerja remote pembawa laptop',
      painPoint: 'Was-was resleting dibuka copet dari belakang saat antre KRL atau laptop basah saat hujan',
      uspBenefit: 'Resleting tersembunyi di punggung 100% anti-copet dan bahan oxford waterproof badai',
      offerPrice: 'Promo Launching Diskon 50% Free Rain Cover Tambahan',
      productUrl: 'https://tiktok.com/@aeroshield/backpack',
    },
    benchmarkHSI: 92,
    benchmark3sRetention: 87,
    winningHookText:
      'Ternyata ini alasan pramugari luar negeri gak pernah pakai tas ransel biasa. Ada satu resleting rahasia di punggung... yang pencopet bandara pun gak bakal tahu.',
    winningKeyword: 'RESLETING RAHASIA',
    archetype: 'The Gatekept Secret & Specific Hack',
    caseDescription: 'UGC Lifestyle Hook dengan formula Authority Secret (rahasia pramugari) mengungkap fitur resleting tersembunyi anti-copet.',
  },
  {
    caseId: 'shopee-obermain-tas-pria-kyler-1-mess',
    segment: 'commerce_ugc',
    title: 'Obermain Tas Pria KYLER 1 MESSENGER BAG Black (Shopee Mall)',
    location: 'Shopee Mall Official Store',
    victim: 'Pria & Wanita Pengguna Laptop yang Butuh Tas Kerja Rapi & Awet',
    suspect: 'Tas Murahan Kaku dan Cepat Sobek',
    keyEvidence: 'Material Kulit Sintetis Premium, Kompartemen Laptop Busa Tebal, Jahitan Presisi',
    coreConflict: 'Tas kerja murahan sering kaku, bikin kelihatan tua, dan cepat jebol saat bawa laptop berat',
    productData: {
      productName: 'Obermain Tas Pria KYLER 1 MESSENGER BAG Black OBC169UBLK',
      category: 'fashion_apparel',
      targetPersona: 'Profesional muda, mahasiswa, pekerja kantoran stylish',
      painPoint: 'Tas kerja murah cepat sobek, resleting macet, dan modelnya kaku kayak bapak-bapak',
      uspBenefit: 'Desain modern sleek, bahan lentur waterproof, kompartemen laptop terlindungi aman',
      offerPrice: 'Official Shopee Mall Garansi 100% Original + Extra Voucher Gratis Ongkir',
      productUrl:
        'https://shopee.co.id/Obermain-Tas-Pria-KYLER-1-MESSENGER-BAG-Black-OBC169UBLK-i.170741489.50808935436?extraParams=%7B%22display_model_id%22%3A277542194970%2C%22model_selection_logic%22%3A3%7D&image_ids=sg-11134275-81zup-mn3z6jnqlfk09b',
      imageUrl: '/renders/ecommerce-products/sg-11134275-81zup-mn3z6jnqlfk09b.jpg',
      voicePersona: 'female_creator',
    },
    benchmarkHSI: 95,
    benchmark3sRetention: 89,
    winningHookText:
      'Sumpah ya... jangan PERNAH beli tas kerja murah yang kaku kayak bapak-bapak! Cepet sobek... bikin kelihatan tua lagi!',
    winningKeyword: 'JANGAN BELI DULU',
    archetype: 'The Negative Warning (Stop Doing This)',
    caseDescription:
      'UGC E-Commerce Fashion Hook untuk Obermain Messenger Bag dengan suara Female Creator (Aoede) dan representasi visual real produk Shopee.',
  },
];

export function getBenchmarkById(caseId: string): HistoricalBenchmarkCase | undefined {
  return HISTORICAL_BENCHMARKS.find((b) => b.caseId === caseId);
}
