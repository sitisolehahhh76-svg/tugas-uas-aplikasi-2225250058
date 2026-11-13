// Misi Literasi: 4 soal kisi-kisi, dipecah per tahap rubrik. Satu bagian per layar.
// Skor dihitung dari percobaan pertama; siswa tetap boleh memperbaiki jawaban (GL04).
import { catat, get, post } from '../api.js';
import { angkaSkor, bintang, h, kosongkan, teksKaya } from '../ui/dom.js';
import { renderEkspresi } from '../ui/ekspresi.js';
import { inputAngka } from '../ui/angka.js';
import { Petunjuk, UmpanBalik } from '../ui/umpan.js';
import { state, zonaTerbuka } from '../state.js';
import { PESAN_KUNCI } from '../teks.js';
import { SolverLangkah } from './langkah.js';

export async function layarDaftarMisi() {
  if (!zonaTerbuka('misi')) return h('div', { class: 'layar' }, h('p', {}, PESAN_KUNCI));
  const daftar = await get('/misi');
  return h('div', { class: 'layar' },
    h('h1', {}, 'Misi Literasi'),
    h('p', { class: 'keterangan' }, 'Gunakan urutan operasi untuk menyelesaikan masalah sehari-hari. Kerjakan tahap demi tahap.'),
    h('ol', { class: 'daftar' }, daftar.map((m, i) => {
      const p = state.progres[m.id];
      return h('li', {}, h('a', { class: 'zona', href: `#/misi/${m.id}` },
        h('span', { class: 'nomor' }, String(i + 1)),
        h('span', { class: 'isi' },
          h('span', { class: 'nama' }, m.judul),
          h('span', { class: 'sub' }, `${m.indikator_nama} · ${m.jumlah_tahap} tahap`)),
        h('span', { class: 'status' }, p ? [bintang(p.bintang), h('br'), h('small', {}, `${angkaSkor(p.skor)}/${m.skor_maks}`)] : '')));
    })),
  );
}

