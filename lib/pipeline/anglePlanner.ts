import { ExtractedArticle } from './articleExtractor';

export interface PlannedAngle {
  name: string;
  rationale: string;
  hookType: 'surprising-statistic' | 'urgent-question' | 'key-impact' | 'direct-quote';
}

export function planAngle(article: ExtractedArticle, brief?: string): PlannedAngle {
  const briefLower = (brief || '').toLowerCase();
  const titleLower = article.title.toLowerCase();

  // If user provided a specific brief/intent
  if (briefLower.includes('dampak') || briefLower.includes('warga') || briefLower.includes('pekerja')) {
    return {
      name: 'Dampak ke Publik',
      rationale: `Brief user meminta fokus pada dampak: "${brief}". Menyoroti bagaimana isu ini dirasakan langsung.`,
      hookType: 'key-impact',
    };
  }

  if (briefLower.includes('data') || briefLower.includes('angka') || briefLower.includes('ekonomi')) {
    return {
      name: 'Sorotan Angka Kunci',
      rationale: `Brief user meminta penekanan data. Memprioritaskan metrik kuantitatif dan statistik artikel.`,
      hookType: 'surprising-statistic',
    };
  }

  if (briefLower.includes('kronologi') || briefLower.includes('alur') || briefLower.includes('fakta')) {
    return {
      name: 'Kronologi Peristiwa',
      rationale: `Brief user mengarahkan ke penguraian alur dan urutan kejadian.`,
      hookType: 'direct-quote',
    };
  }

  // Fallback heuristic based on article content
  if (article.numbers.length >= 3) {
    return {
      name: 'Fakta di Balik Angka',
      rationale: `Artikel memuat ${article.numbers.length} data statistik kunci. Format data explainer paling efektif menyajikan perbandingan angka ini.`,
      hookType: 'surprising-statistic',
    };
  }

  if (titleLower.includes('kenapa') || titleLower.includes('alasan') || titleLower.includes('bagaimana') || titleLower.includes('ini penyebab')) {
    return {
      name: 'Penjelasan Sebab-Akibat',
      rationale: `Judul dan isi artikel membedah sebab-akibat suatu fenomena.`,
      hookType: 'urgent-question',
    };
  }

  return {
    name: 'Intisari & Dampak',
    rationale: `Struktur explainer standar: hook langsung, konteks inti, dan kesimpulan relevan untuk penonton.`,
    hookType: 'key-impact',
  };
}

