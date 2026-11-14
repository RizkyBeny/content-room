# PRD: Generate Video Explainer dari Artikel Kumparan

Content Desk Renew | Feature PRD | Draft v0.2 | Diperbarui 1 November 2026

PRD ini dipisah menjadi **Bagian Bersama** (konteks, scope, user story, pipeline, storyboard), **Bagian A: Frontend** dan **Bagian B: Backend**. FE bisa dikerjakan end to end lebih dulu memakai mock API. BE kemudian menggantinya tanpa mengubah UI. Tanda `[NEEDS INPUT]` berarti belum ada data dan wajib diputuskan. Tanda `⚠️ Needs validation` berarti asumsi yang perlu dicek.

## 0. Ringkasan Perubahan dari v0.1 (28 Oktober 2026)

| # | Perubahan | Dampak |
| --- | --- | --- |
| 1 | Output **dinamis, bukan templating**. Sistem menentukan angle dari artikel dan intent user, lalu menyusun script dan storyboard sendiri (Bagian 8). | Pipeline BE baru. Alur UI tidak berubah. |
| 2 | **Storyboard** menjadi artefak kontrak antara tahap perencanaan dan engine video. Dibuat di belakang layar, mengikat script dan audio yang disetujui, memuat animasi/FX dalam format yang mudah dibaca LLM (Bagian 9). | Kontrak baru FE-agnostik. |
| 3 | Engine video **mengikuti visual direction storyboard**, bukan prompt bebas ke model video. Rujukan craft: LottieFiles `motion-design-skill` dan `claude-motion-skills` (Bagian 10). | BE-07 diganti. Risiko dan dependency vendor video AI berubah. |
| 4 | Fokus tipe video: **explainer saja**. Kontrak menyiapkan field `videoType` agar tipe lain bisa menyusul. | Non-goal baru. |
| 5 | Kartu ringkasan menampilkan **Angle** pilihan sistem (read-only), menggantikan chip fitur gambar. | Menjawab OQ-04 (usulan). |
| 6 | Semantik **Regenerate** diubah: komposisi visual baru, script dan audio sama. | Perlu keputusan PM (OQ-12). |

## 1. Overview

| Field | Value |
| --- | --- |
| Document status | Draft |
| PRD type | Feature (fitur baru di Content Desk) |
| Author | [NEEDS INPUT] |
| Target release | [NEEDS INPUT] |
| Stakeholders | Tim konten Kumparan, Design, FE, BE |
| Desain | Figma file `D2DgTOzzD7TelxaPf8mSDf`, halaman "Cluster Bisnis - Video Generate" (node `37:4545`) |
| Tipe video (scope) | Explainer saja |
| Referensi craft | `LottieFiles/motion-design-skill`, `kevinbadi/claude-motion-skills` (fork dari `iart-ai/motion-skills`), skill internal `tiktok-motion` (lihat Bagian 10) |

## 2. Problem Statement

Tim konten perlu mengubah artikel Kumparan menjadi video explainer pendek, tetapi prosesnya manual: menulis narasi, merekam atau mencari voice over, lalu menyusun visual. Tools ini menyederhanakannya menjadi satu alur: tempel link artikel, tinjau script, pilih suara, dengarkan preview, lalu generate video lengkap dengan audio. Artikel Kumparan sangat beragam (berita cepat, data ekonomi, profil, penjelasan kebijakan), sehingga satu pola visual yang sama untuk semua artikel akan terasa monoton dan sering tidak cocok dengan isi. ⚠️ Needs validation: belum ada data baseline waktu produksi manual saat ini.

## 3. Goals

**Business goal** ⚠️ Needs validation: memangkas waktu produksi satu video explainer dari link artikel sampai video siap unduh menjadi median ≤ 10 menit. Baseline: [NEEDS INPUT].

**User goal:** menghasilkan video explainer 45-60 detik dari satu artikel tanpa menulis prompt panjang dan tanpa keahlian editing, dengan angle dan visual yang menyesuaikan isi artikel dan intent yang ditulis user.

**Quality goal (baru):** video harus setia pada artikel (tidak ada angka atau nama yang tidak bersumber) dan setia pada storyboard yang disetujui. Ambang ukur ada di Bagian 9.

**Non-goals:**

- Link dari media selain Kumparan.
- Lebih dari satu link per video.
- Upload gambar, audio, atau video sendiri.
- Tipe video selain explainer (short/listicle, data brief, affiliate). Kontrak hanya menyiapkan field `videoType`.
- Edit manual oleh user atas storyboard, timeline, musik, atau trim. User mengarahkan lewat brief dan script.
- Katalog template tetap yang dipilih user. Sistem menyusun komposisi sendiri dari building block (Bagian 9.3).
- Pembuatan gambar statis.
- Role dan approval berlapis; tools ini hanya untuk satu jenis user.
- Komponen shell (sidebar, header, date range, dark mode) yang sudah ada di Content Desk.

## 4. User Persona

**Primary: Tim konten / editor video Kumparan (login sebagai Admin)**

- Context: bekerja di Content Desk, membuat video pendek dari artikel yang sudah terbit.
- Motivation: video explainer cepat, konsisten dengan brand, dan siap publish.
- Pain point: produksi manual lambat dan bergantung pada banyak langkah dan orang.

Tidak ada persona sekunder; tidak ada role lain. Engine video adalah *konsumen sistem* atas storyboard, bukan persona.

## 5. User Stories

| ID | User Story | Priority |
| --- | --- | --- |
| US-01 | Sebagai tim konten, saya ingin memasukkan satu link artikel Kumparan beserta konteks/intent tambahan agar sistem membuatkan script narasi video yang sesuai arah yang saya mau. | P0 |
| US-02 | Sebagai tim konten, saya ingin meninjau dan mengedit script agar narasi sesuai keinginan sebelum dijadikan suara. | P0 |
| US-03 | Sebagai tim konten, saya ingin memilih suara Male atau Female lalu generate voice over agar narasi menjadi audio. | P0 |
| US-04 | Sebagai tim konten, saya ingin memutar preview audio sebelum lanjut agar tidak membuang proses video dengan audio yang salah. | P0 |
| US-05 | Sebagai tim konten, saya ingin menyetujui audio dan generate video utuh beserta audionya. | P0 |
| US-06 | Sebagai tim konten, saya ingin menonton, mengunduh, atau me-regenerate video hasil. | P0 |
| US-07 | Sebagai tim konten, saya ingin melihat pesan error yang jelas dan bisa mencoba ulang tanpa mengulang dari awal. | P1 |
| US-08 | Sebagai tim konten, saya ingin melihat angle yang dipilih sistem agar saya paham arah video sebelum menyetujui, dan bisa mengubahnya lewat brief. | P1 |
| US-09 | Sebagai tim konten, saya ingin video hasil sesuai dengan script dan audio yang saya setujui (isi, urutan, dan ritme), dengan visual yang berbeda sesuai jenis artikel, agar tidak terlihat seperti template. | P0 |

