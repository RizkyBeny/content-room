import { callDeepSeek } from '../../llm/deepseek';
import { CrimeCaseDossier, NoirScript, ScriptBeat } from '../types';
import { NoirEditorialAngle } from './editorialNoir';

export async function writeNoirScript(
  dossier: CrimeCaseDossier,
  angle: NoirEditorialAngle
): Promise<NoirScript> {
  const systemPrompt = `Kamu adalah Narator & Lead Scriptwriter dokumenter True Crime Neo-Noir kelas dunia.
Tugasmu adalah menulis naskah narasi Bahasa Indonesia untuk video vertikal 9:16 berdurasi 55–60 detik (~130–150 kata).

STRUKTUR 15 BEATS KANONIK (Shot 00 s/d 14):
- Shot 00 (0.0s - 1.5s): Hook Cover (Headline visual pembuka)
- Shot 01 (1.5s - 5.5s): Hook Misteri (Pernyataan mengejutkan yang memancing rasa penasaran)
- Shot 02 (5.5s - 9.5s): Profil Pelaku / Misteri Korban
- Shot 03 (9.5s - 13.5s): Pintu Masuk Kasus / Modus Awal
- Shot 04 (13.5s - 17.5s): Meja Forensik 45° (Barang bukti penting pertama)
- Shot 05 (17.5s - 21.5s): Penyelidikan Kepolisian / Cyber Forensics
- Shot 06 (21.5s - 25.5s): Peta Rute / Lokasi Pelarian
- Shot 07 (25.5s - 29.5s): Titik Balik TKP (Tempat rahasia pelaku)
- Shot 08 (29.5s - 33.5s): Detik-Detik Penangkapan / Penggerebekan
- Shot 09 (33.5s - 37.5s): Penemuan Bukti Utama yang Mengerikan
- Shot 10 (37.5s - 41.5s): Motif / Uang / Transaksi Rahasia
- Shot 11 (41.5s - 45.5s): Berkas Otopsi / Pengakuan Tersangka
- Shot 12 (45.5s - 49.5s): Sidang Pengadilan / Palu Hakim
- Shot 13 (49.5s - 54.0s): Timbangan Keadilan / Vonis Hukuman
- Shot 14 (54.0s - 59.0s): Brankas Arsip Terkunci / Penutup Kasus / Call to Action

ATURAN PENULISAN:
- Bahasa Indonesia baku namun mengalir dingin, mencekam, dan ritmis.
- Total kata narasi naskah antara 125 hingga 145 kata (kecepatan narator rata-rata 2.4 kata/detik).
- Jangan menulis kata yang terlalu panjang atau berbelit-belit.
- Visual cue harus jelas dan bernuansa graphic novel neo-noir.

Format Output WAJIB JSON murni:
{
  "title": "${angle.mainHeadline}",
  "subHeadline": "${angle.subHeadline}",
  "beats": [
    {
      "shot": 0,
      "startSec": 0,
      "endSec": 1.5,
      "narration": "Sembilan nyawa lenyap tanpa jejak.",
      "visualCue": "Cover headline dramatis: ${angle.mainHeadline}",
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
      targetDurationSec: 59,
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
