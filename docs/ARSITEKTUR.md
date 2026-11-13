# Arsitektur Teknis

## 1. Gambaran Umum

```
 Browser HP / Laptop  (JavaScript, HTML, CSS)
 ┌──────────────────────────────────────────┐
 │ UI game, highlight ekspresi, petunjuk,   │
 │ input jawaban, cache PWA, antrean log    │
 └───────────────┬──────────────────────────┘
                 │ fetch() JSON  /api/...
 ┌───────────────▼──────────────────────────┐
 │ Flask (Python)                           │
 │  engine: tokenizer → solver → checker    │
 │          scoring, generator              │
 │  data: soal_latihan.json, misi.json      │
 │  db.py → SQLite (progres & log)          │
 └──────────────────────────────────────────┘
```

**Pembagian peran Python vs JavaScript**

| Python (backend) | JavaScript (frontend) |
|---|---|
| Mengurai ekspresi dan menghasilkan urutan langkah yang benar | Menampilkan ekspresi sebagai token yang bisa di-highlight/diketuk |
| Memeriksa jawaban per langkah dan mendiagnosis jenis kesalahan | Mengelola alur layar, petunjuk bertingkat, tombol ulangi |
| Menghitung skor rubrik misi literasi | Animasi pelipatan ekspresi, format angka ribuan saat mengetik |
| Membuat soal sejenis (generator) | Menyimpan progres sementara (localStorage) saat offline |
| Menyimpan log & mengekspor CSV | Mengirim log ke server (batch) |

Python adalah **sumber kebenaran** untuk matematika. JS tidak menghitung jawaban benar sendiri, kecuali validasi format input.

## 2. Modul Python (`backend/engine`)

### `tokenizer.py`
```python
def tokenisasi(teks: str) -> list[Token]
# "150.000 − 4 × 12.500" →
# [Angka(150000), Op('-'), Angka(4), Op('*'), Angka(12500)]
```
- Menormalkan simbol: `×,x,*` → `*`; `÷,:,/` → `/`; `−,-` → `-`.
- Angka dengan titik ribuan (`\d{1,3}(\.\d{3})+`) → bilangan bulat.
- Setiap token menyimpan `idx` posisi agar frontend bisa meng-highlight.

### `solver.py`
```python
def langkah_langkah(token: list[Token]) -> list[Langkah]
```
Algoritma (dijelaskan juga di laporan mata kuliah Algoritma & Pemrograman):
1. Selama ada kurung: cari pasangan kurung **terdalam paling kiri**, selesaikan isinya secara rekursif (langkah-langkahnya dicatat dengan `alasan="kurung"`), ganti dengan hasilnya.
2. Selama ada `*` atau `/`: ambil yang **paling kiri**, hitung, ganti tiga token dengan satu angka (`alasan="kali-bagi kiri ke kanan"`).
3. Selama ada `+` atau `-`: ambil yang **paling kiri**, hitung (`alasan="tambah-kurang kiri ke kanan"`).

Struktur `Langkah`:
```json
{
  "no": 2,
  "sebelum": "16 ÷ 4 + 5",
  "rentang": [0, 2],           // indeks token yang dihitung
  "operasi": "16 ÷ 4",
  "hasil": 4,
  "sesudah": "4 + 5",
  "alasan": "kali-bagi-kiri-kanan",
  "penjelasan": "÷ dan × setara. Yang paling kiri adalah 16 ÷ 4."
}
```
Menggunakan `Fraction`; jika ada hasil tak bulat → `ValueError` (bank soal ditolak).

### `checker.py`
```python
def cek_langkah(soal_id, no_langkah, pilihan_rentang=None, jawaban=None) -> HasilCek
```
Diagnosis kesalahan (dipetakan ke temuan wawancara):

| Kode diagnosis | Kondisi | Pesan umpan balik (ringkas) | Asal |
|---|---|---|---|
| `TAMBAH_SEBELUM_KALI` | Memilih `+`/`−` padahal masih ada `×`/`÷` | "Masih ada × atau ÷. Kerjakan itu dulu." | IL01 |
| `ABAIKAN_KURUNG` | Memilih operasi di luar kurung padahal kurung belum selesai | "Lihat bingkai biru — isi kurung dulu." | IL02 |
| `KALI_SEBELUM_BAGI` | Memilih `×` padahal ada `÷` di kirinya | "× dan ÷ setara. Pilih yang paling kiri." | IL03 |
| `TIDAK_DARI_KIRI` | Memilih operasi setara yang bukan paling kiri | "Operasinya setara, mulai dari yang paling kiri." | IL03 |

Catatan: bila ada dua perkalian di suku berbeda (`2 × 3 + 4 × 5`), keduanya **sah** dikerjakan lebih dulu — aplikasi tidak menyalahkan pilihan yang benar secara matematis.
| `SALAH_FAKTA` | Operasi benar, hasil hitung salah | "Urutannya sudah benar! Cek lagi hasil 16 ÷ 4." | IL05 |
| `LEWAT_LANGKAH` | Jawaban sama dengan hasil 2 langkah ke depan | "Wah, kamu melompat langkah. Tulis satu per satu." | IL04 |

### `scoring.py`
- Skor misi literasi = jumlah skor tahap sesuai kisi-kisi (maks. 6/soal).
- Kebijakan petunjuk: membuka petunjuk level 3 pada suatu tahap → skor tahap itu dikali 0,5 (dibulatkan ke bawah ke 0,5). Dicatat terpisah agar peneliti bisa membandingkan skor murni vs berbantuan.
- Bintang: ≥ 90 % = 3, ≥ 60 % = 2, ≥ 1 tahap benar = 1.

