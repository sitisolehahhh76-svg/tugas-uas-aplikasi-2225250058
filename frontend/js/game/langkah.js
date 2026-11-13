// Pengerjaan mandiri satu langkah per layar (IL04):
//   1) ketuk operasi yang dikerjakan dulu → diperiksa server (diagnosis IL01–IL03)
//   2) isi hasil bagian yang ditandai     → diperiksa server (SALAH_FAKTA / LEWAT_LANGKAH)
// Ringkasan langkah selesai selalu terlihat. Petunjuk 3 tingkat, tanpa timer.
import { catat, post } from '../api.js';
import { h, kosongkan } from '../ui/dom.js';
import { renderEkspresi, teksDari } from '../ui/ekspresi.js';
import { inputAngka } from '../ui/angka.js';
import { Petunjuk, RingkasanLangkah, UmpanBalik } from '../ui/umpan.js';
import { ALASAN_LABEL } from '../teks.js';
import { ContohLangkah } from './contoh.js';

/**
 * @param {{
 *   token: any[], item: string, maksLangkah?: number, riwayatAwal?: any[],
 *   onSelesai: (hasil:{benarPertama:number,total:number,kesalahan:number,petunjukMaks:number,riwayat:any[],hasilAkhir:string|null}) => void
 * }} p
 */
