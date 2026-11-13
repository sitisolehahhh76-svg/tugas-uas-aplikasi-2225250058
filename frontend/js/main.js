// Router hash sederhana + layar masuk.
import { get, kirimLog, post } from './api.js';
import { h, kosongkan } from './ui/dom.js';
import { kodeTersimpan, simpanKode, state } from './state.js';
import { layarAturan } from './game/aturan.js';
import { layarLevel, layarSoal } from './game/latihan.js';
import { layarDaftarMisi, layarMisi } from './game/misi.js';
import { layarPemanasan } from './game/pemanasan.js';
import { layarPeta, layarRapor } from './game/peta.js';
import { layarPeneliti } from './game/peneliti.js';

const app = document.getElementById('app');
const bilah = document.getElementById('bilah');
let giliran = 0;

const RUTE = {
  peta: { judul: 'Peta Belajar', layar: layarPeta, kembali: null },
  aturan: { judul: 'Kartu Aturan', layar: layarAturan },
  pemanasan: { judul: 'Pemanasan', layar: layarPemanasan },
  level: { judul: 'Latihan', layar: layarLevel },
  soal: { judul: 'Latihan', layar: layarSoal, kembali: (id) => `#/level/${id.split('-')[0]}` },
  misi: { judul: 'Misi Literasi', layar: (id) => (id ? layarMisi(id) : layarDaftarMisi()), kembali: (id) => (id ? '#/misi' : '#/peta') },
  rapor: { judul: 'Rapor', layar: layarRapor },
  peneliti: { judul: 'Panel Peneliti', layar: layarPeneliti, tanpaMasuk: true },
};

async function masukDengan(kode) {
  const d = await post('/masuk', { kode });
  state.kode = d.kode;
  state.progres = d.progres;
  state.bukaSemua = d.buka_semua;
  state.lencana = d.lencana;
  state.latihan = await get('/latihan');
  simpanKode(d.kode);
  kirimLog();
}

function keluar() {
  kirimLog();
  state.kode = null;
  state.progres = {};
  simpanKode(null);
  location.hash = '#/masuk';
}

function layarMasuk() {
  const input = h('input', {
    class: 'isian', type: 'text', autocomplete: 'off', autocapitalize: 'characters', maxlength: '20',
    'aria-label': 'Kode siswa', placeholder: 'S01', style: 'width:100%',
  });
  const galat = h('p', { class: 'galat', role: 'alert' });
  const tombol = h('button', { type: 'submit', class: 'btn btn-utama btn-lebar' }, 'Masuk');
  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      galat.textContent = '';
      tombol.disabled = true;
      try {
        await masukDengan(input.value);
        location.hash = '#/peta';
      } catch (err) {
        galat.textContent = err.message;
      } finally {
        tombol.disabled = false;
      }
    },
  },
  h('label', { class: 'isian-label' }, 'Kode siswa'), input,
  h('p', { class: 'keterangan', style: 'margin-top:8px' }, 'Pakai kode dari gurumu, misalnya S01. Jangan tulis nama lengkap.'),
  galat, tombol);
  requestAnimationFrame(() => input.focus());
  return h('div', { class: 'layar' },
    h('h1', { style: 'margin-top:24px' }, 'HitungRuntut'),
    h('p', {}, 'Belajar operasi hitung campuran langkah demi langkah — kurung, kali-bagi, tambah-kurang.'),
    h('div', { class: 'kartu' }, form));
}

function gambarBilah(judul, kembali) {
  if (!state.kode) { bilah.replaceChildren(); return; }
  kosongkan(bilah,
    kembali ? h('a', { class: 'btn btn-kecil btn-teks', href: kembali, 'aria-label': 'Kembali' }, '←') : h('span', { style: 'width:44px' }),
    h('span', { class: 'judul-bilah' }, judul),
    h('button', { type: 'button', class: 'btn btn-kecil btn-teks kode', onclick: keluar, title: 'Keluar' }, `${state.kode} · Keluar`));
}

async function tampilkan() {
  const urut = ++giliran;
  const [, nama = '', ...arg] = (location.hash || '#/').slice(1).split('/');
  const rute = RUTE[nama];

  if (!state.kode && !(rute && rute.tanpaMasuk)) {
    const tersimpan = kodeTersimpan();
    if (tersimpan) {
      try { await masukDengan(tersimpan); } catch { simpanKode(null); }
    }
  }
  if (urut !== giliran) return;

  if (!rute || (!state.kode && !rute.tanpaMasuk)) {
    if (state.kode && nama !== 'peta') { location.hash = '#/peta'; return; }
    bilah.replaceChildren();
    kosongkan(app, layarMasuk());
    return;
  }

  const kembali = rute.kembali === undefined ? '#/peta' : typeof rute.kembali === 'function' ? rute.kembali(arg[0] || '') : rute.kembali;
  gambarBilah(rute.judul, kembali);
  kosongkan(app, h('p', { class: 'memuat' }, 'Memuat…'));
  try {
    const el = await rute.layar(...arg.map(decodeURIComponent));
    if (urut !== giliran) return;
    kosongkan(app, el);
  } catch (e) {
    if (urut !== giliran) return;
    kosongkan(app, h('div', { class: 'layar' },
      h('p', { class: 'galat' }, e.message),
      h('button', { type: 'button', class: 'btn btn-utama', onclick: tampilkan }, 'Coba lagi')));
  }
  window.scrollTo({ top: 0 });
  app.focus({ preventScroll: true });
}

window.addEventListener('hashchange', tampilkan);
tampilkan();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
