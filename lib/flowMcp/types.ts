export interface FlowSessionStatus {
  signedIn?: boolean;
  project?: string;
  plan?: string;
  credits?: number;
  creditsCap?: number;
  error?: string;
}

export interface FlowNarrateResult {
  path: string;
  duration_ms: number;
  voice: string;
  backend: 'gemini' | 'kokoro';
}

export interface TranscribedWord {
  word: string;
  start_ms: number;
  end_ms: number;
}

export interface FlowTranscribeResult {
  text: string;
  words: TranscribedWord[];
  duration_ms: number;
}

export interface FlowGenerateInput {
  prompt: string;
  type: 'image' | 'video';
  aspect?: '9:16' | '16:9' | '1:1';
  duration?: number; // seconds
  model?: string;
  max_credits?: number;
  reference_images?: string[];
  first_frame?: string;
  last_frame?: string;
}

export interface FlowGenerateResult {
  task_id?: string;
  finished?: boolean;
  files?: string[];
  credits_used?: number;
  error?: string;
}

export interface FlowWaitResult {
  finished: boolean;
  files?: string[];
  credits_used?: number;
  error?: string;
}