## 6. Acceptance Criteria

**US-01 Input link dan konteks**

- Given halaman composer terbuka, when kolom link kosong, then tombol "Buat konten" nonaktif.
- Given link bukan `https` atau domainnya bukan `kumparan.com` (termasuk `www.` dan subdomain resmi), when user mengisi, then muncul pesan validasi "Link harus berasal dari kumparan.com" dan tombol tetap nonaktif.
- Given link valid dan brief opsional terisi (maks 500 karakter ⚠️), when user klik "Buat konten", then user pindah ke layar loading "Generating Content ..." dan job script dibuat.
- Given artikel tidak bisa diambil (404, tidak publik, kosong), when proses gagal, then user melihat error "Artikel tidak dapat diakses" dan bisa kembali mengganti link.
- Given brief kosong, when job dibuat, then sistem tetap menetapkan angle dari isi artikel dan tidak menampilkan error.
- Given brief meminta hal yang tidak ada di artikel, when script dibuat, then script tidak memuat klaim itu dan `warnings` pada job mencatat permintaan yang tidak dapat dipenuhi.

**US-02 Review dan edit script**

- Given script berhasil dibuat, when halaman terbuka, then script tampil di textarea yang bisa diedit beserta estimasi durasi.
- Given estimasi durasi script > 60 detik, when user hendak generate voice over, then tombol nonaktif dan muncul pesan batas 60 detik.
- Given audio sudah jadi, when user klik "Edit Script", then textarea bisa diedit lagi, audio hasil sebelumnya dibuang dari layar, dan user wajib generate voice over ulang.
- Given script diedit dan voice over di-generate ulang, when proses selesai, then storyboard lama dinyatakan kedaluwarsa dan storyboard baru dibuat dari script terbaru (angle tetap).

**US-03 Pilih suara dan generate voice over**

- Given script valid, when user memilih Male atau Female lalu klik "Generate Voice Over", then tombol menampilkan loading, textarea dan dropdown terkunci, dan panel kanan tetap "Create Voice Over First".
- Given audio selesai dibuat, when proses selesai, then loading hilang dan area preview voice over terisi.
- Given audio hasil lebih dari 60 detik, when proses selesai, then user melihat error "Durasi melebihi 60 detik, persingkat script" dan tidak bisa lanjut.

**US-04 Preview audio**

- Given audio siap, when user klik play, then audio terputar, ikon berubah menjadi pause, dan waveform menunjukkan progres.
- Given audio siap, when halaman tampil, then durasi total (format mm:ss) terlihat dan sesuai durasi file audio.

**US-05 Approve dan generate video**

- Given audio siap dan storyboard berstatus `RESOLVED`, when halaman tampil, then tombol "Approve & Generate Video" aktif.
- Given user klik tombol itu, when proses dimulai, then panel kanan menampilkan "Generating Video ...", tombol approve dan Edit Script nonaktif, dan klik ganda tidak membuat job kedua.
- Given approve berhasil, when job video dimulai, then sistem menyimpan `approvedSnapshot` (versi script, audio, storyboard) dan engine hanya membaca snapshot itu.

**US-06 Hasil video**

- Given video selesai, when panel kanan tampil, then video 9:16 bisa diputar, dan tombol "Regenerate" serta "Download" tersedia.
- Given user klik Download, when file siap, then browser mengunduh file `.mp4` berisi video dan audio, berdurasi ≤ 60 detik.
- Given user klik Regenerate, when proses dimulai, then panel kembali ke "Generating Video ..." dan sistem membuat komposisi visual baru dari script dan audio yang sama ⚠️ (lihat OQ-12).

**US-07 Error dan retry**

- Given tahap script, audio, atau video gagal, when error terjadi, then pesan menyebut tahap yang gagal dan tersedia tombol "Coba lagi" yang mengulang hanya tahap itu.
- Given user menutup tab saat proses berjalan, when membuka kembali URL job, then status terakhir dipulihkan.

**US-08 Angle terlihat**

- Given script siap, when workspace tampil, then kartu ringkasan menampilkan nama angle (maks 4 kata) yang ditetapkan sistem.
- Given user ingin mengubah arah, when user membuat job baru dengan brief berbeda, then angle yang dihasilkan mencerminkan intent di brief (dinilai dengan rubrik editorial, lihat Bagian 11).

**US-09 Video setia pada approval dan beradaptasi**

- Given video selesai, when QA otomatis dijalankan, then ≥ 95% scene muncul di video dalam toleransi ±300 ms dari `time_ms` storyboard dan seluruh teks layar storyboard terdeteksi pada frame sampel. ⚠️
- Given dua artikel dari jenis berbeda pada set evaluasi (mis. berita kejadian vs data ekonomi), when keduanya di-generate, then angle dan urutan komposisi scene berbeda, dan reviewer editorial menilai keduanya "sesuai isi artikel" pada rubrik. ⚠️
- Given semua angka dan nama diri yang tampil di layar, when diperiksa terhadap artikel, then 100% memiliki `source_ref` yang valid (toleransi nol pada sampel review).

## 7. Alur dan Status Job (acuan FE dan BE)

Status eksternal tetap seperti v0.1 agar FE stabil:

`SCRIPT_GENERATING` → `SCRIPT_READY` → `AUDIO_GENERATING` → `AUDIO_READY` → `VIDEO_GENERATING` → `VIDEO_READY`. Dari tahap mana pun bisa ke `FAILED` (menyimpan tahap yang gagal). Dari `AUDIO_READY` atau `VIDEO_READY`, "Edit Script" kembali ke `SCRIPT_READY`. "Regenerate" dari `VIDEO_READY` kembali ke `VIDEO_GENERATING`.

Tahap internal yang baru ditampilkan lewat `progress.step` (untuk label loading), bukan status baru:

| Status eksternal | `progress.step` internal (berurutan) | Artefak yang dihasilkan |
| --- | --- | --- |
| `SCRIPT_GENERATING` | `ARTICLE_FETCH` → `ANGLE_PLANNING` → `SCRIPT_WRITING` → `STORYBOARD_DRAFTING` | Isi artikel, angle, script, storyboard `DRAFT` |
| `AUDIO_GENERATING` | (`STORYBOARD_REDRAFT` bila script berubah) → `TTS` → `TIMING_ALIGNMENT` | Audio, storyboard `RESOLVED` (waktu per scene terkunci ke audio) |
| `VIDEO_GENERATING` | `SCENE_BUILD` → `RENDER` → `QA_VERIFY` → `ENCODE` | Frame/scene, laporan QA, `.mp4` |

Aturan durasi: target 45-60 detik, maksimum keras 60 detik, divalidasi pada **durasi audio aktual**. Panduan awal ⚠️ Needs validation: Bahasa Indonesia ± 2,5 kata/detik, jadi script ± 110-150 kata.

## 8. Pipeline Dinamis: Angle → Script → Storyboard → Video

### 8.1 Prinsip

