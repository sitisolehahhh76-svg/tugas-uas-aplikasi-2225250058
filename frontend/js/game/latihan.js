// Latihan berjenjang (DS02): Contoh → Pilih langkah pertama → Lengkapi → Mandiri,
// lalu Soal Sejenis (GL05) dan Cek Ulang (GL02).
import { catat, get, post } from '../api.js';
import { bintang, h, kosongkan } from '../ui/dom.js';
import { renderEkspresi, teksDari } from '../ui/ekspresi.js';
import { UmpanBalik } from '../ui/umpan.js';
import { level as cariLevel, soalTerbuka, state, zonaTerbuka } from '../state.js';
import { ALASAN_PILIH, MODE_LABEL, PESAN_KUNCI } from '../teks.js';
import { ContohLangkah } from './contoh.js';
import { SolverLangkah } from './langkah.js';

export async function layarLevel(levelId) {
  const lv = cariLevel(levelId);
  if (!lv) return h('div', { class: 'layar' }, h('p', {}, 'Level tidak ditemukan.'));
  if (!zonaTerbuka(levelId)) return h('div', { class: 'layar' }, h('p', {}, PESAN_KUNCI));
  return h('div', { class: 'layar' },
    h('h1', {}, lv.nama),
    h('p', { class: 'keterangan' }, `${lv.keterangan}. Kerjakan berurutan — dari contoh sampai mandiri.`),
    h('ol', { class: 'daftar' }, lv.soal.map((s, i) => {
      const buka = soalTerbuka(levelId, i);
      const p = state.progres[s.id];
      return h('li', {}, h(buka ? 'a' : 'div', {
        class: 'zona', href: buka ? `#/soal/${s.id}` : null, 'aria-disabled': buka ? null : 'true',
      },
      h('span', { class: 'nomor' }, String(i + 1)),
      h('span', { class: 'isi' },
        h('span', { class: 'nama' }, MODE_LABEL[s.mode]),
        h('span', { class: 'sub' }, s.ekspresi || `${s.ekspresi_list.length} soal singkat`)),
      h('span', { class: 'status' }, p ? bintang(p.bintang) : buka ? '' : '🔒')));
    })),
  );
}

function cariSoal(soalId) {
  for (const lv of state.latihan || []) {
    const i = lv.soal.findIndex((s) => s.id === soalId);
    if (i >= 0) return { lv, soal: lv.soal[i], i };
  }
  return null;
}

export async function layarSoal(soalId) {
  const ketemu = cariSoal(soalId);
  const root = h('div', { class: 'layar' });
  if (!ketemu) return kosongkan(root, h('p', {}, 'Soal tidak ditemukan.'));
  const { lv, soal, i } = ketemu;
  if (!soalTerbuka(lv.id, i)) return kosongkan(root, h('p', {}, PESAN_KUNCI));

  const judul = h('div', {},
    h('p', { class: 'label-tahap' }, `${lv.nama} · Soal ${i + 1} dari ${lv.soal.length}`),
    h('h1', {}, MODE_LABEL[soal.mode]));
  const badan = h('div');
  root.append(judul, badan);

  const selesai = (hasil) => tampilHasil(root, { lv, soal, i }, hasil);

  if (soal.mode === 'contoh') {
    const d = await get(`/soal/${soal.id}/contoh`);
    badan.append(h('p', { class: 'keterangan' }, 'Perhatikan contoh ini langkah demi langkah. Tekan "Lanjut" kalau sudah siap.'));
    badan.append(ContohLangkah({
      langkah: d.langkah, item: soal.id, labelSelesai: 'Saya sudah paham',
      onSelesai: () => selesai({ kesalahan: 0, petunjukMaks: 0, riwayat: [] }),
    }).el);
  } else if (soal.mode === 'pilih') {
    badan.append(PilihLangkahPertama(soal, selesai));
  } else if (soal.mode === 'lengkapi') {
    const d = await get(`/soal/${soal.id}/contoh`);
    badan.append(h('p', { class: 'keterangan' }, 'Langkah awal dikerjakan sebagai contoh. Sisanya giliranmu!'));
    const awal = d.langkah.map((l) => ({ ...l, label: 'contoh' }));
    badan.append(ContohLangkah({
      langkah: d.langkah, item: soal.id, labelSelesai: 'Sekarang giliranku →',
      onSelesai: () => {
        kosongkan(badan, h('p', { class: 'keterangan' }, 'Lanjutkan sampai selesai.'),
          SolverLangkah({ token: d.sisa_token, item: soal.id, riwayatAwal: awal, onSelesai: (r) => setTimeout(() => selesai(r), 900) }).el);
      },
    }).el);
  } else {
    badan.append(SolverLangkah({ token: soal.token, item: soal.id, onSelesai: (r) => setTimeout(() => selesai(r), 900) }).el);
  }
  return root;
}

