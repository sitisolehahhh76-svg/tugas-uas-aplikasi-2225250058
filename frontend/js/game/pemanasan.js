// Pemanasan fakta dasar × dan ÷ (IL05). Tanpa timer.
import { catat, get, post } from '../api.js';
import { h, kosongkan } from '../ui/dom.js';
import { teksDari } from '../ui/ekspresi.js';
import { inputAngka } from '../ui/angka.js';
import { UmpanBalik } from '../ui/umpan.js';
import { state } from '../state.js';

export async function layarPemanasan() {
  const soal = await get('/pemanasan');
  const root = h('div', { class: 'layar' });
  let k = 0;
  let benarPertama = 0;

  function render() {
    const s = soal[k];
    const umpan = UmpanBalik();
    let salahSini = 0;
    let tuntas = false;
    const input = inputAngka({ label: `Hasil ${s.ekspresi}`, onEnter: () => periksa() });
    const tombol = h('button', { type: 'button', class: 'btn btn-utama', onclick: () => periksa() }, 'Periksa');
    const aksi = h('div', { class: 'aksi' }, tombol);

    async function periksa() {
      if (tuntas) return;
      if (!input.value) { umpan.tampil(false, 'Isi dulu jawabannya, ya.'); return; }
      try {
        const d = await post('/langkah/cek', { ekspresi: teksDari(s.token), op_idx: 1, jawaban: input.value });
        catat({ item: 'pemanasan', langkah: k + 1, jenis: 'jawab', isi: input.value, benar: d.benar, diagnosis: d.diagnosis });
        if (!d.benar) {
          salahSini += 1;
          umpan.tampil(false, salahSini >= 2 && s.ekspresi.includes('÷')
            ? `Ingat: ${s.ekspresi} artinya "berapa kali ${s.token[2].teks} supaya jadi ${s.token[0].teks}?"`
            : 'Belum tepat. Coba hitung lagi pelan-pelan.');
          return;
        }
        tuntas = true;
        if (salahSini === 0) benarPertama += 1;
        umpan.tampil(true, `Benar! ${s.ekspresi} = ${d.hasil_teks}`);
        input.disabled = true;
        kosongkan(aksi, h('button', {
          type: 'button', class: 'btn btn-utama',
          onclick: () => { if (k < soal.length - 1) { k += 1; render(); } else akhir(); },
        }, k < soal.length - 1 ? 'Berikutnya →' : 'Selesai'));
        aksi.querySelector('button').focus();
      } catch (e) {
        umpan.tampil(false, e.message);
      }
    }

    kosongkan(root,
      h('p', { class: 'label-tahap' }, `Soal ${k + 1} dari ${soal.length}`),
      h('h1', {}, 'Pemanasan × dan ÷'),
      h('div', { class: 'baris-jawab' }, h('span', {}, `${s.ekspresi} =`), input),
      umpan.el, aksi);
    requestAnimationFrame(() => input.focus());
  }

  async function akhir() {
    try {
      const r = await post('/progres', { kode: state.kode, item: 'pemanasan' });
      state.progres = r.progres;
    } catch { /* abaikan */ }
    kosongkan(root,
      h('h1', {}, 'Pemanasan selesai!'),
      h('p', {}, `Benar pada percobaan pertama: ${benarPertama} dari ${soal.length}.`),
      benarPertama < soal.length ? h('p', { class: 'keterangan' }, 'Fakta perkalian yang kuat membuat langkah berikutnya lebih ringan. Ulangi kapan saja.') : null,
      h('div', { class: 'aksi' },
        h('a', { class: 'btn btn-utama', href: '#/peta' }, 'Kembali ke peta'),
        h('button', { type: 'button', class: 'btn', onclick: async () => { const baru = await get('/pemanasan'); soal.splice(0, soal.length, ...baru); k = 0; benarPertama = 0; render(); } }, 'Ulangi dengan soal baru')));
  }

  render();
  return root;
}
