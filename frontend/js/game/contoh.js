// Contoh bertahap (worked example). Maju hanya saat siswa menekan "Lanjut" (EL02),
// setiap langkah dua tahap: (1) tandai bagian + alasan, (2) tampilkan hasil (EL04, EL05).
import { catat } from '../api.js';
import { h, kosongkan } from '../ui/dom.js';
import { idxBaru, renderEkspresi } from '../ui/ekspresi.js';
import { RingkasanLangkah } from '../ui/umpan.js';
import { ALASAN_LABEL } from '../teks.js';

/**
 * @param {{langkah:any[], item?:string, labelSelesai?:string, onSelesai:()=>void, ulangiLabel?:string}} p
 */
export function ContohLangkah({ langkah, item = '', labelSelesai = 'Selesai', onSelesai }) {
  const n = langkah.length;
  let pos = 0; // 0..2n
  const el = h('div', { class: 'contoh' });

  const ringkas = (sampai) => langkah.slice(0, sampai).map((l) => ({
    operasi: l.operasi, hasil_teks: l.hasil_teks, label: ALASAN_LABEL[l.alasan],
  }));

  function render() {
    const k = Math.floor(pos / 2);
    let isi;
    let jumlahSelesai;
    if (pos >= 2 * n) {
      const akhir = langkah[n - 1];
      jumlahSelesai = n;
      isi = [
        h('p', { class: 'instruksi' }, 'Selesai!'),
        renderEkspresi(akhir.sesudah, { baru: 0 }),
        h('p', { class: 'keterangan', style: 'text-align:center' }, `Hasil akhirnya ${akhir.hasil_teks}.`),
      ];
    } else if (pos % 2 === 0) {
      const l = langkah[k];
      jumlahSelesai = k;
      isi = [
        h('p', { class: 'instruksi' }, `Langkah ${k + 1} dari ${n}: bagian yang ditandai dikerjakan dulu.`),
        renderEkspresi(l.sebelum, { sorot: l.rentang }),
        h('p', { class: 'alasan' }, h('strong', {}, 'Kenapa? '), l.penjelasan),
      ];
    } else {
      const l = langkah[k];
      jumlahSelesai = k + 1;
      isi = [
        h('p', { class: 'instruksi' }, `Langkah ${k + 1} dari ${n}`),
        renderEkspresi(l.sebelum, { sorot: l.rentang, kecil: true }),
        h('p', { class: 'hitungan' }, `${l.operasi} = `, h('strong', {}, l.hasil_teks)),
        h('p', { class: 'panah', 'aria-hidden': 'true' }, '↓'),
        renderEkspresi(l.sesudah, { baru: idxBaru(l) }),
      ];
    }

    const akhir = pos >= 2 * n;
    const tombol = h('div', { class: 'aksi' },
      akhir
        ? h('button', { type: 'button', class: 'btn btn-utama', onclick: onSelesai }, labelSelesai)
        : h('button', { type: 'button', class: 'btn btn-utama', onclick: () => { pos += 1; render(); } }, 'Lanjut →'),
      pos > 0 ? h('button', { type: 'button', class: 'btn', onclick: () => { pos -= 1; render(); } }, '← Kembali') : null,
      pos > 0 ? h('button', {
        type: 'button', class: 'btn',
        onclick: () => { catat({ item, jenis: 'ulangi', isi: String(pos) }); pos = 0; render(); },
      }, '↺ Ulangi penjelasan') : null,
    );

    kosongkan(el, isi, RingkasanLangkah(ringkas(jumlahSelesai)), tombol);
  }

  render();
  return { el };
}
