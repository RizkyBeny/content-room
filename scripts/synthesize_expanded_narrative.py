import asyncio
import os
import sys
import subprocess
from edge_tts import Communicate

AUDIO_DIR = "/Users/beny/Documents/Project-self/Content-automation/public/renders/mbah-slamet-banjarnegara/audio"
FFMPEG = "/Users/beny/Documents/Project-self/Content-automation/bin/ffmpeg"

SENTENCES = [
    {
        "id": "s1",
        "shot": 1,
        "text": "Awal April 2023, ketenangan lereng Desa Balun di Banjarnegara seketika runtuh oleh temuan kuburan massal paling mengerikan dalam sejarah kriminal Jawa Tengah."
    },
    {
        "id": "s2",
        "shot": 2,
        "text": "Sosok di balik kekejaman ini adalah Slamet Tohari alias Mbah Slamet, seorang pria paruh baya yang bertahun-tahun hidup di balik topeng kesalehan."
    },
    {
        "id": "s3",
        "shot": 3,
        "text": "Mbah Slamet mengklaim dirinya dukun sakti berilmu gaib tinggi, yang mampu menggandakan uang puluhan juta rupiah menjadi lima miliar secara instan."
    },
    {
        "id": "s4",
        "shot": 4,
        "text": "Tergiur iming-iming kekayaan instan yang dipromosikan perantaranya lewat media sosial, para korban dari berbagai kota berbondong-bondong menyerahkan seluruh tabungan hidup mereka."
    },
    {
        "id": "s5",
        "shot": 5,
        "text": "Namun ketika waktu yang dijanjikan tiba dan para korban mendesak uangnya dikembalikan, sang dukun mulai merancang skenario eksekusi berdarah dingin."
    },
    {
        "id": "s6",
        "shot": 6,
        "text": "Dengan dalih mengambil uang gaib pada malam hari, para korban dipancing datang sendirian menempuh perjalanan ratusan kilometer menuju lereng sunyi Banjarnegara."
    },
    {
        "id": "s7",
        "shot": 7,
        "text": "Di tengah dinginnya perkebunan sepi, sang dukun menyuguhkan minuman ritual yang diam-diam telah dicampur serbuk potasium sianida mematikan."
    },
    {
        "id": "s8",
        "shot": 8,
        "text": "Reaksi racun potas bekerja luar biasa cepat; hanya dalam hitungan lima menit, para korban meregang nyawa dalam kejang hebat tanpa sempat berteriak minta tolong."
    },
    {
        "id": "s9",
        "shot": 9,
        "text": "Teror bukit kematian ini akhirnya terbongkar berkat firasat korban terakhir bernama Paryanto, yang sempat mengirim pesan suara dan titik lokasi GPS ke anaknya."
    },
    {
        "id": "s10",
        "shot": 10,
        "text": "Pesan pilu berbunyi 'Takut ayah mati, jika tidak ada kabar bawa polisi ke sini' menjadi kunci bagi Tim Reskrim untuk mendobrak kediaman sang dukun."
    },
    {
        "id": "s11",
        "shot": 11,
        "text": "Saat diseret ke perbukitan, Mbah Slamet bahkan sempat lupa titik liang kubur saking banyaknya korban yang telah ia bantai dan tumpuk di bukit sayur tersebut."
    },
    {
        "id": "s12",
        "shot": 12,
        "text": "Total dua belas liang kubur dibongkar, mengungkap fakta mengerikan bahwa seluruh korban tewas diracun demi merampas sisa uang di dompet mereka."
    },
    {
        "id": "s13",
        "shot": 13,
        "text": "Di hadapan Majelis Hakim Pengadilan Negeri Banjarnegara, Jaksa Penuntut Umum menuntut Slamet Tohari dengan tuntutan maksimal hukuman mati tanpa ampun."
    },
    {
        "id": "s14",
        "shot": 14,
        "text": "Palu pengadilan akhirnya diketuk tegas menjatuhkan vonis mati, mengakhiri riwayat kelam salah satu serial killer paling berdarah dalam sejarah modern Indonesia."
    }
]

async def synthesize_one(idx, text):
    raw_mp3 = os.path.join(AUDIO_DIR, f"raw-{idx}.mp3")
    final_wav = os.path.join(AUDIO_DIR, f"sentence-{idx}.wav")
    
    print(f"[{idx}/14] Synthesizing: {text[:45]}...")
    communicate = Communicate(text, "id-ID-ArdiNeural", pitch="-8Hz", rate="-3%")
    await communicate.save(raw_mp3)
    
    # Process through cinematic broadcast EQ chain
    cmd = [
        FFMPEG, "-y",
        "-i", raw_mp3,
        "-af", "bass=g=5:f=120,treble=g=1.5:f=3500,highpass=f=75,loudnorm=I=-16:TP=-1.5:LRA=11",
        "-ar", "48000",
        "-ac", "2",
        final_wav
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    if os.path.exists(raw_mp3):
        os.remove(raw_mp3)
    print(f"[{idx}/14] ✅ Done -> {final_wav}")

async def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)
    for i, s in enumerate(SENTENCES):
        await synthesize_one(i + 1, s["text"])
    print("\n🎉 All 14 sentences synthesized successfully with uniform tone & EQ!")

if __name__ == "__main__":
    asyncio.run(main())
