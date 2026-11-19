export type ContentSegmentKey =
  | 'video_reels'
  | 'commerce_ugc'
  | 'news_anchor'
  | 'carousel_swipe'
  | 'article_blog'
  | 'single_image_post';

export type HookArchetypeKey =
  | 'cognitive_dissonance_paradox'
  | 'odd_specific_detail'
  | 'micro_story_countdown'
  | 'ugc_negative_warning'
  | 'ugc_gatekept_secret'
  | 'ugc_before_after_countdown'
  | 'whispered_crime_scene'
  | 'multi_motive_escalation'
  | 'cold_forensic_warning';

export interface HookArchetypeDefinition {
  key: HookArchetypeKey;
  name: string;
  description: string;
  psychologicalTrigger: string;
  formula: string;
  example: string;
}

export interface PillarScores {
  scrollStopVelocity: number; // 0 - 25
  cognitiveGapTension: number; // 0 - 25
  mutedTypographyPunch: number; // 0 - 25
  algorithmicCommentTrigger: number; // 0 - 25
}

export interface PillarReasonFactor {
  factor: string;
  points: number; // e.g. +3 or -2
  description: string;
}

export interface PillarAuditBreakdown {
  pillarKey: keyof PillarScores;
  pillarName: string;
  score: number;
  maxScore: number;
  factors: PillarReasonFactor[];
  verdict: string;
}

export interface RetentionCurvePoint {
  second: number;
  retentionPct: number;
  eventLabel: string;
}

export interface SimulatedFeedComment {
  username: string;
  avatarColor: string;
  comment: string;
  likes: string;
  personaType: string;
  timeAgo: string;
}

export interface AudiencePersonaProfile {
  personaName: string;
  tagline: string;
  resonanceScore: number; // 0 - 100
  demographic: string; // e.g. "Pria & Wanita 24-45 thn"
  psychologicalHook: string; // Alasan kenapa mereka kemakan konten ini
  viralBehavior: string; // Apa yang mereka lakukan (share WA, debat komen, save)
  churnRisk: 'low' | 'medium' | 'high';
  keyQuote: string;
}

export interface BenchmarkComparison {
  benchmarkCaseName: string;
  benchmarkScore: number;
  delta: number; // positive = better than benchmark, negative = below
  status: 'superior' | 'competitive' | 'needs_work';
}

export interface HookCandidate {
  id: string; // e.g. "hook-1"
  archetype: HookArchetypeKey;
  archetypeName: string;
  hookText: string;
  topGiantKeyword: string;
  durationSecEstimate: number; // estimated spoken duration (~4-7s)
  scores: PillarScores;
  scoringAudit: PillarAuditBreakdown[];
  retentionCurve: RetentionCurvePoint[];
  simulatedComments: SimulatedFeedComment[];
  audiencePersonas: AudiencePersonaProfile[];
  hookSuccessIndex: number; // 0 - 100 composite (sum of pillars)
  predictedRetention3s: number; // e.g. 88 (%)
  predictedCompletionRate: number; // e.g. 74 (%)
  shareDebateRatioIndex: number; // 1 - 10
  psychologicalReason: string;
  algorithmicReason: string;
  conciseSummary?: string;
  improvementSuggestion: string;
  benchmarkVsHistory: BenchmarkComparison;
  media?: {
    audioPath?: string;
    audioUrl?: string;
    imagePath?: string;
    imageUrl?: string;
    videoSnippetPath?: string;
    videoSnippetUrl?: string;
    synthesizedAt?: string;
  };
}

export type CommerceNicheCategory =
  | 'beauty_skincare'
  | 'gadget_tech'
  | 'fashion_apparel'
  | 'fnb_culinary'
  | 'home_living'
  | 'general';

export interface ProductDossierInput {
  productName: string;
  category: CommerceNicheCategory;
  targetPersona?: string;
  painPoint: string;
  uspBenefit: string;
  offerPrice?: string;
  productUrl?: string;
  voicePersona?: 'female_creator' | 'male_creator' | 'auto';
}

export interface CaseDossierInput {
  caseId?: string;
  segment?: ContentSegmentKey;
  title: string;
  location: string;
  victim: string;
  suspect: string;
  keyEvidence: string;
  coreConflict: string;
  sourceUrl?: string;
  rawBrief?: string;
  productData?: ProductDossierInput;
}

export interface HookSimulatorSession {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  dossier: CaseDossierInput;
  candidates: HookCandidate[];
  recommendedWinnerId: string;
  selectedWinnerId?: string;
}
