// Menampilkan ekspresi sebagai token yang bisa ditandai (highlight) dan diketuk.
// Ekspresi dipecah per "suku" (dipisah + / − tingkat atas) agar ekspresi panjang
// turun baris di tempat yang bermakna (EL01). Isi kurung diberi bingkai biru (IL02).
import { h } from './dom.js';

const NAMA_OP = { '×': 'kali', '÷': 'bagi', '+': 'tambah', '−': 'kurang' };

export function teksDari(token) {
  return token.map((t) => t.teks).join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
}

/**
 * @param {Array<{jenis:string, teks:string}>} token
 * @param {{sorot?:number[]|null, ketuk?:(i:number)=>void, tandaiSalah?:number|null, baru?:number|null, kecil?:boolean}} opsi
 */
export function renderEkspresi(token, opsi = {}) {
  const { sorot = null, ketuk = null, tandaiSalah = null, baru = null, kecil = false } = opsi;
  const akar = h('div', {
    class: 'ekspresi' + (kecil ? ' kecil' : ''),
    role: ketuk ? 'group' : 'math',
    'aria-label': (ketuk ? 'Ketuk tanda operasi: ' : '') + teksDari(token),
  });
  let suku = h('span', { class: 'suku' });
  akar.append(suku);
  const tumpukan = [suku];

  const tokEl = (t, i) => {
    const kelas = ['tok', t.jenis === 'angka' ? 'angka' : t.jenis === 'op' ? 'op' : 'kurung'];
    if (sorot && i >= sorot[0] && i <= sorot[1]) {
      kelas.push('aktif');
      if (i === sorot[0]) kelas.push('aktif-awal');
      if (i === sorot[1]) kelas.push('aktif-akhir');
    }
    if (tandaiSalah === i) kelas.push('salah');
    if (baru === i) kelas.push('baru');
    if (ketuk && t.jenis === 'op') {
      const kiri = token[i - 1]?.teks ?? '';
      const kanan = token[i + 1]?.teks ?? '';
      return h('button', {
        type: 'button',
        class: kelas.join(' ') + ' bisa-ketuk',
        dataset: { idx: String(i) },
        'aria-label': `${NAMA_OP[t.teks]}, di antara ${kiri} dan ${kanan}`,
        onclick: () => ketuk(i),
      }, t.teks);
    }
    return h('span', { class: kelas.join(' '), dataset: { idx: String(i) }, 'aria-hidden': 'true' }, t.teks);
  };

  token.forEach((t, i) => {
    if (tumpukan.length === 1 && t.jenis === 'op' && (t.teks === '+' || t.teks === '−') && suku.childNodes.length) {
      suku = h('span', { class: 'suku' });
      akar.append(suku);
      tumpukan[0] = suku;
    }
    // bagian yang dikerjakan (a op b) dibungkus satu kotak sorot
    if (sorot && i === sorot[0]) {
      const kotak = h('span', { class: 'sorot' });
      tumpukan[tumpukan.length - 1].append(kotak);
      tumpukan.push(kotak);
    }
    const wadah = tumpukan[tumpukan.length - 1];
    if (sorot && i === sorot[1]) {
      wadah.append(tokEl(t, i));
      tumpukan.pop();
      return;
    }
    if (t.jenis === '(') {
      const g = h('span', { class: 'grup-kurung' });
      wadah.append(g);
      tumpukan.push(g);
      g.append(tokEl(t, i));
    } else if (t.jenis === ')') {
      wadah.append(tokEl(t, i));
      tumpukan.pop();
    } else {
      wadah.append(tokEl(t, i));
    }
  });
  return akar;
}

/** Indeks angka baru setelah satu langkah (memperhitungkan kurung yang hilang). */
export function idxBaru(langkah) {
  const hilang = (langkah.sebelum.length - 2 - langkah.sesudah.length) / 2;
  return langkah.rentang[0] - hilang;
}
