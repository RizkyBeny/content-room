import * as cheerio from 'cheerio';

export interface ExtractedArticle {
  url: string;
  title: string;
  leadParagraph: string;
  paragraphs: string[];
  numbers: string[];
  quotes: string[];
  leadImage?: string;
  sourceDomain: string;
}

export async function extractArticle(url: string): Promise<ExtractedArticle> {
  const parsedUrl = new URL(url);

  // Validate URL protocol
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('URL harus berprotokol HTTP atau HTTPS');
  }

  // Fetch article content
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil artikel: HTTP ${response.status} (${response.statusText})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract title
  let title = $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    'Artikel Tanpa Judul';

  // Clean trailing site name if any (e.g., " | Media", " - Portal Berita")
  title = title.split(' - ')[0].split(' | ')[0].trim();

  // Extract lead image
  const leadImage = $('meta[property="og:image"]').attr('content') ||
    $('article img').first().attr('src') ||
    undefined;

  // Extract paragraphs
  const paragraphs: string[] = [];
  $('article p, main p, .post-content p, .article-body p, .entry-content p, p').each((_, el) => {
    const text = $(el).text().trim();
    // Exclude boilerplate, short captions, ads
    if (text.length > 30 && !text.toLowerCase().includes('baca juga') && !text.toLowerCase().includes('simak video')) {
      paragraphs.push(text);
    }
  });

  if (paragraphs.length === 0) {
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 40) {
        paragraphs.push(text);
      }
    });
  }

  const leadParagraph = paragraphs[0] || title;

  // Extract numbers / metrics / statistics from text
  const numbers: string[] = [];
  const fullText = paragraphs.join(' ');
  const numberRegex = /(?:Rp\s?[\d.,]+|\b\d+(?:[.,]\d+)?\s?(?:persen|%|ribu|juta|miliar|triliun|tahun|bulan|hari|jam|km|meter|ton)?\b)/gi;
  const matches = fullText.match(numberRegex);
  if (matches) {
    for (const match of matches) {
      const trimmed = match.trim();
      if (trimmed.length > 1 && !numbers.includes(trimmed)) {
        numbers.push(trimmed);
        if (numbers.length >= 8) break;
      }
    }
  }

  // Extract quotes
  const quotes: string[] = [];
  const quoteRegex = /"([^"]+)"|“([^”]+)”/g;
  let qMatch: RegExpExecArray | null;
  while ((qMatch = quoteRegex.exec(fullText)) !== null) {
    const quote = (qMatch[1] || qMatch[2] || '').trim();
    if (quote.length > 20 && quote.length < 200) {
      quotes.push(quote);
      if (quotes.length >= 4) break;
    }
  }

  return {
    url,
    title,
    leadParagraph,
    paragraphs: paragraphs.slice(0, 10),
    numbers,
    quotes,
    leadImage,
    sourceDomain: parsedUrl.hostname,
  };
}

