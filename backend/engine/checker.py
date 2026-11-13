"""Memeriksa satu langkah siswa dan mendiagnosis jenis kesalahannya.

Kode diagnosis dipetakan ke temuan wawancara:
  TAMBAH_SEBELUM_KALI (IL01), ABAIKAN_KURUNG (IL02), KALI_SEBELUM_BAGI (IL03),
  TIDAK_DARI_KIRI (IL03), LEWAT_LANGKAH (IL04), SALAH_FAKTA (IL05).
"""
from __future__ import annotations

from dataclasses import dataclass, field

from .solver import (
    ALASAN_KALI_BAGI,
    ALASAN_KURUNG,
    alasan_untuk,
    langkah_langkah,
    op_kanonik,
    op_sah,
    terapkan,
    wilayah_kerja,
)
from .tokenizer import OP_KALI_BAGI, EkspresiTidakValid, Token, format_angka, ke_teks

PESAN = {
    "TAMBAH_SEBELUM_KALI": "Masih ada × atau ÷. Kerjakan itu dulu sebelum + dan −.",
    "ABAIKAN_KURUNG": "Lihat bingkai biru — isi tanda kurung dikerjakan paling dulu.",
    "KALI_SEBELUM_BAGI": "× dan ÷ itu setara. Bukan × dulu — kerjakan yang paling kiri.",
    "TIDAK_DARI_KIRI": "Operasinya setara, jadi mulai dari yang paling kiri.",
    "LEWAT_LANGKAH": "Wah, kamu melompat langkah. Tulis hasil langkah ini saja dulu.",
    "SALAH_FAKTA": "Urutannya sudah benar! Coba hitung lagi hasil {operasi}.",
    "BUKAN_ANGKA": "Tulis jawaban berupa angka, ya.",
}


@dataclass
class HasilCek:
    benar: bool
    diagnosis: str | None = None
    pesan: str = ""
    rentang: list[int] | None = None
    operasi: str | None = None
    sesudah: list[dict] | None = None
    sesudah_teks: str | None = None
    selesai: bool = False
    alasan: str | None = None
    ekstra: dict = field(default_factory=dict)

    def ke_json(self) -> dict:
        d = {k: v for k, v in self.__dict__.items() if k != "ekstra" and v is not None}
        d.update(self.ekstra)
        return d


def diagnosis_pilihan(token: list[Token], op_idx: int) -> str | None:
    """None bila op_idx sah dikerjakan sekarang; selain itu kode diagnosis."""
    if op_idx in op_sah(token):
        return None
    wilayah = wilayah_kerja(token)
    di_wilayah = [w for w in wilayah if w[0] <= op_idx <= w[1]]
    if not di_wilayah:
        return "ABAIKAN_KURUNG"
    awal, akhir, _ = di_wilayah[0]
    op = token[op_idx].nilai
    if op not in OP_KALI_BAGI:
        ada_kali_bagi = any(
            token[i].jenis == "op" and token[i].nilai in OP_KALI_BAGI for i in range(awal, akhir + 1)
        )
        return "TAMBAH_SEBELUM_KALI" if ada_kali_bagi else "TIDAK_DARI_KIRI"
    # op × atau ÷ yang bukan paling kiri pada rantai ×÷
    i = op_idx - 2
    while i >= awal and token[i].jenis == "op" and token[i].nilai in OP_KALI_BAGI:
        if op == "*" and token[i].nilai == "/":
            return "KALI_SEBELUM_BAGI"
        i -= 2
    return "TIDAK_DARI_KIRI"


def _baca_jawaban(jawaban) -> int | None:
    if isinstance(jawaban, bool):
        return None
    if isinstance(jawaban, int):
        return jawaban
    if isinstance(jawaban, str):
        bersih = jawaban.strip().replace(".", "").replace(" ", "")
        if bersih.isdigit():
            return int(bersih)
    return None


def cek_langkah(token: list[Token], op_idx: int, jawaban=None) -> HasilCek:
    """Periksa pilihan operasi (dan jawaban bila ada) pada keadaan ekspresi `token`."""
    if len(token) < 3:
        raise EkspresiTidakValid("Ekspresi sudah selesai.")
    if not (0 <= op_idx < len(token)) or token[op_idx].jenis != "op":
        raise EkspresiTidakValid("Yang dipilih bukan tanda operasi.")

    kode = diagnosis_pilihan(token, op_idx)
    if kode:
        return HasilCek(False, kode, PESAN[kode])

    a, op, b = token[op_idx - 1 : op_idx + 2]
    operasi = f"{a.tampil()} {op.tampil()} {b.tampil()}"
    alasan, _ = alasan_untuk(token, op_idx)
    dasar = HasilCek(True, rentang=[op_idx - 1, op_idx + 1], operasi=operasi, alasan=alasan)
    if jawaban is None or jawaban == "":
        dasar.pesan = "Tepat! Sekarang hitung bagian yang ditandai."
        return dasar

    nilai = _baca_jawaban(jawaban)
    sesudah, hasil = terapkan(token, op_idx)
    if nilai is None:
        return HasilCek(False, "BUKAN_ANGKA", PESAN["BUKAN_ANGKA"], rentang=dasar.rentang, operasi=operasi)
    if nilai != hasil:
        lanjut = langkah_langkah(sesudah) if len(sesudah) > 1 else []
        kode = "LEWAT_LANGKAH" if any(l.hasil == nilai for l in lanjut) else "SALAH_FAKTA"
        return HasilCek(False, kode, PESAN[kode].format(operasi=operasi), rentang=dasar.rentang, operasi=operasi)

    selesai = len(sesudah) == 1
    return HasilCek(
        True,
        pesan="Benar!" if not selesai else f"Benar! Hasil akhirnya {format_angka(hasil)}.",
        rentang=dasar.rentang,
        operasi=operasi,
        sesudah=[t.ke_json() for t in sesudah],
        sesudah_teks=ke_teks(sesudah),
        selesai=selesai,
        alasan=alasan,
        ekstra={"hasil": hasil, "hasil_teks": format_angka(hasil)},
    )


def petunjuk(token: list[Token], level: int) -> dict:
    """Petunjuk bertingkat untuk langkah berikutnya. Tidak pernah memberi hasil."""
    if len(token) < 3:
        return {"teks": "Soal ini sudah selesai.", "rentang": None}
    idx = op_kanonik(token)
    alasan, _ = alasan_untuk(token, idx)
    a, op, b = token[idx - 1 : idx + 2]
    operasi = f"{a.tampil()} {op.tampil()} {b.tampil()}"

    if level <= 1:
        ops = {t.nilai for t in token if t.jenis == "op"}
        if alasan == ALASAN_KURUNG:
            teks = "Ada tanda kurung. Bagian mana yang dikerjakan lebih dulu?"
        elif alasan == ALASAN_KALI_BAGI and {"*", "/"} <= ops:
            teks = "Ada × dan ÷. Mana yang lebih dulu? Ingat, keduanya setara."
        elif alasan == ALASAN_KALI_BAGI:
            teks = "Ada operasi + / − dan × / ÷. Mana yang didahulukan?"
        else:
            teks = "Tinggal + dan −. Mulai dari sebelah mana?"
        return {"teks": teks, "rentang": None}
    if level == 2:
        from .solver import PENJELASAN

        return {"teks": PENJELASAN[alasan] + " Lihat bagian yang ditandai.", "rentang": [idx - 1, idx + 1]}
    return {"teks": f"Hitung {operasi} = …  (kamu yang mengisi hasilnya)", "rentang": [idx - 1, idx + 1]}
