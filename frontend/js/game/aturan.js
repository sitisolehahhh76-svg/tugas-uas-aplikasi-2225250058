// Kartu aturan urutan operasi: aturan + alasan sederhana (EL05) + contoh bertahap (EL04).
import { get, post } from '../api.js';
import { h, kosongkan } from '../ui/dom.js';
import { renderEkspresi } from '../ui/ekspresi.js';
import { state } from '../state.js';
import { ContohLangkah } from './contoh.js';

export async function layarAturan() {
  const kartu = await get('/aturan');
  const root = h('div', { class: 'layar' });
  let k = 0;

  function render() {
    const a = kartu[k];
    const wadahContoh = h('div');
    const terakhir = k === kartu.length - 1;
    const keKartuBerikut = async () => {
      if (!terakhir) { k += 1; render(); window.scrollTo({ top: 0 }); return; }
      try {
        const r = await post('/progres', { kode: state.kode, item: 'aturan' });
        state.progres = r.progres;
      } catch { /* tetap lanjut; akan dicoba lagi lain kali */ }
      location.hash = '#/peta';
    };

    const mulaiContoh = () => kosongkan(wadahContoh, ContohLangkah({
      langkah: a.langkah, item: a.id, labelSelesai: terakhir ? 'Selesai, ke peta →' : 'Kartu berikutnya →',
      onSelesai: keKartuBerikut,
    }).el);

    kosongkan(root,
      h('p', { class: 'label-tahap' }, `Kartu ${k + 1} dari ${kartu.length}`),
      h('h1', {}, a.judul),
      renderEkspresi(a.token),
      h('div', { class: 'alasan' }, h('strong', {}, 'Kenapa begitu? '), a.kenapa),
      wadahContoh,
    );
    wadahContoh.append(h('div', { class: 'aksi' },
      h('button', { type: 'button', class: 'btn btn-utama', onclick: mulaiContoh }, 'Lihat contoh langkah demi langkah'),
      k > 0 ? h('button', { type: 'button', class: 'btn', onclick: () => { k -= 1; render(); } }, '← Kartu sebelumnya') : null,
    ));
  }

  render();
  return root;
}
