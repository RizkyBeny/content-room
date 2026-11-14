import { ExplainerScript } from './scriptWriter';
import { PlannedAngle } from './anglePlanner';
import { ExtractedArticle } from './articleExtractor';
import { StoryboardScene } from '../hyperframes/templateGenerator';
import { TranscribedWord } from '../flowMcp/types';

export interface ResolvedStoryboard {
  scenes: StoryboardScene[];
  totalDurationMs: number;
}

export function resolveStoryboard(
  script: ExplainerScript,
  angle: PlannedAngle,
  article: ExtractedArticle,
  options?: {
    words?: TranscribedWord[];
    actualDurationMs?: number;
    themePresetId?: string;
  }
): ResolvedStoryboard {
  const totalDurationMs = options?.actualDurationMs || script.estimatedDurationSec * 1000;
  const sentenceCount = script.sentences.length;
  const avgSceneDurationMs = Math.floor(totalDurationMs / sentenceCount);

  const beats = ['hook', 'context', 'data', 'impact', 'outro'];
  const kickers = [
    angle.name.toUpperCase(),
    'FAKTA TERBARU',
    article.numbers.length > 0 ? 'SOROTAN DATA' : 'POIN KUNCI',
    'DAMPAK LANGSUNG',
    'POLLING & RESPON',
  ];

  const isVoxPreset = options?.themePresetId === 'vox-archival-parallax';

  // Determine contextual stamp for Vox template
  const fullArticleText = (article.title + ' ' + article.paragraphs.join(' ')).toLowerCase();
  let defaultStamp = 'VERIFIKASI';
  if (fullArticleText.includes('ilegal') || fullArticleText.includes('penindakan') || fullArticleText.includes('kasus') || fullArticleText.includes('rahasia')) {
    defaultStamp = 'RAHASIA';
  } else if (fullArticleText.includes('penerimaan') || fullArticleText.includes('apbn') || fullArticleText.includes('kebijakan') || fullArticleText.includes('resmi')) {
    defaultStamp = 'DEKLASIFIKASI';
  }

  // Extract year for evidence badge
  const yearMatch = fullArticleText.match(/\b(19\d\d|20\d\d)\b/);
  const detectedYear = yearMatch ? yearMatch[1] : '2026';

  const scenes: StoryboardScene[] = script.sentences.map((sentence, idx) => {
    const start_ms = idx * avgSceneDurationMs;
    const end_ms = idx === sentenceCount - 1 ? totalDurationMs : (idx + 1) * avgSceneDurationMs;

    // Decide hybrid asset type
    let assetType: 'video' | 'image' | 'graphic_only' = 'image';
    if (idx === 0) {
      assetType = 'video';
    } else if (idx === 2 && article.numbers.length > 0) {
      assetType = 'graphic_only';
    } else if (idx === 3) {
      assetType = 'image';
    } else {
      assetType = 'image';
    }

    // Headline: Punchy phrase
    let headline = sentence.text;
    if (headline.length > 60) {
      const words = headline.split(' ');
      headline = words.slice(0, 8).join(' ') + '...';
    }

    // Extract metric if available for data scene
    let metric: string | undefined = undefined;
    let metricLabel: string | undefined = undefined;
    if (idx === 0 && article.numbers.length > 0) {
      metric = article.numbers[0];
      metricLabel = 'Data Terkini';
    } else if (idx === 2 && article.numbers.length > 1) {
      metric = article.numbers[1];
      metricLabel = 'Perubahan Kunci';
    }

    // Vox Master Prompt Generator
    let visualIntent = `Cinematic 9:16 visual representing ${sentence.text.slice(0, 60)}, high aesthetic, modern documentary, photorealistic`;
    let variant: 'variant-a' | 'variant-b' | undefined = undefined;
    let stampType: string | undefined = undefined;
    let evidenceCategory: string | undefined = undefined;
    let evidenceSource: string | undefined = undefined;

    if (isVoxPreset) {
      // Alternating rhythm:
      // Variant B (Desk Overview & Cutout) for Hook (0), Impact (3), Outro (4)
      // Variant A (Macro Dossier & Tape Reel) for Context (1), Data (2)
      if (idx === 0 || idx === 3 || idx === 4) {
        variant = 'variant-b';
        visualIntent = `A high-end editorial 2.5D documentary photo collage in the distinctive Vox visual journalism style, vertical 9:16 composition. An investigative historical desk setup examining ${sentence.text.slice(0, 70)}. In the midground, a vintage rotary telephone connected to an analog interception switchbox with glowing vacuum tubes and patched jumper wires, resting atop a spread of authentic archival documents with red ink editorial underlines. In the foreground, textured torn edges of yellowed archival paper and a pair of heavy wiretapping headphones frame the bottom and sides. In the background, a large-format vintage Indonesian map and institutional office walls blur into soft focus with subtle dust motes in a beam of light. Rich documentary photojournalism feel, 35mm film texture, high contrast chiaroscuro lighting, distinct 3-plane spatial depth. The top 35% is open, dark, clean negative space. Editorial documentary collage, authentic historical look, no floating letters, no digital watermark.`;
      } else {
        variant = 'variant-a';
        visualIntent = `A high-end editorial 2.5D documentary photo collage in the distinctive Vox visual journalism style, vertical 9:16 composition. An intelligence archive examining ${sentence.text.slice(0, 70)}. In the midground, an iconic vintage 1960s reel-to-reel magnetic tape recorder with twin aluminum spools, analog VU meters, and coiled vintage bakelite headphones sits on a dark teak wood desk alongside a thick manila folder marked with a bold red rubber stamp reading "RAHASIA". In the foreground, a dark coiled telephone cord and a brass magnifying glass create strong foreground depth. In the background, aged Indonesian newspaper clippings and shadowy institutional louvre blinds fade softly into warm atmospheric shadow. Tactile matte paper archival aesthetic, subtle 35mm film grain, dramatic documentary lighting with volumetric warm desk lamp glow. The top 35% of the frame is clean, uncluttered negative space reserved for text overlay. Clean, realistic, editorial journalism collage, no digital UI, no floating text or subtitles.`;
      }

      stampType = defaultStamp;
      evidenceCategory = `BERKAS INVESTIGASI LAPORAN // ${detectedYear}`;
      evidenceSource = `SUMBER: DOKUMEN RESMI & RISET ${article.sourceDomain.toUpperCase()}`;
    }

    return {
      id: `s${idx + 1}`,
      beat: beats[idx] || 'beat',
      start_ms,
      end_ms,
      kicker: kickers[idx] || 'UPDATE',
      headline,
      subtext: sentence.text !== headline ? sentence.text : undefined,
      metric,
      metricLabel,
      assetType,
      visualIntent,
      variant,
      stampType,
      evidenceCategory,
      evidenceSource,
    };
  });

  return {
    scenes,
    totalDurationMs,
  };
}
