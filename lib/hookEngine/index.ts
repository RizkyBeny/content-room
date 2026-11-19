import { CaseDossierInput, HookSimulatorSession, HookCandidate } from './types';
import { generateHookCandidates } from './hookGenerator';
import { scoreHookCandidate } from './empiricalScorer';
import { synthesizeHookMedia } from './flowMediaSynthesizer';
import { HISTORICAL_BENCHMARKS, getBenchmarkById } from './caseLibrary';
import { extractCrimeCaseDossier } from '../orchestrator/agents/caseExtractor';

export * from './types';
export * from './archetypes';
export * from './caseLibrary';
export * from './empiricalScorer';
export * from './hookGenerator';
export * from './flowMediaSynthesizer';

/**
 * Hook Successor Engine Facade
 */
export class HookSuccessorEngine {
  /**
   * Initializes a new Hook Simulator Session from URL, Case ID, or raw brief
   */
  async createSession(input: {
    sourceUrl?: string;
    caseId?: string;
    rawBrief?: string;
    synthesizeMedia?: boolean;
  }): Promise<HookSimulatorSession> {
    let dossier: CaseDossierInput;

    if (input.caseId) {
      const benchmark = getBenchmarkById(input.caseId);
      if (benchmark) {
        dossier = { ...benchmark };
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
        };
      }
    } else if (input.sourceUrl) {
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
      };
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
