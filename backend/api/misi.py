"""Misi literasi (4 soal kisi-kisi), dinilai per tahap rubrik."""
from __future__ import annotations

import json

from flask import Blueprint, request

from .. import bank, db
from ..engine import format_angka
from ..engine.scoring import (
    bintang,
    cek_model,
    skor_hitung,
    skor_pilih_info,
    skor_pilihan,
    terapkan_petunjuk,
)
from . import body, gagal, ok

bp = Blueprint("misi", __name__, url_prefix="/api/misi")

PESAN_MODEL = {
    "MODEL_TIDAK_SAH": "Kalimat matematikanya belum lengkap. Periksa: angka dan tanda harus bergantian, kurung harus berpasangan.",
    "ANGKA_TIDAK_SESUAI": "Angka yang dipakai belum sesuai. Pastikan semua angka penting dipakai, dan tidak ada yang berlebih.",
    "PERLU_KURUNG": "Angkanya sudah tepat, tapi hasilnya berbeda. Bagian mana yang harus dihitung dulu? Mungkin perlu tanda kurung.",
    "NILAI_TIDAK_SESUAI": "Angkanya sudah tepat, tapi susunannya belum menggambarkan cerita. Baca lagi ceritanya.",
}


def _misi_atau_404(misi_id):
    m = bank.cari_misi(misi_id)
    return m


@bp.get("")
def daftar():
    return ok([
        {"id": m["id"], "judul": m["judul"], "indikator": m["indikator"],
         "indikator_nama": m["indikator_nama"], "skor_maks": bank.skor_maks_misi(m),
         "jumlah_tahap": len(m["tahap"])}
        for m in bank.misi_semua()
    ])


@bp.get("/<misi_id>")
def detail(misi_id):
    m = _misi_atau_404(misi_id)
    if not m:
        return gagal("Misi tidak ditemukan.", 404)
    return ok(bank.misi_publik(m))


@bp.get("/<misi_id>/petunjuk")
def petunjuk(misi_id):
    m = _misi_atau_404(misi_id)
    b = m and bank.cari_bagian(m, request.args.get("tahap", type=int), request.args.get("bagian", 0, type=int))
    level = request.args.get("level", 1, type=int)
    if not b or "petunjuk" not in b or not 1 <= level <= 3:
        return gagal("Petunjuk tidak ditemukan.", 404)
    return ok({"teks": b["petunjuk"][level - 1], "level": level})


def _baca_angka(x):
    if isinstance(x, int) and not isinstance(x, bool):
        return x
    if isinstance(x, str):
        s = x.strip().replace(".", "").replace(" ", "").lower().removeprefix("rp")
        if s.isdigit():
            return int(s)
    return None


