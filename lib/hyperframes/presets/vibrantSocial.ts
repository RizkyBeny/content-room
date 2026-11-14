import { ThemePreset } from './modernDark';

export const vibrantSocialPreset: ThemePreset = {
  id: 'vibrant-social',
  name: 'Vibrant Social',
  description: 'Desain energetic & punchy untuk media sosial dengan aksen kuning terang, kartu bulat tebal, dan tipografi ekspresif.',
  colors: {
    bg: '#0F0F0F',
    text: '#FFFFFF',
    primary: '#FFE600',
    accent: '#FF0055',
    cardBg: 'rgba(24, 24, 27, 0.9)',
    scrim: 'linear-gradient(180deg, rgba(15,15,15,0.2) 0%, rgba(15,15,15,0.95) 75%)',
    kickerBg: '#FFE600',
    kickerText: '#000000',
    patternColor: 'rgba(255, 230, 0, 0.1)',
  },
  fonts: {
    heading: "'Montserrat', sans-serif",
    body: "'Inter', sans-serif",
  },
  css: `
    .theme-vibrant-social {
      background-color: #0F0F0F;
      color: #FFFFFF;
      font-family: 'Inter', sans-serif;
    }
    .kicker-badge {
      background: #FFE600;
      color: #000000;
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: 9999px;
      padding: 12px 28px;
      font-size: 28px;
      display: inline-block;
      box-shadow: 0 4px 15px rgba(255, 230, 0, 0.4);
    }
    .scene-card {
      background: rgba(24, 24, 27, 0.92);
      border: 3px solid #FFE600;
      border-radius: 32px;
      padding: 40px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8);
    }
    .kinetic-title {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 68px;
      line-height: 1.1;
      color: #FFFFFF;
    }
    .metric-value {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 120px;
      color: #FFE600;
      line-height: 0.95;
      text-shadow: 0 4px 20px rgba(255, 230, 0, 0.4);
    }
  `,
};

