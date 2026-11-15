export interface CrimeCaseDossier {
  url: string;
  headline: string;
  source: string;
  crimeType: string;
  location: string;
  suspects: string[];
  victims: string[];
  keyEvidence: string[];
  chronologySummary: string;
  hookIdea: string;
  fullBodyText: string;
}

export interface ScriptBeat {
  shot: number;
  startSec: number;
  endSec: number;
  narration: string;
  visualCue: string;
  shotType: 'cover' | 'hook' | 'perpetrator' | 'context' | 'desk' | 'timeline' | 'climax' | 'justice' | 'archive';
}

export interface NoirScript {
  title: string;
  subHeadline: string;
  fullText: string;
  targetDurationSec: number;
  wordCount: number;
  beats: ScriptBeat[];
}

export interface KeyframeItem {
  shot: number;
  label: string;
  prompt: string;
  imagePath?: string;
  imageUrl?: string;
  isCoreSample?: boolean;
}

export interface PostingMetadata {
  seoTitle: string;
  caption: string;
  hashtags: string[];
  summaryNote: string;
}

export type JobStatus =
  | 'IDLE'
  | 'ANALYZING_ARTICLE'
  | 'SCRIPTING'
  | 'GENERATING_SAMPLES'
  | 'AWAITING_STAGE1_APPROVAL'
  | 'SYNTHESIZING_AUDIO'
  | 'GENERATING_ALL_KEYFRAMES'
  | 'COMPOSING_VIDEO'
  | 'RENDERING_FINAL'
  | 'PACKAGING_METADATA'
  | 'DELIVERING_FINAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface OrchestratorJob {
  id: string;
  articleUrl: string;
  chatId: number | string;
  status: JobStatus;
  statusMessage?: string;
  errorMessage?: string;
  dossier?: CrimeCaseDossier;
  script?: NoirScript;
  sampleKeyframes?: KeyframeItem[];
  allKeyframes?: KeyframeItem[];
  audioPath?: string;
  audioDurationSec?: number;
  finalVideoPath?: string;
  metadata?: PostingMetadata;
  telegramMessageIds?: number[];
  createdAt: string;
  updatedAt: string;
}
