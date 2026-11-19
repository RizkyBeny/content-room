import { ContentSegmentKey } from './types';

export interface ContentSegmentDefinition {
  key: ContentSegmentKey;
  name: string;
  targetMedium: string;
  description: string;
  guidelines: {
    formatConstraints: string;
    keywordPlacement: string;
    primaryTrigger: string;
    cmlabsPillarsUsed: string[];
  };
  promptDirective: string;
}

export const CONTENT_SEGMENTS: Record<ContentSegmentKey, ContentSegmentDefinition> = {
  video_reels: {
    key: 'video_reels',
    name: 'Short Video (Reels / TikTok / Shorts)',
    targetMedium: '9:16 Vertical Video (1080x1920)',
    description: 'Format video pendek bertensi tinggi dengan narasi audio dingin Charon dan top giant keyword untuk mode hening.',
    guidelines: {
      formatConstraints: '15-22 kata, durasi berbicara 5-8 detik, rekayasa tanda baca titik tiga (...) untuk jeda bernafas 0.4s-0.6s.',
      keywordPlacement: 'Frasa 2-3 kata huruf besar di sepertiga atas layar feed.',
      primaryTrigger: 'Golden 3-Second Retention Milestone (menghentikan jempol dalam 1 detik).',
      cmlabsPillarsUsed: ['Curiosity Questioning', 'Micro-Storytelling', 'Controversial Paradox', 'Visual Anchor'],
    },
    promptDirective: `Fokus pada video vertikal 9:16: Mulai narasi di detik 0 tanpa pengantar klise. Sisipkan tanda titik tiga (...) untuk jeda audio. Tentukan 1 frasa kunci "topGiantKeyword" (2-3 kata HURUF BESAR) untuk penonton mode senyap.`,
  },
  commerce_ugc: {
    key: 'commerce_ugc',
    name: 'Commerce & UGC Video Ad',
    targetMedium: '9:16 Video Kreatif / Iklan Produk',
    description: 'Hook berbasis masalah nyata (problem-agitation), kontras sebelum-sesudah, atau rahasia yang mengubah cara pandang konsumen.',
    guidelines: {
      formatConstraints: '12-18 kata, durasi 4-6 detik, berfokus pada frustrasi emosional atau rasa ingin tahu produk.',
      keywordPlacement: 'Pain-point atau benefit utama dalam 2-3 kata (misal: "STOP BUANG DUIT", "RAHASIA KULIT GLOWING").',
      primaryTrigger: 'Self-Interest, Solution Discovery & Call-to-Value.',
      cmlabsPillarsUsed: ['Curiosity Questioning', 'Fakta / Statistik Mengejutkan', 'Anti-Empty Clickbait'],
    },
    promptDirective: `Fokus pada Commerce/UGC: Sorot frustrasi terbesar audiens atau benturkan kebiasaan salah dengan solusi yang tak terduga. Hindari hard-selling norak; gunakan rasa penasaran solusi konkrit.`,
  },
  news_anchor: {
    key: 'news_anchor',
    name: 'News Anchor & Policy Explainer',
    targetMedium: 'Broadcast 16:9 / 9:16 Breaking News Frame',
    description: 'Pembuka gaya jurnalisme investigatif dengan wibawa tinggi, menabrak paradoks kebijakan atau skandal kekuasaan.',
    guidelines: {
      formatConstraints: '18-25 kata, durasi 6-9 detik, intonasi otoritas dan urgensi publik.',
      keywordPlacement: 'Breaking News Kicker (misal: "DPR MENDADAK SEPAKAT", "KLAUSUL NON-VONIS").',
      primaryTrigger: 'Public Outrage, Civil Accountability & Urgent Insight.',
      cmlabsPillarsUsed: ['Pernyataan Kontroversial', 'Kutipan / Bukti Otentik', 'Fakta / Statistik'],
    },
    promptDirective: `Fokus pada News Anchor: Awali dengan fakta kontroversial atau paradoks keputusan elite politik yang bertentangan dengan akal sehat publik. Tampilkan klausul atau data spesifik.`,
  },
  carousel_swipe: {
    key: 'carousel_swipe',
    name: 'Social Media Carousel (Instagram / LinkedIn)',
    targetMedium: 'Slide 1 Multi-Slide Post (1080x1350 / 1080x1080)',
    description: 'Headline slide cover yang memicu rasa penasaran akut sehingga audiens wajib menggeser ke slide 2 (*Swipe-Through Rate*).',
    guidelines: {
      formatConstraints: 'Judul utama cover maksimal 7-10 kata + 1 baris sub-teks pemicu swipe (misal: "Geser sebelum terlambat").',
      keywordPlacement: 'Teks cover utama berukuran besar dengan kontras visual tajam.',
      primaryTrigger: 'Information Gap & Swipe-Through Rate (STR).',
      cmlabsPillarsUsed: ['Curiosity Questioning', 'Headline Singkat & Padat', 'Kisah Pendek'],
    },
    promptDirective: `Fokus pada Slide 1 Carousel: Rancang teks cover yang membuat audiens merasa tertinggal jika tidak menggeser ke slide berikutnya. Tuliskan naskah teks judul cover dan teaser sub-teksnya.`,
  },
  article_blog: {
    key: 'article_blog',
    name: 'SEO Longform Article & Blog Post',
    targetMedium: 'H1 Title + Paragraf Pembuka Artikel Web (cmlabs style)',
    description: 'Judul artikel berdaya pikat SEO organik dipadukan dengan paragraf pembuka yang langsung mengunci pembaca (*Search Intent Satisfaction*).',
    guidelines: {
      formatConstraints: 'Judul H1 50-65 karakter (SEO-friendly) + Lead paragraph 2-3 kalimat tajam (30-45 kata).',
      keywordPlacement: 'Keyword utama di awal judul H1 dan bold text pada kalimat pertama.',
      primaryTrigger: 'Search Intent Relevance & Dwell Time (Mencegah Bounce Rate).',
      cmlabsPillarsUsed: ['Headline Singkat & Padat', 'Fakta / Statistik', 'Pernyataan Kontroversial', 'Anti-Empty Clickbait'],
    },
    promptDirective: `Fokus pada Artikel / Blog SEO: Buat judul H1 yang click-worthy tanpa clickbait murahan, diikuti paragraf pembuka yang menyajikan fakta/statistik mengejutkan atau paradoks yang relevan dengan kebutuhan pembaca.`,
  },
  single_image_post: {
    key: 'single_image_post',
    name: 'Static Feed Post (Single Image + Caption)',
    targetMedium: 'Single Image Post 1:1 / 4:5 + Baris Pertama Keterangan (Caption)',
    description: 'Judul visual pada grafis dipadukan dengan kalimat pertama caption yang terlihat sebelum tombol "...selengkapnya" (125 karakter pertama).',
    guidelines: {
      formatConstraints: 'Teks visual gambar 3-5 kata + Baris pertama caption maksimal 15-20 kata sebelum truncate.',
      keywordPlacement: 'Teks raksasa di grafis gambar + 1 kalimat pembuka caption yang menusuk emosi.',
      primaryTrigger: 'Scroll-Stop Visual Impact & First-Line Caption Click.',
      cmlabsPillarsUsed: ['Headline Singkat & Padat', 'Kutipan Menarik', 'Curiosity Questioning'],
    },
    promptDirective: `Fokus pada Single Post Gambar: Rancang teks visual singkat untuk ditempatkan pada gambar, dan tuliskan 1-2 kalimat pembuka caption yang memicu penonton mengklik tombol "baca selengkapnya" atau menulis komentar.`,
  },
};
