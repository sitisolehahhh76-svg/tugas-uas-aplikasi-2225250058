# Desain Game

## 1. Konsep

**HitungRuntut** — siswa menjadi "penyelesai urusan kelas" yang membantu teman-teman mengurus belanja, bazar, dan uang kembalian. Untuk membuka misi-misi itu, siswa harus menguasai **aturan urutan operasi** lewat latihan berjenjang.

Game ini sengaja **tenang**: tidak ada nyawa, tidak ada timer, tidak ada musuh. Unsur game berasal dari **peta yang terbuka bertahap, bintang, dan lencana**, sehingga motivasi naik tanpa menambah beban kognitif (EL02, EL03).

## 2. Alur Besar

```
Masuk (kode siswa)
   │
   ▼
[Pemanasan Fakta ×÷]  (opsional, 8 soal, tanpa timer)   ← IL05
   │
   ▼
Zona 1: Kartu Aturan  (kurung → ×÷ kiri-kanan → +− kiri-kanan)       ← FR-01, EL05
   │
   ▼
Zona 2: Latihan Dasar     (2 operasi)                                ← DS02
Zona 3: Latihan Sedang    (3 operasi, ada kurung, ×÷ campur)
Zona 4: Latihan Lanjutan  (≥ 4 operasi, bilangan ribuan / uang)
   │
   ▼
Zona 5: Misi Literasi (4 misi dari kisi-kisi)                        ← FR-15
   │
   ▼
Rapor: bintang, skor per indikator literasi, saran latihan ulang
```

Zona terbuka bila zona sebelumnya mendapat ≥ 1 bintang. Semua zona yang terbuka bisa diulang kapan saja.

## 3. Mekanik Latihan (Zona 2–4)

Setiap soal latihan melewati mode berikut (prinsip *worked example → fading*):

| Mode | Yang dilakukan siswa | Tujuan | Kode |
|---|---|---|---|
| **A. Tonton Contoh** | Menekan "Lanjut" untuk melihat tiap langkah dikerjakan; highlight + alasan muncul | Contoh bertahap, tempo diatur siswa | EL04, EL02, DS01 |
| **B. Pilih Langkah Pertama** | Mengetuk operator yang harus dikerjakan lebih dulu | Melatih keputusan urutan (inti miskonsepsi) | IL01–IL03 |
| **C. Lengkapi** | Contoh dengan 1–2 langkah kosong; siswa mengisi hasil | *Fading* | GL01, GL03 |
| **D. Mandiri** | Tiap langkah: ketuk operasi → isi hasil → ekspresi "melipat" | Satu langkah per layar | IL04 |
| **E. Soal Sejenis** | Pola sama, angka baru (dari generator Python) | Transfer | GL05 |
| **F. Cek Ulang** | Setelah selesai, tombol memutar ulang langkah siswa dari awal | Kebiasaan memeriksa | GL02 |

### Petunjuk bertingkat (FR-09)
| Level | Contoh untuk `36 ÷ 6 × 2 − 3` |
|---|---|
| 1 — Arah | "Ada ÷ dan ×. Mana yang lebih dulu dikerjakan?" |
| 2 — Aturan | "× dan ÷ setara, dikerjakan dari **kiri ke kanan**." + highlight `36 ÷ 6` |
| 3 — Setengah jawaban | "Hitung 36 ÷ 6 = ..." (tetap siswa yang mengisi) |

Jawaban akhir **tidak pernah** diberikan otomatis. Setelah 3 kali salah pada langkah yang sama, game menawarkan "Tonton contoh soal mirip" (bukan soal yang sama).

### Bank soal latihan (awal, akan diperbanyak generator)

Soal pemicu wawancara dipakai sebagai soal inti karena terbukti memicu miskonsepsi.

| Level | Soal | Fokus | Langkah benar |
|---|---|---|---|
| Dasar | `12 + 6 × 3` | IL01 | 6×3=18 → 12+18=**30** |
| Dasar | `20 − 12 ÷ 4` | IL01 | 12÷4=3 → 20−3=**17** |
| Dasar | `(7 + 5) × 2` | IL02 | 7+5=12 → 12×2=**24** |
| Dasar | `18 ÷ 3 × 2` | IL03 | 18÷3=6 → 6×2=**12** |
| Sedang | `(24 − 8) ÷ 4 + 5` | IL02 | 16 → 4 → **9** |
| Sedang | `36 ÷ 6 × 2 − 3` | IL03 | 6 → 12 → **9** |
| Sedang | `48 ÷ (2 × 4) + 7` | IL02, IL03 | 8 → 6 → **13** |
| Sedang | `5 + 3 × (10 − 4)` | IL01, IL02 | 6 → 18 → **23** |
| Lanjutan | `100 − 4 × 15 + 30 ÷ 5` | IL04 | 60 → 6 → 40 → **46** |
| Lanjutan | `3 × 35.000 + 10.000` | konteks uang | 105.000 → **115.000** |
| Lanjutan | `150.000 − (2 × 35.000 + 3 × 20.000)` | kurung + uang | 70.000 → 60.000 → 130.000 → **20.000** |

