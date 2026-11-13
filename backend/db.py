"""Penyimpanan SQLite: siswa (hanya kode), progres, dan log belajar."""
from __future__ import annotations

import re
import sqlite3

from flask import current_app, g

SKEMA = """
CREATE TABLE IF NOT EXISTS siswa (
  id INTEGER PRIMARY KEY,
  kode TEXT UNIQUE NOT NULL,
  dibuat TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS progres (
  siswa_id INTEGER NOT NULL,
  item TEXT NOT NULL,
  bintang INTEGER NOT NULL,
  skor REAL,
  skor_maks REAL,
  rincian TEXT,
  diperbarui TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (siswa_id, item)
);
CREATE TABLE IF NOT EXISTS log (
  id INTEGER PRIMARY KEY,
  siswa_id INTEGER NOT NULL,
  waktu TEXT,
  item TEXT,
  langkah INTEGER,
  jenis TEXT,
  isi TEXT,
  benar INTEGER,
  diagnosis TEXT
);
"""

POLA_KODE = re.compile(r"^[A-Z0-9-]{1,20}$")


def koneksi() -> sqlite3.Connection:
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
    return g.db


def tutup(_exc=None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def siapkan(app) -> None:
    with app.app_context():
        koneksi().executescript(SKEMA)
        koneksi().commit()
    app.teardown_appcontext(tutup)


def normal_kode(kode) -> str | None:
    if not isinstance(kode, str):
        return None
    k = kode.strip().upper()
    return k if POLA_KODE.match(k) else None


def id_siswa(kode: str, buat: bool = True) -> int | None:
    db = koneksi()
    row = db.execute("SELECT id FROM siswa WHERE kode = ?", (kode,)).fetchone()
    if row:
        return row["id"]
    if not buat:
        return None
    cur = db.execute("INSERT INTO siswa (kode) VALUES (?)", (kode,))
    db.commit()
    return cur.lastrowid


def simpan_progres(siswa_id: int, item: str, bintang: int, skor=None, skor_maks=None, rincian=None) -> dict:
    """Simpan hasil; yang disimpan adalah hasil terbaik."""
    db = koneksi()
    lama = db.execute(
        "SELECT bintang, skor FROM progres WHERE siswa_id = ? AND item = ?", (siswa_id, item)
    ).fetchone()
    lebih_baik = lama is None or bintang > lama["bintang"] or (
        bintang == lama["bintang"] and (skor or 0) > (lama["skor"] or 0)
    )
    if lebih_baik:
        db.execute(
            """INSERT INTO progres (siswa_id, item, bintang, skor, skor_maks, rincian, diperbarui)
               VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(siswa_id, item) DO UPDATE SET bintang=excluded.bintang, skor=excluded.skor,
               skor_maks=excluded.skor_maks, rincian=excluded.rincian, diperbarui=CURRENT_TIMESTAMP""",
            (siswa_id, item, bintang, skor, skor_maks, rincian),
        )
        db.commit()
    return {"baru_terbaik": lebih_baik}


def ambil_progres(siswa_id: int) -> dict:
    rows = koneksi().execute(
        "SELECT item, bintang, skor, skor_maks, rincian FROM progres WHERE siswa_id = ?", (siswa_id,)
    ).fetchall()
    return {r["item"]: dict(r) for r in rows}


def tambah_log(siswa_id: int, entri: list[dict]) -> int:
    db = koneksi()
    baris = [
        (
            siswa_id,
            str(e.get("waktu", ""))[:40],
            str(e.get("item", ""))[:60],
            e.get("langkah") if isinstance(e.get("langkah"), int) else None,
            str(e.get("jenis", ""))[:30],
            str(e.get("isi", ""))[:200],
            1 if e.get("benar") is True else 0 if e.get("benar") is False else None,
            str(e.get("diagnosis") or "")[:40] or None,
        )
        for e in entri[:500]
        if isinstance(e, dict)
    ]
    db.executemany(
        "INSERT INTO log (siswa_id, waktu, item, langkah, jenis, isi, benar, diagnosis) VALUES (?,?,?,?,?,?,?,?)",
        baris,
    )
    db.commit()
    return len(baris)


def hitung_log(siswa_id: int, jenis: str) -> int:
    return koneksi().execute(
        "SELECT COUNT(*) FROM log WHERE siswa_id = ? AND jenis = ?", (siswa_id, jenis)
    ).fetchone()[0]


def rekap() -> list[dict]:
    rows = koneksi().execute(
        """SELECT s.kode,
                  (SELECT COUNT(*) FROM progres p WHERE p.siswa_id = s.id) AS item_selesai,
                  (SELECT COALESCE(SUM(bintang),0) FROM progres p WHERE p.siswa_id = s.id) AS bintang,
                  (SELECT COALESCE(SUM(skor),0) FROM progres p WHERE p.siswa_id = s.id AND p.item LIKE 'misi-%') AS skor_misi,
                  (SELECT COUNT(*) FROM log l WHERE l.siswa_id = s.id AND l.benar = 0) AS kesalahan,
                  (SELECT COUNT(*) FROM log l WHERE l.siswa_id = s.id AND l.jenis = 'petunjuk') AS petunjuk,
                  (SELECT COUNT(*) FROM log l WHERE l.siswa_id = s.id AND l.jenis = 'ulangi') AS ulangi,
                  (SELECT COUNT(*) FROM log l WHERE l.siswa_id = s.id AND l.jenis = 'cek_ulang') AS cek_ulang
           FROM siswa s ORDER BY s.kode"""
    ).fetchall()
    hasil = [dict(r) for r in rows]
    diag = koneksi().execute(
        """SELECT s.kode, l.diagnosis, COUNT(*) AS n FROM log l JOIN siswa s ON s.id = l.siswa_id
           WHERE l.diagnosis IS NOT NULL GROUP BY s.kode, l.diagnosis"""
    ).fetchall()
    per_kode: dict[str, dict] = {}
    for d in diag:
        per_kode.setdefault(d["kode"], {})[d["diagnosis"]] = d["n"]
    for h in hasil:
        h["diagnosis"] = per_kode.get(h["kode"], {})
    return hasil


def semua_baris(tabel: str) -> tuple[list[str], list[tuple]]:
    if tabel == "log":
        sql = """SELECT s.kode, l.waktu, l.item, l.langkah, l.jenis, l.isi, l.benar, l.diagnosis
                 FROM log l JOIN siswa s ON s.id = l.siswa_id ORDER BY l.id"""
    else:
        sql = """SELECT s.kode, p.item, p.bintang, p.skor, p.skor_maks, p.rincian, p.diperbarui
                 FROM progres p JOIN siswa s ON s.id = p.siswa_id ORDER BY s.kode, p.item"""
    cur = koneksi().execute(sql)
    kolom = [c[0] for c in cur.description]
    return kolom, [tuple(r) for r in cur.fetchall()]
