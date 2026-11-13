"""Mesin langkah urutan operasi.

Aturan: kurung (terdalam) -> × dan ÷ setara, kiri ke kanan -> + dan − setara, kiri ke kanan.
Semua hasil antara wajib bilangan bulat tidak negatif.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from fractions import Fraction

from .tokenizer import (
    OP_KALI_BAGI,
    EkspresiTidakValid,
    Token,
    format_angka,
    ke_teks,
    tokenisasi,
)

ALASAN_KURUNG = "kurung"
ALASAN_KALI_BAGI = "kali-bagi"
ALASAN_TAMBAH_KURANG = "tambah-kurang"

PENJELASAN = {
    ALASAN_KURUNG: "Isi tanda kurung selalu dikerjakan paling dulu.",
    ALASAN_KALI_BAGI: "× dan ÷ didahulukan dari + dan −. × dan ÷ setara, jadi kerjakan yang paling kiri.",
    ALASAN_TAMBAH_KURANG: "Tinggal + dan −. Keduanya setara, kerjakan dari kiri ke kanan.",
}


@dataclass
class Langkah:
    no: int
    sebelum: list[Token]
    op_idx: int
    hasil: int
    sesudah: list[Token]
    alasan: str
    dalam_kurung: bool = False
    rentang: tuple[int, int] = field(init=False)

    def __post_init__(self) -> None:
        self.rentang = (self.op_idx - 1, self.op_idx + 1)

    @property
    def operasi(self) -> str:
        a, op, b = self.sebelum[self.op_idx - 1 : self.op_idx + 2]
        return f"{a.tampil()} {op.tampil()} {b.tampil()}"

    @property
    def penjelasan(self) -> str:
        teks = PENJELASAN[self.alasan]
        if self.dalam_kurung and self.alasan != ALASAN_KURUNG:
            teks = "Kita sedang di dalam kurung. " + teks
        return teks

    def ke_json(self) -> dict:
        return {
            "no": self.no,
            "sebelum": [t.ke_json() for t in self.sebelum],
            "sebelum_teks": ke_teks(self.sebelum),
            "op_idx": self.op_idx,
            "rentang": list(self.rentang),
            "operasi": self.operasi,
            "hasil": self.hasil,
            "hasil_teks": format_angka(self.hasil),
            "sesudah": [t.ke_json() for t in self.sesudah],
            "sesudah_teks": ke_teks(self.sesudah),
            "alasan": self.alasan,
            "penjelasan": self.penjelasan,
        }


# ---------- struktur kurung ----------

def grup_terdalam(token: list[Token]) -> list[tuple[int, int]]:
    """Daftar pasangan (buka, tutup) yang di dalamnya tidak ada kurung lagi."""
    hasil = []
    buka_terakhir = None
    for i, t in enumerate(token):
        if t.jenis == "(":
            buka_terakhir = i
        elif t.jenis == ")":
            if buka_terakhir is not None:
                hasil.append((buka_terakhir, i))
            buka_terakhir = None
    return hasil


def wilayah_kerja(token: list[Token]) -> list[tuple[int, int, bool]]:
    """Wilayah tempat operasi boleh dikerjakan sekarang: (awal, akhir_inklusif, dalam_kurung)."""
    grup = grup_terdalam(token)
    if grup:
        return [(b + 1, t - 1, True) for b, t in grup]
    return [(0, len(token) - 1, False)]


def op_sah(token: list[Token]) -> list[int]:
    """Semua indeks operator yang sah dikerjakan sekarang (bisa lebih dari satu,
    misalnya dua perkalian di suku berbeda: 2 × 3 + 4 × 5)."""
    sah: list[int] = []
    for awal, akhir, _ in wilayah_kerja(token):
        ops = [i for i in range(awal, akhir + 1) if token[i].jenis == "op"]
        kali_bagi = [i for i in ops if token[i].nilai in OP_KALI_BAGI]
        if kali_bagi:
            for i in kali_bagi:
                kiri = i - 2
                if kiri < awal or token[kiri].nilai not in OP_KALI_BAGI:
                    sah.append(i)
        elif ops:
            sah.append(ops[0])
    return sah


def op_kanonik(token: list[Token]) -> int:
    """Operator yang dikerjakan pada jalur baku (paling kiri di antara yang sah)."""
    awal, akhir, _ = wilayah_kerja(token)[0]
    ops = [i for i in range(awal, akhir + 1) if token[i].jenis == "op"]
    kali_bagi = [i for i in ops if token[i].nilai in OP_KALI_BAGI]
    return (kali_bagi or ops)[0]


def alasan_untuk(token: list[Token], op_idx: int) -> tuple[str, bool]:
    for awal, akhir, dalam in wilayah_kerja(token):
        if awal <= op_idx <= akhir:
            if dalam:
                return (ALASAN_KURUNG, True)
            if token[op_idx].nilai in OP_KALI_BAGI:
                return (ALASAN_KALI_BAGI, False)
            return (ALASAN_TAMBAH_KURANG, False)
    raise ValueError("Operator di luar wilayah kerja.")


# ---------- hitung ----------

def hitung_op(a: int, op: str, b: int) -> int:
    if op == "+":
        h = Fraction(a) + b
    elif op == "-":
        h = Fraction(a) - b
    elif op == "*":
        h = Fraction(a) * b
    else:
        if b == 0:
            raise EkspresiTidakValid("Pembagian dengan nol.")
        h = Fraction(a, b)
    if h.denominator != 1:
        raise EkspresiTidakValid(f"{format_angka(a)} ÷ {format_angka(b)} tidak menghasilkan bilangan bulat.")
    if h < 0:
        raise EkspresiTidakValid("Ada hasil antara yang negatif.")
    return int(h)


def terapkan(token: list[Token], op_idx: int) -> tuple[list[Token], int]:
    """Kerjakan operator di op_idx, lalu buang kurung yang hanya berisi satu angka."""
    a, op, b = token[op_idx - 1], token[op_idx], token[op_idx + 1]
    if a.jenis != "angka" or op.jenis != "op" or b.jenis != "angka":
        raise EkspresiTidakValid("Operasi tidak bisa dikerjakan di posisi ini.")
    hasil = hitung_op(int(a.nilai), str(op.nilai), int(b.nilai))
    baru = token[: op_idx - 1] + [Token("angka", hasil)] + token[op_idx + 2 :]
    i = op_idx - 1
    while 0 < i < len(baru) - 1 and baru[i - 1].jenis == "(" and baru[i + 1].jenis == ")":
        baru = baru[: i - 1] + [baru[i]] + baru[i + 2 :]
        i -= 1
    return baru, hasil


def langkah_langkah(ekspresi: str | list[Token]) -> list[Langkah]:
    """Jalur penyelesaian baku, satu operasi per langkah."""
    token = tokenisasi(ekspresi) if isinstance(ekspresi, str) else list(ekspresi)
    hasil: list[Langkah] = []
    while len(token) > 1:
        idx = op_kanonik(token)
        alasan, dalam = alasan_untuk(token, idx)
        sesudah, nilai = terapkan(token, idx)
        hasil.append(Langkah(len(hasil) + 1, token, idx, nilai, sesudah, alasan, dalam))
        token = sesudah
    return hasil


def nilai_akhir(ekspresi: str | list[Token]) -> int:
    token = tokenisasi(ekspresi) if isinstance(ekspresi, str) else list(ekspresi)
    if len(token) == 1:
        return int(token[0].nilai)
    return langkah_langkah(token)[-1].hasil
