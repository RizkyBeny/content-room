import { ExtractedArticle } from './articleExtractor';
import { PlannedAngle } from './anglePlanner';

export interface ScriptSentence {
  id: string;
  text: string;
  wordCount: number;
}

export interface ExplainerScript {
  sentences: ScriptSentence[];
  fullText: string;
  totalWords: number;
  estimatedDurationSec: number;
  isDurationValid: boolean;
}

export function writeScript(article: ExtractedArticle, angle: PlannedAngle): ExplainerScript {
  const sentences: ScriptSentence[] = [];

  // Sentence 1: The Hook (Opening Beat)
  let hookSentence = '';
  if (angle.hookType === 'surprising-statistic' && article.numbers.length > 0) {
    hookSentence = `Kabar mengejutkan, ${article.numbers[0]} tercatat dalam laporan terbaru terkait ${article.title}.`;
  } else if (angle.hookType === 'urgent-question') {
    hookSentence = `Kenapa isu ${article.title} mendadak jadi sorotan publik hari ini?`;
  } else {
    hookSentence = `Ada perkembangan penting seputar ${article.title} yang wajib kamu ketahui sekarang juga.`;
  }
  sentences.push({
    id: 's1',
    text: hookSentence,
    wordCount: hookSentence.split(/\s+/).filter(Boolean).length,
  });

  // Sentence 2: Core Context
  const contextSentence = article.leadParagraph
    ? `${article.leadParagraph.slice(0, 150).replace(/\.[^.]*$/, '')}.`
    : `Pemerintah dan pihak terkait telah merilis detail resmi mengenai ketentuan baru ini.`;
  sentences.push({
    id: 's2',
    text: contextSentence,
    wordCount: contextSentence.split(/\s+/).filter(Boolean).length,
  });

  // Sentence 3: Key Detail / Data Point / Quote
  let detailSentence = '';
  if (article.numbers.length > 1) {
    detailSentence = `Fakta menariknya, angka ini menyentuh ${article.numbers[1]}, memicu perubahan signifikan bagi sektor terkait.`;
  } else if (article.quotes.length > 0) {
    detailSentence = `Menurut keterangan resmi: "${article.quotes[0].slice(0, 100)}".`;
  } else if (article.paragraphs.length > 1) {
    detailSentence = `${article.paragraphs[1].slice(0, 140).replace(/\.[^.]*$/, '')}.`;
  } else {
    detailSentence = `Langkah ini diambil guna mengantisipasi tantangan yang dihadapi masyarakat ke depan.`;
  }
  sentences.push({
    id: 's3',
    text: detailSentence,
    wordCount: detailSentence.split(/\s+/).filter(Boolean).length,
  });

  // Sentence 4: The Impact / Meaning
  let impactSentence = '';
  if (article.paragraphs.length > 2) {
    impactSentence = `Dampaknya, kebijakan ini langsung memengaruhi pola aktivitas serta operasional harian di lapangan.`;
  } else {
    impactSentence = `Banyak pihak menilai kebijakan ini akan menjadi tolok ukur baru bagi industri dan masyarakat.`;
  }
  sentences.push({
    id: 's4',
    text: impactSentence,
    wordCount: impactSentence.split(/\s+/).filter(Boolean).length,
  });

  // Sentence 5: Outro / Takeaway Callout
  const outroSentence = `Bagaimana menurutmu? Tulis pendapatmu di kolom komentar dan bagikan kabar ini ke rekanmu.`;
  sentences.push({
    id: 's5',
    text: outroSentence,
    wordCount: outroSentence.split(/\s+/).filter(Boolean).length,
  });

  const fullText = sentences.map((s) => s.text).join(' ');
  const totalWords = sentences.reduce((sum, s) => sum + s.wordCount, 0);

  // Bahasa Indonesia speaking rate: approx 2.5 words per second
  const estimatedDurationSec = Math.round((totalWords / 2.5) * 10) / 10;
  const isDurationValid = estimatedDurationSec <= 60;

  return {
    sentences,
    fullText,
    totalWords,
    estimatedDurationSec,
    isDurationValid,
  };
}