| Prinsip | Artinya |
| --- | --- |
| Adaptif, bukan templating | Tidak ada daftar template yang dipilih. Angle, struktur narasi, dan komposisi visual ditentukan per artikel dan per intent. Variasi datang dari building block yang dikombinasikan (Bagian 9.3). |
| Terarah tapi berpagar | Kebebasan LLM dibatasi oleh brand token, safe area, kosakata FX terkontrol, dan validator. Dinamis tidak berarti bebas tanpa aturan. |
| Storyboard sebagai kontrak | Engine video tidak membaca artikel atau brief. Engine hanya membaca storyboard yang sudah `RESOLVED` dan disetujui. |
| Berbasis sumber | Setiap fakta yang tampil di layar atau terucap harus bisa ditelusuri ke bagian artikel. |
| Tipe video eksplisit | `videoType = explainer` menentukan struktur narasi dan aturan pacing. Tipe lain di luar scope. |

### 8.2 Tahap dan tanggung jawab

| Tahap | Input | Output | Gerbang |
| --- | --- | --- | --- |
| 1. Ekstraksi artikel | `articleUrl` | Judul, isi, entitas, angka, kutipan, bagian bersumber (`article:p2`, dst.) | Gagal bila kosong/tidak publik |
| 2. Penentuan angle | Artikel, brief, `videoType` | `angle` {nama, rationale, jenis hook, jenis artikel terdeteksi} | Brief kosong → angle dari artikel |
| 3. Penulisan script | Artikel, angle | Script ±110-150 kata, dipecah per kalimat berID | Validasi panjang |
| 4. Drafting storyboard | Script, angle, artikel | Storyboard `DRAFT` (urutan beat, visual intent, elemen, FX, estimasi waktu) | Lolos validator (Bagian 9.5) |
| 5. Review user | Script | Script yang diedit dan disetujui | Tombol Generate Voice Over |
| 6. Audio + penyelarasan waktu | Script final, suara | Audio, alignment per kata/kalimat, storyboard `RESOLVED` | Durasi ≤ 60 detik, validator waktu |
| 7. Approve | Audio, storyboard `RESOLVED` | `approvedSnapshot` | Tombol Approve & Generate Video |
| 8. Build dan render | Snapshot | Video 1080×1920 | Render sukses |
| 9. Verifikasi (deliver-and-verify) | Video, storyboard | Laporan QA; perbaikan otomatis terbatas | Lolos QA atau fallback (Bagian 9.5) |

### 8.3 Perilaku terhadap intent dan jenis artikel

| Situasi | Perilaku sistem |
| --- | --- |
| Brief kosong | Angle ditentukan dari isi artikel. Struktur explainer standar (konteks → inti → dampak). |
| Brief berisi intent jelas ("fokus dampak ke pekerja") | Intent menjadi pemandu angle dan urutan beat; rationale mencatat intent itu. |
| Brief berisi gaya ("santai", "tegas") | Memengaruhi `direction.tone` dan `motion_personality`, bukan fakta. |
| Brief bertentangan atau meminta fakta di luar artikel | Fakta di luar artikel diabaikan, dicatat di `warnings`. Artikel menang atas brief. |
| Artikel kaya angka | Storyboard condong ke komposisi data (hitung naik, bar, perbandingan). |
| Artikel kronologis | Storyboard condong ke komposisi linimasa. |
| Artikel sensitif (korban, kekerasan, SARA) | Visual dibatasi ke tipografi dan grafis netral. Kebijakan lengkap [NEEDS INPUT] (OQ-14). |

Angle bersifat open-ended (nama + rationale). Taksonomi awal ⚠️ untuk panduan, bukan batas: kronologi, penjelasan sebab-akibat, dampak ke pembaca, data/angka, perbandingan, mitos vs fakta, sosok/human interest.

### 8.4 Semantik approval

- "Approve & Generate Video" mengunci `approvedSnapshot` = {versi script, id audio, versi storyboard `RESOLVED`}.
- Engine hanya membaca snapshot. Perubahan apa pun setelahnya (Edit Script) membuat versi baru dan menggugurkan audio, storyboard, dan video lama.
- Storyboard **tidak ditampilkan** ke user di v0.2 ⚠️ (selaras dengan Figma). Storyboard tersedia untuk tim internal lewat endpoint debug (OQ-13).

## 9. Spesifikasi Storyboard (kontrak engine)

### 9.1 Tujuan dan prinsip penulisan agar mudah dibaca LLM

Storyboard dibaca dan ditulis oleh LLM dan dieksekusi oleh engine. Karena itu:

- **JSON sebagai sumber kebenaran**, dengan render tabel/teks otomatis untuk review manusia dan debugging.
- **Enum eksplisit** untuk `fx`, `easing`, `layout`, `beat`, `transition`. Tidak ada nilai bebas untuk hal yang dieksekusi.
- **Satuan eksplisit** (`_ms`, koordinat pada kanvas 1080×1920, persen safe area). Tidak ada default tersirat.
- **Satu maksud per scene**, ditulis dalam bahasa alami (`visual_intent`) **dan** dalam elemen terstruktur. Keduanya wajib; intent membantu LLM memperbaiki, struktur membuat engine deterministik.
- **Animasi sebagai daftar per elemen**: `target`, `fx`, `start_ms`, `duration_ms`, `easing`, `params`.
- **Setiap scene mencantumkan alasan** (`rationale`) singkat mengapa visual itu dipilih, agar LLM pada tahap perbaikan/regenerate bisa bernalar.
- Setiap teks faktual membawa `source_ref`.

### 9.2 Skema (indikatif; skema final masuk dokumen teknis BE)

Contoh ilustratif, angka dan isi bukan fakta:

