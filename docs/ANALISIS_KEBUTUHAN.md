# Analisis Kebutuhan

Turunan dari *Laporan Hasil Wawancara Analisis Kebutuhan* (pewawancara: Siti Solehah; responden: S01, kelas VIII SMP; 6 November 2026; ±40 menit, dengan persetujuan).

## 1. Ringkasan Temuan

### Pengalaman belajar (K)
- Pembelajaran berpola: guru menjelaskan → siswa menyalin contoh → latihan di buku (K01, K02).
- Siswa belum konsisten menentukan operasi yang didahulukan (K03).

### Intrinsic load (IL) — kesulitan pada materi itu sendiri
| Kode | Temuan | Bukti dari tugas pemicu |
|---|---|---|
| IL01 | Lupa × didahulukan dari + | Soal 1 `12 + 6 × 3`: ingin menghitung `12 + 6` dulu karena membaca dari kiri |
| IL02 | Melewatkan tanda kurung | Soal 2 `(24 − 8) ÷ 4 + 5`: ingin membagi `8 ÷ 4` dulu |
| IL03 | Bingung × dan ÷ bersama | Soal 3 `36 ÷ 6 × 2 − 3`: mengira × selalu sebelum ÷ |
| IL04 | Kehilangan urutan bila ≥ 3 operasi | — |
| IL05 | Salah fakta dasar × / ÷ | — |

### Extraneous load (EL) — beban dari cara penyajian
| Kode | Temuan |
|---|---|
| EL01 | Soal satu baris yang panjang sulit dilihat bagian mana yang dihitung dulu |
| EL02 | Penjelasan terlalu cepat |
| EL03 | Warna/gambar tak penting mengalihkan perhatian |
| EL04 | Lebih paham bila contoh ditulis langkah demi langkah |
| EL05 | Tidak tahu *alasan* aturan, hanya meniru |

### Germane load (GL) — yang membantu membangun skema
| Kode | Temuan |
|---|---|
| GL01 | Contoh angka dekat/konkret dan dihitung bersama |
| GL02 | Sudah terbiasa cek ulang dari langkah pertama |
| GL03 | Petunjuk sedikit demi sedikit membuat bisa lanjut sendiri |
| GL04 | Butuh diberi tahu salah di bagian mana |
| GL05 | Bisa mengerjakan soal sejenis dengan angka berbeda |

### Usulan siswa (DS)
DS01 contoh langkah satu-satu, jangan langsung jawaban · DS02 latihan mudah → sulit · DS03 tampilan tidak ramai, angka jelas.

## 2. Kebutuhan Fungsional (FR)

| ID | Kebutuhan | Kode asal | Prioritas |
|---|---|---|---|
| FR-01 | Kartu aturan urutan operasi + contoh sederhana + alasan singkat ("kenapa") | IL01, IL03, EL05 | Wajib |
| FR-02 | Penanda (highlight) bagian ekspresi yang dikerjakan lebih dulu | IL01, EL01 | Wajib |
| FR-03 | Warna/bingkai khusus untuk isi tanda kurung | IL02 | Wajib |
| FR-04 | Mode "Pilih Langkah Pertama": siswa mengetuk operasi yang harus dikerjakan dulu | IL01–IL03, matriks uji | Wajib |
| FR-05 | Pengerjaan **satu langkah per layar** + panel ringkasan langkah yang sudah selesai | IL04, EL04 | Wajib |
| FR-06 | Ekspresi ditampilkan berjarak, besar, bisa dipecah ke beberapa baris | EL01, DS03 | Wajib |
| FR-07 | Tombol "Ulangi penjelasan" dan penjelasan yang maju hanya saat siswa menekan "Lanjut" | EL02 | Wajib |
| FR-08 | Contoh bertahap (*worked example*) → contoh berlubang (*faded*) → mandiri | EL04, GL01, DS01 | Wajib |
| FR-09 | Petunjuk bertingkat 3 level (arah → aturan → setengah jawaban), tidak pernah langsung jawaban penuh | GL03, DS01 | Wajib |
| FR-10 | Umpan balik per langkah yang menyebut langkah keliru + diagnosis jenis kesalahan + kesempatan memperbaiki | GL04 | Wajib |
| FR-11 | Latihan berjenjang Dasar / Sedang / Lanjutan, terkunci bertahap | DS02 | Wajib |
| FR-12 | Generator soal sejenis (pola sama, angka baru) | GL05 | Wajib |
| FR-13 | Tombol "Cek ulang dari awal" yang memutar ulang langkah siswa | GL02 | Sedang |
| FR-14 | Mini-latihan fakta × dan ÷ (pemanasan singkat) | IL05 | Sedang |
| FR-15 | Misi Literasi: 4 soal kisi-kisi dipecah per tahap rubrik, skor maks. 6 per soal | Kisi-kisi | Wajib |
| FR-16 | Log belajar: langkah, jawaban, jumlah petunjuk dibuka, jumlah "ulangi penjelasan", waktu (hanya dicatat, tidak ditampilkan sebagai tekanan) | Matriks uji | Wajib |
| FR-17 | Halaman peneliti/guru: rekap per kode siswa + ekspor CSV | Matriks uji | Sedang |
| FR-18 | Pre-test & post-test singkat (opsional) untuk membandingkan sebelum/sesudah | Matriks uji (EL04/GL03) | Sedang |