## 4. Zona 5 — Misi Literasi (dari Kisi-kisi)

Setiap misi = cerita singkat (dipecah per kalimat, informasi angka ditebalkan) + **tahap-tahap sesuai rubrik kisi-kisi**. Satu tahap per layar. Tahap yang berbentuk uraian di kertas diubah menjadi bentuk yang bisa dinilai otomatis tanpa mengubah indikatornya.

**Tipe tahap**

| Tipe | Interaksi | Dinilai oleh Python |
|---|---|---|
| `pilih_info` | Mengetuk kalimat/angka yang relevan dari cerita (multi-pilih) | Himpunan pilihan = kunci (toleransi 1 kesalahan → skor separuh) |
| `pilih_tanya` | Pilihan ganda "Apa yang ditanyakan?" | Kunci |
| `susun_model` | Menyusun ubin angka, operator, dan kurung menjadi kalimat matematika | Ekspresi siswa diurai `tokenizer`; dinilai **setara** bila hasil dan struktur sama (urutan suku yang dapat dipertukarkan diterima) |
| `hitung_langkah` | Mode Mandiri seperti latihan, pada ekspresi misi | `solver` + `checker` |
| `isian` | Isi angka hasil | Kunci |
| `keputusan` | Pilihan ganda (mis. Toko A / Toko B, Setuju / Tidak) | Kunci |
| `alasan` | Pilih 1 alasan dari 3–4 pilihan (satu benar, pengecoh berbasis miskonsepsi) | Kunci |

### Misi 1 — "Borong Buku Hadiah" · Mathematical Reasoning · maks. 6
Konteks: 30 buku; Toko A pak isi 10 @ Rp35.000 + ongkir Rp10.000; Toko B satuan @ Rp3.500 + ongkir Rp15.000.

| Tahap | Tipe | Isi | Skor |
|---|---|---|---|
| 1 | `pilih_info` | Ketuk info yang dibutuhkan (harga, isi pak, ongkir kedua toko, 30 buku) + tujuan: bandingkan total biaya | 1 |
| 2 | `hitung_langkah` ×2 | A: `3 × 35.000 + 10.000 = 115.000`; B: `30 × 3.500 + 15.000 = 120.000` (1 poin per toko) | 2 |
| 3 | `isian` | Selisih `120.000 − 115.000 = 5.000` | 1 |
| 4 | `keputusan` | Toko A | 1 |
| 5 | `alasan` | "Harga per buku sama (Rp3.500), yang membedakan hanya ongkir; ongkir A lebih murah Rp5.000." Pengecoh: "Toko A lebih murah karena beli per pak", "Toko B lebih murah karena harga satuannya kecil" | 1 |

Catatan pengembang: tahap 2 Toko A — siswa harus lebih dulu menentukan banyak pak `30 ÷ 10 = 3`; tampilkan sebagai sub-langkah dengan petunjuk level 1 "Berapa pak yang dibutuhkan?".

### Misi 2 — "Bazar Air Mineral" · Formulating Situations Mathematically · maks. 6
Konteks: 5 kardus × 24 botol @ Rp48.000/kardus; jual Rp3.000/botol; 8 botol gratis; sisanya habis.
(Konteks "Kelas V" di kisi-kisi disesuaikan → lihat ANALISIS_KEBUTUHAN §5.)

| Tahap | Tipe | Isi | Skor |
|---|---|---|---|
| 1 | `pilih_info` | 5 kardus, 24 botol, Rp48.000, Rp3.000, 8 botol gratis | 1 |
| 2 | `pilih_tanya` | Besar keuntungan | 1 |
| 3 | `susun_model` | `(5 × 24 − 8) × 3.000 − 5 × 48.000` | 1 |
| 4 | `hitung_langkah` | Botol terjual `5 × 24 − 8 = 112` | 1 |
| 5 | `hitung_langkah` | Pendapatan `112 × 3.000 = 336.000`; Modal `5 × 48.000 = 240.000` | 1 |
| 6 | `isian` | Untung `336.000 − 240.000 = 96.000` | 1 |

Pengecoh tahap 3 (diagnosis `ABAIKAN_KURUNG`): `5 × 24 − 8 × 3.000 − 5 × 48.000`.

