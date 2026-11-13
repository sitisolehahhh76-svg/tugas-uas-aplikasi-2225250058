import pytest

from backend.engine import EkspresiTidakValid, cek_langkah, langkah_langkah, nilai_akhir, petunjuk, tokenisasi
from backend.engine.generator import fakta_kali_bagi, soal_sejenis
from backend.engine.scoring import (
    bintang,
    cek_model,
    skor_hitung,
    skor_pilih_info,
    terapkan_petunjuk,
)
from backend.engine.solver import op_sah


def operasi(ekspresi):
    return [l.operasi for l in langkah_langkah(ekspresi)]


# ---------- tokenizer ----------

def test_titik_ribuan_dan_simbol():
    t = tokenisasi("150.000 − 4 x 12.500 : 5 * 2 / 1 - 3")
    angka = [x.nilai for x in t if x.jenis == "angka"]
    assert angka == [150000, 4, 12500, 5, 2, 1, 3]
    assert [x.nilai for x in t if x.jenis == "op"] == ["-", "*", "/", "*", "/", "-"]


@pytest.mark.parametrize("salah", ["", "3 +", "(2 + 3", "2 + 3)", "2 3", "1,5 + 2", "2 ^ 3", "× 4"])
def test_ekspresi_tidak_sah(salah):
    with pytest.raises(EkspresiTidakValid):
        tokenisasi(salah)


# ---------- solver: tiga soal pemicu wawancara ----------

def test_pemicu_1_kali_sebelum_tambah():
    assert operasi("12 + 6 × 3") == ["6 × 3", "12 + 18"]
    assert nilai_akhir("12 + 6 × 3") == 30


def test_pemicu_2_kurung_dulu():
    l = langkah_langkah("(24 − 8) ÷ 4 + 5")
    assert [x.operasi for x in l] == ["24 − 8", "16 ÷ 4", "4 + 5"]
    assert l[0].ke_json()["sesudah_teks"] == "16 ÷ 4 + 5"  # kurung hilang setelah isinya selesai
    assert l[0].alasan == "kurung"
    assert l[-1].hasil == 9


def test_pemicu_3_kali_bagi_kiri_ke_kanan():
    assert operasi("36 ÷ 6 × 2 − 3") == ["36 ÷ 6", "6 × 2", "12 − 3"]
    assert nilai_akhir("36 ÷ 6 × 2 − 3") == 9


def test_kurung_bersarang():
    assert operasi("2 × ((3 + 5) ÷ 4)") == ["3 + 5", "8 ÷ 4", "2 × 2"]


# ---------- solver: empat misi kisi-kisi ----------

@pytest.mark.parametrize(
    "ekspresi, hasil",
    [
        ("3 × 35.000 + 10.000", 115000),
        ("30 × 3.500 + 15.000", 120000),
        ("(5 × 24 − 8) × 3.000 − 5 × 48.000", 96000),
        ("150.000 − 4 × 12.500 − 3 × 4.000 + 2 × 25.000", 138000),
        ("150.000 − (2 × 35.000 + 3 × 20.000)", 20000),
    ],
)
def test_misi(ekspresi, hasil):
    assert nilai_akhir(ekspresi) == hasil


def test_misi3_urutan_sesuai_kisi():
    assert operasi("150.000 − 4 × 12.500 − 3 × 4.000 + 2 × 25.000") == [
        "4 × 12.500", "3 × 4.000", "2 × 25.000",
        "150.000 − 50.000", "100.000 − 12.000", "88.000 + 50.000",
    ]


def test_hasil_tak_bulat_ditolak():
    with pytest.raises(EkspresiTidakValid):
        langkah_langkah("7 ÷ 2")
    with pytest.raises(EkspresiTidakValid):
        langkah_langkah("3 − 5")


# ---------- checker: diagnosis dari kesalahan nyata siswa S01 ----------

def idx_op(ekspresi, simbol, ke=1):
    t = tokenisasi(ekspresi)
    n = 0
    for i, x in enumerate(t):
        if x.jenis == "op" and x.tampil() == simbol:
            n += 1
            if n == ke:
                return t, i
    raise AssertionError


def test_diag_tambah_sebelum_kali():  # IL01: ingin 12 + 6 dulu
    t, i = idx_op("12 + 6 × 3", "+")
    assert cek_langkah(t, i).diagnosis == "TAMBAH_SEBELUM_KALI"


