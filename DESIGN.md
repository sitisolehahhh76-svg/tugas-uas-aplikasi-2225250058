# DESIGN.md — Desain UI/UX

Prinsip utama: **setiap elemen di layar harus membantu siswa berpikir tentang urutan operasi; yang tidak membantu, dihapus.**

## 1. Prinsip Beban Kognitif → Keputusan Desain

| Prinsip (Cognitive Load Theory / multimedia) | Penerapan | Kode |
|---|---|---|
| **Segmenting** — pecah materi jadi bagian kecil yang dikendalikan siswa | Satu langkah per layar; tombol "Lanjut" dikendalikan siswa | IL04, EL02 |
| **Signaling** — tandai info penting | Highlight operasi aktif; bingkai warna untuk kurung; nomor urut kecil di atas operator | IL01, IL02, EL01 |
| **Coherence** — buang hiasan | Tanpa ilustrasi latar, tanpa maskot bergerak, maksimal 1 warna aksen per layar | EL03, DS03 |
| **Worked example → fading** | Contoh lengkap → contoh dengan langkah kosong → mandiri | EL04, GL01, DS01 |
| **Spatial contiguity** — hindari perhatian terbelah | Penjelasan aturan muncul tepat di bawah bagian ekspresi yang dirujuk, bukan di halaman lain | EL01, EL05 |
| **Self-pacing** | Tidak ada timer; tombol "Ulangi penjelasan" | EL02 |
| **Feedback elaboratif** | Pesan menyebut langkah & jenis salah, bukan sekadar "Salah" | GL04 |
| **Variability of practice** | Soal sejenis dengan angka baru | GL05 |

## 2. Gaya Visual

### Warna (token CSS)
| Token | Terang | Gelap | Fungsi |
|---|---|---|---|
| `--bg` | `#FAFAF7` | `#16181D` | Latar |
| `--teks` | `#1F2328` | `#E8EAED` | Teks utama |
| `--teks-lemah` | `#5B636E` | `#A0A7B1` | Keterangan |
| `--aktif` | `#FFE58A` (latar) + garis `#B88A00` | `#5A4A10` + `#F2C94C` | Operasi yang sedang dikerjakan |
| `--kurung` | `#DCEBFF` + garis `#2F6FDB` | `#1C2E4A` + `#7FB0FF` | Isi tanda kurung |
| `--benar` | `#1E8E3E` | `#5BD47A` | Umpan balik benar (selalu disertai ikon ✓ + teks) |
| `--salah` | `#C5221F` | `#FF8A80` | Umpan balik salah (selalu disertai ikon + teks, bukan warna saja) |
| `--selesai` | `#E9ECEF` | `#2A2E35` | Langkah yang sudah selesai (diredupkan) |

Aturan: maksimal 3 warna bermakna per layar (aktif, kurung, umpan balik). Warna tidak pernah menjadi satu-satunya penanda (aksesibilitas buta warna).

### Tipografi
- Font: **Atkinson Hyperlegible** atau **Lexend** (Google Fonts), fallback `system-ui`. Angka 1/7 dan 0/O mudah dibedakan.
- Ekspresi matematika: 28–36 px (HP), jarak antar token ≥ 0,4 em, `font-variant-numeric: tabular-nums`.
- Teks penjelasan: 17–18 px, maksimal 2 kalimat per blok.
- Pemisah ribuan selalu ditampilkan: `150.000`.

### Ekspresi panjang (EL01)
- Bila lebar tidak cukup, ekspresi dipecah **pada operator + / − tingkat atas**, bukan sembarang:
  ```
  150.000
    − 4 × 12.500
    − 3 × 4.000
    + 2 × 25.000
  ```
- Setiap "suku" (*term*) diberi latar tipis, sehingga siswa melihat bahwa perkalian di dalam suku dikerjakan dulu.

## 3. Layar Utama

