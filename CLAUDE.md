# CLAUDE.md — Panduan Pengembangan

File ini dibaca oleh Claude Code (dan pengembang manusia) sebelum mengubah kode. Ikuti aturan di sini; jika ada konflik, tanyakan dulu ke pemilik proyek.

## Ringkasan Proyek

Aplikasi web game belajar **operasi hitung bilangan campuran** untuk siswa SMP kelas VIII.
Tujuan pedagogis: **mengurangi beban kognitif** agar kemampuan **mathematical literacy** meningkat.
Sumber kebutuhan: wawancara siswa (lihat [docs/ANALISIS_KEBUTUHAN.md](docs/ANALISIS_KEBUTUHAN.md)) dan kisi-kisi soal (lihat [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)).

## Stack Wajib

- **Python 3.11+** — backend Flask di `backend/`. Semua logika matematika (tokenisasi, urutan operasi, pemeriksaan langkah, penskoran) **ditulis di Python** dan menjadi sumber kebenaran.
- **JavaScript (vanilla, ES modules)** — frontend di `frontend/`. Tanpa framework berat (tanpa React/Vue) agar ringan di HP spesifikasi rendah. Tanpa build step.
- SQLite untuk penyimpanan; JSON untuk bank soal.
- Dilarang menambah dependensi baru tanpa alasan tertulis di PR/commit.

## Perintah

```bash
pip install -r requirements.txt   # instal dependensi
python -m backend.app             # server dev di http://localhost:5000
pytest                            # semua tes Python
pytest backend/tests/test_engine.py -k kurung   # tes spesifik
```

## Struktur Folder

```
backend/
  app.py              # Flask app factory, validasi bank soal saat start, sajikan frontend
  bank.py             # muat & validasi JSON soal; *_publik() membuang kunci
  db.py               # SQLite: siswa, progres, log
  api/                # blueprint: latihan.py (aturan/langkah/sejenis), misi.py, siswa.py (masuk/progres/log/rapor/peneliti)
  engine/
    tokenizer.py      # "36 ÷ 6 × 2 − 3" → token
    solver.py         # langkah urutan operasi; op_sah() = semua operator yang boleh dikerjakan sekarang
    checker.py        # cek langkah siswa + diagnosis + petunjuk 3 tingkat
    scoring.py        # skor rubrik kisi-kisi, bintang
    generator.py      # soal sejenis & pemanasan
  data/
    soal_latihan.json # kartu aturan + level dasar/sedang/lanjutan
    misi_literasi.json# 4 soal kisi-kisi: tahap → bagian (skor bagian dijumlah = skor tahap)
  tests/
frontend/
  index.html  css/style.css  manifest.webmanifest  sw.js  icon.svg
  js/
    main.js (router hash)  api.js (fetch + antrean log)  state.js (kunci zona)  teks.js
    ui/    dom.js  ekspresi.js  angka.js  umpan.js (umpan balik, petunjuk, ringkasan)
    game/  contoh.js (worked example)  langkah.js (pengerjaan mandiri)  latihan.js  misi.js
           aturan.js  pemanasan.js  peta.js (peta & rapor)  peneliti.js
docs/
```

Menambah soal: edit JSON lalu jalankan `pytest` — `test_bank_soal_sehat` menolak soal yang tidak bulat, kunci di luar pilihan, atau skor bagian yang tidak cocok dengan rubrik.

## Aturan Matematika (JANGAN dilanggar)

1. Urutan operasi: **kurung → (× dan ÷ setara, kiri ke kanan) → (+ dan − setara, kiri ke kanan)**.
   - Jangan pernah mengajarkan "kali selalu sebelum bagi" (miskonsepsi IL03 dari wawancara).
   - Jangan gunakan singkatan yang menyesatkan seperti "KaBaTaKu" tanpa menegaskan kesetaraan kali-bagi.
2. Simbol tampilan: `×`, `÷`, `−` (U+2212), `+`, `( )`. Tokenizer harus menerima juga `*`, `/`, `-`, `x`, `:`.
3. Pemisah ribuan memakai titik gaya Indonesia: `35.000`. Tokenizer harus membedakan "35.000" (tiga puluh lima ribu) dari desimal. Aplikasi **tidak memakai desimal** pada versi 1.
4. Gunakan `fractions.Fraction` / bilangan bulat di Python, bukan `float`. Jangan pernah memakai `eval()`.
5. Semua soal di bank soal harus punya hasil bilangan bulat di setiap langkah (validasi otomatis di tes).

## Aturan Pedagogis (dari wawancara)

| Aturan | Asal kode |
|---|---|
| Satu langkah per layar; ringkasan langkah selesai selalu terlihat | IL04, EL04, DS01 |
| Bagian yang sedang dikerjakan diberi penanda (highlight); isi kurung punya warna khusus | IL01, IL02, EL01 |
| Jangan langsung menampilkan jawaban; petunjuk dibuka bertahap (3 tingkat) | DS01, GL03 |
| Umpan balik menyebut **langkah mana** yang keliru dan memberi kesempatan memperbaiki | GL04 |
| Setiap aturan disertai "kenapa" dalam satu kalimat sederhana | EL05 |
| Tidak ada timer/hitung mundur di mode belajar; ada tombol "ulangi penjelasan" | EL02 |
| Tampilan minim dekorasi; animasi hanya untuk menandai langkah | EL03, DS03 |
| Latihan berjenjang dasar → sedang → lanjutan; soal sejenis bisa diulang dengan angka baru | DS02, GL05 |
| Ajak siswa memeriksa ulang (tombol "cek ulang dari awal") | GL02 |

## Konvensi Kode

- Python: PEP 8, type hints, docstring bahasa Indonesia singkat. Nama fungsi/variabel boleh bahasa Indonesia (`hitung_langkah`, `cek_jawaban`) — konsisten dalam satu modul.
- JavaScript: ES2020, `const`/`let`, modul per fitur, tanpa variabel global kecuali `window.APP_VERSION`.
- Teks UI seluruhnya **bahasa Indonesia** sederhana untuk siswa SMP; simpan teks di `frontend/js/teks.js` agar mudah direvisi.
- API mengembalikan JSON `{ "ok": true, "data": ... }` atau `{ "ok": false, "pesan": "..." }`.

## Privasi

- Siswa masuk dengan **kode siswa** (mis. `S01`) — jangan meminta nama lengkap, NIS, foto, atau email.
- Log belajar hanya untuk analisis penelitian; dapat diekspor CSV oleh guru/peneliti.

## Definisi Selesai (per fitur)

- Ada tes pytest untuk logika Python yang berubah.
- Dicoba di lebar layar 360 px (HP) dan 1280 px (laptop).
- Teks terbaca (ukuran angka ≥ 24 px pada ekspresi), kontras memenuhi WCAG AA.
- Fitur dikaitkan ke kode kebutuhan (FR-xx) di [docs/ANALISIS_KEBUTUHAN.md](docs/ANALISIS_KEBUTUHAN.md).
