import { ThemePreset, modernDarkPreset } from './modernDark';
import { editorialCleanPreset } from './editorialClean';
import { vibrantSocialPreset } from './vibrantSocial';
import { voxArchivalPreset } from './voxArchival';
import { mysteryTrueCrimePreset } from './mysteryTrueCrime';

export * from './modernDark';
export * from './editorialClean';
export * from './vibrantSocial';
export * from './voxArchival';
export * from './mysteryTrueCrime';

export const THEME_PRESETS: Record<string, ThemePreset> = {
  'modern-dark': modernDarkPreset,
  'editorial-clean': editorialCleanPreset,
  'vibrant-social': vibrantSocialPreset,
  'vox-archival-parallax': voxArchivalPreset,
  'mystery-true-crime': mysteryTrueCrimePreset,
};

export function getThemePreset(id?: string): ThemePreset {
  if (id && THEME_PRESETS[id]) {
    return THEME_PRESETS[id];
  }
  return mysteryTrueCrimePreset;
}
