import { ThemePreset } from './modernDark';

export const editorialCleanPreset: ThemePreset = {
  id: 'editorial-clean',
  name: 'Editorial Clean',
  description: 'Desain elegan editorial minimalis dengan palet slate tua, aksen emas/amber, dan kartu rapi.',
  colors: {
    bg: '#14171F',
    text: '#F8FAFC',
    primary: '#F59E0B',
    accent: '#D97706',
    cardBg: 'rgba(30, 41, 59, 0.85)',
    scrim: 'linear-gradient(180deg, rgba(20,23,31,0.2) 0%, rgba(20,23,31,0.95) 80%)',
    kickerBg: '#F59E0B',
    kickerText: '#0F172A',
    patternColor: 'rgba(245, 158, 11, 0.08)',
  },
  fonts: {
    heading: "'Montserrat', sans-serif",
    body: "'Inter', sans-serif",
  },
  css: `
    .theme-editorial-clean {
      background-color: #14171F;
      color: #F8FAFC;
      font-family: 'Inter', sans-serif;
    }
    .kicker-badge {
      background: #F59E0B;
      color: #0F172A;
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-radius: 6px;
      padding: 10px 24px;
      font-size: 26px;
      display: inline-block;
    }
    .scene-card {
      background: rgba(30, 41, 59, 0.9);
      border-left: 8px solid #F59E0B;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 16px 36px rgba(0,0,0,0.5);
    }
    .kinetic-title {
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 60px;
      line-height: 1.2;
      color: #FFFFFF;
    }
    .metric-value {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 105px;
      color: #F59E0B;
      line-height: 1.0;
    }
  `,
};

