// Pembungkus fetch + antrean log belajar (tetap tersimpan saat offline).
import { state } from './state.js';

export async function api(path, { method = 'GET', body } = {}) {
  let r;
  try {
    r = await fetch('/api' + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Tidak terhubung ke server. Periksa internet atau Wi-Fi kamu.');
  }
  let j;
  try {
    j = await r.json();
  } catch {
    throw new Error('Server sedang bermasalah. Coba lagi sebentar.');
  }
  if (!j.ok) throw new Error(j.pesan || 'Terjadi kesalahan.');
  return j.data;
}

export const get = (p) => api(p);
export const post = (p, body) => api(p, { method: 'POST', body });

// ---------- log ----------
const KUNCI_LOG = 'hr_log_antre';
let pewaktu = null;

function bacaAntre() {
  try { return JSON.parse(localStorage.getItem(KUNCI_LOG) || '[]'); } catch { return []; }
}
function tulisAntre(a) {
  try { localStorage.setItem(KUNCI_LOG, JSON.stringify(a.slice(-2000))); } catch { /* penyimpanan penuh/diblokir */ }
}

/** Catat aktivitas: {item, langkah, jenis, isi, benar, diagnosis}. */
export function catat(entri) {
  const a = bacaAntre();
  a.push({ waktu: new Date().toISOString(), ...entri });
  tulisAntre(a);
  // throttle: kirim paling lambat 4 detik setelah entri pertama, walau siswa terus aktif
  if (!pewaktu) {
    pewaktu = setTimeout(() => { pewaktu = null; kirimLog(); }, 4000);
  }
}

export async function kirimLog() {
  const a = bacaAntre();
  if (!a.length || !state.kode || !navigator.onLine) return;
  try {
    await post('/log', { kode: state.kode, entri: a });
    // hapus hanya yang sudah terkirim (entri baru mungkin masuk saat menunggu)
    tulisAntre(bacaAntre().slice(a.length));
  } catch { /* coba lagi nanti */ }
}

window.addEventListener('online', kirimLog);
window.addEventListener('pagehide', () => {
  const a = bacaAntre();
  if (!a.length || !state.kode) return;
  const ok = navigator.sendBeacon?.('/api/log', new Blob([JSON.stringify({ kode: state.kode, entri: a })], { type: 'application/json' }));
  if (ok) tulisAntre([]);
});