export function SolverLangkah({ token, item, maksLangkah = Infinity, riwayatAwal = [], onSelesai }) {
  let tok = token;
  let fase = 'pilih';
  let opIdx = null;
  let rentang = null;
  let sorotPetunjuk = null;
  let tandaiSalah = null;
  let langkahKe = 0;
  let salahLangkahIni = 0;
  let benarPertama = 0;
  let kesalahan = 0;
  let petunjukMaks = 0;
  let sibuk = false;
  const riwayat = [...riwayatAwal];
  const riwayatSiswa = [];

  const el = h('div', { class: 'solver' });
  const umpan = UmpanBalik();
  const wadahEkspresi = h('div');
  const instruksi = h('p', { class: 'instruksi', 'aria-live': 'polite' });
  const wadahJawab = h('div');
  const wadahBantuan = h('div');
  const wadahRingkasan = h('div');
  let petunjuk = buatPetunjuk();

  function buatPetunjuk() {
    return Petunjuk({
      ambil: (level) => post('/langkah/petunjuk', { ekspresi: teksDari(tok), level }),
      onBuka: (level, d) => {
        petunjukMaks = Math.max(petunjukMaks, level);
        catat({ item, langkah: langkahKe + 1, jenis: 'petunjuk', isi: String(level) });
        if (d.rentang && fase === 'pilih') { sorotPetunjuk = d.rentang; gambarEkspresi(); }
      },
    });
  }

  function gambarEkspresi() {
    kosongkan(wadahEkspresi, renderEkspresi(tok, {
      sorot: fase === 'jawab' ? rentang : sorotPetunjuk,
      ketuk: fase === 'pilih' ? pilih : null,
      tandaiSalah,
    }));
  }

  function render() {
    instruksi.textContent = fase === 'pilih'
      ? `Langkah ${langkahKe + 1}: ketuk tanda operasi yang dikerjakan lebih dulu.`
      : `Langkah ${langkahKe + 1}: hitung bagian yang ditandai.`;
    gambarEkspresi();
    if (fase === 'jawab') {
      const a = tok[rentang[0]].teks;
      const op = tok[opIdx].teks;
      const b = tok[rentang[1]].teks;
      const isian = inputAngka({ label: `Hasil ${a} ${op} ${b}`, onEnter: () => jawab(isian.value) });
      kosongkan(wadahJawab,
        h('div', { class: 'baris-jawab' }, h('span', {}, `${a} ${op} ${b} =`), isian),
        h('div', { class: 'aksi' },
          h('button', { type: 'button', class: 'btn btn-utama', onclick: () => jawab(isian.value) }, 'Periksa'),
          h('button', { type: 'button', class: 'btn', onclick: batalPilih }, '← Pilih ulang')));
      requestAnimationFrame(() => isian.focus());
    } else {
      wadahJawab.replaceChildren();
    }
    kosongkan(wadahRingkasan, RingkasanLangkah(riwayat));
  }

  function batalPilih() {
    fase = 'pilih'; rentang = null; opIdx = null; umpan.bersih(); render();
  }

  function salah(d, diagnosisIdx = null) {
    kesalahan += 1;
    salahLangkahIni += 1;
    tandaiSalah = diagnosisIdx;
    umpan.tampil(false, d.pesan);
    if (salahLangkahIni >= 3) tawarkanContohMirip();
  }

  async function pilih(i) {
    if (sibuk) return;
    sibuk = true;
    try {
      const d = await post('/langkah/cek', { ekspresi: teksDari(tok), op_idx: i });
      catat({ item, langkah: langkahKe + 1, jenis: 'pilih_langkah', isi: String(i), benar: d.benar, diagnosis: d.diagnosis });
      if (d.benar) {
        fase = 'jawab'; opIdx = i; rentang = d.rentang; tandaiSalah = null; sorotPetunjuk = null;
        umpan.tampil(true, d.pesan);
        render();
      } else {
        salah(d, i);
        gambarEkspresi();
      }
    } catch (e) {
      umpan.tampil(false, e.message);
    } finally {
      sibuk = false;
    }
  }

  async function jawab(nilai) {
    if (sibuk) return;
    if (!nilai) { umpan.tampil(false, 'Isi dulu hasilnya, ya.'); return; }
    sibuk = true;
    try {
      const d = await post('/langkah/cek', { ekspresi: teksDari(tok), op_idx: opIdx, jawaban: nilai });
      catat({ item, langkah: langkahKe + 1, jenis: 'jawab', isi: nilai, benar: d.benar, diagnosis: d.diagnosis });
      if (!d.benar) { salah(d); return; }

      if (salahLangkahIni === 0) {
        benarPertama += 1;
        if (d.alasan === 'kurung') catat({ item, jenis: 'kurung_benar' });
        if (d.alasan === 'kali-bagi') catat({ item, jenis: 'kalibagi_benar' });
      }
      const catatan = { sebelum: tok, rentang, operasi: d.operasi, hasil_teks: d.hasil_teks, alasan: d.alasan, label: ALASAN_LABEL[d.alasan], sesudah: d.sesudah };
      riwayat.push(catatan);
      riwayatSiswa.push(catatan);
      tok = d.sesudah;
      langkahKe += 1;
      salahLangkahIni = 0;
      fase = 'pilih'; rentang = null; opIdx = null; tandaiSalah = null; sorotPetunjuk = null;
      wadahBantuan.replaceChildren();
      petunjuk = buatPetunjuk();
      pasangBantuan();

      if (d.selesai || langkahKe >= maksLangkah) {
        umpan.tampil(true, d.pesan);
        instruksi.textContent = d.selesai ? 'Semua langkah selesai!' : 'Bagian ini selesai!';
        kosongkan(wadahEkspresi, renderEkspresi(tok, { baru: d.selesai ? 0 : null }));
        wadahJawab.replaceChildren();
        wadahBantuan.replaceChildren();
        kosongkan(wadahRingkasan, RingkasanLangkah(riwayat));
        onSelesai({
          benarPertama, total: langkahKe, kesalahan, petunjukMaks,
          riwayat: riwayatSiswa, hasilAkhir: d.selesai ? d.hasil_teks : null,
        });
        return;
      }
      umpan.tampil(true, `Benar! ${d.operasi} = ${d.hasil_teks}. Lanjut ke langkah berikutnya.`);
      render();
    } catch (e) {
      umpan.tampil(false, e.message);
    } finally {
      sibuk = false;
    }
  }

  function tawarkanContohMirip() {
    if (wadahBantuan.querySelector('.tawar-mirip')) return;
    wadahBantuan.append(h('button', {
      type: 'button', class: 'btn btn-lebar tawar-mirip',
      onclick: async () => {
        try {
          const d = await post('/contoh-mirip', { ekspresi: teksDari(tok) });
          catat({ item, jenis: 'contoh_mirip', isi: d.ekspresi });
          const dialog = h('div', { class: 'kartu' }, h('h3', {}, 'Contoh soal mirip'));
          const c = ContohLangkah({
            langkah: d.langkah, item: item + ':mirip', labelSelesai: 'Kembali ke soalku',
            onSelesai: () => { dialog.remove(); },
          });
          dialog.append(c.el);
          wadahBantuan.prepend(dialog);
          dialog.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
          umpan.tampil(false, e.message);
        }
      },
    }, '📖 Tonton contoh soal yang mirip'));
  }

  function pasangBantuan() {
    wadahBantuan.prepend(petunjuk.el);
  }

  el.append(instruksi, wadahEkspresi, umpan.el, wadahJawab, wadahBantuan, wadahRingkasan);
  pasangBantuan();
  render();
  return { el };
}
