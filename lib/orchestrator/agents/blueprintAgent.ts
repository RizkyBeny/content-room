import { CrimeCaseDossier, KeyframeItem, NoirScript } from '../types';
import { NoirEditorialAngle } from './editorialNoir';

export function generateAllKeyframeBlueprints(
  dossier: CrimeCaseDossier,
  angle: NoirEditorialAngle,
  script: NoirScript
): KeyframeItem[] {
  const mainHeadline = angle.mainHeadline || dossier.headline.toUpperCase().slice(0, 30);
  const subHeadline = angle.subHeadline || `KASUS ${dossier.crimeType.toUpperCase()}`.slice(0, 25);
  const heroVisual = angle.caseHeroVisual || `A chilling crime scene in ${dossier.location} with yellow police tape and dark silhouettes`;
  const primaryEvidence = dossier.keyEvidence[0] || 'cracked smartphone with glowing messages and forensic tags';
  const suspectName = dossier.suspects[0] || 'suspect';

  const items: KeyframeItem[] = [
    {
      shot: 0,
      label: 'Shot 00: Mandatory High-CTR Cover Image',
      isCoreSample: true,
      prompt: `A dramatic, high-CTR YouTube Shorts cover and thumbnail illustration, vertical 9:16 aspect ratio (1080x1920), Graphic Novel Neo-Noir style. Visual Scene: A chilling crime scene hook depicting ${heroVisual}. Integrated Bold Typography: Prominent massive distressed headline text: '${mainHeadline}' rendered in heavy stencil/impact typography in warm broken-white (#E6EDF3) with antique brass bronze accents (#C59B27) and deep drop shadows. Sub-headline ribbon banner: '${subHeadline}' in a deep dried crimson red tape (#8B2635) with sharp white lettering. Top warning header banner: '/// POLICE INVESTIGATION DOSSIER ///'. Artistic Style: Dynamic heavy inking, chiaroscuro lighting, gritty halftone screen tone dot pattern, cel-shaded shadows, matte graphic novel finish. Full bleed composition filling the entire 9:16 vertical canvas. No pastel colors, no oversaturation, no cartoonish elements.`,
    },
    {
      shot: 1,
      label: 'Shot 01: Hook Scene Silhouette',
      isCoreSample: true,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Subject: An ominous silhouette standing in the shadow of a dim crime scene in ${dossier.location}, heavy rain on pavement, yellow police tape marked 'KEEP OUT'. Full bleed vertical portrait framing, dramatic chiaroscuro lighting with sharp volumetric spotlight piercing through cold mist, deep shadows, heavy contour inking, fine halftone dot screen tones, matte charcoal slate (#0D1117), cold storm gray, antique dull bronze (#C59B27). No text cards, no watermark.`,
    },
    {
      shot: 2,
      label: 'Shot 02: Police Criminal Mugshot',
      isCoreSample: false,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). A stark police criminal mugshot sketch of suspect ${suspectName}, high contrast comic book inking, prisoner identification placard under chin, heavy cross-hatching, harsh interrogation spotlight, stamped with dried crimson red seal 'BERKAS PERKARA'. Full bleed, halftone shading, matte finish.`,
    },
    {
      shot: 3,
      label: 'Shot 03: The Hook Entrance / Digital Footprint',
      isCoreSample: false,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). A cracked glowing smartphone screen shattered on cold reflective asphalt surface, subtle eerie cyan and dried crimson glow through dark shadows, rain-slicked night pavement, dynamic heavy inking, halftone screen tone texture. Full bleed 9:16.`,
    },
    {
      shot: 4,
      label: 'Shot 04: Forensic Evidence Desk 45°',
      isCoreSample: true,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Subject: Isometric 45-degree angle top-down view of a police forensic evidence desk examining ${primaryEvidence}, clear plastic evidence bags, red evidence marker tags '01' and '02', tactical grid paper. Forensic items tightly arranged across a matte dark graphite workbench. Dynamic heavy inking, fine halftone dot shading, matte charcoal slate (#0D1117), antique bronze accents (#C59B27), dried crimson red stamps (#8B2635). Harsh desk lamp lighting. Full bleed.`,
    },
    {
      shot: 5,
      label: 'Shot 05: Cyber Crime Investigation Workstation',
      isCoreSample: false,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Forensic cyber crime investigation workstation at police headquarters, glowing computer monitors displaying forensic audio waveforms and encrypted communication logs, dark chiaroscuro room, heavy linework, halftone shading. Full bleed.`,
    },
    {
      shot: 6,
      label: 'Shot 06: Tactical Transit Route Map',
      isCoreSample: false,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Isometric top-down forensic transit map showing city route lines branching toward ${dossier.location}, routes traced in red marker ink, dark parchment texture, magnifying glass, tactical surveillance grid. Full bleed.`,
    },
    {
      shot: 7,
      label: 'Shot 07: Isolated Crime Building Exterior',
      isCoreSample: false,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Low angle exterior perspective of a quiet secluded suburban building in ${dossier.location} at 2 AM, single eerie fluorescent light glowing from an upper window, yellow police barrier tape. Gritty graphic novel style, halftone sky, deep shadows. Full bleed.`,
    },
    {
      shot: 8,
      label: 'Shot 08: Dim Hallway Corridor Door',
      isCoreSample: false,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Narrow dim hallway corridor inside a quiet building, weathered metal door with room number plate, long menacing shadow stretching out from beneath the door sill, heavy noir inking, dust motes in beam of light. Full bleed.`,
    },
    {
      shot: 9,
      label: 'Shot 09: Chilling Evidence Discovery Climax',
      isCoreSample: true,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Forensic crime scene photograph: sealed evidence boxes and heavy tool containers with police barrier tape inside a dim room, yellow forensic evidence tags '03' and '04', intense chiaroscuro contrast, heavy graphic novel inking, deep dried crimson red accents (#8B2635). Full bleed vertical portrait.`,
    },
    {
      shot: 10,
      label: 'Shot 10: Seized Property & Banknotes',
      isCoreSample: false,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Clear transparent police evidence bag containing thick stacks of banknotes and confiscated victim identity cards, barcode evidence sticker, resting on dark brushed steel forensic table. Heavy inking, halftone dots. Full bleed.`,
    },
    {
      shot: 11,
      label: 'Shot 11: Confidential Autopsy Dossier',
      isCoreSample: false,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Manila autopsy file dossier and police investigation crime report folder spread out, red confidential rubber stamp 'RAHASIA / CONFIDENTIAL', censored monochrome incident documents, antique bronze accents. Full bleed.`,
    },
    {
      shot: 12,
      label: 'Shot 12: Judicial Courtroom Gavel',
      isCoreSample: false,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Heavy dark hardwood judicial gavel bound with antique brass bronze bands resting on sound block, official court verdict decree documents, dramatic spotlight casting long shadows, solemn courtroom ambiance. Full bleed.`,
    },
    {
      shot: 13,
      label: 'Shot 13: Monolithic Scales of Justice',
      isCoreSample: true,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Neoclassical black iron scales of justice hanging in exact balance under a dramatic volumetric ray of light inside a cathedral-like high court chamber, fine halftone screen tone, timeless justice allegory, deep shadows, matte charcoal slate (#0D1117). Full bleed vertical framing.`,
    },
    {
      shot: 14,
      label: 'Shot 14: Police Archive Vault Case Closed',
      isCoreSample: false,
      prompt: `A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Massive heavy vault steel door of the police archives closing and locked, embossed brass seal, large bold red wax stamp across the seam reading 'BERKAS DITUTUP / CASE CLOSED', dark slate background with fine halftone dots. Full bleed.`,
    },
  ];

  return items;
}

export function extractCore5SampleKeyframes(allItems: KeyframeItem[]): KeyframeItem[] {
  return allItems.filter((item) => item.isCoreSample);
}