```json
{
  "storyboard_version": "1.0",
  "job_id": "job_123",
  "script_hash": "sha256:…",
  "status": "RESOLVED",
  "video_type": "explainer",
  "canvas": { "width": 1080, "height": 1920, "fps": 30,
              "safe_area": { "top": 160, "bottom": 280, "left": 64, "right": 64 } },
  "angle": { "name": "Dampak ke warga",
             "rationale": "Brief meminta fokus dampak; artikel memuat tiga angka dampak.",
             "hook_type": "angka-mengejutkan" },
  "direction": { "tone": "serius-jernih",
                 "motion_personality": "<arketipe dari referensi>",
                 "palette_ref": "kumparan-ds/default",
                 "type_ref": "kumparan-ds/default",
                 "pacing": "medium" },
  "timing": { "audio_duration_ms": 52400, "alignment": "word" },
  "scenes": [
    {
      "id": "s1",
      "beat": "hook",
      "narration": { "sentence_ids": ["n1"],
                     "text": "Tarif baru ini naik tiga ribu rupiah per jam." },
      "time_ms": { "start": 0, "end": 4200 },
      "visual_intent": "Satu angka raksasa langsung tampil di frame 0 agar penonton berhenti scroll.",
      "rationale": "Angka adalah hal paling mengejutkan di artikel.",
      "layout": "focal-single",
      "elements": [
        { "id": "e1", "type": "number", "content": "Rp3.000",
          "style": "display", "source_ref": "article:p2" },
        { "id": "e2", "type": "text", "content": "naik per jam",
          "style": "kicker", "source_ref": "article:p2" }
      ],
      "animations": [
        { "target": "e1", "fx": "scale-pop", "start_ms": 0, "duration_ms": 400, "easing": "spring-soft" },
        { "target": "e2", "fx": "fade-up", "start_ms": 500, "duration_ms": 300, "easing": "ease-out" },
        { "target": "camera", "fx": "push-in", "start_ms": 0, "duration_ms": 4200, "easing": "linear",
          "params": { "scale_to": 1.06 } }
      ],
      "transition_out": { "fx": "push-up", "duration_ms": 350 }
    },
    {
      "id": "s2",
      "beat": "data",
      "narration": { "sentence_ids": ["n2", "n3"], "text": "…" },
      "time_ms": { "start": 4200, "end": 14800 },
      "visual_intent": "Perbandingan tarif lama dan baru dalam bar yang tumbuh bergantian.",
      "rationale": "Perbandingan dua angka paling jelas lewat bar berdampingan.",
      "layout": "chart-area",
      "elements": [
        { "id": "e3", "type": "bar-chart",
          "data": [ { "label": "Lama", "value": 2000 }, { "label": "Baru", "value": 5000 } ],
          "source_ref": "article:p3" }
      ],
      "animations": [
        { "target": "e3", "fx": "bar-grow", "start_ms": 600, "duration_ms": 700,
          "easing": "ease-out", "params": { "stagger_ms": 150 } },
        { "target": "e3", "fx": "highlight-sweep", "start_ms": 5200, "duration_ms": 500,
          "easing": "ease-in-out", "params": { "item": "Baru", "cue_word": "baru" } }
      ],
      "transition_out": { "fx": "cut", "duration_ms": 0 }
    }
  ]
}
```

(Contoh dipotong: storyboard nyata memuat semua scene sampai seluruh narasi tercakup.)

### 9.3 Kosakata FX dan building block (awal, ⚠️ dikalibrasi dari referensi)

Variasi berasal dari kombinasi blok di bawah, bukan dari template utuh. Daftar final ditetapkan di tech design setelah membaca referensi (Bagian 10).

| Kategori | Nilai awal (`fx` / `layout` / `type`) | Catatan |
| --- | --- | --- |
| Entrance | `fade-up`, `slide-in`, `scale-pop`, `mask-reveal`, `word-by-word`, `stagger-list` | Dipicu oleh waktu atau kata kunci narasi (`cue_word`). |
| Emphasis | `highlight-sweep`, `underline-draw`, `count-up`, `pulse`, `impact-shake` | Maksimal satu emphasis kuat per scene. |
| Exit / Transition | `cut`, `push-up`, `wipe`, `zoom-through`, `match-cut` | Durasi transisi ≤ 600 ms ⚠️. |
| Data | `bar-grow`, `line-draw`, `progress-ring`, `timeline-reveal`, `comparison-split` | Data wajib dari artikel dan membawa `source_ref`. |
| Kamera / ambient | `push-in`, `drift`, `parallax`, `bg-gradient-shift` | Gerak halus, tidak mengganggu keterbacaan. |
| Layout (building block) | `focal-single`, `split-v`, `stack`, `chart-area`, `timeline-h`, `quote-card`, `list-reveal` | Posisi bisa dioverride lewat `position` (anchor + offset) dalam safe area. |
| Elemen | `text`, `number`, `bar-chart`, `line-chart`, `icon-shape`, `article-image` (bila boleh, OQ-10), `quote` | Tanpa aset buatan user. |

### 9.4 Motion token awal

Angka berikut berasal dari praktik umum motion design dan ⚠️ harus dikalibrasi dengan tabel timing/easing dan checklist kualitas di repo LottieFiles setelah dibaca langsung.

| Token | Nilai awal | Dipakai untuk |
| --- | --- | --- |
| `dur-micro` | 100-200 ms | Perubahan kecil, penanda |
| `dur-standard` | 250-400 ms | Entrance elemen teks |
| `dur-emphasis` | 500-800 ms | Data, penekanan |
| `dur-transition` | 300-600 ms | Pergantian scene |
| `easing` | `ease-out` (masuk), `ease-in` (keluar), `ease-in-out` (pindah), `spring-soft` (aksen) | Konsisten per video |
| `stagger` | 80-150 ms | Daftar atau grup elemen |

### 9.5 Validator dan aturan kualitas (wajib lulus sebelum storyboard dipakai)

| Aturan | Cek | Status |
| --- | --- | --- |
| Skema valid | Semua field wajib ada, enum dikenal | Blokir |
| Cakupan narasi | 100% kalimat script terpetakan ke tepat satu scene, urutan sama | Blokir |
| Waktu sesuai audio | Setelah `RESOLVED`: total waktu scene = durasi audio ±300 ms ⚠️, tanpa celah/tumpang tindih | Blokir |
| FX terkontrol | Semua `fx`, `easing`, `layout` ada di kosakata | Blokir |
| Grounding | Setiap angka dan nama diri di layar punya `source_ref` yang cocok dengan artikel | Blokir |
| Safe area | Semua elemen berada dalam safe area | Blokir |
| Keterbacaan | Waktu tampil teks ≥ 1,5 dtk + jumlah kata ÷ 3 ⚠️ (rujukan: skill internal `tiktok-motion`) | Perbaiki otomatis |
| Hook | Ada elemen visual di frame 0 dan ≥ 3 perubahan visual di 2 detik pertama ⚠️ | Perbaiki otomatis |
| Pacing | Tidak ada layar diam > 6 detik saat narasi berbicara ⚠️ | Perbaiki otomatis |
| Brand | Warna dan font hanya dari token design system | Blokir |
| Variasi | Tidak ada layout identik > 2 scene berturut-turut ⚠️ | Perbaiki otomatis |

Bila perbaikan otomatis gagal setelah N percobaan [NEEDS INPUT, usulan 2], scene bermasalah diganti komposisi fallback aman (tipografi sederhana) dan dicatat di `quality.degraded_scenes`. Job tidak gagal hanya karena satu scene.

### 9.6 Siklus hidup storyboard

| Status | Terjadi ketika | Boleh dipakai engine? |
| --- | --- | --- |
| `DRAFT` | Dibuat bersama script (estimasi waktu dari jumlah kata) | Tidak |
| `STALE` | Script diedit setelah draft dibuat (`script_hash` berubah) | Tidak |
| `RESOLVED` | Audio selesai dan waktu per scene dikunci ke alignment audio | Ya |
| `APPROVED` | Dirujuk oleh `approvedSnapshot` | Ya (hanya snapshot) |

Setiap versi disimpan untuk audit dan debugging (retensi [NEEDS INPUT], OQ-03).

## 10. Referensi dan Cara Pemakaiannya

