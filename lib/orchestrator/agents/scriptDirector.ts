import { callDeepSeek } from '../../llm/deepseek';
import { CrimeCaseDossier, NoirScript, ScriptBeat } from '../types';
import { NoirEditorialAngle } from './editorialNoir';

export async function writeNoirScript(
  dossier: CrimeCaseDossier,
  angle: NoirEditorialAngle
): Promise<NoirScript> {
  const systemPrompt = `Kamu adalah Narator & Lead Storyteller True Crime Neo-Noir kelas dunia.
Tugasmu adalah menulis naskah narasi Bahasa Indonesia yang SANGAT ENGAGING, dibawakan SEPERTI DONGENG KELAM (Dark Fairytale / Eerie Mystery Storybook) agar penonton terhipnotis dan tidak bosan dari detik pertama hingga akhir.

ATURAN EMAS DURASI & PACING:
- DURASI TOTAL HARUS DI BAWAH 1 MENIT (Target: 50–55 detik) agar bisa diposting di multichannel (YouTube Shorts, TikTok, IG Reels) tanpa terpotong!
- Jumlah total kata naskah: WAJIB antara 105 hingga 125 kata (rata-rata 2.1 kata/detik dengan jeda hening dramatis).
- Jangan menulis kalimat berita datar/kaku. Gunakan pembuka bercerita ("Sebuah dongeng kelam...", "Konon...", "Semua bermula saat...", "Namun fiksi dongeng runtuh...").

STRUKTUR 15 BEATS KANONIK (Shot 00 s/d 14):
- Shot 00 (0.0s - 1.5s): Hook Cover (Headline visual pembuka)
- Shot 01 (1.5s - 5.5s): Hook Misteri (Pernyataan mengejutkan pembuka dongeng)
- Shot 02 (5.5s - 9.5s): Mitos / Lenyapnya Korban
- Shot 03 (9.5s - 13.5s): Malam Tragedi / Penembakan di Tempat Terpencil
- Shot 04 (13.5s - 17.5s): Barang Bukti di TKP
- Shot 05 (17.5s - 21.5s): Ledakan Histeria & Konspirasi Dunia Maya
- Shot 06 (21.5s - 25.5s): Daftar Hitam Korban Misterius
- Shot 07 (25.5s - 29.5s): Pemburu Bayangan / Klaim Sindikat Rahasia
- Shot 08 (29.5s - 33.5s): Detektif Memecah Dongeng / Pelaku Nyata
- Shot 09 (33.5s - 37.5s): Sosok Tersangka Nyata (Freddy Snyder)
- Shot 10 (37.5s - 41.5s): Motif Nyata / Perampokan & Uang Tunai
- Shot 11 (41.5s - 45.5s): Bantahan Murka Keluarga Korban
- Shot 12 (45.5s - 49.5s): Ruang Sidang Pengadilan Berhadapan Fakta
- Shot 13 (49.5s - 53.0s): Ketukan Palu Hakim & Keadilan
- Shot 14 (53.0s - 56.0s): Gembok Arsip Terkunci / Penutup Kasus

Format Output WAJIB JSON murni:
{
  "title": "${angle.mainHeadline}",
  "subHeadline": "${angle.subHeadline}",
  "beats": [
    {
      "shot": 0,
      "startSec": 0,
      "endSec": 1.5,
      "narration": "Sebuah dongeng kelam dari padang sunyi.",
      "visualCue": "Headline grafis neo-noir: ${angle.mainHeadline}",
      "shotType": "cover"
    },
    ... sampai shot 14
  ]
}`;

  const userPrompt = `Buat naskah 15 beat untuk kasus:
Judul Kasus: ${dossier.headline}
Tersangka: ${dossier.suspects.join(', ')}
Korban: ${dossier.victims.join(', ')}
Bukti Kunci: ${dossier.keyEvidence.join(', ')}
Kronologi: ${dossier.chronologySummary}
Fakta Mengejutkan: ${dossier.hookIdea}`;

  try {
    const raw = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
    const clean = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);

    const beats: ScriptBeat[] = Array.isArray(parsed.beats) ? parsed.beats : [];
    const fullText = beats
      .map((b) => b.narration)
      .filter(Boolean)
      .join(' ');
    const wordCount = fullText.trim().split(/\s+/).length;

    return {
      title: parsed.title || angle.mainHeadline,
      subHeadline: parsed.subHeadline || angle.subHeadline,
      fullText,
      targetDurationSec: 55,
      wordCount,
      beats,
    };
  } catch (err) {
    console.warn('⚠️ Gagal parse JSON Script DeepSeek, merangkai fallback beats:', err);
    return createFallbackScript(dossier, angle);
  }
}