export async function layarMisi(misiId) {
  if (!zonaTerbuka('misi')) return h('div', { class: 'layar' }, h('p', {}, PESAN_KUNCI));
  const misi = await get(`/misi/${misiId}`);
  const root = h('div', { class: 'layar' });

  // daftar datar semua bagian: [{tahap, bagianIdx, b}]
  const urutan = misi.tahap.flatMap((t) => t.bagian.map((b, i) => ({ tahap: t, bagianIdx: i, b })));
  const hasil = {}; // "tahap-bagian" -> {tahap, bagian, skor_awal|benar_pertama,total, petunjuk_maks}
  let pos = 0;

  function cerita(terbuka) {
    return h('details', { class: 'kartu cerita', open: terbuka },
      h('summary', {}, '📖 Cerita misi'),
      misi.cerita.map((c) => h('p', {}, teksKaya(c))));
  }

  function render() {
    const { tahap, bagianIdx, b } = urutan[pos];
    const kunci = `${tahap.no}-${bagianIdx}`;
    hasil[kunci] = hasil[kunci] || { tahap: tahap.no, bagian: bagianIdx, petunjuk_maks: 0 };
    const catatan = hasil[kunci];
    const itemLog = `${misi.id}:t${tahap.no}b${bagianIdx}`;

    const kemajuan = h('div', { class: 'kemajuan', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(misi.tahap.length), 'aria-valuenow': String(tahap.no - 1) },
      misi.tahap.map((t) => h('span', { class: t.no < tahap.no ? 'sudah' : '' })));
    const kepala = h('div', {},
      h('p', { class: 'label-tahap' }, `${misi.judul} · Tahap ${tahap.no} dari ${misi.tahap.length}`),
      kemajuan,
      h('h1', {}, tahap.judul));

    const lanjut = () => {
      if (pos < urutan.length - 1) { pos += 1; render(); window.scrollTo({ top: 0 }); } else selesai();
    };
    const tombolLanjut = () => h('div', { class: 'aksi' },
      h('button', { type: 'button', class: 'btn btn-utama', onclick: lanjut }, pos < urutan.length - 1 ? 'Lanjut →' : 'Lihat hasil'));

    let badan;
    if (b.tipe === 'hitung_langkah') {
      badan = h('div', {}, h('p', { class: 'isian-label' }, b.label));
      badan.append(SolverLangkah({
        token: b.token, item: itemLog, maksLangkah: b.maks_langkah || Infinity,
        onSelesai: (r) => {
          catatan.benar_pertama = r.benarPertama;
          catatan.total = r.total;
          catatan.petunjuk_maks = r.petunjukMaks;
          badan.append(tombolLanjut());
        },
      }).el);
    } else {
      badan = BagianInteraktif(misi, tahap, bagianIdx, b, catatan, itemLog, () => badan.append(tombolLanjut()));
    }

    kosongkan(root, kepala, cerita(pos === 0 || b.tipe === 'pilih_info'), badan);
  }

  async function selesai() {
    kosongkan(root, h('p', { class: 'memuat' }, 'Menghitung skor…'));
    try {
      const r = await post(`/misi/${misi.id}/selesai`, { kode: state.kode, hasil: Object.values(hasil) });
      state.progres[misi.id] = { bintang: r.bintang, skor: r.skor, skor_maks: r.skor_maks };
      kosongkan(root,
        h('h1', {}, 'Misi selesai!'),
        h('p', { class: 'keterangan' }, `${misi.judul} · ${misi.indikator_nama}`),
        bintang(r.bintang, 3, true),
        h('p', { style: 'text-align:center; font-size:1.3rem' }, h('strong', {}, `Skor ${angkaSkor(r.skor)} dari ${r.skor_maks}`)),
        r.skor !== r.skor_murni ? h('p', { class: 'keterangan', style: 'text-align:center' },
          `Skor tanpa potongan petunjuk: ${angkaSkor(r.skor_murni)}. Coba lagi tanpa petunjuk terakhir untuk skor penuh!`) : null,
        h('div', { class: 'kartu' }, h('table', {},
          h('thead', {}, h('tr', {}, h('th', {}, 'Tahap'), h('th', { class: 'angka' }, 'Skor'))),
          h('tbody', {}, r.per_tahap.map((t) => h('tr', {},
            h('td', {}, `${t.no}. ${t.judul}`),
            h('td', { class: 'angka' }, `${angkaSkor(t.skor)} / ${t.skor_maks}`)))))),
        h('div', { class: 'aksi' },
          h('a', { class: 'btn btn-utama', href: '#/misi' }, 'Daftar misi'),
          h('a', { class: 'btn', href: '#/rapor' }, 'Lihat rapor'),
          h('button', { type: 'button', class: 'btn', onclick: () => { pos = 0; for (const k in hasil) delete hasil[k]; render(); } }, 'Ulangi misi')));
    } catch (e) {
      kosongkan(root, h('p', { class: 'galat' }, e.message),
        h('button', { type: 'button', class: 'btn btn-utama', onclick: selesai }, 'Coba kirim lagi'));
    }
  }

  render();
  return root;
}

