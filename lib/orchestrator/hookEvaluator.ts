import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

export interface ViralHookOption {
  id: number;
  archetype: string;
  hookText: string;
  topGiantKeyword: string;
  predictedViralityScore: number; // 1 - 100
  retention3sEstimate: string; // e.g. "84%"
  psychologyTrigger: string;
  viralReason: string;
}

export interface HookEvaluationResult {
  topic: string;
  recommendedHookId: number;
  hooks: ViralHookOption[];
}

/**
 * Generates and evaluates 5 dynamic viral hook options with predictive virality metrics using DeepSeek LLM.
 */
export async function generateViralHooks(caseContext: {
  title: string;
  location: string;
  victim: string;
  keyEvidence: string;
  coreConflict: string;
  additionalDetails?: string;
}): Promise<HookEvaluationResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY belum dikonfigurasi di .env.local!');
  }

  const prompt = `Anda adalah Master Viral Strategist & True Crime Scriptwriter untuk Instagram Reels, TikTok, dan YouTube Shorts.
Karakteristik penceritaan Anda terinspirasi dari gaya @klenik_malam: dingin, mencekam, bertempo lambat, berbobot, dengan rasa ingin tahu yang tak tertahankan (unbearable curiosity gap).

Berdasarkan konteks kasus kriminal berikut:
- Judul: ${caseContext.title}
- Lokasi: ${caseContext.location}
- Korban: ${caseContext.victim}
- Barang Bukti / TKP Utama: ${caseContext.keyEvidence}
- Konflik Inti: ${caseContext.coreConflict}
- Detail Tambahan: ${caseContext.additionalDetails || '-'}

Tugas Anda: Formulasikan 5 opsi HOOK PEMBUKA (durasi ~8-12 detik berbicara santai) dengan 5 arketipe psikologis berbeda:
1. "The Odd Specific Detail" (Fokus pada satu objek janggal yang bikin bertanya-tanya)
2. "The Cognitive Dissonance Paradox" (Pertentangan logika yang mencengangkan, misal: pintu terkunci dari luar tapi pelakunya ada di dalam)
3. "The Whispered Crime Scene" (Suasana lorong malam dan saksi bisu misterius)
4. "The 3-Motive Escalation" (Tiga motif sakit hati yang bersatu dalam satu malam)
5. "The Cold Forensic Warning" (Pernyataan dingin tentang tragedi manusia yang tak masuk akal)

PANDUAN PENULISAN HOOK:
- Tulis dalam bahasa Indonesia investigatif sastrawi yang dingin dan mengalir.
- Gunakan rekayasa tanda baca elipsis (...) dan titik (.) untuk memaksa AI ElevenLabs memberi jeda nafas misterius ala Klenik Malam.
- Tentukan 1 frasa kunci huruf kapital (maks 3 kata) untuk ditampilkan sebagai "Giant Keyword Flash" di bagian atas layar.
- Berikan skor prediksi virality (1 - 100), estimasi retensi 3 detik pertama (%), pemicu psikologis, dan penjelasan alasan kenapa hook ini viral di algoritma Reels/TikTok.

Output WAJIB berupa JSON murni dengan format persis berikut:
{
  "topic": "${caseContext.title}",
  "recommendedHookId": 1,
  "hooks": [
    {
      "id": 1,
      "archetype": "The Odd Specific Detail",
      "hookText": "Kamar nomor tujuh itu... terkunci rapat dari luar. Di lorong mess karyawan yang basah oleh hujan... sebuah cangkul tergeletak di sudut kasur berdarah.",
      "topGiantKeyword": "KAMAR NO. 7",
      "predictedViralityScore": 94,
      "retention3sEstimate": "88%",
      "psychologyTrigger": "Specific Mystery Object + Sensory Rain",
      "viralReason": "Menyebut nomor kamar spesifik dan kontras cangkul di atas kasur memicu rasa penasaran ekstrem dalam 2 detik pertama."
    }
  ]
}`;

  const res = await fetch(`${process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media virality analyst and crime documentary scriptwriter. Output strictly valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API Error (${res.status}): ${err}`);
  }

  const json = await res.json();
  const rawContent = json.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(rawContent) as HookEvaluationResult;
  return parsed;
}
