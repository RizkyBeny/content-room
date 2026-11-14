export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    bg: string;
    text: string;
    primary: string;
    accent: string;
    cardBg: string;
    scrim: string;
    kickerBg: string;
    kickerText: string;
    patternColor: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  css: string;
}

export const modernDarkPreset: ThemePreset = {
  id: 'modern-dark',
  name: 'Tech / Modern Dark',
  description: 'Gaya sinematik gelap modern dengan aksen neon cyan/emerald dan kartu border berpendar.',
  colors: {
    bg: '#0B0D13',
    text: '#FFFFFF',
    primary: '#00F2FE',
    accent: '#4FACFE',
    cardBg: 'rgba(15, 23, 42, 0.75)',
    scrim: 'linear-gradient(180deg, rgba(11,13,19,0.3) 0%, rgba(11,13,19,0.92) 85%)',
    kickerBg: '#00F2FE',
    kickerText: '#0B0D13',
    patternColor: 'rgba(0, 242, 254, 0.08)',
  },
  fonts: {
    heading: "'Montserrat', sans-serif",
    body: "'Inter', sans-serif",
  },
  css: `
    .theme-modern-dark {
      background-color: #0B0D13;
      color: #FFFFFF;
      font-family: 'Inter', sans-serif;
    }
    .kicker-badge {
      background: linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%);
      color: #0B0D13;
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: 8px;
      padding: 10px 24px;
      font-size: 28px;
      display: inline-block;
      box-shadow: 0 0 20px rgba(0, 242, 254, 0.35);
    }
    .scene-card {
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(16px);
      border: 2px solid rgba(0, 242, 254, 0.25);
      border-radius: 24px;
      padding: 36px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .kinetic-title {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 64px;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: #FFFFFF;
      text-shadow: 0 4px 20px rgba(0,0,0,0.8);
    }
    .metric-value {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 110px;
      color: #00F2FE;
      line-height: 1.0;
      text-shadow: 0 0 30px rgba(0, 242, 254, 0.5);
    }
  `,
};