/** Bagian selain hitung_langkah: pilihan, isian, susun model, tunjuk. */
function BagianInteraktif(misi, tahap, bagianIdx, b, catatan, itemLog, onBenar) {
  const el = h('div');
  const umpan = UmpanBalik();
  let percobaan = 0;
  let tuntas = false;
  let sibuk = false;
  let ambilJawaban = () => null;

  const petunjuk = Petunjuk({
    ambil: (level) => get(`/misi/${misi.id}/petunjuk?tahap=${tahap.no}&bagian=${bagianIdx}&level=${level}`),
    onBuka: (level) => {
      catatan.petunjuk_maks = Math.max(catatan.petunjuk_maks, level);
      catat({ item: itemLog, jenis: 'petunjuk', isi: String(level) });
    },
  });

  async function periksa(jawabanLangsung) {
    if (tuntas || sibuk) return;
    const jawaban = jawabanLangsung !== undefined ? jawabanLangsung : ambilJawaban();
    if (jawaban === null || jawaban === '' || (Array.isArray(jawaban) && !jawaban.length)) {
      umpan.tampil(false, 'Pilih atau isi jawabanmu dulu, ya.');
      return;
    }
    sibuk = true;
    percobaan += 1;
    try {
      const d = await post(`/misi/${misi.id}/cek`, { tahap: tahap.no, bagian: bagianIdx, jawaban, percobaan });
      catat({ item: itemLog, langkah: percobaan, jenis: 'misi_cek', isi: JSON.stringify(jawaban).slice(0, 180), benar: d.benar, diagnosis: d.diagnosis });
      if (percobaan === 1) catatan.skor_awal = d.skor;
      const pembahasan = d.pembahasan ? h('span', { class: 'pembahasan' }, h('strong', {}, 'Pembahasan: '), d.pembahasan) : null;
      umpan.tampil(d.benar, d.pesan, pembahasan);
      if (d.benar || d.pembahasan) {
        tuntas = true;
        el.querySelectorAll('button.pilihan, button.ubin, button.bisa-ketuk, input.isian, .tombol-periksa').forEach((x) => { x.disabled = true; });
        onBenar();
      }
    } catch (e) {
      percobaan -= 1;
      umpan.tampil(false, e.message);
    } finally {
      sibuk = false;
    }
  }

  const pertanyaan = h('p', { class: 'isian-label' }, b.pertanyaan);
  let isi;

  if (b.tipe === 'pilih_info' || ['pilih_tanya', 'keputusan', 'alasan'].includes(b.tipe)) {
    const banyak = b.tipe === 'pilih_info';
    const dipilih = new Set();
    const tombol = b.pilihan.map((teks, i) => {
      const t = h('button', {
        type: 'button', class: 'pilihan', 'aria-pressed': 'false',
        onclick: () => {
          if (tuntas) return;
          if (banyak) { dipilih.has(i) ? dipilih.delete(i) : dipilih.add(i); } else { dipilih.clear(); dipilih.add(i); }
          tombol.forEach((x, j) => {
            x.setAttribute('aria-pressed', String(dipilih.has(j)));
            x.querySelector('.tanda').textContent = dipilih.has(j) ? (banyak ? '☑' : '●') : (banyak ? '☐' : '○');
          });
        },
      }, h('span', { class: 'tanda', 'aria-hidden': 'true' }, banyak ? '☐' : '○'), h('span', {}, teks));
      return t;
    });
    ambilJawaban = () => (banyak ? [...dipilih].sort((a, c) => a - c) : (dipilih.size ? [...dipilih][0] : null));
    isi = h('div', { class: 'pilihan-daftar', role: banyak ? 'group' : 'radiogroup', 'aria-label': b.pertanyaan }, tombol);
  } else if (b.tipe === 'isian') {
    const input = inputAngka({ label: b.pertanyaan, onEnter: () => periksa() });
    ambilJawaban = () => input.value;
    isi = h('div', { class: 'baris-jawab' }, h('span', {}, 'Rp'), input);
  } else if (b.tipe === 'susun_model') {
    isi = SusunModel(b.ubin, (fn) => { ambilJawaban = fn; });
  } else if (b.tipe === 'tunjuk') {
    const wadah = h('div');
    const gambar = (tandai = null) => kosongkan(wadah, renderEkspresi(b.token, {
      ketuk: (i) => { if (tuntas || sibuk) return; gambar(i); periksa(i); }, tandaiSalah: tandai,
    }));
    gambar();
    isi = wadah;
  }

  const butuhTombol = b.tipe !== 'tunjuk';
  el.append(
    pertanyaan, isi, umpan.el,
    butuhTombol ? h('div', { class: 'aksi' }, h('button', { type: 'button', class: 'btn btn-utama tombol-periksa', onclick: () => periksa() }, 'Periksa')) : null,
    petunjuk.el,
  );
  return el;
}

/** Menyusun kalimat matematika dari ubin (Formulating). Ubin boleh dipakai berulang. */
function SusunModel(ubin, daftarkanAmbil) {
  const susunan = [];
  const area = h('div', { class: 'model-area', 'aria-live': 'polite', 'aria-label': 'Kalimat matematika yang kamu susun' });
  const gambar = () => {
    if (!susunan.length) kosongkan(area, h('span', { class: 'kosong' }, 'Ketuk ubin di bawah untuk menyusun…'));
    else kosongkan(area, susunan.map((s) => h('span', { class: 'm-tok' }, s)));
  };
  daftarkanAmbil(() => susunan.join(' '));
  gambar();
  const ops = new Set(['×', '÷', '+', '−', '(', ')']);
  return h('div', {},
    area,
    h('div', { class: 'ubin-daftar' },
      ubin.map((u) => h('button', {
        type: 'button', class: 'ubin' + (ops.has(u) ? ' op' : ''), 'aria-label': `tambah ${u}`,
        onclick: () => { if (susunan.length < 30) { susunan.push(u); gambar(); } },
      }, u))),
    h('div', { class: 'ubin-daftar' },
      h('button', { type: 'button', class: 'ubin', onclick: () => { susunan.pop(); gambar(); } }, '⌫ Hapus'),
      h('button', { type: 'button', class: 'ubin', onclick: () => { susunan.length = 0; gambar(); } }, 'Kosongkan')),
  );
}
