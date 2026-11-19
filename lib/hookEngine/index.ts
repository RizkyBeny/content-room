import fs from 'node:fs';
import path from 'node:path';
import { CaseDossierInput, HookSimulatorSession, HookCandidate, ContentSegmentKey, ProductDossierInput } from './types';
import { generateHookCandidates } from './hookGenerator';
import { scoreHookCandidate } from './empiricalScorer';
import { synthesizeHookMedia } from './flowMediaSynthesizer';
import { HISTORICAL_BENCHMARKS, getBenchmarkById } from './caseLibrary';
import { extractCrimeCaseDossier } from '../orchestrator/agents/caseExtractor';
import { extractEcommerceProductDossier } from './ecommerceParser';

export * from './types';
export * from './archetypes';
export * from './segments';
export * from './caseLibrary';
export * from './empiricalScorer';
export * from './hookGenerator';
export * from './flowMediaSynthesizer';
export * from './ecommerceParser';

/**
 * Hook Successor Engine Facade
 */
export class HookSuccessorEngine {
  /**
   * Initializes a new Hook Simulator Session from URL, Case ID, Product Data, or raw brief
   */
  async createSession(input: {
    sourceUrl?: string;
    caseId?: string;
    rawBrief?: string;
    segment?: ContentSegmentKey;
    productData?: ProductDossierInput;
    synthesizeMedia?: boolean;
  }): Promise<HookSimulatorSession> {
    let dossier: CaseDossierInput;

    if (input.productData) {
      const p = input.productData;
      dossier = {
        caseId: `ugc-${Date.now()}`,
        segment: 'commerce_ugc',
        title: p.productName,
        location: 'TikTok Shop / Shopee',
        victim: p.targetPersona || 'Konsumen',
        suspect: 'Solusi / Skincare Lama yang Tidak Efektif',
        keyEvidence: p.uspBenefit,
        coreConflict: p.painPoint,
        rawBrief: `${p.productName} - ${p.uspBenefit}. Promo: ${p.offerPrice || '-'}`,
        sourceUrl: p.productUrl,
        productData: p,
      };
    } else if (input.caseId) {
      const benchmark = getBenchmarkById(input.caseId);
      if (benchmark) {
        dossier = {
          ...benchmark,
          segment: input.segment || benchmark.segment || 'video_reels',
          productData: benchmark.productData,
        };
      } else {
        dossier = {
          caseId: input.caseId,
          title: input.caseId.replace(/-/g, ' ').toUpperCase(),
          location: 'Indonesia',
          victim: 'Korban Perkara',
          suspect: 'Tersangka Perkara',
          keyEvidence: 'Barang Bukti Forensik',
          coreConflict: 'Konflik investigasi utama',
          rawBrief: input.rawBrief,
          segment: input.segment || 'video_reels',
        };
      }
    } else if (input.sourceUrl) {
      const isEcommerce =
        input.segment === 'commerce_ugc' ||
        /(shopee|tokopedia|tiktok\.com|lazada|blibli|zalora|product|shop)/i.test(input.sourceUrl);

      if (isEcommerce) {
        console.log(`🛍️ [Hook Engine] Mendeteksi URL E-Commerce: ${input.sourceUrl}...`);
        const ecom = await extractEcommerceProductDossier(input.sourceUrl);
        dossier = ecom.dossier;
      } else {
        console.log(`🌐 Mengambil & menganalisis artikel dari URL: ${input.sourceUrl}...`);
        const extracted = await extractCrimeCaseDossier(input.sourceUrl);
        const slug = (extracted.headline || 'investigasi')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 30);
        dossier = {
          caseId: `url-${slug}`,
          title: extracted.headline || 'Investigasi Perkara Kriminal',
          location: extracted.location || 'Indonesia',
          victim: extracted.victims?.join(', ') || 'Korban',
          suspect: extracted.suspects?.join(', ') || 'Pelaku',
          keyEvidence: extracted.keyEvidence?.join(', ') || 'Barang Bukti',
          coreConflict: extracted.chronologySummary || 'Konflik kejahatan',
          sourceUrl: input.sourceUrl,
          rawBrief: extracted.hookIdea,
          segment: input.segment || 'video_reels',
        };
      }
    } else {
      dossier = {
        caseId: `brief-${Date.now()}`,
        title: 'Investigasi Perkara Kriminal',
        location: 'Indonesia',
        victim: 'Korban',
        suspect: 'Pelaku',
        keyEvidence: 'Bukti Kunci',
        coreConflict: input.rawBrief || 'Konflik perkara',
        rawBrief: input.rawBrief,
        segment: input.segment || 'video_reels',
      };
    }

    console.log(`🧠 Memformulasikan 5 arketipe hook untuk: "${dossier.title}"...`);
    const candidates = await generateHookCandidates(dossier);

    // Identify recommended winner (highest HSI score)
    const sorted = [...candidates].sort((a, b) => b.hookSuccessIndex - a.hookSuccessIndex);
    const recommendedWinnerId = sorted[0]?.id || 'hook-1';

    // If synthesizeMedia is requested, synthesize media for all 3 candidates so all are instantly ready
    if (input.synthesizeMedia) {
      console.log(`🎬 Memulai sintesis media Neo-Noir (Bom Bali style) untuk seluruh 3 kandidat hook...`);
      for (const cand of candidates.slice(0, 3)) {
        try {
          const media = await synthesizeHookMedia(cand, dossier);
          cand.media = media;
        } catch (err: any) {
          console.warn(`⚠️ Gagal mensintesis media untuk ${cand.id}:`, err.message);
        }
      }
    }

    // Auto-attach pre-synthesized media from disk if available
    for (const cand of candidates) {
      if (!cand.media && dossier.caseId) {
        const outDir = path.resolve(process.cwd(), 'public', 'renders', 'hook-simulator', dossier.caseId, cand.id);
        const videoSnippetPath = path.join(outDir, 'hook-preview.mp4');
        const audioPath = path.join(outDir, 'hook-audio.wav');
        const imagePath = path.join(outDir, 'hook-visual.jpg');
        if (fs.existsSync(videoSnippetPath)) {
          cand.media = {
            audioPath,
            audioUrl: `/renders/hook-simulator/${dossier.caseId}/${cand.id}/hook-audio.wav`,
            imagePath,
            imageUrl: `/renders/hook-simulator/${dossier.caseId}/${cand.id}/hook-visual.jpg`,
            videoSnippetPath,
            videoSnippetUrl: `/renders/hook-simulator/${dossier.caseId}/${cand.id}/hook-preview.mp4`,
            durationSec: 6.0,
          };
        }
      }
    }

    const sessionId = `sess-${Date.now()}`;
    return {
      sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dossier,
      candidates,
      recommendedWinnerId,
    };
  }

  /**
   * Re-evaluates a hook candidate when copy or keyword is edited
   */
  rescoreCandidate(params: {
    candidate: HookCandidate;
    newHookText: string;
    newGiantKeyword: string;
    dossier: CaseDossierInput;
  }): HookCandidate {
    const evaluation = scoreHookCandidate({
      hookText: params.newHookText,
      topGiantKeyword: params.newGiantKeyword,
      archetypeKey: params.candidate.archetype,
      dossier: params.dossier,
    });

    const wordCount = params.newHookText.split(/\s+/).length;
    const durationSecEstimate = Number((wordCount * 0.45).toFixed(1));

    return {
      ...params.candidate,
      hookText: params.newHookText,
      topGiantKeyword: params.newGiantKeyword,
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
  }
}

export const hookEngine = new HookSuccessorEngine();
