import json

import pytest

from backend import bank
from backend.app import create_app


@pytest.fixture
def client(tmp_path):
    app = create_app({"DATABASE": str(tmp_path / "uji.sqlite"), "PENELITI_PIN": "9999", "TESTING": True})
    return app.test_client()


def data(r):
    j = r.get_json()
    assert j["ok"], j
    return j["data"]


def test_bank_soal_sehat():
    assert bank.validasi() == []


def test_halaman_utama(client):
    r = client.get("/")
    assert r.status_code == 200 and b"<html" in r.data.lower()


def test_aturan_dan_latihan(client):
    kartu = data(client.get("/api/aturan"))
    assert len(kartu) == 4 and kartu[0]["langkah"][0]["operasi"] == "6 × 3"
    level = data(client.get("/api/latihan"))
    assert [l["id"] for l in level] == ["dasar", "sedang", "lanjutan"]


def test_contoh_hanya_untuk_mode_contoh_dan_lengkapi(client):
    assert len(data(client.get("/api/soal/sedang-1/contoh"))["langkah"]) == 3
    lengkapi = data(client.get("/api/soal/sedang-3/contoh"))
    assert len(lengkapi["langkah"]) == 1 and lengkapi["sisa_ekspresi"] == "6 × 2 − 3"
    assert client.get("/api/soal/sedang-4/contoh").status_code == 403


def test_alur_langkah(client):
    e = "(24 − 8) ÷ 4 + 5"
    salah = data(client.post("/api/langkah/cek", json={"ekspresi": e, "op_idx": 5}))
    assert salah["benar"] is False and salah["diagnosis"] == "ABAIKAN_KURUNG"
    pilih = data(client.post("/api/langkah/cek", json={"ekspresi": e, "op_idx": 2}))
    assert pilih["benar"] and pilih["rentang"] == [1, 3] and "sesudah" not in pilih
    jawab = data(client.post("/api/langkah/cek", json={"ekspresi": e, "op_idx": 2, "jawaban": "16"}))
    assert jawab["sesudah_teks"] == "16 ÷ 4 + 5"


def test_ekspresi_rusak_400(client):
    r = client.post("/api/langkah/cek", json={"ekspresi": "3 +", "op_idx": 1})
    assert r.status_code == 400 and r.get_json()["ok"] is False


def test_misi_tidak_membocorkan_kunci(client):
    for m in data(client.get("/api/misi")):
        teks = json.dumps(data(client.get(f"/api/misi/{m['id']}")))
        for k in ('"kunci"', '"kunci_ekspresi"', '"kunci_op"', '"pembahasan"', '"petunjuk"'):
            assert k not in teks


def test_misi_cek_tiap_tipe(client):
    cek = lambda t, b, j, p=1: data(client.post("/api/misi/misi-4/cek", json={"tahap": t, "bagian": b, "jawaban": j, "percobaan": p}))
    assert cek(1, 0, [0, 1, 2, 3])["benar"]
    assert cek(1, 0, [0, 1, 2])["skor"] == 0.5
    assert cek(2, 0, 5)["benar"]
    r = cek(3, 0, "150.000 − 2 × 35.000 + 3 × 20.000")
    assert r["diagnosis"] == "PERLU_KURUNG" and "pembahasan" not in r
    assert "pembahasan" in cek(3, 0, "150.000", p=3)
    assert cek(3, 0, "150.000 − (2 × 35.000 + 3 × 20.000)")["benar"]
    assert cek(6, 1, "Rp20.000")["benar"]
    assert not cek(5, 0, 0)["benar"]


def test_misi_selesai_dan_rapor(client):
    data(client.post("/api/masuk", json={"kode": "s01"}))
    hasil = [
        {"tahap": 1, "bagian": 0, "skor_awal": 0.5},
        {"tahap": 1, "bagian": 1, "skor_awal": 0.5},
        {"tahap": 2, "bagian": 0, "benar_pertama": 2, "total": 2},
        {"tahap": 2, "bagian": 1, "benar_pertama": 2, "total": 2, "petunjuk_maks": 3},
        {"tahap": 3, "bagian": 0, "skor_awal": 99},  # dipotong ke skor maks
        {"tahap": 4, "bagian": 0, "skor_awal": 1},
        {"tahap": 5, "bagian": 0, "skor_awal": 0},
    ]
    r = data(client.post("/api/misi/misi-1/selesai", json={"kode": "S01", "hasil": hasil}))
    assert r["skor_murni"] == 5 and r["skor"] == 4.5 and r["bintang"] == 2
    rapor = data(client.get("/api/rapor/S01"))
    assert rapor["misi"][0]["skor"] == 4.5


def test_progres_latihan_dan_kode(client):
    assert client.post("/api/masuk", json={"kode": "nama lengkap saya"}).status_code == 400
    r = data(client.post("/api/progres", json={"kode": "S02", "item": "dasar-4", "kesalahan": 0}))
    assert r["bintang"] == 3
    r = data(client.post("/api/progres", json={"kode": "S02", "item": "dasar-4", "kesalahan": 5}))
    assert r["progres"]["dasar-4"]["bintang"] == 3  # hasil terbaik dipertahankan


def test_peneliti_perlu_pin(client):
    data(client.post("/api/log", json={"kode": "S03", "entri": [{"jenis": "jawab", "benar": False, "diagnosis": "SALAH_FAKTA"}]}))
    assert client.get("/api/peneliti/rekap?pin=0000").status_code == 403
    rekap = data(client.get("/api/peneliti/rekap?pin=9999"))
    assert rekap[0]["diagnosis"] == {"SALAH_FAKTA": 1}
    csv = client.get("/api/peneliti/ekspor.csv?pin=9999&tabel=log")
    assert csv.status_code == 200 and "SALAH_FAKTA" in csv.data.decode("utf-8-sig")


def test_mode_vercel(monkeypatch, tmp_path):
    """Di Vercel: DB di folder temp, panel peneliti tertutup bila PIN belum diatur."""
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.delenv("PENELITI_PIN", raising=False)
    monkeypatch.delenv("HR_DATABASE", raising=False)
    monkeypatch.setattr("tempfile.gettempdir", lambda: str(tmp_path))
    monkeypatch.setattr("dotenv.load_dotenv", lambda *a, **k: None)
    app = create_app()
    assert app.config["DATABASE"].startswith(str(tmp_path))
    c = app.test_client()
    assert c.get("/").status_code == 200
    assert c.get("/api/peneliti/rekap?pin=").status_code == 403
    assert c.get("/api/peneliti/rekap?pin=1234").status_code == 403


def test_titik_masuk_vercel():
    import app as titik_masuk
    assert titik_masuk.app.test_client().get("/api/misi").status_code == 200


def test_soal_sejenis_dan_pemanasan(client):
    r = data(client.post("/api/soal-sejenis", json={"ekspresi": "36 ÷ 6 × 2 − 3"}))
    assert r["ekspresi"] != "36 ÷ 6 × 2 − 3"
    assert len(data(client.get("/api/pemanasan"))) == 8
