import { ThemePreset } from './modernDark';

export const mysteryTrueCrimePreset: ThemePreset = {
  id: 'mystery-true-crime',
  name: 'Mystery True Crime',
  description: 'Gaya Graphic Novel Neo-Noir investigatif: kanvas full-bleed 9:16, palet muted charcoal & antique bronze, tekstur halftone, pergerakan kamera halus, dan mandatory click-worthy cover image.',
  colors: {
    bg: '#0D1117',
    text: '#E6EDF3',
    primary: '#8B2635', // Deep Dried Crimson
    accent: '#C59B27',  // Antique Dull Bronze
    cardBg: 'rgba(22, 27, 34, 0.85)',
    scrim: 'linear-gradient(180deg, rgba(13,17,23,0.6) 0%, rgba(13,17,23,0.05) 45%, rgba(13,17,23,0.8) 100%)',
    kickerBg: '#8B2635',
    kickerText: '#FFFFFF',
    patternColor: 'rgba(197, 155, 39, 0.08)',
  },
  fonts: {
    heading: "'Montserrat', sans-serif",
    body: "'Inter', sans-serif",
  },
  css: `
    .theme-mystery-true-crime {
      background-color: #0D1117;
      color: #E6EDF3;
      font-family: 'Inter', sans-serif;
    }

    /* Halftone Screen Tone Grain Effect */
    .halftone-grain-overlay {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0.05;
      pointer-events: none;
      background-image: radial-gradient(#E6EDF3 1px, transparent 1px);
      background-size: 5px 5px;
      z-index: 10;
    }

    /* Full-Bleed Media Container */
    .media-container-fullbleed {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 1;
    }

    .media-container-fullbleed img,
    .media-container-fullbleed video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transform-origin: center center;
    }

    /* Pure Autocaption Karaoke Bar in Bottom Safe Area */
    .autocaption-bar {
      position: absolute;
      bottom: 300px;
      left: 60px;
      right: 60px;
      text-align: center;
      z-index: 25;
      pointer-events: none;
    }

    /* Bottom Dark Scrim for Enhanced Readability */
    .bottom-caption-scrim {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 560px;
      background: linear-gradient(180deg, rgba(13, 17, 23, 0) 0%, rgba(13, 17, 23, 0.55) 45%, rgba(13, 17, 23, 0.92) 100%);
      pointer-events: none;
      z-index: 20;
    }

    /* Noir Forensic Glitch Overlay */
    .forensic-glitch-overlay {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      opacity: 0;
      z-index: 30;
      background: repeating-linear-gradient(
        0deg,
        rgba(230, 237, 243, 0.09) 0px,
        rgba(230, 237, 243, 0.09) 2px,
        transparent 2px,
        transparent 5px
      );
      mix-blend-mode: screen;
      will-change: opacity, transform, filter;
    }

    .caption-word {
      display: inline-block;
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 52px;
      line-height: 1.3;
      color: #E6EDF3;
      margin: 0 8px 10px 8px;
      text-shadow: 0 4px 18px rgba(0, 0, 0, 0.95), 0 2px 4px rgba(0, 0, 0, 0.8);
      transition: transform 0.15s ease, color 0.15s ease;
    }

    .caption-word.active {
      color: #C59B27;
      transform: scale(1.08);
      text-shadow: 0 0 24px rgba(197, 155, 39, 0.75), 0 4px 18px rgba(0, 0, 0, 0.95);
    }

    /* Cover Image Hook Title Styling */
    .cover-hook-overlay {
      position: absolute;
      inset: 0;
      z-index: 30;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 0 60px 220px 60px;
      background: linear-gradient(180deg, rgba(13,17,23,0.1) 0%, rgba(13,17,23,0.3) 50%, rgba(13,17,23,0.92) 100%);
    }

    .cover-hook-kicker {
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 24px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #8B2635;
      background: #E6EDF3;
      padding: 6px 16px;
      border-radius: 4px;
      display: inline-block;
      width: fit-content;
      margin-bottom: 20px;
    }

    .cover-hook-title {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 64px;
      line-height: 1.12;
      text-transform: uppercase;
      color: #E6EDF3;
      text-shadow: 0 6px 30px rgba(0, 0, 0, 0.95);
    }

    .cover-hook-title span {
      color: #C59B27;
    }

    .cover-hook-subtitle {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 30px;
      color: rgba(230, 237, 243, 0.85);
      margin-top: 16px;
    }
  `,
};
