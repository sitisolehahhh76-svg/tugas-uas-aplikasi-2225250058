// Panel peneliti/guru: rekap per kode siswa + ekspor CSV (dilindungi PIN).
import { get } from '../api.js';
import { h, kosongkan } from '../ui/dom.js';

const KOLOM = [
  ['kode', 'Kode'], ['item_selesai', 'Item selesai'], ['bintang', 'Bintang'], ['skor_misi', 'Skor misi'],
  ['kesalahan', 'Percobaan salah'], ['petunjuk', 'Petunjuk dibuka'], ['ulangi', 'Ulangi penjelasan'], ['cek_ulang', 'Cek ulang'],
];

export async function layarPeneliti() {
  const root = h('div', { class: 'layar' });
  const pin = h('input', { type: 'password', inputmode: 'numeric', class: 'isian', 'aria-label': 'PIN peneliti', autocomplete: 'off' });
  const hasil = h('div');
  const muat = async () => {
    try {
      const data = await get(`/peneliti/rekap?pin=${encodeURIComponent(pin.value)}`);
      const q = `pin=${encodeURIComponent(pin.value)}`;
      kosongkan(hasil,
        h('div', { class: 'aksi' },
          h('a', { class: 'btn', href: `/api/peneliti/ekspor.csv?${q}&tabel=progres` }, '⬇ CSV progres'),
          h('a', { class: 'btn', href: `/api/peneliti/ekspor.csv?${q}&tabel=log` }, '⬇ CSV log')),
        h('div', { class: 'tabel-gulir kartu' }, h('table', {},
          h('thead', {}, h('tr', {}, KOLOM.map(([, l]) => h('th', {}, l)), h('th', {}, 'Diagnosis kesalahan'))),
          h('tbody', {}, data.map((r) => h('tr', {},
            KOLOM.map(([k]) => h('td', { class: k === 'kode' ? '' : 'angka' }, String(r[k] ?? ''))),
            h('td', {}, Object.entries(r.diagnosis).map(([d, n]) => `${d}: ${n}`).join(', ') || '–'))))),
        ),
        data.length ? null : h('p', { class: 'keterangan' }, 'Belum ada data siswa.'));
    } catch (e) {
      kosongkan(hasil, h('p', { class: 'galat' }, e.message));
    }
  };
  pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') muat(); });
  root.append(
    h('h1', {}, 'Panel Peneliti'),
    h('p', { class: 'keterangan' }, 'Rekap aktivitas belajar per kode siswa. PIN diatur di file .env (PENELITI_PIN).'),
    h('div', { class: 'baris-jawab' }, pin, h('button', { type: 'button', class: 'btn btn-utama', onclick: muat }, 'Buka')),
    hasil);
  return root;
}
