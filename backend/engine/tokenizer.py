"""Mengubah teks ekspresi menjadi daftar token.

Contoh: "150.000 − 4 × 12.500" -> [150000, '-', 4, '*', 12500]
Titik dianggap pemisah ribuan gaya Indonesia (tidak ada desimal pada versi 1).
"""
from __future__ import annotations

import re
from dataclasses import dataclass

OP_KALI_BAGI = ("*", "/")
OP_TAMBAH_KURANG = ("+", "-")
SEMUA_OP = OP_KALI_BAGI + OP_TAMBAH_KURANG

_NORMAL = {
    "×": "*", "x": "*", "X": "*", "*": "*", "·": "*",
    "÷": "/", ":": "/", "/": "/",
    "−": "-", "-": "-", "–": "-",
    "+": "+", "(": "(", ")": ")",
}
TAMPIL_OP = {"*": "×", "/": "÷", "-": "−", "+": "+"}

_POLA_ANGKA = re.compile(r"\d{1,3}(?:\.\d{3})+(?!\d)|\d+")


class EkspresiTidakValid(ValueError):
    """Ekspresi tidak bisa dibaca atau tidak sesuai aturan aplikasi."""


@dataclass(frozen=True)
class Token:
    jenis: str  # 'angka' | 'op' | '(' | ')'
    nilai: int | str

    def tampil(self) -> str:
        if self.jenis == "angka":
            return format_angka(int(self.nilai))
        if self.jenis == "op":
            return TAMPIL_OP[str(self.nilai)]
        return self.jenis

    def ke_json(self) -> dict:
        return {"jenis": self.jenis, "teks": self.tampil()}


def format_angka(n: int) -> str:
    """12500 -> '12.500'."""
    tanda = "-" if n < 0 else ""
    return tanda + f"{abs(n):,}".replace(",", ".")


def tokenisasi(teks: str) -> list[Token]:
    """Baca teks menjadi token dan pastikan susunannya sah."""
    if not isinstance(teks, str) or not teks.strip():
        raise EkspresiTidakValid("Ekspresi kosong.")
    token: list[Token] = []
    i = 0
    while i < len(teks):
        c = teks[i]
        if c.isspace():
            i += 1
            continue
        if c.isdigit():
            m = _POLA_ANGKA.match(teks, i)
            assert m
            mentah = m.group(0)
            i = m.end()
            if i < len(teks) and (teks[i] == "." or teks[i] == ","):
                raise EkspresiTidakValid(f"Angka '{mentah}{teks[i]}…' tidak dikenali.")
            token.append(Token("angka", int(mentah.replace(".", ""))))
            continue
        if c in _NORMAL:
            n = _NORMAL[c]
            token.append(Token(n, n) if n in "()" else Token("op", n))
            i += 1
            continue
        raise EkspresiTidakValid(f"Simbol '{c}' tidak dikenali.")
    periksa_susunan(token)
    return token


def periksa_susunan(token: list[Token]) -> None:
    """Pastikan pola angka-operator-angka dan kurung berpasangan."""
    kedalaman = 0
    harap_angka = True  # di awal / setelah op / setelah '(' harus angka atau '('
    for t in token:
        if harap_angka:
            if t.jenis == "angka":
                harap_angka = False
            elif t.jenis == "(":
                kedalaman += 1
            else:
                raise EkspresiTidakValid("Ada operasi yang tidak punya angka di kirinya.")
        else:
            if t.jenis == "op":
                harap_angka = True
            elif t.jenis == ")":
                kedalaman -= 1
                if kedalaman < 0:
                    raise EkspresiTidakValid("Tanda kurung tutup tidak berpasangan.")
            else:
                raise EkspresiTidakValid("Dua angka atau kurung berdampingan tanpa operasi.")
    if harap_angka:
        raise EkspresiTidakValid("Ekspresi berakhir dengan operasi.")
    if kedalaman != 0:
        raise EkspresiTidakValid("Tanda kurung buka tidak berpasangan.")


def ke_teks(token: list[Token]) -> str:
    """Token -> teks tampilan berjarak: '( 24 − 8 ) ÷ 4'."""
    bagian: list[str] = []
    for t in token:
        if t.jenis == "(":
            bagian.append("(")
        elif t.jenis == ")":
            bagian.append(")")
        else:
            bagian.append(t.tampil())
    teks = " ".join(bagian)
    return teks.replace("( ", "(").replace(" )", ")")
