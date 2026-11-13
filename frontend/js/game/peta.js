// Peta belajar: zona terbuka bertahap. Rapor & lencana.
import { get } from '../api.js';
import { angkaSkor, bintang, h } from '../ui/dom.js';
import { bintangLevel, levelSelesai, selesai, state, zonaTerbuka } from '../state.js';
import { LENCANA_IKON, ZONA } from '../teks.js';

function statusZona(z) {
  if (!zonaTerbuka(z.id)) return '🔒';
  if (['dasar', 'sedang', 'lanjutan'].includes(z.id)) {
    const [b, maks] = bintangLevel(z.id);
    return levelSelesai(z.id) ? `★ ${b}/${maks}` : b ? `★ ${b}/${maks}` : 'Mulai';
  }
  if (z.id === 'misi') {
    const n = ['misi-1', 'misi-2', 'misi-3', 'misi-4'].filter(selesai).length;
    return `${n}/4`;
  }
  return selesai(z.id) ? '✓' : 'Mulai';
}

export async function layarPeta() {
  return h('div', { class: 'layar' },
    h('h1', {}, `Halo, ${state.kode}!`),
    h('p', { class: 'keterangan' }, 'Ikuti jalurnya dari atas ke bawah. Tidak ada batas waktu — belajarlah dengan tenang.'),
    h('ol', { class: 'daftar' }, ZONA.map((z, i) => {
      const buka = zonaTerbuka(z.id);
      return h('li', {}, h(buka ? 'a' : 'div', { class: 'zona', href: buka ? z.href : null, 'aria-disabled': buka ? null : 'true' },
        h('span', { class: 'nomor', 'aria-hidden': 'true' }, i === 0 ? '·' : String(i)),
        h('span', { class: 'isi' }, h('span', { class: 'nama' }, z.nama), h('span', { class: 'sub' }, z.sub)),
        h('span', { class: 'status' }, statusZona(z))));
    })),
    h('div', { class: 'aksi' }, h('a', { class: 'btn btn-lebar', href: '#/rapor' }, '📊 Rapor & lencana')),
  );
}

export async function layarRapor() {
  const r = await get(`/rapor/${encodeURIComponent(state.kode)}`);
  const sudahMisi = r.misi.filter((m) => m.skor != null);
  const total = sudahMisi.reduce((n, m) => n + m.skor, 0);
  return h('div', { class: 'layar' },
    h('h1', {}, 'Rapor'),
    h('section', { class: 'kartu' },
      h('h2', {}, 'Latihan'),
      r.level.map((l) => h('div', { style: 'margin-bottom:12px' },
        h('div', { style: 'display:flex;justify-content:space-between;gap:8px' },
          h('span', {}, l.nama), h('span', { class: 'keterangan' }, `${l.selesai}/${l.jumlah} soal · ★ ${l.bintang}/${l.bintang_maks}`)),
        h('div', { class: 'batang', 'aria-hidden': 'true' }, h('span', { style: `width:${(100 * l.bintang) / l.bintang_maks}%` }))))),
    h('section', { class: 'kartu' },
      h('h2', {}, 'Misi literasi per indikator'),
      r.misi.map((m) => h('div', { style: 'margin-bottom:12px' },
        h('div', { style: 'display:flex;justify-content:space-between;gap:8px' },
          h('span', {}, h('strong', {}, m.indikator_nama), h('br'), h('small', { class: 'keterangan' }, m.judul)),
          h('span', {}, m.skor == null ? h('span', { class: 'keterangan' }, 'belum') : [`${angkaSkor(m.skor)}/${m.skor_maks} `, bintang(m.bintang)])),
        h('div', { class: 'batang', 'aria-hidden': 'true' }, h('span', { style: `width:${(100 * (m.skor || 0)) / m.skor_maks}%` })))),
      sudahMisi.length ? h('p', {}, h('strong', {}, `Total: ${angkaSkor(total)} dari 24`)) : null,
      sudahMisi.length > 1 ? h('p', { class: 'keterangan' }, `Indikator yang paling perlu dilatih: ${[...sudahMisi].sort((a, b) => a.skor - b.skor)[0].indikator_nama}.`) : null),
    h('section', { class: 'kartu' },
      h('h2', {}, 'Lencana'),
      h('ul', { class: 'daftar' }, r.lencana.map((l) => h('li', { class: 'lencana' + (l.dapat ? '' : ' belum') },
        h('span', { class: 'ikon', 'aria-hidden': 'true' }, LENCANA_IKON[l.id] || '★'),
        h('span', {}, h('strong', {}, l.nama + (l.dapat ? '' : ' (belum)')), h('br'), h('small', { class: 'keterangan' }, l.syarat)))))),
    h('div', { class: 'aksi' }, h('a', { class: 'btn btn-utama', href: '#/peta' }, 'Kembali ke peta')),
  );
}