### Misi 3 — "Dompet Rina" · Employing Concepts, Facts & Procedures · maks. 6
Konteks: uang Rp150.000; 4 buku @ Rp12.500; 3 pulpen @ Rp4.000; uang saku Rp25.000/hari × 2 hari.

| Tahap | Tipe | Isi | Skor |
|---|---|---|---|
| 1 | `susun_model` | `150.000 − 4 × 12.500 − 3 × 4.000 + 2 × 25.000` | 1 |
| 2 | `hitung_langkah` | Perkalian dulu: 50.000; 12.000; 50.000 (3 sub-langkah; 2 poin bila semua benar, 1 bila 2 benar) | 2 |
| 3 | `hitung_langkah` | Kiri ke kanan: 100.000 → 88.000 → 138.000 (2 poin / 1 poin) | 2 |
| 4 | `isian` | Uang Rina sekarang Rp138.000 | 1 |

### Misi 4 — "Detektif Kembalian" · Interpreting, Applying & Evaluating · maks. 6
Konteks: 2 tiket dewasa @ Rp35.000, 3 tiket anak @ Rp20.000, bayar Rp150.000. Seorang siswa menulis `150.000 − 2 × 35.000 + 3 × 20.000 = 140.000`.

| Tahap | Tipe | Isi | Skor |
|---|---|---|---|
| 1 | `pilih_info` | Info tiket, uang bayar, dan klaim kembalian 140.000 | 1 |
| 2 | Ketuk bagian ekspresi yang keliru | Siswa mengetuk `+ 3 × 20.000`; lalu `alasan`: "harga tiket anak ikut ditambahkan, seharusnya dikurangkan — perlu kurung" | 1 |
| 3 | `susun_model` | `150.000 − (2 × 35.000 + 3 × 20.000)` | 1 |
| 4 | `hitung_langkah` | 70.000 + 60.000 = 130.000 → 150.000 − 130.000 = 20.000 | 1 |
| 5 | `alasan` | Kewajaran: total tiket saja Rp130.000, jadi kembalian tak mungkin hampir sama dengan uang bayar | 1 |
| 6 | `keputusan` + `isian` | Tidak setuju; kembalian Rp20.000 | 1 |

**Total Misi Literasi: 24 poin.** Rapor menampilkan skor per indikator (Reasoning, Formulating, Employing, Interpreting) sehingga peneliti bisa melihat indikator terlemah.

## 5. Penghargaan

| Elemen | Aturan |
|---|---|
| Bintang (0–3) | Per soal/misi, dari persentase skor (lihat ARSITEKTUR §2 scoring) |
| Lencana "Penjaga Kurung" | 5 soal berkurung tanpa diagnosis `ABAIKAN_KURUNG` |
| Lencana "Kiri ke Kanan" | 5 soal ×÷ campur tanpa `KALI_SEBELUM_BAGI` |
| Lencana "Pemeriksa Teliti" | Memakai "Cek Ulang" 5 kali |
| Lencana "Mandiri" | Menyelesaikan misi tanpa petunjuk level 3 |

Lencana dipilih untuk **menguatkan perilaku yang diinginkan** dari wawancara, bukan kecepatan.

## 6. Format Data Soal (`backend/data/*.json`)

```json
{
  "id": "sedang-01",
  "level": "sedang",
  "ekspresi": "(24 − 8) ÷ 4 + 5",
  "fokus": ["IL02"],
  "pola": "(a − b) ÷ c + d",
  "petunjuk": {
    "1": ["Ada tanda kurung. Bagian mana yang dikerjakan dulu?"],
    "2": ["Isi kurung selalu dikerjakan paling awal."]
  }
}
```
Langkah dan kunci **tidak ditulis manual** — dihasilkan `solver.py` saat server berjalan, lalu diuji otomatis.

```json
{
  "id": "misi-4",
  "judul": "Detektif Kembalian",
  "indikator": "interpreting",
  "cerita": ["Sebuah keluarga membeli **2 tiket dewasa** seharga **Rp35.000** per tiket ...", "..."],
  "tahap": [
    { "no": 1, "tipe": "pilih_info", "skor": 1,
      "pertanyaan": "Ketuk informasi yang kamu perlukan.",
      "pilihan": ["2 tiket dewasa Rp35.000", "3 tiket anak Rp20.000", "bayar Rp150.000", "kembalian versi siswa Rp140.000", "keluarga pergi hari Minggu"],
      "kunci": [0, 1, 2, 3] },
    { "no": 3, "tipe": "susun_model", "skor": 1,
      "ubin": ["150.000", "−", "(", "2", "×", "35.000", "+", "3", "×", "20.000", ")"],
      "kunci_ekspresi": "150.000 − (2 × 35.000 + 3 × 20.000)" }
  ]
}
```