| Referensi | Isi (menurut README) | Dipakai untuk | Catatan |
| --- | --- | --- | --- |
| `LottieFiles/motion-design-skill` (MIT) | Prinsip motion design universal: checklist 8 langkah, arketipe motion personality, tabel durasi/easing, koreografi, struktur naratif, prinsip Disney, checklist kualitas, troubleshooting. Berfokus pada UI. | Sumber **aturan craft** di tahap storyboard: pemilihan `motion_personality`, token timing/easing, koreografi urutan elemen, checklist kualitas. | Dirancang untuk UI, bukan video naratif. Perlu adaptasi, terutama untuk ritme mengikuti narasi. |
| `kevinbadi/claude-motion-skills` (MIT; fork dari `iart-ai/motion-skills`) | Kumpulan pack skill untuk motion graphics/video. Pack `explainer-video-skills` mencakup alur script → storyboard → build scene → sinkronisasi narasi/caption → edit → polish, plus `diagram-animation`. Skill video memakai loop *deliver-and-verify* (render frame, cek, probe MP4) dan render via Remotion atau Manim. | Sumber **alur kerja explainer**, pola animasi diagram/data, dan pola verifikasi yang menjadi dasar tahap `QA_VERIFY`. | Repo `kevinbadi` adalah fork. Rujuk upstream `iart-ai` dan kunci ke commit tertentu. |
| Skill internal `tiktok-motion` | Pipeline motion graphic 9:16 dari spec JSON, render HTML/CSS frame-per-frame lewat Chromium headless, aturan hook, tempo, dan `pacing_warnings`, memakai palet design system Kumparan. | Preseden internal: katalog tipe scene sebagai kosakata awal, aturan hook/pacing, bukti bahwa render programatik dengan palet Kumparan sudah dipakai. | Pendekatannya memakai tipe scene tetap. Di PRD ini tipe scene diperlakukan sebagai **building block**, bukan template. |

**Cara pakai:** referensi dipakai sebagai *knowledge base* untuk prompt dan validator pipeline (disaring dan dikunci versinya), bukan dijalankan sebagai agent di production. Opsi eksekusi (distilasi ke prompt sendiri vs menjalankan agent dengan skill) diputuskan di tech design (OQ-11).

**Asumsi engine** ⚠️ Needs validation: referensi di atas membangun video secara programatik (kode menggambar tiap frame), bukan lewat model video generatif. PRD v0.1 menulis "video AI-generated". Versi ini mengasumsikan engine programatik karena teks dan angka harus persis sesuai artikel dan storyboard bisa dieksekusi deterministik. Model generatif tetap boleh dipakai untuk elemen tertentu bila diputuskan kemudian (OQ-02).

## Bagian A: Frontend

### A1. Scope FE

Dua layar: **Composer** (`/video/new`) dan **Workspace** (`/video/:jobId`). Layar di Figma: Composer kosong (`37:4546`), Loading (`37:4629`), Script sebelum audio (`37:4663`), Generating Video (`37:4877`), Video selesai (`37:5096`). Menu sidebar aktif dan judul kartu ringkasan di Figma bertuliskan "Buat Gambar" / "Create Image"; implementasikan sebagai "Buat Video" / "Create Video". **Storyboard tidak punya UI di v0.2.** Dampak perubahan v0.2 pada FE kecil: label progres, chip angle, dan peringatan opsional.

### A2. Kebutuhan fungsional FE

| ID | Requirement | Story |
| --- | --- | --- |
| FE-01 | Composer: textarea brief opsional, input link wajib, tombol "Add link", tombol "Buat konten". Validasi domain `kumparan.com` di sisi klien. | US-01 |
| FE-02 | Layar Loading penuh "Generating Content ..." selama `SCRIPT_GENERATING`, dengan sub-label dari `progress.step` (mis. "Membaca artikel", "Menentukan angle", "Menulis script", "Menyusun storyboard"). | US-01 |
| FE-03 | Workspace: kartu ringkasan (brief dan pengaturan, read-only) di atas; kolom kiri Script, kolom kanan hasil video. | US-02 |
| FE-04 | Textarea Script Voice Over editable saat `SCRIPT_READY`, read-only pada status lain; penghitung kata dan estimasi durasi; blokir bila > 60 detik. | US-02 |
| FE-05 | Dropdown suara (Male/Female, default Male ⚠️), tombol "Generate Voice Over", loading state pada tombol. | US-03 |
| FE-06 | Kartu "Preview Voice Over": play/pause, waveform dengan progres, durasi mm:ss. Waveform abu-abu kosong sebelum audio ada. | US-04 |
| FE-07 | Tombol "Approve & Generate Video" dan "Edit Script" sesuai status; cegah klik ganda. Tombol approve aktif hanya bila audio siap (storyboard `RESOLVED` dipastikan BE; FE cukup membaca `AUDIO_READY`). | US-05 |
| FE-08 | Panel kanan menurut status: "Create Voice Over First", "Generating Video ..." (dengan sub-label `progress.step`: "Menyusun scene", "Merender", "Memeriksa hasil"), atau player video 9:16 dengan "Regenerate" dan "Download". | US-05, US-06 |
| FE-09 | Polling status job tiap 3 detik (berhenti saat status final), pulihkan state dari `jobId` saat refresh. | US-07 |
| FE-10 | Error state per tahap dengan pesan jelas dan "Coba lagi". | US-07 |
| FE-11 | Kartu ringkasan menampilkan chip **Angle** (dari `job.angle.name`), estimasi durasi, dan rasio 9:16. Chip "1 Gambar" dan "investigatif" dihapus. | US-08 |
| FE-12 | Bila `job.warnings` tidak kosong, tampilkan info non-blokir di bawah kartu ringkasan (P2). | US-01 |

### A3. Matriks UI per status

| Status | Script | Suara | Tombol utama | Panel kanan |
| --- | --- | --- | --- | --- |
| SCRIPT\_READY | Editable | Aktif | Generate Voice Over | Create Voice Over First |
| AUDIO\_GENERATING | Terkunci | Terkunci | Generate Voice Over (loading) | Create Voice Over First |
| AUDIO\_READY | Read-only | Aktif | Approve & Generate Video, Edit Script | Create Voice Over First |
| VIDEO\_GENERATING | Read-only | Terkunci | Semua nonaktif | Generating Video ... |
| VIDEO\_READY | Read-only | Aktif | Edit Script | Player, Regenerate, Download |
| FAILED | Sesuai tahap | Sesuai tahap | Coba lagi | Pesan error |

### A4. Gap desain (butuh keputusan desain sebelum atau selama FE)

- Tidak ada desain untuk state **audio sedang diproses** (loading di tombol/preview) dan **semua state error**.
- Tidak ada desain validasi link dan counter durasi script.
- Chip kartu ringkasan berasal dari fitur gambar. Usulan v0.2: ganti dengan Angle, durasi, rasio (OQ-04).
- Tidak ada desain **sub-label progres** pada layar Loading dan Generating Video.
- Tidak ada desain info `warnings`.
- Teks script di Figma berisi prompt gambar; anggap data dummy.