/** Mode B: ketuk operasi yang dikerjakan lebih dulu pada beberapa soal (IL01–IL03). */
function PilihLangkahPertama(soal, onSelesai) {
  const el = h('div');
  let k = 0;
  let kesalahan = 0;
  let sibuk = false;

  function render(tandaiSalah = null, sorot = null, sudahBenar = false) {
    const umpan = UmpanBalik();
    const tok = soal.token_list[k];
    const ketuk = sudahBenar ? null : async (i) => {
      if (sibuk) return;
      sibuk = true;
      try {
        const d = await post('/langkah/cek', { ekspresi: teksDari(tok), op_idx: i });
        catat({ item: soal.id, langkah: k + 1, jenis: 'pilih_langkah', isi: String(i), benar: d.benar, diagnosis: d.diagnosis });
        if (d.benar) {
          render(null, d.rentang, true);
          el.querySelector('.umpan-wadah').replaceChildren(umpanBenar(d));
        } else {
          kesalahan += 1;
          render(i);
          el.querySelector('.umpan-wadah').replaceChildren(umpanSalah(d));
        }
      } finally {
        sibuk = false;
      }
    };
    const terakhir = k === soal.token_list.length - 1;
    kosongkan(el,
      h('p', { class: 'label-tahap' }, `Soal ${k + 1} dari ${soal.token_list.length}`),
      h('p', { class: 'instruksi' }, 'Ketuk tanda operasi yang dikerjakan PALING DULU.'),
      renderEkspresi(tok, { ketuk, tandaiSalah, sorot }),
      h('div', { class: 'umpan-wadah' }, umpan.el),
      sudahBenar ? h('div', { class: 'aksi' }, h('button', {
        type: 'button', class: 'btn btn-utama',
        onclick: () => {
          if (terakhir) onSelesai({ kesalahan, petunjukMaks: 0, riwayat: [] });
          else { k += 1; render(); }
        },
      }, terakhir ? 'Selesai' : 'Soal berikutnya →')) : null);
  }

  const umpanBenar = (d) => {
    const u = UmpanBalik();
    u.tampil(true, `Tepat! ${d.operasi} dikerjakan dulu. `, ALASAN_PILIH[d.alasan]);
    return u.el;
  };
  const umpanSalah = (d) => {
    const u = UmpanBalik();
    u.tampil(false, d.pesan);
    return u.el;
  };

  render();
  return el;
}

async function tampilHasil(root, { lv, soal, i }, hasil) {
  const badan = h('div');
  kosongkan(root, h('h1', {}, 'Soal selesai!'), badan);
  let b = 1;
  try {
    const r = await post('/progres', { kode: state.kode, item: soal.id, kesalahan: hasil.kesalahan, petunjuk_maks: hasil.petunjukMaks });
    b = r.bintang;
    state.progres = r.progres;
  } catch (e) {
    badan.append(h('p', { class: 'galat' }, `Hasil belum tersimpan: ${e.message}`));
  }
  const pesan = b === 3 ? 'Sempurna — tanpa kesalahan!' : b === 2 ? 'Bagus! Sedikit lagi sempurna.' : 'Kamu berhasil menyelesaikannya. Coba soal sejenis untuk berlatih lagi.';
  const berikut = lv.soal[i + 1];

  badan.append(
    bintang(b, 3, true),
    h('p', { style: 'text-align:center' }, pesan),
    hasil.kesalahan ? h('p', { class: 'keterangan', style: 'text-align:center' }, `Percobaan yang belum tepat: ${hasil.kesalahan}. Tidak apa-apa — dari situ kita belajar.`) : null,
  );
  const wadahExtra = h('div');
  badan.append(wadahExtra);

  const aksi = h('div', { class: 'aksi' },
    berikut
      ? h('a', { class: 'btn btn-utama', href: `#/soal/${berikut.id}` }, 'Soal berikutnya →')
      : h('a', { class: 'btn btn-utama', href: '#/peta' }, 'Kembali ke peta'),
    hasil.riwayat.length ? h('button', { type: 'button', class: 'btn', onclick: () => cekUlang(wadahExtra, soal, hasil.riwayat) }, '✓ Cek ulang dari awal') : null,
    soal.ekspresi ? h('button', { type: 'button', class: 'btn', onclick: () => soalSejenis(wadahExtra, soal) }, '🔁 Soal sejenis') : null,
    h('a', { class: 'btn', href: `#/level/${lv.id}` }, 'Daftar soal'),
  );
  badan.append(aksi);
}

/** GL02: putar ulang langkah siswa sendiri dari awal. */
function cekUlang(wadah, soal, riwayat) {
  catat({ item: soal.id, jenis: 'cek_ulang' });
  const langkah = riwayat.map((r, i) => ({
    no: i + 1, sebelum: r.sebelum, rentang: r.rentang, operasi: r.operasi, hasil_teks: r.hasil_teks,
    sesudah: r.sesudah, alasan: r.alasan, penjelasan: ALASAN_PILIH[r.alasan],
  }));
  const kartu = h('div', { class: 'kartu' }, h('h2', {}, 'Cek ulang langkahmu'));
  kartu.append(ContohLangkah({ langkah, item: soal.id + ':cek', labelSelesai: 'Tutup', onSelesai: () => kartu.remove() }).el);
  kosongkan(wadah, kartu);
  kartu.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** GL05: pola sama, angka baru. Tidak memengaruhi bintang; dicatat di log. */
async function soalSejenis(wadah, soal) {
  try {
    const d = await post('/soal-sejenis', { ekspresi: soal.ekspresi });
    catat({ item: soal.id + ':sejenis', jenis: 'sejenis', isi: d.ekspresi });
    const kartu = h('div', { class: 'kartu' }, h('h2', {}, 'Soal sejenis'),
      h('p', { class: 'keterangan' }, 'Caranya sama, angkanya berbeda.'));
    kartu.append(SolverLangkah({
      token: d.token, item: soal.id + ':sejenis',
      onSelesai: () => kartu.append(h('div', { class: 'aksi' },
        h('button', { type: 'button', class: 'btn btn-utama', onclick: () => soalSejenis(wadah, soal) }, '🔁 Satu lagi'),
        h('button', { type: 'button', class: 'btn', onclick: () => kartu.remove() }, 'Tutup'))),
    }).el);
    kosongkan(wadah, kartu);
    kartu.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    kosongkan(wadah, h('p', { class: 'galat' }, e.message));
  }
}
