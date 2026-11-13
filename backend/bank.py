"""Memuat dan memvalidasi bank soal (latihan & misi literasi).

Kunci jawaban hanya ada di sisi server; fungsi *_publik membuang kunci
sebelum data dikirim ke browser.
"""
from __future__ import annotations

import copy
import json
from functools import lru_cache
from pathlib import Path

from .engine import langkah_langkah, tokenisasi
from .engine.scoring import cek_model

DATA = Path(__file__).parent / "data"
KUNCI_RAHASIA = ("kunci", "kunci_ekspresi", "kunci_op", "pembahasan")
TIPE_PILIHAN = ("pilih_tanya", "keputusan", "alasan")


@lru_cache
def latihan() -> dict:
    return json.loads((DATA / "soal_latihan.json").read_text(encoding="utf-8"))


@lru_cache
def misi_semua() -> list[dict]:
    return json.loads((DATA / "misi_literasi.json").read_text(encoding="utf-8"))


def token_json(ekspresi: str) -> list[dict]:
    return [t.ke_json() for t in tokenisasi(ekspresi)]


def cari_soal(soal_id: str) -> dict | None:
    for level in latihan()["level"]:
        for s in level["soal"]:
            if s["id"] == soal_id:
                return s
    return None


def cari_misi(misi_id: str) -> dict | None:
    return next((m for m in misi_semua() if m["id"] == misi_id), None)


def cari_bagian(misi: dict, tahap: int, bagian: int) -> dict | None:
    for t in misi["tahap"]:
        if t["no"] == tahap and 0 <= bagian < len(t["bagian"]):
            return t["bagian"][bagian]
    return None


def skor_maks_misi(misi: dict) -> float:
    return sum(t["skor"] for t in misi["tahap"])


def misi_publik(misi: dict) -> dict:
    m = copy.deepcopy(misi)
    for t in m["tahap"]:
        for b in t["bagian"]:
            for k in KUNCI_RAHASIA:
                b.pop(k, None)
            b.pop("petunjuk", None)  # diambil satu per satu agar tercatat
            if "ekspresi" in b:
                b["token"] = token_json(b["ekspresi"])
    m["skor_maks"] = skor_maks_misi(misi)
    return m


def soal_publik(soal: dict) -> dict:
    s = dict(soal)
    if "ekspresi" in s:
        s["token"] = token_json(s["ekspresi"])
        s["jumlah_langkah"] = len(langkah_langkah(s["ekspresi"]))
    if "ekspresi_list" in s:
        s["token_list"] = [token_json(e) for e in s["ekspresi_list"]]
    return s


def validasi() -> list[str]:
    """Kembalikan daftar masalah pada bank soal (kosong = sehat)."""
    masalah: list[str] = []

    def cek_ekspresi(e: str, asal: str):
        try:
            langkah_langkah(e)
        except Exception as exc:  # noqa: BLE001
            masalah.append(f"{asal}: {e!r} -> {exc}")

    for a in latihan()["aturan"]:
        cek_ekspresi(a["contoh"], a["id"])
    for level in latihan()["level"]:
        for s in level["soal"]:
            for e in s.get("ekspresi_list", [s.get("ekspresi")]):
                cek_ekspresi(e, s["id"])
            if s["mode"] == "lengkapi" and s["kosong"] >= len(langkah_langkah(s["ekspresi"])):
                masalah.append(f"{s['id']}: kosong terlalu banyak")

    for m in misi_semua():
        if skor_maks_misi(m) != 6:
            masalah.append(f"{m['id']}: skor maks bukan 6")
        for t in m["tahap"]:
            total = sum(b["skor"] for b in t["bagian"])
            if abs(total - t["skor"]) > 1e-9:
                masalah.append(f"{m['id']} tahap {t['no']}: jumlah skor bagian {total} != {t['skor']}")
            for i, b in enumerate(t["bagian"]):
                asal = f"{m['id']} tahap {t['no']} bagian {i}"
                tipe = b["tipe"]
                if tipe in ("hitung_langkah", "tunjuk"):
                    cek_ekspresi(b["ekspresi"], asal)
                if tipe == "susun_model":
                    cek_ekspresi(b["kunci_ekspresi"], asal)
                    ubin_angka = {u for u in b["ubin"] if u[0].isdigit()}
                    for t2 in tokenisasi(b["kunci_ekspresi"]):
                        if t2.jenis == "angka" and t2.tampil() not in ubin_angka:
                            masalah.append(f"{asal}: angka {t2.tampil()} tidak ada di ubin")
                    if cek_model(b["kunci_ekspresi"], b["kunci_ekspresi"]) != (True, None):
                        masalah.append(f"{asal}: kunci model tidak sah")
                if tipe in TIPE_PILIHAN and not (0 <= b["kunci"] < len(b["pilihan"])):
                    masalah.append(f"{asal}: kunci di luar pilihan")
                if tipe == "pilih_info" and any(not (0 <= k < len(b["pilihan"])) for k in b["kunci"]):
                    masalah.append(f"{asal}: kunci di luar pilihan")
                if tipe != "hitung_langkah" and len(b.get("petunjuk", [])) != 3:
                    masalah.append(f"{asal}: petunjuk harus 3 level")
    return masalah