### A5. Data contract untuk mock (indikatif)

```ts
type JobStatus = 'SCRIPT_GENERATING' | 'SCRIPT_READY' | 'AUDIO_GENERATING' | 'AUDIO_READY' | 'VIDEO_GENERATING' | 'VIDEO_READY' | 'FAILED';
type ProgressStep =
  | 'ARTICLE_FETCH' | 'ANGLE_PLANNING' | 'SCRIPT_WRITING' | 'STORYBOARD_DRAFTING'
  | 'STORYBOARD_REDRAFT' | 'TTS' | 'TIMING_ALIGNMENT'
  | 'SCENE_BUILD' | 'RENDER' | 'QA_VERIFY' | 'ENCODE';
interface VideoJob {
  id: string; videoType: 'explainer';
  articleUrl: string; brief?: string;
  status: JobStatus;
  progress?: { step: ProgressStep; index: number; total: number };
  angle?: { name: string; rationale: string };
  warnings?: { code: string; message: string }[];
  script?: { text: string; estimatedDurationSec: number };
  voice: 'male' | 'female';
  audio?: { url: string; durationSec: number };
  storyboard?: { id: string; version: number; status: 'DRAFT' | 'STALE' | 'RESOLVED' | 'APPROVED' }; // metadata saja, isi tidak dikirim ke FE
  video?: { url: string; downloadUrl: string; durationSec: number };
  error?: { stage: 'SCRIPT' | 'AUDIO' | 'VIDEO'; code: string; message: string };
}
```

Mock harus mensimulasikan jeda (script ± 3 detik, audio ± 4 detik, video ± 6 detik) dengan urutan `progress.step` yang realistis, memakai audio dan video sampel, serta bisa memicu error (misalnya link yang mengandung `fail-audio`) dan `warnings`. Semua panggilan API dibungkus satu service layer agar mock mudah diganti BE.

### A6. Acceptance FE (selesai bila)

- Seluruh alur US-01 sampai US-08 bisa dijalankan dari browser memakai mock, termasuk refresh di tengah proses.
- Tidak ada aksi yang bisa dipicu ganda saat loading.
- Layout sesuai Figma pada lebar desktop 1440px; responsif minimal ≥ 1024px ⚠️.

## Bagian B: Backend

### B1. Kebutuhan fungsional BE

| ID | Requirement | Story |
| --- | --- | --- |
| BE-01 | Terima `articleUrl` (wajib) dan `brief` (opsional). Validasi `https` dan host `kumparan.com` di sisi server (allowlist; tolak redirect ke luar domain, cegah SSRF). | US-01 |
| BE-02 | Ambil dan ekstrak isi artikel menjadi struktur bersumber (judul, paragraf berID, entitas, angka, kutipan) sebagai dasar `source_ref`. | US-01 |
| BE-03 | **Angle planner:** tetapkan `angle` {nama, rationale, hook_type} dari artikel, brief, dan `videoType`. Brief kosong tetap menghasilkan angle. Catat `warnings` bila brief tidak dapat dipenuhi. | US-01, US-08 |
| BE-04 | **Script writer:** tulis script dari artikel dan angle, target 45-60 detik, dipecah per kalimat berID. | US-01 |
| BE-05 | **Storyboard generator:** hasilkan storyboard `DRAFT` yang memetakan seluruh kalimat script ke scene, sesuai skema Bagian 9, memakai kosakata FX terkontrol, brand token, dan aturan kualitas dari referensi (Bagian 10). | US-09 |
| BE-06 | **Validator storyboard** menjalankan aturan Bagian 9.5, melakukan perbaikan otomatis terbatas, dan memakai fallback scene bila gagal. | US-09 |
| BE-07 | Simpan script, izinkan pembaruan script selama `SCRIPT_READY`, `AUDIO_READY`, atau `VIDEO_READY`. Pembaruan mereset audio dan video, menandai storyboard `STALE`, dan mengunci angle yang sama. | US-02 |
| BE-08 | Generate audio (TTS) dari script dengan dua pilihan suara, `male` dan `female`, dipetakan ke voice ID provider. Bila storyboard `STALE`, susun ulang storyboard dari script terbaru secara paralel. | US-03 |
| BE-09 | Tolak atau tandai gagal bila durasi audio aktual > 60 detik (`DURATION_EXCEEDED`). | US-03 |
| BE-10 | **Penyelarasan waktu:** hasilkan alignment per kalimat/kata dari audio, kunci `time_ms` per scene, dan ubah storyboard menjadi `RESOLVED`. Gagal alignment ditandai `ALIGNMENT_FAILED`. | US-09 |
| BE-11 | Sediakan URL audio untuk preview (signed URL, berlaku terbatas) beserta durasi. | US-04 |
| BE-12 | Pada approve, simpan `approvedSnapshot` lalu jalankan **engine video** yang membangun dan merender video 1080×1920 mengikuti storyboard snapshot, dengan audio terpilih, hasil `.mp4` berisi audio. Engine tidak membaca artikel atau brief. | US-05, US-09 |
| BE-13 | **QA otomatis (deliver-and-verify):** ambil frame sampel di batas scene, cek teks terdeteksi, overflow, safe area, dan probe durasi `.mp4` terhadap audio. Hasil masuk `quality` pada job; perbaikan otomatis terbatas sebelum fallback. | US-09 |
| BE-14 | Regenerate membuat storyboard varian baru (komposisi visual berbeda) dari script dan audio yang sama, lalu merender ulang. Maksimum regenerate per job [NEEDS INPUT]. | US-06 |
| BE-15 | Sediakan URL download untuk `.mp4` final. | US-06 |
| BE-16 | Seluruh generate bersifat asinkron (job). Setiap tahap punya timeout, retry otomatis terbatas untuk error sementara, dan menyimpan `error.stage` serta kode error. Perbarui `progress.step` di setiap pergantian tahap. | US-07 |
| BE-17 | Operasi approve, generate audio, dan regenerate bersifat idempoten; menolak transisi status yang tidak valid dengan 409. | US-05 |
| BE-18 | Autentikasi memakai sesi Content Desk yang sudah ada; job hanya bisa diakses pembuatnya [NEEDS INPUT: mekanisme auth]. | semua |
| BE-19 | Simpan setiap versi storyboard dan laporan QA untuk audit. Sediakan akses baca internal/debug ke storyboard (tidak dikirim ke FE publik). | US-09 |
| BE-20 | Referensi motion skill disajikan ke pipeline sebagai knowledge base **terversi** (commit dikunci), dengan mekanisme pembaruan terkontrol. | US-09 |

### B2. Surface API yang dibutuhkan FE (level capability)

