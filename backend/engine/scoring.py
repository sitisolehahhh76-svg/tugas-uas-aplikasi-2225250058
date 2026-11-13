"""Penskoran rubrik misi literasi (kisi-kisi) dan bintang."""
from __future__ import annotations

import math

from .tokenizer import EkspresiTidakValid, tokenisasi
from .solver import nilai_akhir


def bulat_bawah_setengah(x: float) -> float:
    return math.floor(x * 2 + 1e-9) / 2


def skor_pilihan(jawaban, kunci, skor: float) -> float:
    return skor if jawaban == kunci else 0.0


def skor_pilih_info(jawaban: list[int], kunci: list[int], skor: float) -> float:
    """Tepat = penuh; selisih satu pilihan = separuh; selain itu 0."""
    beda = set(jawaban) ^ set(kunci)
    if not beda:
        return skor
    if len(beda) == 1:
        return skor / 2
    return 0.0


def angka_dalam(ekspresi: str) -> list[int]:
    return sorted(int(t.nilai) for t in tokenisasi(ekspresi) if t.jenis == "angka")


def cek_model(jawaban: str, kunci: str) -> tuple[bool, str | None]:
    """Model setara bila sah, memakai angka yang sama, dan nilainya sama.
    Mengembalikan (benar, diagnosis)."""
    try:
        token = tokenisasi(jawaban)
    except EkspresiTidakValid:
        return False, "MODEL_TIDAK_SAH"
    angka_siswa = sorted(int(t.nilai) for t in token if t.jenis == "angka")
    if angka_siswa != angka_dalam(kunci):
        return False, "ANGKA_TIDAK_SESUAI"
    try:
        nilai = nilai_akhir(token)
    except EkspresiTidakValid:
        return False, "NILAI_TIDAK_SESUAI"
    if nilai != nilai_akhir(kunci):
        ada_kurung = any(t.jenis == "(" for t in token)
        return False, "PERLU_KURUNG" if not ada_kurung and "(" in kunci else "NILAI_TIDAK_SESUAI"
    return True, None


def skor_hitung(benar_pertama: int, total: int, skor: float) -> float:
    """Skor bagian hitung_langkah dari proporsi langkah yang benar pada percobaan pertama."""
    if total <= 0:
        return 0.0
    benar_pertama = max(0, min(benar_pertama, total))
    return bulat_bawah_setengah(skor * benar_pertama / total)


def terapkan_petunjuk(skor: float, level_petunjuk_maks: int) -> float:
    """Membuka petunjuk level 3 → skor bagian dikali 0,5."""
    if level_petunjuk_maks >= 3:
        return bulat_bawah_setengah(skor * 0.5)
    return skor


def bintang(skor: float, skor_maks: float) -> int:
    if skor_maks <= 0:
        return 0
    p = skor / skor_maks
    if p >= 0.9:
        return 3
    if p >= 0.6:
        return 2
    return 1 if skor > 0 else 0


def bintang_latihan(kesalahan: int, petunjuk_maks: int) -> int:
    """Bintang soal latihan: dihitung dari banyak kesalahan, bukan kecepatan."""
    if kesalahan == 0 and petunjuk_maks < 3:
        return 3
    if kesalahan <= 2:
        return 2
    return 1
