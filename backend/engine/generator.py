"""Membuat soal sejenis: pola operasi sama, angka baru (GL05).

Caranya: ambil struktur token ekspresi asli, ganti setiap angka dengan angka acak
yang besarnya mirip, lalu terima hanya bila semua langkah bulat dan tidak negatif.
"""
from __future__ import annotations

import random

from .solver import langkah_langkah
from .tokenizer import EkspresiTidakValid, Token, ke_teks, tokenisasi


def _kelipatan(n: int) -> int:
    """Kelipatan 'bulat' angka asli: 35.000 -> 1000, 12.500 -> 500, 24 -> 1."""
    for k in (1000, 500, 100, 50, 10):
        if n >= k * 2 and n % k == 0:
            return k
    return 1


def _acak_mirip(n: int, rng: random.Random) -> int:
    k = _kelipatan(n)
    satuan = max(1, n // k)
    bawah = max(1, satuan // 2)
    atas = max(bawah + 2, satuan * 2)
    if satuan <= 12:  # angka kecil (faktor perkalian/pembagian): tetap 2..12
        bawah, atas = 2, max(9, satuan + 3)
    return rng.randint(bawah, atas) * k


def soal_sejenis(ekspresi: str, seed: int | None = None, percobaan: int = 5000) -> str:
    asli = tokenisasi(ekspresi)
    rng = random.Random(seed)
    for _ in range(percobaan):
        baru = [Token("angka", _acak_mirip(int(t.nilai), rng)) if t.jenis == "angka" else t for t in asli]
        if baru == asli:
            continue
        try:
            langkah = langkah_langkah(baru)
        except EkspresiTidakValid:
            continue
        batas = max(1000, max(int(t.nilai) for t in asli if t.jenis == "angka") * 20)
        if all(0 <= l.hasil <= batas for l in langkah):
            return ke_teks(baru)
    raise EkspresiTidakValid("Tidak berhasil membuat soal sejenis.")


def fakta_kali_bagi(jumlah: int = 8, seed: int | None = None) -> list[str]:
    """Soal pemanasan fakta dasar × dan ÷ (IL05)."""
    rng = random.Random(seed)
    hasil = []
    for i in range(jumlah):
        a, b = rng.randint(2, 9), rng.randint(2, 9)
        hasil.append(f"{a} × {b}" if i % 2 == 0 else f"{a * b} ÷ {a}")
    return hasil
