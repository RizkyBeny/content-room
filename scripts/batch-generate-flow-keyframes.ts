import fs from 'node:fs';
import path from 'node:path';
import { flowClient } from '../lib/flowMcp/client';

interface StoryboardData {
  title: string;
  shotTimings: Array<{
    shot: number;
    startSec: number;
    endSec: number;
    imagePath?: string;
    prompt?: string;
  }>;
}

// 15 Standard Graphic Novel Neo-Noir Prompts for Twitter Killer (Full-Bleed 9:16)
const DEFAULT_SHOT_PROMPTS: Record<number, string> = {
  0: "A dramatic, high-CTR YouTube Shorts cover and thumbnail illustration, vertical 9:16 aspect ratio (1080x1920), Graphic Novel Neo-Noir style. A chilling crime scene hook depicting the menacing silhouette of a serial killer in a hoodie in a dim Tokyo apartment hallway holding a cracked smartphone with a cold cyan glow, yellow police tape marked 'KEEP OUT / 立入禁止' and white cooler boxes in the shadows. Prominent distressed typography: 'JEJAK SADIS TWITTER KILLER' in warm broken-white and antique bronze, with deep dried crimson ribbon '9 NYAWA DALAM 2 BULAN'. Heavy contour inking, chiaroscuro lighting, fine halftone dots. Full bleed.",
  1: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). The ominous silhouette of a gallows noose hanging inside a monolithic Tokyo justice hall with neoclassical stone columns and judicial seal. Full bleed vertical framing, dramatic chiaroscuro lighting, deep shadows, heavy inking, fine halftone dot pattern, matte charcoal slate (#0D1117), cold desaturated storm gray, antique brass bronze accents (#C59B27). No text cards, no watermark.",
  2: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). A stark police criminal mugshot sketch of a Japanese male suspect Takahiro Shiraishi, high contrast comic book inking, prisoner identification placard under chin, heavy cross-hatching, harsh interrogation spotlight, stamped with dried crimson red seal 'TERPIDANA MATI'. Full bleed, halftone shading, matte finish.",
  3: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). A fractured glowing Twitter X bird logo shattered on a cold reflective asphalt surface, subtle eerie cyan and dried crimson glow through dark shadows, rain-slicked Tokyo night pavement, dynamic heavy inking, halftone screen tone texture. Full bleed 9:16.",
  4: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Close-up 45-degree isometric angle of a cracked smartphone screen resting on a dark evidence table, glowing with ominous social media direct messages seeking suicide pacts, harsh sidelight, fine halftone dots, dark slate backdrop. Full bleed.",
  5: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Forensic cyber crime investigation workstation at Tokyo Metropolitan Police headquarters, glowing computer monitors with data analysis, external hard drives, acrylic evidence tag marker '01', forensic tweezers, dramatic blue and charcoal chiaroscuro. Full bleed.",
  6: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Isometric top-down forensic transit map showing Tokyo railway train lines branching toward Zama City in Kanagawa Prefecture, routes traced in red marker ink, dark parchment texture, magnifying glass, tactical grid. Full bleed.",
  7: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Low angle exterior perspective of a narrow communal two-story suburban apartment building in Zama City at 2 AM, single eerie fluorescent light glowing from an upper window, yellow Japanese police barrier tape '立入禁止 KEEP OUT'. Gritty graphic novel style, halftone sky. Full bleed.",
  8: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Narrow dim hallway corridor inside an old Japanese apartment building, weathered metal door with room number plate, long menacing shadow stretching out from beneath the door sill, heavy noir inking, dust motes in beam of light. Full bleed.",
  9: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Forensic crime scene evidence photograph: two stark white plastic cooler boxes and a heavy steel toolbox sealed with police tape inside a dim tatami room, yellow forensic evidence tags '02' and '03', intense chiaroscuro contrast. Full bleed.",
  10: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Clear transparent police evidence bag containing thick stacks of Japanese 10,000 Yen banknotes and confiscated victim identity cards, barcode evidence sticker, resting on dark brushed steel forensic table. Full bleed.",
  11: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Manila autopsy file dossier and police investigation crime report folder spread out, red confidential rubber stamp 'RAHASIA / TOP SECRET', censored monochrome incident photos, heavy graphic novel inking, antique bronze accents. Full bleed.",
  12: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Heavy dark hardwood judicial gavel bound with antique brass bronze bands resting on sound block, official Japanese court verdict decree documents, dramatic spotlight casting long shadows, solemn courtroom ambiance. Full bleed.",
  13: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Neoclassical black iron scales of justice hanging in exact balance under a dramatic volumetric ray of light inside a cathedral-like high court chamber, fine halftone screen tone, timeless justice allegory. Full bleed.",
  14: "A cinematic graphic novel neo-noir illustration, vertical 9:16 aspect ratio (1080x1920). Massive heavy vault steel door of the police archives closing and locked, embossed brass seal, large bold red wax stamp across the seam reading 'KASUS SELESAI / CASE CLOSED', dark slate background with fine halftone dots. Full bleed."
};

