"""Aturan, latihan berjenjang, pemeriksaan langkah, petunjuk, dan soal sejenis."""
from __future__ import annotations

import random

from flask import Blueprint

from .. import bank
from ..engine import cek_langkah, ke_teks, langkah_langkah, petunjuk, tokenisasi
from ..engine.generator import fakta_kali_bagi, soal_sejenis
from . import body, gagal, ok

bp = Blueprint("latihan", __name__, url_prefix="/api")


@bp.get("/aturan")
def aturan():
    kartu = []
    for a in bank.latihan()["aturan"]:
        kartu.append({**a, "token": bank.token_json(a["contoh"]),
                      "langkah": [l.ke_json() for l in langkah_langkah(a["contoh"])]})
    return ok(kartu)


@bp.get("/latihan")
def daftar_latihan():
    return ok([
        {k: v for k, v in level.items() if k != "soal"} | {"soal": [bank.soal_publik(s) for s in level["soal"]]}
        for level in bank.latihan()["level"]
    ])


@bp.get("/soal/<soal_id>/contoh")
def contoh(soal_id: str):
    """Contoh bertahap. Hanya untuk soal bermode 'contoh' (semua langkah)
    atau 'lengkapi' (langkah awal saja; sisanya dikerjakan siswa)."""
    soal = bank.cari_soal(soal_id)
    if not soal:
        return gagal("Soal tidak ditemukan.", 404)
    semua = langkah_langkah(soal["ekspresi"])
    if soal["mode"] == "contoh":
        tampil = semua
    elif soal["mode"] == "lengkapi":
        tampil = semua[: len(semua) - soal["kosong"]]
    else:
        return gagal("Soal ini dikerjakan mandiri.", 403)
    sisa = tampil[-1].sesudah if tampil else tokenisasi(soal["ekspresi"])
    return ok({
        "langkah": [l.ke_json() for l in tampil],
        "sisa_ekspresi": ke_teks(sisa),
        "sisa_token": [t.ke_json() for t in sisa],
    })


@bp.post("/langkah/cek")
def cek():
    d = body()
    token = tokenisasi(d.get("ekspresi", ""))
    op_idx = d.get("op_idx")
    if not isinstance(op_idx, int):
        return gagal("op_idx wajib berupa bilangan bulat.")
    return ok(cek_langkah(token, op_idx, d.get("jawaban")).ke_json())


@bp.post("/langkah/petunjuk")
def langkah_petunjuk():
    d = body()
    level = d.get("level", 1)
    if not isinstance(level, int) or not 1 <= level <= 3:
        return gagal("level harus 1, 2, atau 3.")
    return ok(petunjuk(tokenisasi(d.get("ekspresi", "")), level))


@bp.post("/soal-sejenis")
def sejenis():
    baru = soal_sejenis(body().get("ekspresi", ""))
    return ok({"ekspresi": baru, "token": bank.token_json(baru),
               "jumlah_langkah": len(langkah_langkah(baru))})


@bp.post("/contoh-mirip")
def contoh_mirip():
    """Contoh lengkap untuk soal MIRIP (bukan soal yang sedang dikerjakan)."""
    baru = soal_sejenis(body().get("ekspresi", ""))
    return ok({"ekspresi": baru, "token": bank.token_json(baru),
               "langkah": [l.ke_json() for l in langkah_langkah(baru)]})


@bp.get("/pemanasan")
def pemanasan():
    soal = fakta_kali_bagi(8, seed=random.randrange(1 << 30))
    return ok([{"ekspresi": e, "token": bank.token_json(e)} for e in soal])
