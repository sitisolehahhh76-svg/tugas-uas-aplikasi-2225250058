# Roadmap Pengerjaan

Urutan disusun agar **mesin matematika Python** jadi dan teruji dulu, lalu tampilan JavaScript dibangun di atasnya.

## Fase 0 — Persiapan
- [ ] Konfirmasi catatan ketidakkonsistenan di [ANALISIS_KEBUTUHAN.md §5](ANALISIS_KEBUTUHAN.md)
- [ ] Tetapkan nama aplikasi final
- [x] `requirements.txt`, `.gitignore`, `.env.example`
- [ ] `git init`

## Fase 1 — Mesin Matematika (Python) ✅
- [x] `tokenizer.py` + tes
- [x] `solver.py` (kurung → ×÷ kiri-kanan → +− kiri-kanan) + tes 3 soal pemicu & 4 misi
- [x] `checker.py` dengan 6 kode diagnosis + petunjuk 3 tingkat + tes
- [x] `generator.py` soal sejenis & pemanasan + tes validitas
- [x] `scoring.py` rubrik kisi-kisi + tes

## Fase 2 — Backend API (Python/Flask) ✅
- [x] `app.py`, blueprint `latihan`, `misi`, `siswa`
- [x] `db.py` SQLite (siswa, progres, log)
- [x] Bank soal `soal_latihan.json` (18 soal, 3 level) & `misi_literasi.json` (4 misi), divalidasi otomatis saat start
- [x] Tes API (kunci tidak bocor)

## Fase 3 — Frontend Inti (JavaScript) ✅
- [x] HTML/CSS + token warna & tipografi (Lexend) dari DESIGN.md, mode gelap
- [x] `ui/ekspresi.js` (sorotan, bingkai kurung, ketuk, pemecahan per suku)
- [x] Layar Masuk, Peta Belajar, Kartu Aturan, Pemanasan
- [x] `game/latihan.js`: contoh, pilih langkah pertama, lengkapi, mandiri, soal sejenis, cek ulang
- [x] Petunjuk bertingkat, umpan balik diagnosis, contoh soal mirip setelah 3× salah

## Fase 4 — Misi Literasi ✅
- [x] `game/misi.js` mesin tahap (pilih info, pilih, isian, susun model, tunjuk kesalahan, hitung langkah)
- [x] 4 misi + layar hasil per tahap + Rapor per indikator

## Fase 5 — Penyempurnaan
- [x] PWA (manifest + service worker), antrean log offline
- [x] Lencana (Penjaga Kurung, Kiri ke Kanan, Pemeriksa Teliti, Mandiri)
- [x] Panel peneliti (`#/peneliti`) + ekspor CSV
- [x] `prefers-reduced-motion`, mode gelap, target sentuh ≥ 48 px
- [ ] Pre-test & post-test (FR-18)
- [ ] Ikon PNG 192/512 px untuk instalasi PWA di Android lama
- [ ] Uji di HP Android nyata

## Fase 6 — Uji Coba & Laporan
- [ ] Uji ahli → revisi
- [ ] Uji perorangan & kelompok kecil (lihat [PENGUJIAN.md](PENGUJIAN.md))
- [ ] Deploy (PythonAnywhere/Render)
- [ ] Dokumentasi algoritma untuk laporan mata kuliah Algoritma & Pemrograman (flowchart solver & checker)