| Capability | Perilaku |
| --- | --- |
| Buat job | Input link dan brief, kembalikan `jobId` dan status awal |
| Ambil job | Kembalikan seluruh `VideoJob` termasuk `progress`, `angle`, `warnings` (dipakai polling dan pemulihan) |
| Simpan script | Update teks script, reset audio dan video, storyboard menjadi `STALE` |
| Generate voice over | Input suara, mulai job audio (termasuk redraft storyboard dan alignment) |
| Approve dan generate video | Kunci snapshot, mulai job video |
| Regenerate video | Buat varian storyboard dan render ulang |
| Retry tahap gagal | Ulangi hanya tahap yang berstatus FAILED |
| Ambil storyboard (internal/debug) | Kembalikan storyboard penuh dan laporan QA; tidak dipakai UI |

Bentuk response mengikuti data contract di A5; spesifikasi endpoint rinci masuk dokumen teknis BE.

### B3. Kode error minimum

`INVALID_URL`, `ARTICLE_UNREACHABLE`, `ARTICLE_EMPTY`, `SCRIPT_FAILED`, `STORYBOARD_INVALID`, `DURATION_EXCEEDED`, `AUDIO_FAILED`, `ALIGNMENT_FAILED`, `RENDER_FAILED`, `QA_FAILED`, `VIDEO_FAILED`, `INVALID_STATE`, `RATE_LIMITED`.

Pemetaan `error.stage`: `STORYBOARD_INVALID` → `SCRIPT` (atau `AUDIO` bila terjadi saat redraft); `ALIGNMENT_FAILED` → `AUDIO`; `RENDER_FAILED`, `QA_FAILED` → `VIDEO`.

### B4. Keputusan teknis BE (masuk tech design, bukan PRD)

Provider LLM dan TTS; engine render (mis. Remotion atau Chromium headless, lihat OQ-02/OQ-11); metode alignment audio; antrean dan worker; object storage dan masa retensi file; skema data job dan storyboard; cara menyajikan referensi skill ke pipeline.

## 11. Non-Functional Requirements

| Kategori | Requirement | Threshold |
| --- | --- | --- |
| Performa | Generate script + storyboard draft (p95) | ≤ 45 detik ⚠️ |
| Performa | Generate audio + redraft + alignment (p95) | ≤ 75 detik ⚠️ |
| Performa | Generate video, render + QA (p95) | [NEEDS INPUT, tergantung engine] |
| Performa | Respons API non-generate (p95) | ≤ 500 ms |
| Keandalan | Job berhasil tanpa intervensi | ≥ 95% ⚠️ |
| Determinisme | Render ulang dari snapshot yang sama menghasilkan video yang sama (pada engine yang sama) | Ya |
| Kualitas | Storyboard lolos validator pada percobaan pertama | ≥ 90% ⚠️ |
| Kualitas | Fidelity video terhadap storyboard (QA probe) | ≥ 95% scene dalam ±300 ms ⚠️ |
| Kualitas | Angka/nama di layar tanpa `source_ref` valid | 0 pada sampel review |
| Kualitas | Skor rubrik editorial (kecocokan angle, kejelasan, kualitas visual) | ≥ 4 dari 5 pada ≥ 80% set evaluasi ⚠️ |
| Keamanan | Akses job | Hanya pembuat; signed URL kedaluwarsa ≤ 1 jam ⚠️ |
| Keamanan | Input link | Allowlist domain di server, proteksi SSRF |
| Keamanan | Konten artikel dalam prompt | Diperlakukan sebagai data, bukan instruksi (mitigasi prompt injection) |
| Biaya | Batas pemakaian | Rate limit per user per hari [NEEDS INPUT] |
| Lokalisasi | Bahasa | Bahasa Indonesia ⚠️ |
| Aksesibilitas | Kontrol audio/video | Bisa dioperasikan dengan keyboard, label ARIA pada play/pause |

**Rubrik editorial** ⚠️ (dinilai editor Kumparan pada set evaluasi ±20 artikel dari ≥ 4 kategori): (1) angle sesuai isi dan intent, (2) fakta akurat, (3) narasi jelas dan runtut, (4) visual mendukung narasi dan sesuai brand, (5) tampak tidak seperti template yang sama.

## 12. Success Metrics

| Metric | Type | Baseline | Target | Measurement |
| --- | --- | --- | --- | --- |
| Waktu link sampai video siap (median) | Lagging | [NEEDS INPUT] | ≤ 10 menit ⚠️ | Timestamp job created vs VIDEO\_READY |
| Completion rate (link ke Download) | Lagging | [NEEDS INPUT] | ≥ 70% ⚠️ | Event funnel per tahap |
| Skor rubrik editorial | Lagging | n/a | ≥ 4/5 ⚠️ | Review berkala atas sampel video |
| Rasio Regenerate per video | Leading | [NEEDS INPUT] | ≤ 1 per video ⚠️ | Event regenerate |
| Rasio Edit Script setelah audio jadi | Leading | n/a | Dipantau | Event edit script |
| Job gagal per tahap | Leading | n/a | ≤ 5% ⚠️ | Status FAILED per stage |
| Storyboard lolos validator percobaan pertama | Leading | n/a | ≥ 90% ⚠️ | Log validator |
| Scene fallback per video | Leading | n/a | ≤ 10% scene ⚠️ | `quality.degraded_scenes` |
| Keragaman komposisi | Leading | n/a | ≥ 80% pasangan video dari kategori berbeda punya urutan layout berbeda ⚠️ | Analisis storyboard pada set evaluasi |

## 13. Dependencies dan Risks

| Dependency | Owner | Status | Catatan |
| --- | --- | --- | --- |
| Provider LLM (angle, script, storyboard) | [NEEDS INPUT] | Pending | Kualitas output terstruktur dan Bahasa Indonesia perlu diuji |
| Provider TTS (suara Male/Female Bahasa Indonesia) | [NEEDS INPUT] | Pending | Kualitas suara Indonesia perlu diuji |
| Alignment audio per kata/kalimat | [NEEDS INPUT] | Pending | Dari TTS bila tersedia, atau forced alignment terpisah |
| Engine render (programatik) | [NEEDS INPUT] | Pending | Menentukan waktu proses dan biaya |
| Design system Kumparan (token warna, font) | Design | Pending | Sumber token dan akses dari pipeline [NEEDS INPUT] |
| Referensi motion skill (LottieFiles, iart-ai) | BE | Pending | Lisensi MIT. Kunci commit; repo kecil dan jarang diperbarui |
| Akses ambil konten artikel kumparan.com | [NEEDS INPUT] | Pending | Idealnya via API/CMS internal, bukan scraping |
| Hak pakai gambar artikel pada video | Legal / Konten | Pending | Menentukan boleh tidaknya `article-image` (OQ-10) |
| Sesi login Content Desk | [NEEDS INPUT] | Pending | Untuk auth BE |

