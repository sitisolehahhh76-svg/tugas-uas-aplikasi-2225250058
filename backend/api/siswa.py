"""Masuk dengan kode siswa, progres, log belajar, rapor, dan panel peneliti."""
from __future__ import annotations

import csv
import hmac
import io
import json

from flask import Blueprint, Response, current_app, request

from .. import bank, db
from ..engine.scoring import bintang_latihan
from . import body, gagal, ok

bp = Blueprint("siswa", __name__, url_prefix="/api")


def _siswa_dari(d) -> tuple[str | None, int | None]:
    kode = db.normal_kode(d.get("kode"))
    return (kode, db.id_siswa(kode)) if kode else (None, None)


def _lencana(sid: int, progres: dict) -> list[dict]:
    misi_mandiri = any(
        k.startswith("misi-") and v["rincian"] and all(t["skor"] == t["skor_murni"] for t in json.loads(v["rincian"]))
        for k, v in progres.items()
    )
    daftar = [
        ("penjaga-kurung", "Penjaga Kurung", "5 langkah kurung dikerjakan tanpa melewatkan kurung",
         db.hitung_log(sid, "kurung_benar") >= 5),
        ("kiri-ke-kanan", "Kiri ke Kanan", "5 langkah × ÷ dikerjakan berurutan dari kiri",
         db.hitung_log(sid, "kalibagi_benar") >= 5),
        ("pemeriksa-teliti", "Pemeriksa Teliti", "Memakai 'Cek ulang' 5 kali", db.hitung_log(sid, "cek_ulang") >= 5),
        ("mandiri", "Mandiri", "Menyelesaikan misi tanpa petunjuk level 3", misi_mandiri),
    ]
    return [{"id": i, "nama": n, "syarat": s, "dapat": bool(dpt)} for i, n, s, dpt in daftar]


@bp.post("/masuk")
def masuk():
    kode, sid = _siswa_dari(body())
    if not kode:
        return gagal("Kode siswa hanya boleh huruf, angka, atau tanda minus (maks. 20).")
    progres = db.ambil_progres(sid)
    return ok({"kode": kode, "progres": progres, "buka_semua": kode.startswith("GURU"),
               "lencana": _lencana(sid, progres)})


@bp.post("/progres")
def progres():
    """Simpan hasil soal latihan. Bintang dihitung server dari kesalahan & petunjuk."""
    d = body()
    kode, sid = _siswa_dari(d)
    item = d.get("item")
    if not kode or not isinstance(item, str) or not (bank.cari_soal(item) or item in ("aturan", "pemanasan")):
        return gagal("Data progres tidak valid.")
    kesalahan = d.get("kesalahan", 0) if isinstance(d.get("kesalahan"), int) else 0
    pm = d.get("petunjuk_maks", 0) if isinstance(d.get("petunjuk_maks"), int) else 0
    b = 3 if item in ("aturan", "pemanasan") else bintang_latihan(kesalahan, pm)
    db.simpan_progres(sid, item, b, None, None, json.dumps({"kesalahan": kesalahan, "petunjuk_maks": pm}))
    return ok({"bintang": b, "progres": db.ambil_progres(sid)})


@bp.post("/log")
def log():
    d = body()
    kode, sid = _siswa_dari(d)
    entri = d.get("entri")
    if not kode or not isinstance(entri, list):
        return gagal("Data log tidak valid.")
    return ok({"tersimpan": db.tambah_log(sid, entri)})


@bp.get("/rapor/<kode>")
def rapor(kode):
    kode = db.normal_kode(kode)
    sid = kode and db.id_siswa(kode, buat=False)
    if not sid:
        return gagal("Siswa belum terdaftar.", 404)
    progres = db.ambil_progres(sid)
    level = []
    for lv in bank.latihan()["level"]:
        ids = [s["id"] for s in lv["soal"]]
        level.append({"id": lv["id"], "nama": lv["nama"],
                      "selesai": sum(i in progres for i in ids), "jumlah": len(ids),
                      "bintang": sum(progres.get(i, {}).get("bintang", 0) for i in ids), "bintang_maks": 3 * len(ids)})
    misi = []
    for m in bank.misi_semua():
        p = progres.get(m["id"])
        misi.append({"id": m["id"], "judul": m["judul"], "indikator_nama": m["indikator_nama"],
                     "skor": p["skor"] if p else None, "skor_maks": bank.skor_maks_misi(m),
                     "bintang": p["bintang"] if p else 0,
                     "per_tahap": json.loads(p["rincian"]) if p and p["rincian"] else None})
    return ok({"kode": kode, "level": level, "misi": misi, "lencana": _lencana(sid, progres)})


# ---------- panel peneliti ----------

def _pin_benar() -> bool:
    pin = request.args.get("pin", "") or request.headers.get("X-PIN", "")
    return hmac.compare_digest(pin, current_app.config["PENELITI_PIN"])


@bp.get("/peneliti/rekap")
def rekap():
    if not _pin_benar():
        return gagal("PIN salah.", 403)
    return ok(db.rekap())


@bp.get("/peneliti/ekspor.csv")
def ekspor():
    if not _pin_benar():
        return gagal("PIN salah.", 403)
    tabel = "log" if request.args.get("tabel") == "log" else "progres"
    kolom, baris = db.semua_baris(tabel)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(kolom)
    w.writerows(baris)
    return Response(
        "﻿" + buf.getvalue(),  # BOM agar Excel membaca UTF-8
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename=hitungruntut-{tabel}.csv"},
    )