### `generator.py`
- Membuat soal sejenis dari **templat pola**, mis. `a + b × c`, `(a − b) ÷ c + d`, `a ÷ b × c − d`.
- Batasan: semua langkah bulat & non-negatif, angka sesuai level (Dasar ≤ 50, Sedang ≤ 200, Lanjutan ribuan/konteks uang).

## 3. Modul JavaScript (`frontend/js`)

| File | Isi |
|---|---|
| `main.js` | Router hash sederhana (`#/peta`, `#/latihan/dasar/3`, `#/misi/2/tahap/3`) |
| `api.js` | Pembungkus `fetch` + antrean log offline |
| `state.js` | Status sesi: kode siswa, level terbuka, bintang (sinkron ke localStorage) |
| `teks.js` | Semua string UI bahasa Indonesia |
| `ui/ekspresi.js` | Render token, highlight `rentang`, bingkai kurung, mode ketuk, animasi lipat |
| `ui/petunjuk.js` | Petunjuk bertingkat |
| `ui/umpanbalik.js` | Menampilkan pesan diagnosis |
| `ui/angka.js` | Format/parsing titik ribuan pada input |
| `game/peta.js` | Peta belajar & kunci level |
| `game/latihan.js` | Mode Contoh / Lengkapi / Mandiri / Pilih Langkah Pertama |
| `game/misi.js` | Mesin tahap untuk misi literasi (pilihan, susun model, hitung langkah, isian) |
| `sw.js` | Service worker cache aset statis |

## 4. API (Flask)

| Metode | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/masuk` | `{kode}` → buat/ambil siswa, progres, lencana. Kode berawalan `GURU` membuka semua zona (untuk demo/uji ahli) |
| GET | `/api/aturan` | 4 kartu aturan + langkah contohnya |
| GET | `/api/latihan` | Semua level beserta soal (token ekspresi, tanpa langkah jawaban) |
| GET | `/api/soal/<id>/contoh` | Langkah contoh — hanya untuk mode `contoh` (semua) dan `lengkapi` (langkah awal) |
| POST | `/api/langkah/cek` | `{ekspresi, op_idx, jawaban?}` → `{benar, diagnosis, pesan, rentang, sesudah?, selesai}` (stateless) |
| POST | `/api/langkah/petunjuk` | `{ekspresi, level}` → `{teks, rentang}` |
| POST | `/api/soal-sejenis` | `{ekspresi}` → soal baru berpola sama |
| POST | `/api/contoh-mirip` | `{ekspresi}` → contoh lengkap untuk soal *mirip* (ditawarkan setelah 3× salah) |
| GET | `/api/pemanasan` | 8 soal fakta × dan ÷ |
| POST | `/api/progres` | `{kode, item, kesalahan, petunjuk_maks}` → bintang dihitung server, simpan hasil terbaik |
| GET | `/api/misi` · `/api/misi/<id>` | Daftar misi · cerita + tahap (tanpa kunci, pembahasan, petunjuk) |
| GET | `/api/misi/<id>/petunjuk?tahap&bagian&level` | Petunjuk bertingkat bagian misi |
| POST | `/api/misi/<id>/cek` | `{tahap, bagian, jawaban, percobaan}` → `{benar, skor, pesan, pembahasan?}` (pembahasan muncul bila benar atau setelah 3 percobaan) |
| POST | `/api/misi/<id>/selesai` | Skor akhir per tahap rubrik, potongan petunjuk level 3, simpan progres |
| GET | `/api/rapor/<kode>` | Rekap level, skor per indikator literasi, lencana |
| POST | `/api/log` | Batch log aktivitas |
| GET | `/api/peneliti/rekap` · `/api/peneliti/ekspor.csv?tabel=progres|log` | Panel peneliti (PIN di `.env`) |

Pembagian bagian (*bagian*) dalam satu tahap: tahap rubrik bisa terdiri dari beberapa interaksi kecil (mis. Misi 1 tahap 1 = pilih info 0,5 + pilih yang dibandingkan 0,5). Jumlah skor bagian selalu = skor tahap pada kisi-kisi (divalidasi `bank.validasi()` saat server start).

Kunci jawaban **tidak pernah** dikirim ke browser sebelum siswa menjawab (mencegah mengintip lewat DevTools).

## 5. Skema Database (SQLite)

```sql
CREATE TABLE siswa (
  id INTEGER PRIMARY KEY, kode TEXT UNIQUE NOT NULL,
  dibuat TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE progres (
  siswa_id INTEGER, item TEXT,          -- 'dasar-3', 'misi-2'
  bintang INTEGER, skor REAL, skor_maks REAL,
  diperbarui TEXT, PRIMARY KEY (siswa_id, item)
);
CREATE TABLE log (
  id INTEGER PRIMARY KEY, siswa_id INTEGER, waktu TEXT,
  item TEXT, langkah INTEGER,
  jenis TEXT,       -- jawab | petunjuk | ulangi | cek_ulang | pilih_langkah
  isi TEXT,         -- jawaban/level petunjuk
  benar INTEGER, diagnosis TEXT
);
```

## 6. Deployment

- Pengembangan: `python -m backend.app` (host `0.0.0.0` agar HP di Wi-Fi yang sama bisa mengakses).
- Uji coba di sekolah: PythonAnywhere (gratis) atau Render; atau laptop + hotspot.
- `requirements.txt`: `flask`, `python-dotenv`, `pytest` (dev). Tidak perlu yang lain.
