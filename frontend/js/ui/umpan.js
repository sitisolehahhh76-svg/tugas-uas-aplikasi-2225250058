// Umpan balik dan petunjuk bertingkat.
import { h, kosongkan } from './dom.js';

export function UmpanBalik() {
  const el = h('div', { class: 'umpan', role: 'status', 'aria-live': 'polite' });
  return {
    el,
    tampil(benar, pesan, tambahan = null) {
      el.className = 'umpan ' + (benar ? 'benar' : 'salah');
      kosongkan(el,
        h('span', { class: 'umpan-ikon', 'aria-hidden': 'true' }, benar ? '✓' : '!'),
        h('span', {}, pesan, tambahan));
    },
    info(...isi) {
      el.className = 'umpan info';
      kosongkan(el, h('span', {}, ...isi));
    },
    bersih() {
      el.className = 'umpan';
      el.replaceChildren();
    },
  };
}

/**
 * Petunjuk 3 tingkat (arah → aturan → setengah jawaban). Jawaban akhir tidak pernah diberikan.
 * @param {{ambil:(level:number)=>Promise<{teks:string}>, onBuka?:(level:number, data:any)=>void}} p
 */
export function Petunjuk({ ambil, onBuka }) {
  let level = 0;
  const isi = h('div', { class: 'petunjuk-isi', 'aria-live': 'polite' });
  const tombol = h('button', { type: 'button', class: 'btn btn-kecil' });
  const el = h('div', { class: 'petunjuk' }, tombol, isi);

  function perbarui() {
    tombol.textContent = level >= 3 ? '💡 Semua petunjuk sudah dibuka' : `💡 Petunjuk ${level + 1} dari 3`;
    tombol.disabled = level >= 3;
  }
  tombol.addEventListener('click', async () => {
    if (level >= 3) return;
    tombol.disabled = true;
    try {
      const d = await ambil(level + 1);
      level += 1;
      isi.append(h('p', { class: 'petunjuk-baris' }, h('strong', {}, `Petunjuk ${level}: `), d.teks));
      onBuka?.(level, d);
    } catch (e) {
      isi.append(h('p', { class: 'galat' }, e.message));
    }
    perbarui();
  });
  perbarui();
  return {
    el,
    get level() { return level; },
    reset() { level = 0; isi.replaceChildren(); perbarui(); },
  };
}

export function RingkasanLangkah(riwayat, judul = 'Langkah yang sudah selesai') {
  if (!riwayat.length) return h('div');
  return h('section', { class: 'ringkasan', 'aria-label': judul },
    h('h3', {}, judul),
    h('ol', {}, riwayat.map((r, i) =>
      h('li', {},
        h('span', {}, `✓ ${i + 1}. ${r.operasi} = `, h('strong', {}, r.hasil_teks)),
        r.label ? h('span', { class: 'label-alasan' }, r.label) : null))));
}
