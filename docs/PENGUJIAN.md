# Rencana Pengujian

## 1. Uji Teknis (otomatis)

### Python — pytest (49 tes, semua lulus)
| Berkas | Yang diuji |
|---|---|
| `backend/tests/test_engine.py` | Tokenizer (simbol `× x * ÷ : / − -`, titik ribuan, input rusak ditolak) |
| | Tiga soal pemicu wawancara menghasilkan langkah persis seperti laporan: `12 + 6 × 3 → 18 → 30`; `(24 − 8) ÷ 4 + 5 → 16 → 4 → 9`; `36 ÷ 6 × 2 − 3 → 6 → 12 → 9` |
| | Keempat misi kisi-kisi menghasilkan 115.000 / 120.000, 96.000, 138.000, 20.000; urutan langkah Misi 3 sama dengan kisi-kisi |
| | Setiap kode diagnosis (`TAMBAH_SEBELUM_KALI`, `ABAIKAN_KURUNG`, `KALI_SEBELUM_BAGI`, `TIDAK_DARI_KIRI`, `SALAH_FAKTA`, `LEWAT_LANGKAH`) terpicu oleh kesalahan nyata siswa S01 |
| | Generator soal sejenis: 50 soal acak per pola, semua bulat & ≥ 0, pola operasi sama |
| | Penskoran: pilih info, model setara (`PERLU_KURUNG`), skor hitung proporsional, potongan petunjuk, bintang |
| `backend/tests/test_api.py` | Bank soal sehat; endpoint tidak membocorkan kunci/pembahasan/petunjuk; alur cek langkah; skor misi; progres terbaik; PIN peneliti; ekspor CSV |

### Uji browser end-to-end (sudah dijalankan saat pengembangan)
Edge headless + puppeteer-core, layar 360 px & 1280 px, mode terang & gelap: masuk → kartu aturan → latihan dasar (contoh, pilih langkah, lengkapi, mandiri, cek ulang, soal sejenis) → Misi 4 lengkap → rapor. Hasil: tanpa error JavaScript, tanpa scroll horizontal di 360 px, log & diagnosis tercatat di panel peneliti.

Contoh tes:
```python
def test_soal_pemicu_kali_bagi_kiri_ke_kanan():
    langkah = langkah_langkah(tokenisasi("36 ÷ 6 × 2 − 3"))
    assert [l.operasi for l in langkah] == ["36 ÷ 6", "6 × 2", "12 − 3"]
    assert langkah[-1].hasil == 9
```

### JavaScript
- Uji unit ringan untuk `ui/angka.js` (format ribuan) dengan Vitest atau halaman `frontend/tests.html`.
- Uji manual lintas perangkat: Chrome Android (HP 360 px), Safari iOS bila ada, Chrome/Edge laptop.
- Lighthouse: Performance ≥ 85, Accessibility ≥ 90.

## 2. Uji Pedagogis (uji coba ke siswa)

Mengacu kolom **"Cara menguji fitur"** pada matriks laporan wawancara.

| Fitur | Cara menguji (dari laporan) | Data yang dicatat aplikasi | Indikator berhasil (usulan) |
|---|---|---|---|
| Aturan + penanda langkah (FR-01/02/04) | Minta siswa menentukan langkah pertama pada beberapa soal | Log `pilih_langkah`, benar/salah, diagnosis | ≥ 80 % pilihan pertama benar di akhir Zona 3 |
| Penanda kurung (FR-03) | Amati apakah siswa selalu menyelesaikan isi kurung dulu | Frekuensi `ABAIKAN_KURUNG` per soal | Menurun dari soal awal ke soal akhir |
| Satu langkah per layar (FR-05) | Periksa apakah siswa menyelesaikan soal tanpa melewatkan langkah | Frekuensi `LEWAT_LANGKAH` | ≈ 0 pada Lanjutan |
| Ekspresi berjarak (FR-06) | Tanyakan apakah soal lebih mudah dibaca | Angket skala 1–5 | Rerata ≥ 4 |
| Tombol ulang & tampilan sederhana (FR-07) | Amati penggunaan tombol ulang & tanyakan kejelasan | Log `ulangi` | Dipakai saat dibutuhkan; angket kejelasan ≥ 4 |
| Contoh & petunjuk bertingkat (FR-08/09) | Bandingkan kemampuan sebelum & sesudah memakai petunjuk | Pre-test vs post-test; level petunjuk per tahap | Skor post > pre; ketergantungan petunjuk level 3 menurun |
| Latihan berjenjang (FR-11) | Amati perkembangan hasil tiap tingkat | Bintang & skor per level | Pola naik/stabil antar level |
| Umpan balik per langkah (FR-10/13) | Lihat apakah siswa bisa memperbaiki tanpa diberi jawaban | Benar pada percobaan ke-2/3 setelah diagnosis | ≥ 70 % kesalahan diperbaiki sendiri |
| Misi literasi (FR-15) | Skor rubrik kisi-kisi | Skor per tahap & per indikator | Rerata ≥ 4/6 per misi |

### Angket beban kognitif singkat (opsional)
Setelah tiap zona, 1 pertanyaan skala 1–9 (adaptasi skala Paas): "Seberapa berat usahamu mengerjakan bagian tadi?" — untuk melihat apakah beban yang dirasakan turun sementara skor naik.

### Prosedur uji coba
1. Uji ahli (dosen/guru matematika & ahli media) → revisi.
2. Uji perorangan (1–3 siswa, termasuk S01) → amati, wawancara singkat.
3. Uji kelompok kecil (6–10 siswa) → pre-test, pakai aplikasi 2 × 40 menit, post-test, angket.
4. Ekspor CSV dari panel peneliti untuk analisis.
