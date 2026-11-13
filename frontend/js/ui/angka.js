// Isian angka: keyboard numerik, titik ribuan otomatis saat mengetik (DS03).
import { h } from './dom.js';

export function formatRibuan(s) {
  const d = String(s).replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12);
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function inputAngka({ label = 'Jawaban', onEnter } = {}) {
  const el = h('input', {
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'off',
    enterkeyhint: 'done',
    class: 'isian',
    'aria-label': label,
  });
  el.addEventListener('input', () => {
    el.value = formatRibuan(el.value);
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter?.();
    }
  });
  return el;
}