## 3. Kebutuhan Non-Fungsional (NFR)

| ID | Kebutuhan |
|---|---|
| NFR-01 | Responsif: nyaman di lebar 360 px sampai 1440 px; operasi utama dengan satu jempol |
| NFR-02 | Ringan: halaman awal < 300 KB, tanpa framework JS berat; dapat dipakai di HP Android kelas bawah |
| NFR-03 | Keterbacaan: angka ekspresi ≥ 24 px, kontras WCAG AA, font sans-serif berangka jelas |
| NFR-04 | Tidak ada batas waktu di mode belajar |
| NFR-05 | Privasi: hanya kode siswa, tidak ada data pribadi |
| NFR-06 | Bahasa Indonesia sederhana untuk siswa SMP |
| NFR-07 | Dapat dibuka ulang tanpa internet setelah kunjungan pertama (PWA cache) — progres disinkron saat online |

## 4. Keterlacakan Matriks Wawancara → Fitur

| Baris matriks (laporan) | FR |
|---|---|
| Bingung operasi pertama (IL01, IL03) | FR-01, FR-02, FR-04 |
| Melewatkan kurung (IL02) | FR-03 |
| Kehilangan urutan (IL04) | FR-05 |
| Soal satu baris sulit dibaca (EL01) | FR-06 |
| Penjelasan cepat & tampilan ramai (EL02, EL03) | FR-07, DESIGN.md |
| Contoh bertahap (EL04, GL03) | FR-08, FR-09 |
| Latihan mudah → sulit (DS02) | FR-11, FR-12 |
| Cek ulang & koreksi (GL02, GL04) | FR-10, FR-13 |

## 5. Catatan Ketidakkonsistenan Dokumen Sumber (perlu dikonfirmasi)

1. **Kelas saat belajar materi** — kolom informasi menulis "dipelajari di kelas VIII semester 1", sedangkan kutipan K01: "Pernah belajar waktu kelas 7". Perlu diseragamkan di laporan.
2. **Soal kisi-kisi no. 2** menyebut "Kelas V akan berjualan..." padahal sasaran kelas VIII. Di aplikasi konteks diganti menjadi "Kelas VIII" (atau tetap "Kelas V" jika memang sengaja sebagai nama kelas lain).
3. Kolom matriks bertuliskan "Keputusan fitur **Android**", sedangkan produk berupa **aplikasi web** yang dapat dibuka di browser Android. Disarankan diubah menjadi "Keputusan fitur aplikasi".
4. Responden baru **satu siswa**; kebutuhan bersifat sementara dan sebaiknya divalidasi dengan siswa lain/guru pada uji coba.
