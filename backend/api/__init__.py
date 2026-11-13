"""Blueprint API JSON. Format respons: {"ok": true, "data": ...} atau {"ok": false, "pesan": ...}."""
from flask import jsonify, request


def ok(data=None, status: int = 200):
    return jsonify({"ok": True, "data": data}), status


def gagal(pesan: str, status: int = 400):
    return jsonify({"ok": False, "pesan": pesan}), status


def body() -> dict:
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}
