# HitungRuntut — Game Belajar Operasi Hitung Campuran

Aplikasi web *mobile-first* (bisa dibuka di browser smartphone maupun laptop) untuk membantu siswa SMP kelas VIII memahami **operasi hitung bilangan campuran** dan menerapkannya pada **soal literasi matematika** dalam bentuk game.

> Nama "HitungRuntut" adalah nama kerja; boleh diganti.

## Tujuan

1. **Menurunkan beban kognitif (cognitive load)** siswa saat mengerjakan soal operasi campuran:
   - *Intrinsic load* (IL) → dipecah menjadi langkah kecil, satu langkah per layar.
   - *Extraneous load* (EL) → tampilan bersih, ekspresi berjarak, tanpa hiasan yang mengganggu, tanpa batas waktu.
   - *Germane load* (GL) → contoh bertahap, petunjuk bertingkat, umpan balik per langkah, latihan soal sejenis.
2. **Meningkatkan kemampuan mathematical literacy** pada 4 indikator (lihat kisi-kisi):
   Reasoning, Formulating, Employing, Interpreting/Evaluating.

## Dasar Perancangan

| Sumber | Isi | Dokumen turunan |
|---|---|---|
| Laporan wawancara analisis kebutuhan (siswa S01, 6 Nov 2026) | 23 kutipan berkode K/IL/EL/GL/DS + 3 tugas pemicu + matriks fitur | [docs/ANALISIS_KEBUTUHAN.md](docs/ANALISIS_KEBUTUHAN.md) |
| Kisi-kisi soal mathematical literacy | 4 soal kontekstual, rubrik skor per tahap (maks. 6 per soal) | [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) |

## Teknologi

| Lapisan | Bahasa / Alat | Peran |
|---|---|---|
| Backend | **Python 3.11+**, Flask, SQLite | Mesin langkah (*step engine*) urutan operasi, pemeriksa jawaban per langkah, penskoran rubrik, bank soal, penyimpanan log belajar, API JSON |
| Frontend | **JavaScript** (vanilla, ES modules), HTML5, CSS3 | Tampilan game, penanda (highlight) bagian yang dikerjakan, petunjuk bertingkat, umpan balik, PWA ringan |
| Data | JSON (bank soal), SQLite (progres & log) | |
| Uji | pytest (Python), Vitest/uji manual (JS) | |

Detail: [docs/ARSITEKTUR.md](docs/ARSITEKTUR.md).

## Peta Dokumen

| File | Isi |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Panduan untuk asisten AI/pengembang: aturan kode, konvensi, batasan pedagogis |
| [DESIGN.md](DESIGN.md) | Desain UI/UX & prinsip beban kognitif, warna, tipografi, komponen layar |
| [docs/ANALISIS_KEBUTUHAN.md](docs/ANALISIS_KEBUTUHAN.md) | Penerjemahan data wawancara → kebutuhan fungsional (FR) & non-fungsional (NFR) |
| [docs/ARSITEKTUR.md](docs/ARSITEKTUR.md) | Struktur folder, modul Python & JS, API, skema database |
| [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) | Alur game, level, mekanik, misi literasi dari 4 soal kisi-kisi, format data soal |
| [docs/PENGUJIAN.md](docs/PENGUJIAN.md) | Rencana uji teknis & uji pedagogis (mengacu kolom "cara menguji fitur") |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Tahapan pengerjaan & checklist |

## Menjalankan

```bash
# 1. siapkan lingkungan Python (sekali saja)
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
copy .env.example .env          # lalu ganti PENELITI_PIN

# 2. jalankan server
python -m backend.app
# buka http://localhost:5000 di browser
# dari HP pada Wi-Fi yang sama: http://<IP-laptop>:5000  (cek IP dengan `ipconfig`)

# 3. jalankan tes
pytest
```

### Cara pakai
| Siapa | Caranya |
|---|---|
| Siswa | Masuk dengan kode (mis. `S01`). Zona terbuka berurutan: Kartu Aturan → Dasar → Sedang → Lanjutan → Misi Literasi. Pemanasan × ÷ selalu terbuka. |
| Guru / uji ahli | Masuk dengan kode berawalan `GURU` (mis. `GURU1`) → semua zona langsung terbuka. |
| Peneliti | Buka `http://localhost:5000/#/peneliti`, isi PIN dari `.env` → rekap per siswa (kesalahan, diagnosis, petunjuk, ulangi, cek ulang) + unduh CSV. |

### Fitur yang sudah ada
- Mesin langkah urutan operasi (Python) dengan 6 diagnosis kesalahan dari wawancara
- Kartu aturan + alasan, contoh bertahap dengan tombol "Ulangi penjelasan"
- Latihan 3 level × 6 soal: contoh → pilih langkah pertama → lengkapi → mandiri; soal sejenis tanpa batas; cek ulang
- Petunjuk 3 tingkat yang tidak pernah memberi jawaban akhir; contoh soal mirip setelah 3× salah
- 4 misi literasi sesuai kisi-kisi (skor maks. 6 per misi), rapor per indikator, lencana
- Log belajar + panel peneliti + ekspor CSV; PWA; mode gelap; tanpa timer

## Penyusun

Siti Solehah — S1 Pendidikan Matematika, kelas 3B.
Mata kuliah: Algoritma dan Pemrograman.