def test_diag_abaikan_kurung():  # IL02: ingin 8 ÷ 4 dulu
    t, i = idx_op("(24 − 8) ÷ 4 + 5", "÷")
    assert cek_langkah(t, i).diagnosis == "ABAIKAN_KURUNG"


def test_diag_kali_sebelum_bagi():  # IL03: mengira × selalu dulu
    t, i = idx_op("36 ÷ 6 × 2 − 3", "×")
    assert cek_langkah(t, i).diagnosis == "KALI_SEBELUM_BAGI"


def test_diag_tidak_dari_kiri():
    t, i = idx_op("20 − 5 + 3", "+")
    assert cek_langkah(t, i).diagnosis == "TIDAK_DARI_KIRI"


def test_diag_salah_fakta_dan_lewat_langkah():
    t, i = idx_op("(24 − 8) ÷ 4 + 5", "−")
    assert cek_langkah(t, i, "15").diagnosis == "SALAH_FAKTA"
    assert cek_langkah(t, i, "4").diagnosis == "LEWAT_LANGKAH"  # 16 ÷ 4 langsung


def test_jawaban_benar_melipat_kurung():
    t, i = idx_op("(24 − 8) ÷ 4 + 5", "−")
    h = cek_langkah(t, i, "16")
    assert h.benar and h.sesudah_teks == "16 ÷ 4 + 5" and not h.selesai


def test_jawaban_dengan_titik_ribuan():
    t, i = idx_op("3 × 35.000 + 10.000", "×")
    assert cek_langkah(t, i, "105.000").benar


def test_dua_perkalian_beda_suku_sama_sah():
    t = tokenisasi("2 × 3 + 4 × 5")
    assert op_sah(t) == [1, 5]


def test_petunjuk_tidak_memberi_hasil():
    t = tokenisasi("36 ÷ 6 × 2 − 3")
    for level in (1, 2, 3):
        assert "6 " not in petunjuk(t, level)["teks"].split("=")[-1]
    assert petunjuk(t, 1)["rentang"] is None
    assert petunjuk(t, 2)["rentang"] == [0, 2]


# ---------- generator ----------

@pytest.mark.parametrize(
    "pola",
    ["12 + 6 × 3", "(24 − 8) ÷ 4 + 5", "36 ÷ 6 × 2 − 3", "150.000 − (2 × 35.000 + 3 × 20.000)", "100 − 4 × 15 + 30 ÷ 5"],
)
def test_soal_sejenis_valid(pola):
    asli = [t for t in tokenisasi(pola)]
    for seed in range(50):
        baru = soal_sejenis(pola, seed=seed)
        tb = tokenisasi(baru)
        assert [t.jenis for t in tb] == [t.jenis for t in asli]
        assert [t.nilai for t in tb if t.jenis == "op"] == [t.nilai for t in asli if t.jenis == "op"]
        langkah_langkah(baru)  # tidak error = semua bulat & ≥ 0


def test_fakta_kali_bagi():
    for s in fakta_kali_bagi(8, seed=1):
        langkah_langkah(s)


# ---------- scoring ----------

def test_cek_model():
    kunci = "(5 × 24 − 8) × 3.000 − 5 × 48.000"
    assert cek_model("(5 × 24 − 8) × 3.000 − 5 × 48.000", kunci) == (True, None)
    assert cek_model("3.000 × (24 × 5 − 8) − 48.000 × 5", kunci) == (True, None)
    assert cek_model("5 × 24 − 8 × 3.000 − 5 × 48.000", kunci)[1] in ("PERLU_KURUNG", "NILAI_TIDAK_SESUAI")
    assert cek_model("150.000 − 2 × 35.000 + 3 × 20.000", "150.000 − (2 × 35.000 + 3 × 20.000)") == (False, "PERLU_KURUNG")
    assert cek_model("5 × 24", kunci) == (False, "ANGKA_TIDAK_SESUAI")


def test_skor():
    assert skor_pilih_info([0, 1, 2], [0, 1, 2], 1) == 1
    assert skor_pilih_info([0, 1], [0, 1, 2], 1) == 0.5
    assert skor_pilih_info([0], [0, 1, 2], 1) == 0
    assert skor_hitung(3, 3, 2) == 2
    assert skor_hitung(2, 3, 2) == 1
    assert terapkan_petunjuk(2, 3) == 1
    assert terapkan_petunjuk(2, 2) == 2
    assert bintang(6, 6) == 3 and bintang(4, 6) == 2 and bintang(1, 6) == 1 and bintang(0, 6) == 0