async function main() {
  console.log('===============================================================');
  console.log('  Google Flow MCP: Batch Keyframe Generator (0 Credits / Free) ');
  console.log('===============================================================\n');

  // 1. Health check Flow MCP Server
  console.log('1. Memeriksa koneksi ke Flow MCP daemon (http://127.0.0.1:8787)...');
  const health = await flowClient.checkHealth();

  if (!health.ok) {
    console.error('\n❌ Server Flow MCP sedang offline:');
    console.error(`   ${health.error}\n`);
    console.log('---------------------------------------------------------------');
    console.log('💡 CARA MENYALAKAN FLOW MCP:');
    console.log('   Buka terminal terpisah di komputer Anda dan jalankan:');
    console.log('   $ pnpm flow:studio');
    console.log('   (atau: cd ~/flow-mcp && npm run studio)');
    console.log('---------------------------------------------------------------\n');
    process.exit(1);
  }

  console.log('   ✅ Flow MCP daemon aktif di port 8787!');

  // 2. Check Session Status
  console.log('\n2. Memeriksa status sesi Google Flow...');
  try {
    const status = await flowClient.getStatus();
    console.log(`   - Status Akun: ${status.signedIn ? '✅ Signed In' : '⚠️ Belum Login'}`);
    console.log(`   - Tipe Paket: ${status.plan || 'Free Account'}`);
    console.log(`   - Video Credits Tersedia: ${status.credits ?? 50}`);
    console.log('   - Biaya Stills / Keyframes: 0 Credits (GRATIS / UNLIMITED)');

    if (!status.project) {
      console.log('   🚀 Membuka/membuat proyek baru di Flow: "Twitter Killer Investigation"...');
      const proj = await flowClient.newProject('Twitter Killer Investigation');
      console.log(`   ✅ Proyek aktif: ${proj.title} (${proj.url})`);
    }
  } catch (err: unknown) {
    console.warn('   ⚠️ Status akun/proyek Google Flow:', err);
  }

  // 3. Prepare Batch Job
  const projectName = 'twitter-killer-investigation';
  const outDir = path.join(process.cwd(), 'public/renders/twitter-killer-test');
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n3. Menyiapkan 15 shot keyframe (Shot 00 Cover + Shot 01 s/d 14) untuk proyek: ${projectName}...`);

  const scenesToGenerate = Object.entries(DEFAULT_SHOT_PROMPTS).map(([shotId, prompt]) => ({
    shotId: Number(shotId),
    prompt,
    filename: Number(shotId) === 0 ? 'cover-shot-00.jpg' : `shot-${String(shotId).padStart(2, '0')}.jpg`,
  }));

  console.log(`   Total keyframe yang akan diproses: ${scenesToGenerate.length} shot`);
  console.log('   Estimasi Biaya: $0.00 / 0 Credits (Menggunakan Still Frames Google Flow)\n');

  // 4. Batch Dispatch to Flow MCP
  for (const scene of scenesToGenerate) {
    console.log(`[Shot ${String(scene.shotId).padStart(2, '0')}] Mengantrekan ke Flow MCP (type: image, aspect: 9:16)...`);
    try {
      const res = await flowClient.generate({
        project: projectName,
        prompt: scene.prompt,
        type: 'image',
        aspect: '9:16',
        max_credits: 0, // Invariant: Jangan potong credit video!
      });

      if (!res.task_id) {
        console.warn(`   ⚠️ Tidak mendapatkan task_id untuk shot ${scene.shotId}`);
        continue;
      }

      console.log(`   ⏳ Task ID: ${res.task_id}. Menunggu hasil render dari Google Flow...`);
      const jobResult = await flowClient.waitForJob(res.task_id, 120);

      if (jobResult.finished && jobResult.files && jobResult.files.length > 0) {
        const generatedFile = jobResult.files[0];
        const destPath = path.join(outDir, scene.filename);
        if (fs.existsSync(generatedFile)) {
          fs.copyFileSync(generatedFile, destPath);
          console.log(`   ✅ Selesai! Disimpan ke: ${destPath}`);
        } else {
          console.log(`   ✅ Selesai di Flow MCP (File: ${generatedFile})`);
        }
      } else {
        console.warn(`   ⚠️ Gagal menyelesaikan shot ${scene.shotId}:`, jobResult.error || 'Unknown error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ Error pada shot ${scene.shotId}:`, msg);
    }
  }

  console.log('\n===============================================================');
  console.log('  Batch Keyframe Generation Selesai!                           ');
  console.log('  Total Credits Video Terpakai: 0 Credits (Rp 0)               ');
  console.log('===============================================================\n');
}

main().catch(console.error);