```
┌──────────────────────────────┐
│ ← Kembali     Langkah 2 / 4  │  ← progres langkah, bukan waktu
├──────────────────────────────┤
│                              │
│   ( 24 − 8 ) ÷ 4 + 5         │  ← kurung berbingkai biru
│     └──┬──┘                  │
│   16   ÷ 4 + 5               │
│   ▔▔▔▔▔▔▔▔                   │  ← bagian aktif ber-highlight kuning
│                              │
│   16 ÷ 4 = [   ]             │  ← isian jawaban langkah ini saja
│                              │
├──────────────────────────────┤
│ Langkah selesai:             │
│ ✓ 1. 24 − 8 = 16  (kurung)   │  ← ringkasan (IL04)
├──────────────────────────────┤
│ [💡 Petunjuk 1/3] [↺ Ulangi] │
│ [        Periksa          ]  │  ← tombol utama besar, di zona jempol
└──────────────────────────────┘
```

### Daftar layar
1. **Masuk** — isi kode siswa (mis. S01). Satu kolom, satu tombol.
2. **Peta Belajar** — 4 pulau/zona berurutan: Kartu Aturan → Latihan (Dasar, Sedang, Lanjutan) → Misi Literasi. Zona berikutnya terbuka setelah zona sebelumnya selesai (bintang ≥ 1).
3. **Kartu Aturan** — 3 kartu (kurung; × ÷ setara kiri→kanan; + − setara kiri→kanan), masing-masing: aturan, alasan singkat, satu contoh beranimasi pelan yang maju per ketukan.
4. **Latihan** — mode Contoh → Lengkapi → Mandiri (lihat GAME_DESIGN.md).
5. **Misi Literasi** — cerita konteks + tahap-tahap rubrik.
6. **Hasil** — bintang, skor per tahap, langkah yang perlu diulang, tombol "Coba soal sejenis".
7. **Panel Peneliti** (dilindungi PIN) — rekap & ekspor CSV.

## 4. Komponen

| Komponen | Perilaku |
|---|---|
| `Ekspresi` | Render token sebagai `<span>` dengan `data-idx`; dapat di-highlight, dibingkai kurung, diketuk (mode pilih langkah) |
| `IsianAngka` | Keyboard numerik (`inputmode="numeric"`); otomatis memformat titik ribuan saat mengetik |
| `Petunjuk` | Tombol membuka level 1 → 2 → 3 berurutan; level yang dibuka dicatat |
| `UmpanBalik` | Muncul di bawah isian; nada mendukung ("Hampir! Coba lihat lagi bagian yang ditandai.") |
| `RingkasanLangkah` | Daftar langkah selesai; dapat ditekan untuk melihat ulang (GL02) |
| `KartuAturan` | Teks + contoh; tombol "Ulangi penjelasan" |
| `PilihanTahap` | Untuk tahap misi berbentuk pilihan (info relevan, keputusan, alasan) |
| `SusunModel` | Ubin angka & operator yang disusun menjadi kalimat matematika (Formulating) |

## 5. Interaksi & Gerak

- Animasi hanya untuk: (a) memindahkan highlight ke bagian berikutnya, (b) "melipat" sub-ekspresi menjadi hasilnya. Durasi 250–400 ms, bisa dimatikan; hormati `prefers-reduced-motion`.
- Tidak ada suara default; suara benar/salah opsional dan pelan.
- Target sentuh ≥ 48 × 48 px; tombol utama di sepertiga bawah layar.

## 6. Nada Bahasa

- Sapaan "kamu", kalimat pendek, kata kerja aktif.
- Hindari kata "Salah!" berdiri sendiri. Contoh: "Belum tepat. Di langkah 2, ÷ dan × setara — kerjakan yang paling **kiri** dulu."
- Alasan aturan, contoh EL05: "Perkalian adalah penjumlahan berulang yang 'dikemas'. 6 × 3 berarti satu paket bernilai 18, jadi paket itu dibuka dulu sebelum ditambah 12."