function createFallbackScript(dossier: CrimeCaseDossier, angle: NoirEditorialAngle): NoirScript {
  const beats: ScriptBeat[] = [
    { shot: 0, startSec: 0, endSec: 1.5, narration: 'Sebuah rahasia kelam terbongkar.', visualCue: 'Cover Image', shotType: 'cover' },
    { shot: 1, startSec: 1.5, endSec: 5.5, narration: `Di ${dossier.location}, satu laporan orang hilang berubah menjadi mimpi buruk investigasi.`, visualCue: 'Hook siluet TKP', shotType: 'hook' },
    { shot: 2, startSec: 5.5, endSec: 9.5, narration: `Sosok ${dossier.suspects[0] || 'pelaku'} dicurigai berada di balik serangkaian kejanggalan.`, visualCue: 'Sketsa tersangka', shotType: 'perpetrator' },
    { shot: 3, startSec: 9.5, endSec: 13.5, narration: 'Melalui modus komunikasi tersembunyi, korban diarahkan ke lokasi yang tak terduga.', visualCue: 'Layar smartphone berpendar', shotType: 'context' },
    { shot: 4, startSec: 13.5, endSec: 17.5, narration: 'Di atas meja forensik, penyidik menemukan rekam jejak digital yang tak terbantahkan.', visualCue: 'Meja forensik 45 derajat', shotType: 'desk' },
    { shot: 5, startSec: 17.5, endSec: 21.5, narration: 'Tim siber kepolisian menganalisis setiap transaksi dan data lokasi terakhir.', visualCue: 'Pusat komando siber polisi', shotType: 'context' },
    { shot: 6, startSec: 21.5, endSec: 25.5, narration: 'Peta rute menunjukkan pola pergerakan yang terencana secara sistematis.', visualCue: 'Peta rute taktikal', shotType: 'timeline' },
    { shot: 7, startSec: 25.5, endSec: 29.5, narration: 'Sebuah ruangan terisolasi di pinggiran kota menjadi pusat seluruh aktivitas rahasia.', visualCue: 'Gedung terpencil di malam hari', shotType: 'context' },
    { shot: 8, startSec: 29.5, endSec: 33.5, narration: 'Saat pintu digerebek di tengah malam, kebenaran mengerikan mulai terkuak.', visualCue: 'Lorong sepi apartemen', shotType: 'context' },
    { shot: 9, startSec: 33.5, endSec: 37.5, narration: `Bukti ${dossier.keyEvidence[0] || 'barang perkara'} ditemukan tersimpan rapat dalam kegelapan.`, visualCue: 'Temuan bukti TKP berlabel', shotType: 'climax' },
    { shot: 10, startSec: 37.5, endSec: 41.5, narration: 'Bukan sekadar motif biasa, kejahatan ini menyisakan trauma mendalam bagi publik.', visualCue: 'Kantong bukti kepolisian', shotType: 'climax' },
    { shot: 11, startSec: 41.5, endSec: 45.5, narration: 'Berkas otopsi dan lembar pengakuan akhirnya mengunci dalang di balik semua ini.', visualCue: 'Map autopsi stempel rahasia', shotType: 'archive' },
    { shot: 12, startSec: 45.5, endSec: 49.5, narration: 'Ketukan palu di ruang pengadilan menegaskan pertanggungjawaban di hadapan hukum.', visualCue: 'Palu pengadilan megah', shotType: 'justice' },
    { shot: 13, startSec: 49.5, endSec: 54.0, narration: 'Keadilan ditegakkan tanpa kompromi bagi mereka yang meregang nyawa.', visualCue: 'Timbangan keadilan chiaroscuro', shotType: 'justice' },
    { shot: 14, startSec: 54.0, endSec: 59.0, narration: 'Berkas perkara resmi ditutup, namun pelajarannya akan selalu membekas.', visualCue: 'Pintu brankas arsip stempel case closed', shotType: 'archive' },
  ];

  const fullText = beats.map((b) => b.narration).join(' ');
  return {
    title: angle.mainHeadline,
    subHeadline: angle.subHeadline,
    fullText,
    targetDurationSec: 59,
    wordCount: fullText.split(/\s+/).length,
    beats,
  };
}