| Risk | Likelihood | Impact | Mitigasi |
| --- | --- | --- | --- |
| LLM menulis FX atau layout yang tidak didukung engine | High | Med | Kosakata terkontrol, validasi skema, perbaikan otomatis, fallback scene |
| Angle salah baca atau tidak sesuai intent | Med | High | Rationale tersimpan, angle terlihat di UI, brief sebagai pengarah, rubrik evaluasi sebelum beta |
| Angka atau nama di layar tidak akurat | Med | High | Aturan grounding wajib (`source_ref`), validasi, review sampel dengan toleransi nol |
| Storyboard tidak sinkron setelah Edit Script | Med | High | `script_hash`, status `STALE`, redraft otomatis, hanya `RESOLVED` yang boleh dirender |
| Regenerate menghasilkan video identik karena engine deterministik | High | Med | Regenerate = storyboard varian baru (BE-14) |
| Hasil terasa seragam atau acak (dinamis tapi tidak terkendali) | Med | High | Aturan variasi, brand token, motion personality per angle, evaluasi rubrik |
| Referensi motion skill berfokus UI atau berubah/hilang | Med | Med | Adaptasi ke ritme narasi, kunci commit, salin ke repo internal bila lisensi mengizinkan |
| Render lambat atau mahal | Med | High | Rate limit, batas regenerate, polling dengan status jelas, caching aset |
| Audio melebihi 60 detik | High | Med | Estimasi durasi di FE, validasi audio di BE, prompt LLM dibatasi kata |
| Konten AI tidak akurat terhadap artikel | Med | High | Script wajib bisa ditinjau dan diedit sebelum audio |
| Visual tidak sesuai standar editorial atau topik sensitif | Med | High | Kebijakan visual untuk topik sensitif (OQ-14); kebijakan review sebelum publish [NEEDS INPUT] |
| FE selesai lebih dulu, contract BE berubah | Med | Med | Service layer terpisah dan data contract A5 dibekukan sebelum FE selesai |

## 14. Open Questions

| # | Question | Owner | Due | Status |
| --- | --- | --- | --- | --- |
| OQ-01 | Baseline waktu produksi manual dan target bisnis resmi? | PM | Sebelum kickoff | Open |
| OQ-02 | **Engine video:** programatik (diasumsikan), generatif, atau hibrida? Vendor TTS dan LLM yang dipakai? | PM + BE | Sebelum BE kickoff | Open |
| OQ-03 | Apakah hasil video perlu riwayat (history)? Berapa lama video, audio, dan versi storyboard disimpan? Saat ini diasumsikan per sesi/job. | PM | Sebelum BE kickoff | Open |
| OQ-04 | Kartu ringkasan: setujui usulan chip Angle + durasi + rasio 9:16 sebagai pengganti chip fitur gambar? | PM + Design | Sebelum FE selesai | Open |
| OQ-05 | Bahasa script dan suara: hanya Bahasa Indonesia? | PM | Sebelum BE kickoff | Open |
| OQ-06 | Batas regenerate per video dan rate limit per user per hari? | PM + BE | Sebelum BE kickoff | Open |
| OQ-07 | Apakah Edit Script setelah video jadi perlu konfirmasi karena membuang hasil? | PM + Design | Sebelum FE selesai | Open |
| OQ-08 | Desain state loading audio, sub-label progres, info `warnings`, dan semua state error. | Design | Sebelum FE selesai | Open |
| OQ-09 | Tech stack FE dan mekanisme auth yang sudah ada. | FE + BE | Sebelum kickoff | Open |
| OQ-10 | Apakah gambar dari artikel boleh dipakai di video (hak pakai)? Bila tidak, visual hanya grafis dan tipografi. | Legal + Konten | Sebelum BE kickoff | Open |
| OQ-11 | Cara memakai referensi motion skill: distilasi ke prompt dan validator sendiri, atau menjalankan agent dengan skill? Sistem pembaruan versinya? | BE | Tech design | Open |
| OQ-12 | Semantik Regenerate: komposisi visual baru (diusulkan) atau render ulang identik? Apakah user perlu memilih? | PM | Sebelum BE kickoff | Open |
| OQ-13 | Apakah storyboard perlu ditampilkan ke user (read-only atau bisa diedit) pada fase berikutnya? Asumsi v0.2: tidak. | PM + Design | Sebelum FE selesai | Open |
| OQ-14 | Kebijakan visual untuk topik sensitif (korban, kekerasan, SARA, politik) dan siapa yang meninjau sebelum publish? | Konten + Legal | Sebelum beta | Open |
| OQ-15 | Caption/subtitle otomatis di video dan musik latar: dibakar ke video, opsional, atau di luar scope? Non-goal v0.1 menyebut "subtitle, musik". | PM + Design | Sebelum BE kickoff | Open |
| OQ-16 | Jumlah percobaan perbaikan otomatis (usulan 2) dan ambang scene fallback sebelum job dianggap gagal. | BE | Tech design | Open |

## 15. Rollout Plan

- **Fase 0 (paralel dengan Fase 1):** *Spike kualitas pipeline* tanpa UI. Jalankan angle → script → storyboard → render pada set evaluasi ±20 artikel dari ≥ 4 kategori, lalu nilai dengan rubrik editorial. Gerbang: ambang di Bagian 11 tercapai atau keputusan eksplisit untuk melanjutkan.
- **Fase 1:** FE end to end dengan mock API.
- **Fase 2:** BE dan integrasi provider; ganti mock dengan API nyata.
- **Fase 3:** rilis beta ke tim konten memakai feature flag; tinjau metrik sebelum rilis penuh.
- **Kriteria rollback:** job gagal > 20% selama 24 jam, ada temuan angka/nama tidak bersumber pada video yang lolos, atau biaya per video melebihi batas yang disepakati [NEEDS INPUT].
- **Checklist rilis:** uji kualitas suara Indonesia, uji video 9:16 di perangkat mobile, uji batas 60 detik, uji load beberapa job paralel, uji keragaman komposisi pada set evaluasi, uji grounding pada sampel, uji sinkronisasi setelah Edit Script, review kebijakan konten AI.
- **Setelah explainer stabil:** evaluasi tipe video lain (di luar scope PRD ini).

## 16. Catatan Kepercayaan

Bagian yang terisi dari input Anda dan desain Figma: alur, batas 45-60 detik dan maksimum 60 detik, satu link wajib dari Kumparan, satu persona, sistem dinamis yang menentukan angle, script, dan storyboard di belakang layar, engine yang mengikuti storyboard setelah approve, fokus explainer, dan dua repo referensi.

Bagian yang saya asumsikan (⚠️): engine render programatik (bertentangan dengan frasa "AI-generated" di v0.1), storyboard tidak ditampilkan ke user, semantik Regenerate, token timing/easing, daftar FX, ambang validator dan kualitas, angka performa, dan rubrik editorial. Saya membaca README ketiga repo (LottieFiles, `kevinbadi`, dan `iart-ai/explainer-video-skills`), bukan isi tiap file skill. Detail seperti nama arketipe dan tabel easing masih perlu dibaca langsung sebelum tech design. Spesifikasi BE tahap video dan estimasi performanya tetap sementara sampai engine dan vendor diputuskan.
