import { ThemePreset } from './modernDark';

export const voxArchivalPreset: ThemePreset = {
  id: 'vox-archival-parallax',
  name: 'Vox Archival Parallax',
  description: 'Gaya visual journalism 2.5D ala Vox: kanvas gelap investigasi, tipografi krem arsip, berkas dossier manila, dan stempel rahasia merah.',
  colors: {
    bg: '#1A1918',
    text: '#F4EBD9',
    primary: '#D72638', // Stamp Crimson Red
    accent: '#FFE271',  // Amber Tungsten Glow
    cardBg: '#EFE6D5',  // Manila Tint
    scrim: 'linear-gradient(180deg, rgba(26,25,24,0.92) 0%, rgba(26,25,24,0.3) 45%, rgba(26,25,24,0.85) 100%)',
    kickerBg: '#D72638',
    kickerText: '#FFFFFF',
    patternColor: 'rgba(215, 38, 56, 0.08)',
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  css: `
    .theme-vox-archival-parallax {
      background-color: #1A1918;
      color: #F4EBD9;
      font-family: 'Inter', sans-serif;
    }

    /* 35mm Subtle Film Grain Overlay */
    .film-grain-overlay {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0.06;
      pointer-events: none;
      background-image: radial-gradient(#F4EBD9 1px, transparent 1px);
      background-size: 4px 4px;
      z-index: 5;
    }

    /* Top Archival Header */
    .archival-header {
      font-family: 'Courier Prime', 'IBM Plex Mono', monospace;
      font-size: 22px;
      letter-spacing: 0.16em;
      color: rgba(244, 235, 217, 0.85);
      text-transform: uppercase;
      text-align: center;
      margin-top: 8px;
    }

    /* Pagination Hash Marks */
    .archival-hash-marks {
      font-family: monospace;
      font-size: 20px;
      letter-spacing: 24px;
      color: rgba(244, 235, 217, 0.6);
      text-align: center;
      margin-top: 12px;
    }
    .hash-active {
      color: #D72638;
      font-weight: 900;
      text-shadow: 0 0 10px rgba(215, 38, 56, 0.6);
    }

    /* Headline Zone (Top 35% Negative Space, Center-Aligned) */
    .vox-headline-container {
      margin-top: 50px;
      text-align: center;
      padding: 0 40px;
    }

    .vox-kinetic-title {
      font-family: 'Inter', sans-serif;
      font-weight: 800;
      font-size: 64px;
      line-height: 1.18;
      letter-spacing: -0.02em;
      color: #F4EBD9;
      text-shadow: 0 4px 24px rgba(0, 0, 0, 0.9);
    }

    /* Bottom Archival Evidence Badge Card (780px x 160px) */
    .vox-evidence-badge-container {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }

    .vox-evidence-badge {
      width: 780px;
      height: 160px;
      background: #EFE6D5;
      border: 1.5px solid #D8C29D;
      border-radius: 16px;
      padding: 20px 28px;
      position: relative;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    .vox-stamp-mark {
      position: absolute;
      right: 24px;
      top: 50%;
      transform: translateY(-50%) rotate(-12deg);
      border: 3px solid #D72638;
      color: #D72638;
      font-family: 'Inter', sans-serif;
      font-weight: 900;
      font-size: 32px;
      padding: 6px 18px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0.88;
      border-radius: 6px;
      box-shadow: inset 0 0 8px rgba(215, 38, 56, 0.2);
    }

    .vox-evidence-row1 {
      font-family: 'Courier Prime', 'IBM Plex Mono', monospace;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #8C2525;
      text-transform: uppercase;
    }

    .vox-evidence-row2 {
      font-family: 'Inter', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: #1A1918;
      line-height: 1.25;
      max-width: 520px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .vox-evidence-row3 {
      font-family: 'Courier Prime', 'IBM Plex Mono', monospace;
      font-size: 14px;
      letter-spacing: 0.04em;
      color: #5A524C;
      text-transform: uppercase;
    }

    /* Middle Zone Metric Highlight (for data beats without external plate) */
    .vox-mid-metric {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      padding: 18px 36px;
      background: rgba(26, 25, 24, 0.65);
      border: 1.5px solid rgba(215, 38, 56, 0.35);
      border-radius: 12px;
      backdrop-filter: blur(8px);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
    }

    .vox-mid-metric-val {
      font-family: 'Inter', sans-serif;
      font-size: 72px;
      font-weight: 900;
      letter-spacing: -0.02em;
      color: #FFE271;
      text-shadow: 0 0 24px rgba(255, 226, 113, 0.35);
      line-height: 1;
    }

    .vox-mid-metric-lbl {
      font-family: 'Courier Prime', 'IBM Plex Mono', monospace;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #D8C29D;
      margin-top: 8px;
    }
  `,
};
