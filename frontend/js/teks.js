// Semua teks UI tetap di satu tempat agar mudah direvisi.

export const ALASAN_LABEL = {
  kurung: 'isi kurung dulu',
  'kali-bagi': '× ÷ dari kiri',
  'tambah-kurang': '+ − dari kiri',
};

export const ALASAN_PILIH = {
  kurung: 'Isi tanda kurung selalu dikerjakan paling dulu.',
  'kali-bagi': '× dan ÷ didahulukan dari + dan −, dan yang paling kiri dikerjakan dulu.',
  'tambah-kurang': 'Tinggal + dan −, jadi dikerjakan dari kiri ke kanan.',
};

export const MODE_LABEL = {
  contoh: 'Tonton contoh',
  pilih: 'Pilih langkah pertama',
  lengkapi: 'Lengkapi contoh',
  mandiri: 'Kerjakan sendiri',
};

export const ZONA = [
  { id: 'pemanasan', nama: 'Pemanasan × dan ÷', sub: 'Opsional · 8 soal fakta dasar', href: '#/pemanasan' },
  { id: 'aturan', nama: 'Kartu Aturan', sub: 'Urutan operasi dan alasannya', href: '#/aturan' },
  { id: 'dasar', nama: 'Latihan Dasar', sub: 'Dua operasi', href: '#/level/dasar' },
  { id: 'sedang', nama: 'Latihan Sedang', sub: 'Tiga operasi, ada kurung', href: '#/level/sedang' },
  { id: 'lanjutan', nama: 'Latihan Lanjutan', sub: 'Empat operasi & bilangan ribuan', href: '#/level/lanjutan' },
  { id: 'misi', nama: 'Misi Literasi', sub: '4 masalah sehari-hari', href: '#/misi' },
];

export const PESAN_KUNCI = 'Selesaikan bagian sebelumnya dulu untuk membuka ini.';

export const LENCANA_IKON = {
  'penjaga-kurung': '( )',
  'kiri-ke-kanan': '→',
  'pemeriksa-teliti': '✓✓',
  mandiri: '★',
};