@bp.post("/<misi_id>/cek")
def cek(misi_id):
    """Periksa jawaban satu bagian (selain hitung_langkah, yang memakai /api/langkah/cek)."""
    m = _misi_atau_404(misi_id)
    d = body()
    b = m and bank.cari_bagian(m, d.get("tahap"), d.get("bagian", 0))
    if not b:
        return gagal("Bagian tidak ditemukan.", 404)
    tipe, jawaban, maks = b["tipe"], d.get("jawaban"), b["skor"]
    percobaan = d.get("percobaan", 1) if isinstance(d.get("percobaan"), int) else 1

    diagnosis = None
    if tipe == "pilih_info":
        if not isinstance(jawaban, list) or not all(isinstance(x, int) for x in jawaban):
            return gagal("Jawaban harus daftar pilihan.")
        skor = skor_pilih_info(jawaban, b["kunci"], maks)
        benar = skor == maks
        if benar:
            pesan = "Tepat! Semua informasi penting sudah kamu temukan."
        else:
            kurang = len(set(b["kunci"]) - set(jawaban))
            lebih = len(set(jawaban) - set(b["kunci"]))
            bagian = []
            if kurang:
                bagian.append(f"{kurang} informasi penting belum dipilih")
            if lebih:
                bagian.append(f"{lebih} pilihan tidak diperlukan")
            pesan = "Belum tepat: " + " dan ".join(bagian) + "."
    elif tipe in bank.TIPE_PILIHAN:
        skor = skor_pilihan(jawaban, b["kunci"], maks)
        benar = skor == maks
        pesan = "Tepat!" if benar else "Belum tepat. Baca lagi pilihannya dengan teliti."
    elif tipe == "isian":
        nilai = _baca_angka(jawaban)
        benar = nilai == b["kunci"]
        skor = maks if benar else 0.0
        pesan = f"Tepat! {format_angka(b['kunci'])}." if benar else (
            "Tulis jawaban berupa angka, ya." if nilai is None else "Belum tepat. Coba hitung lagi.")
    elif tipe == "susun_model":
        if not isinstance(jawaban, str):
            return gagal("Jawaban harus berupa kalimat matematika.")
        benar, diagnosis = cek_model(jawaban, b["kunci_ekspresi"])
        skor = maks if benar else 0.0
        pesan = "Tepat! Kalimat matematikamu sesuai cerita." if benar else PESAN_MODEL[diagnosis]
    elif tipe == "tunjuk":
        benar = jawaban in b["kunci_op"]
        skor = maks if benar else 0.0
        pesan = "Tepat, di situlah kesalahannya!" if benar else "Bukan di situ. Perhatikan tanda di depan setiap harga tiket."
    else:
        return gagal("Bagian ini dikerjakan langkah demi langkah.")

    hasil = {"benar": benar, "skor": skor, "skor_maks": maks, "pesan": pesan}
    if diagnosis:
        hasil["diagnosis"] = diagnosis
    if benar or percobaan >= 3:
        hasil["pembahasan"] = b.get("pembahasan")
    return ok(hasil)


@bp.post("/<misi_id>/selesai")
def selesai(misi_id):
    """Hitung skor akhir misi dari hasil tiap bagian.

    hasil: [{tahap, bagian, skor_awal?, benar_pertama?, total?, petunjuk_maks}]
    skor_awal = skor percobaan pertama (dari /cek); untuk hitung_langkah dipakai benar_pertama/total.
    """
    m = _misi_atau_404(misi_id)
    if not m:
        return gagal("Misi tidak ditemukan.", 404)
    d = body()
    kode = db.normal_kode(d.get("kode"))
    if not kode:
        return gagal("Kode siswa tidak valid.")
    masukan = {(h.get("tahap"), h.get("bagian", 0)): h for h in d.get("hasil", []) if isinstance(h, dict)}

    per_tahap = []
    total = total_murni = 0.0
    for t in m["tahap"]:
        skor_t = murni_t = 0.0
        for i, b in enumerate(t["bagian"]):
            h = masukan.get((t["no"], i), {})
            if b["tipe"] == "hitung_langkah":
                murni = skor_hitung(int(h.get("benar_pertama", 0) or 0), int(h.get("total", 0) or 0), b["skor"])
            else:
                try:
                    murni = max(0.0, min(float(h.get("skor_awal", 0) or 0), b["skor"]))
                except (TypeError, ValueError):
                    murni = 0.0
            pm = h.get("petunjuk_maks", 0)
            akhir = terapkan_petunjuk(murni, pm if isinstance(pm, int) else 0)
            skor_t += akhir
            murni_t += murni
        per_tahap.append({"no": t["no"], "judul": t["judul"], "skor": skor_t, "skor_murni": murni_t, "skor_maks": t["skor"]})
        total += skor_t
        total_murni += murni_t

    maks = bank.skor_maks_misi(m)
    hasil = {
        "skor": total, "skor_murni": total_murni, "skor_maks": maks,
        "bintang": bintang(total, maks), "per_tahap": per_tahap,
        "indikator": m["indikator"], "indikator_nama": m["indikator_nama"],
    }
    sid = db.id_siswa(kode)
    db.simpan_progres(sid, m["id"], hasil["bintang"], total, maks, json.dumps(per_tahap))
    return ok(hasil)
