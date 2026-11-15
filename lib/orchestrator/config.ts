import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

export const ORCHESTRATOR_CONFIG = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    authorizedChatId: process.env.TELEGRAM_AUTHORIZED_CHAT_ID || '',
    pollIntervalMs: 2500,
  },
  flowMcp: {
    url: process.env.FLOW_MCP_URL || 'http://127.0.0.1:8787',
    port: Number(process.env.FLOW_MCP_PORT || 8787),
  },
  voice: {
    preferredVoice: process.env.ORCHESTRATOR_VOICE || 'Puck',
    backend: (process.env.ORCHESTRATOR_VOICE_BACKEND || 'gemini') as 'gemini' | 'kokoro',
  },
  paths: {
    dataDir: path.resolve(process.cwd(), '.data'),
    jobStore: path.resolve(process.cwd(), '.data', 'orchestrator-jobs.json'),
    rendersDir: path.resolve(process.cwd(), 'public', 'renders'),
    workspaceDir: path.resolve(process.cwd(), 'hyperframes-workspace'),
  },
};
