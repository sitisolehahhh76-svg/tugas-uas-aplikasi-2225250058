// Pembuat elemen DOM kecil. Semua teks dimasukkan sebagai textContent (aman).

export function h(tag, attrs = {}, ...anak) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  tambah(el, anak);
  return el;
}

function tambah(el, anak) {
  for (const a of anak.flat(Infinity)) {
    if (a == null || a === false) continue;
    el.append(a instanceof Node ? a : String(a));
  }
}

export function kosongkan(el, ...anak) {
  el.replaceChildren();
  tambah(el, anak);
  return el;
}

/** Teks dengan **tebal** dan `ekspresi` → daftar node. */
export function teksKaya(s) {
  const hasil = [];
  const re = /\*\*(.+?)\*\*|`(.+?)`/g;
  let i = 0;
  let m;
  while ((m = re.exec(s))) {
    if (m.index > i) hasil.push(s.slice(i, m.index));
    hasil.push(m[1] != null ? h('strong', {}, m[1]) : h('code', { class: 'ekspr-inline' }, m[2]));
    i = re.lastIndex;
  }
  if (i < s.length) hasil.push(s.slice(i));
  return hasil;
}

export function bintang(n, maks = 3, besar = false) {
  n = Math.max(0, Math.min(maks, n || 0));
  return h('span', { class: 'bintang' + (besar ? ' besar' : ''), role: 'img', 'aria-label': `${n} dari ${maks} bintang` },
    '★'.repeat(n), h('span', { class: 'bintang-kosong' }, '☆'.repeat(maks - n)));
}

export function angkaSkor(x) {
  return Number.isInteger(x) ? String(x) : String(x).replace('.', ',');
}

export function fokus(el) {
  requestAnimationFrame(() => el?.focus?.({ preventScroll: false }));
}
