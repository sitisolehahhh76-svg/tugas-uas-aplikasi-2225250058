// Status sesi siswa dan aturan membuka zona.

export const state = {
  kode: null,
  progres: {},
  bukaSemua: false,
  lencana: [],
  latihan: null, // daftar level dari /api/latihan
};

const KUNCI_KODE = 'hr_kode';

export function kodeTersimpan() {
  try { return localStorage.getItem(KUNCI_KODE); } catch { return null; }
}
export function simpanKode(kode) {
  try {
    if (kode) localStorage.setItem(KUNCI_KODE, kode);
    else localStorage.removeItem(KUNCI_KODE);
  } catch { /* abaikan */ }
}

export const selesai = (id) => !!state.progres[id];
export const level = (id) => state.latihan?.find((l) => l.id === id);
export const levelSelesai = (id) => !!level(id) && level(id).soal.every((s) => selesai(s.id));

export function zonaTerbuka(zona) {
  if (state.bukaSemua) return true;
  switch (zona) {
    case 'pemanasan':
    case 'aturan':
      return true;
    case 'dasar':
      return selesai('aturan');
    case 'sedang':
      return levelSelesai('dasar');
    case 'lanjutan':
      return levelSelesai('sedang');
    case 'misi':
      return levelSelesai('lanjutan');
    default:
      return false;
  }
}

/** Soal ke-i dalam level terbuka bila soal sebelumnya sudah selesai (urutan contoh → mandiri). */
export function soalTerbuka(levelId, i) {
  if (state.bukaSemua || i === 0) return zonaTerbuka(levelId);
  return zonaTerbuka(levelId) && selesai(level(levelId).soal[i - 1].id);
}

export function bintangLevel(id) {
  const lv = level(id);
  if (!lv) return [0, 0];
  return [lv.soal.reduce((n, s) => n + (state.progres[s.id]?.bintang || 0), 0), lv.soal.length * 3];
}
