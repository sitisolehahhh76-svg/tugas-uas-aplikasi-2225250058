"""Aplikasi Flask HitungRuntut: API JSON + menyajikan frontend statis.

Jalankan:  python -m backend.app
"""
from __future__ import annotations

import os
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

from . import bank, db
from .engine import EkspresiTidakValid

AKAR = Path(__file__).resolve().parent.parent
FRONTEND = AKAR / "frontend"


def create_app(konfigurasi: dict | None = None) -> Flask:
    try:
        from dotenv import load_dotenv

        load_dotenv(AKAR / ".env")
    except ImportError:
        pass

    app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")
    app.config.update(
        DATABASE=os.environ.get("HR_DATABASE", str(AKAR / "instance" / "hitungruntut.sqlite")),
        PENELITI_PIN=os.environ.get("PENELITI_PIN", "1234"),
        JSON_AS_ASCII=False,
    )
    if konfigurasi:
        app.config.update(konfigurasi)
    app.json.ensure_ascii = False
    Path(app.config["DATABASE"]).parent.mkdir(parents=True, exist_ok=True)

    masalah = bank.validasi()
    if masalah:
        raise RuntimeError("Bank soal bermasalah:\n" + "\n".join(masalah))

    db.siapkan(app)

    from .api import latihan, misi, siswa

    app.register_blueprint(latihan.bp)
    app.register_blueprint(misi.bp)
    app.register_blueprint(siswa.bp)

    @app.errorhandler(EkspresiTidakValid)
    def _ekspresi_tidak_valid(e):
        return jsonify({"ok": False, "pesan": str(e)}), 400

    @app.errorhandler(404)
    def _tidak_ada(_e):
        return jsonify({"ok": False, "pesan": "Tidak ditemukan."}), 404

    @app.get("/")
    def index():
        return send_from_directory(FRONTEND, "index.html")

    @app.get("/sw.js")
    def service_worker():
        r = send_from_directory(FRONTEND, "sw.js")
        r.headers["Cache-Control"] = "no-cache"
        return r

    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"HitungRuntut berjalan di http://localhost:{port}")
    print("Dari HP (Wi-Fi yang sama): http://<IP-laptop>:%d" % port)
    create_app().run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
