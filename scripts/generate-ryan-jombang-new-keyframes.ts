import fs from 'node:fs';
import path from 'node:path';
import { flowClient } from '../lib/flowMcp/client';

const PROJECT_ID = 'ryan-jombang-smiling-killer';
const KEYFRAMES_DIR = path.join(process.cwd(), 'public', 'renders', PROJECT_ID, 'keyframes');

const NEW_KEYFRAMES: Record<string, string> = {
  'victim-mother-child.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Tragic forensic crime case file folder open on a brushed steel table. Black-and-white passport identification photographs of 30-year-old Indonesian woman Nanik Hidayati and her innocent 3-year-old daughter Silvia, stamped with red Indonesian police ink 'BERKAS IDENTIFIKASI KORBAN JOMBANG'. A pair of blue forensic latex gloves resting beside the file, harsh clinical desk lamp illumination, deep charcoal slate (#0D1117) with crimson blood accent, full bleed.",
  'ryan-press-conference.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Tense media press conference inside Polda Metro Jaya headquarters 2008. Handcuffed 30-year-old suspect Very Idham Henyansyah alias Ryan wearing an orange prison detainee vest, flanked by serious Indonesian police officers. A cluster of television microphones from news channels pointed at him. Ryan looks straight into the camera lenses with a shockingly calm, pleasant, eerie polite smile that chills the viewer. Blinding white camera flashlights cutting through dark shadowy background, heavy noir ink lines, full bleed.",
  'margonda-door-309.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Claustrophobic apartment corridor in Margonda Residence Depok late at night. Looking directly at apartment room door numbered '309', crisscrossed with bright yellow Indonesian police line tape 'DILARANG MELINTAS - GARIS POLISI'. A faint, sinister eerie warm light leaks through the bottom crack of the doorway onto the worn floor, heavy graphic novel vignette, deep psychological dread, full bleed.",
  'jombang-burial-close-up.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Extreme close-up low angle shot of an excavated burial pit in damp red earth in a Jombang rural backyard. A rusted steel shovel blade plunged into the dirt, surrounded by bright yellow forensic evidence marker cards numbered '07', '08', and '09'. Wet tropical banana tree roots exposed, dramatic high-contrast floodlight beam cutting through foggy night air, heavy noir crosshatching, full bleed.",
  'ryan-autobiography.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Melancholic psychological prison evidence view. On a scarred rustic wooden prison table, a handwritten lined notebook with dense handwritten pages titled 'The Untold Story: Persembahan Terakhir' written by serial killer Ryan. A vintage black fountain pen with ink leaking onto the manuscript paper, beside a cassette audio tape. A ray of cold moonlight through prison cell window bars, deep shadows, full bleed.",
  'gavel-death-sentence.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). High-drama climax in Pengadilan Negeri Depok courtroom. Close-up of the chief judge's heavy dark mahogany wooden gavel striking down with immense force onto the circular wooden sound block. Flying dust motes caught in dramatic shafts of courtroom light, court verdict dossier papers below stamped with red official seal 'VONIS: HUKUMAN MATI' (DEATH PENALTY). Blurred brass scale of justice in dark background, intense graphic novel chiaroscuro, full bleed.",
  'satellite-route-map.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Dark forensic pinboard map of Java Island. Taut red threads pinned between Jakarta (Ragunan, Margonda Depok) and East Java (Jombang). Pinned Polaroid crime scene photos, casualty dates '2006 - 2008', yellow sticky notes, and handwritten police timeline connecting the dots of the serial killer's trail. Dramatic moody lighting, neo-noir investigative thriller aesthetic, full bleed.",
  'atm-transaction-receipt.jpg':
    "Graphic novel neo-noir cinematic vertical illustration 9:16 (1080x1920). Macro forensic crime scene inspection. A blue-gloved police detective's hand holding a paper ATM withdrawal receipt slip under violet ultraviolet forensic light. Revealing transaction details and forged signature from Depok shopping mall using victim Heri Santoso's credit card. Evidence marker 'B-02' visible, fine clinical detailing, full bleed.",
};

async function main() {
  fs.mkdirSync(KEYFRAMES_DIR, { recursive: true });
  console.log('🎨 Generating 8 New Supplementary Keyframes via Google Flow MCP...\n');

  for (const [filename, prompt] of Object.entries(NEW_KEYFRAMES)) {
    const dest = path.join(KEYFRAMES_DIR, filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 20000) {
      console.log(`✅ [Cache] ${filename} sudah ada (${(fs.statSync(dest).size / 1024).toFixed(0)} KB)`);
      continue;
    }

    console.log(`🚀 Generating: ${filename}...`);
    try {
      const res = await flowClient.generate({
        project: PROJECT_ID,
        prompt,
        type: 'image',
        aspect: '9:16',
        max_credits: 0,
      });

      if (res.task_id) {
        console.log(`   Task ${res.task_id} queued. Menunggu render...`);
        const waitRes = await flowClient.waitForJob(res.task_id, 180);
        if (waitRes.finished && waitRes.files?.[0] && fs.existsSync(waitRes.files[0])) {
          fs.copyFileSync(waitRes.files[0], dest);
          console.log(`   ✅ Selesai: ${filename} (${(fs.statSync(dest).size / 1024).toFixed(0)} KB)\n`);
        } else {
          console.warn(`   ⚠️ Render selesai tanpa file valid untuk ${filename}`);
        }
      }
    } catch (err: any) {
      console.error(`   ❌ Gagal generate ${filename}:`, err.message);
    }
  }

  console.log('\n🎉 Semua keyframe baru berhasil diproses!');
}

main().catch(console.error);
