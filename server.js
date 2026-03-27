/**
 * SIPAS Donggala — Backend API
 * Express + better-sqlite3
 * Jalankan: node server.js
 */

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── Database Setup ────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'sipas.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ────────────────────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS hero_stats (
  id INTEGER PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS neraca (
  id INTEGER PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  label TEXT,
  sub TEXT
);

CREATE TABLE IF NOT EXISTS armada (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  icon TEXT DEFAULT '🚛',
  jumlah INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'Unit · Pemda Kab. Donggala',
  ritasi TEXT DEFAULT '3×',
  volume TEXT DEFAULT '—',
  kepemilikan TEXT DEFAULT 'Pemda',
  status TEXT DEFAULT 'aktif',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fasilitas_tps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  icon TEXT DEFAULT '🏠',
  jumlah INTEGER DEFAULT 0,
  label TEXT,
  sub TEXT
);

CREATE TABLE IF NOT EXISTS tpa_info (
  id INTEGER PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jadwal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hari TEXT NOT NULL,
  wilayah TEXT NOT NULL,
  jam TEXT DEFAULT '🌅 Pagi 06.00–08.00 & 🌆 Sore 16.00–18.00 WITA',
  kecamatan TEXT DEFAULT 'banawa,banawaT',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS data_sampah (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kecamatan TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  timbulan_total REAL DEFAULT 0,
  layanan_uptd REAL DEFAULT 0,
  bank_sampah REAL DEFAULT 0,
  tpst REAL DEFAULT 0,
  tidak_terkelola REAL DEFAULT 0,
  persen_kelola REAL DEFAULT 0,
  populasi_estimasi INTEGER DEFAULT 0,
  catatan TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS kelurahan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kecamatan TEXT NOT NULL,
  nama TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS edukasi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  icon TEXT DEFAULT '♻️',
  tag TEXT NOT NULL,
  title TEXT NOT NULL,
  desc TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS kontak (
  id INTEGER PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS aduan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tiket TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  telp TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  kelurahan TEXT,
  shift TEXT,
  jenis TEXT NOT NULL,
  lokasi TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  status TEXT DEFAULT 'menunggu',
  catatan_admin TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// ─── Seed Data ─────────────────────────────────────────────────────────────
function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM hero_stats').get().c;
  if (count > 0) return;

  console.log('🌱 Seeding initial data...');

  // Hero Stats
  const insertHero = db.prepare('INSERT OR IGNORE INTO hero_stats (key,value,label) VALUES (?,?,?)');
  [
    ['penduduk', '49.000+', 'Jiwa Terlayani'],
    ['kecamatan', '2', 'Kecamatan Cakupan'],
    ['armada', '39', 'Unit Armada Aktif'],
    ['bank_sampah', '3', 'Bank Sampah Unit'],
  ].forEach(r => insertHero.run(...r));

  // Neraca
  const insertNeraca = db.prepare('INSERT OR IGNORE INTO neraca (key,value,unit,label,sub) VALUES (?,?,?,?,?)');
  [
    ['timbulan_total', 182.25, 'Ton/Hari', 'Total Timbulan Sampah Terlayani', 'Kec. Banawa + sebagian Banawa Tengah — estimasi BPLH 2025'],
    ['terkelola', 27.90, '%', 'Persentase Sampah Terkelola', '18,95 Ton/Hari UPT + 2,88 Bank Sampah + 0,04 TPST'],
    ['tidak_terkelola', 154.43, 'Ton/Hari', 'Sampah Tidak Terkelola', '~84,7% terbuang ke lingkungan — target pengelolaan perlu ditingkatkan'],
  ].forEach(r => insertNeraca.run(...r));

  // Armada
  const insertArmada = db.prepare('INSERT OR IGNORE INTO armada (nama,icon,jumlah,unit,ritasi,volume,kepemilikan,status,sort_order) VALUES (?,?,?,?,?,?,?,?,?)');
  [
    ['Gerobak Sampah', '🛒', 22, 'Unit · Pemda Kab. Donggala', '3×', '2 m³/hari', 'Pemda', 'aktif', 1],
    ['Motor Sampah 3 Roda', '🛵', 10, 'Unit · Pemda Kab. Donggala', '3×', '1,2 m³/hari', 'Pemda', 'aktif', 2],
    ['Dump Truck', '🚛', 4, 'Unit · Pemda Kab. Donggala', '3×', '6 m³/hari', 'Pemda', 'aktif', 3],
    ['Armroll Truck', '🚚', 3, 'Unit · Pemda Kab. Donggala', '3×', '6 m³/hari', 'Pemda', 'aktif', 4],
    ['Compactor', '🗜️', 0, 'Unit · Dalam Perencanaan', '—', '— m³/hari', 'Pemda', 'tidak_aktif', 5],
  ].forEach(r => insertArmada.run(...r));

  // Fasilitas TPS
  const insertTps = db.prepare('INSERT OR IGNORE INTO fasilitas_tps (nama,icon,jumlah,label,sub) VALUES (?,?,?,?,?)');
  [
    ['TPS Konvensional', '🏠', 2, 'TPS Konvensional / Transfer Depo', 'Tercatat · Kepemilikan Pemda Kab. Donggala'],
    ['Kontainer Sampah', '🗑️', 10, 'Kontainer Sampah', 'Tersebar di Kec. Banawa & Banawa Tengah'],
  ].forEach(r => insertTps.run(...r));

  // TPA Info
  const insertTpa = db.prepare('INSERT OR IGNORE INTO tpa_info (key,value) VALUES (?,?)');
  [
    ['nama', 'TPA Kabonga Besar'],
    ['status', 'Operasional'],
    ['dasar_hukum', 'Perbup No. 1 Tahun 2018 tentang Pembentukan Susunan Organisasi UPT Dinas LH Kab. Donggala'],
    ['cakupan', 'Kecamatan Banawa (18,95 Ton/Hari) dan sebagian Banawa Tengah (5,95 Ton/Hari)'],
    ['sdm', '1 Orang Kepala UPT — Dinas Lingkungan Hidup Kab. Donggala'],
    ['fasilitas', 'Penanganan Gas, GCL (Geomembrane Clay Liner), Controled Landfill, LTP (Leachate Treatment Plant), Sumur Pantau'],
    ['kondisi', 'Controlled Landfill — Bak Equalisasi, Anaerob, Vakultatif, Maturasi, Constructed Wetland'],
    ['biaya_operasional', 'Rp 1.401.800.000'],
    ['bank_sampah_induk', '2,80'],
    ['bsu_jumlah', '3'],
    ['bsu_volume', '0,08'],
    ['tpst_jumlah', '2'],
    ['tpst_volume', '0,04'],
    ['apbd', 'Rp 1.610.118.444.000'],
    ['alokasi_sampah', 'Rp 1.805.520.000'],
    ['proporsi_apbd', '0,11%'],
    ['kepala_dinas', 'Dra. ARITATRIANA, M.Si'],
    ['nip_kepala_dinas', '19740414 199311 2 001'],
    ['sumber_data', 'BPLH & DLH · Nov 2025'],
  ].forEach(r => insertTpa.run(...r));

  // Jadwal
  const insertJadwal = db.prepare('INSERT OR IGNORE INTO jadwal (hari,wilayah,jam,kecamatan,sort_order) VALUES (?,?,?,?,?)');
  [
    ['Senin', 'Kel. Kabonga Besar|Kel. Kabonga Kecil|Kel. Boya|Kel. Gunung Bale|📍 Sebagian Desa Towale (Banawa Tengah)', '🌅 Pagi 06.00–08.00 & 🌆 Sore 16.00–18.00 WITA', 'banawa,banawaT', 1],
    ['Selasa', 'Kel. Maleni|Kel. Tibo|Kel. Donggala Kodi|📍 Desa Loli Saluran (Banawa Tengah)', '🌅 Pagi 06.00–08.00 & 🌆 Sore 16.00–18.00 WITA', 'banawa,banawaT', 2],
    ['Rabu', 'Kel. Labuan Bajo|Kel. Boneoge|Kel. Ganti|📍 Desa Wani I (Banawa Tengah)', '🌅 Pagi 06.00–08.00 & 🌆 Sore 16.00–18.00 WITA', 'banawa,banawaT', 3],
    ['Kamis', 'Kel. Kabonga Besar|Kel. Kabonga Kecil|Kel. Boya|📍 Desa Wani II (Banawa Tengah)', '🌅 Pagi 06.00–08.00 & 🌆 Sore 16.00–18.00 WITA', 'banawa,banawaT', 4],
    ['Jumat', 'Kel. Gunung Bale|Kel. Maleni|Kel. Tibo|Kel. Donggala Kodi|📍 Desa Loli Saluran & Towale (Banawa Tengah)', '🌅 Pagi 06.00–08.00 & 🌆 Sore 16.00–18.00 WITA', 'banawa,banawaT', 5],
    ['Sabtu', 'Kel. Labuan Bajo|Kel. Boneoge|Kel. Ganti|Bank Sampah Unit — Penerimaan Setoran|📍 Seluruh Desa Banawa Tengah (Gotong Royong)', '🌅 Pagi 06.00–08.00 & 🌆 Sore 16.00–18.00 WITA', 'banawa,banawaT', 6],
    ['Minggu', 'Libur Pengangkutan Reguler|TPST Beroperasi (mandiri)', '—', '', 7],
  ].forEach(r => insertJadwal.run(...r));

  // Data Sampah
  const insertDs = db.prepare('INSERT OR IGNORE INTO data_sampah (kecamatan,label,timbulan_total,layanan_uptd,bank_sampah,tpst,tidak_terkelola,persen_kelola,populasi_estimasi,catatan) VALUES (?,?,?,?,?,?,?,?,?,?)');
  [
    ['Banawa', 'Kec. Banawa', 154.15, 18.95, 2.88, 0.04, 132.28, 25.26, 37900, 'Pusat cakupan layanan UPT Persampahan Kabonga Besar. Termasuk SMP Negeri 1 Banawa (Bank Sampah) dan SMA 1 Banawa (BSI).'],
    ['Banawa Tengah', 'Kec. Banawa Tengah', 28.10, 5.95, 0, 0, 22.15, 21.17, 11100, 'Sebagian dilayani UPT Persampahan Kabonga Besar. Komunitas di Desa Towale secara rutin melakukan gotong royong kebersihan.'],
  ].forEach(r => insertDs.run(...r));

  // Kelurahan
  const insertKel = db.prepare('INSERT OR IGNORE INTO kelurahan (kecamatan,nama,sort_order) VALUES (?,?,?)');
  const kelBanawa = ['Kel. Kabonga Besar','Kel. Kabonga Kecil','Kel. Boya','Kel. Gunung Bale','Kel. Maleni','Kel. Tibo','Kel. Donggala Kodi','Kel. Labuan Bajo','Kel. Boneoge','Kel. Ganti','Desa Tolongano','Desa Limboro','Desa Nupa Bomba','Desa Surumana'];
  const kelBT = ['Desa Towale','Desa Loli Saluran','Desa Loli Pesua','Desa Loli Oge','Desa Wani I','Desa Wani II','Desa Wani III','Desa Wani IV','Desa Lero','Desa Dalaka'];
  kelBanawa.forEach((n, i) => insertKel.run('banawa', n, i));
  kelBT.forEach((n, i) => insertKel.run('banawa_tengah', n, i));

  // Edukasi
  const insertEdu = db.prepare('INSERT OR IGNORE INTO edukasi (type,icon,tag,title,desc,sort_order) VALUES (?,?,?,?,?,?)');
  [
    ['organic', '🥦', 'Organik', 'Sampah Organik', 'Sisa makanan, sayuran, dan bahan alami. Di Donggala, Bank Sampah Induk mengelola 2,80 ton/hari sampah jenis ini menjadi kompos.', 1],
    ['anorganic', '🧴', 'Anorganik', 'Sampah Anorganik', 'Plastik, logam, kaca yang dapat didaur ulang. Program daur ulang aktif di SMP Negeri 2 Banawa dan SMA 1 Banawa.', 2],
    ['b3', '☠️', 'Limbah B3', 'Limbah Berbahaya (B3)', 'Baterai, cat, oli bekas. Serahkan ke petugas DLH Kab. Donggala untuk pengelolaan khusus. Jangan dibuang sembarangan.', 3],
    ['recycle', '🏦', 'Bank Sampah', 'Bank Sampah Unit', '3 BSU aktif di Donggala termasuk di SMA 1 Banawa. Setorkan sampah bernilai (plastik, kertas, logam) untuk mendapatkan poin atau uang tunai.', 4],
    ['program', '🤝', 'Program TAKE', 'Program TAKE (Insentif Desa)', 'Skema tata kelola anggaran daerah Pemkab Donggala — memberikan insentif finansial kepada desa yang berhasil menerapkan kebijakan pro-lingkungan.', 5],
    ['program', '🏘️', 'Gotong Royong', 'Kerja Bakti Massal', 'Pemkab Donggala rutin mengadakan kerja bakti massal di Kec. Banawa dan sekitarnya untuk menggaungkan semangat gotong royong menjaga kebersihan.', 6],
  ].forEach(r => insertEdu.run(...r));

  // Kontak
  const insertKontak = db.prepare('INSERT OR IGNORE INTO kontak (key,value,label) VALUES (?,?,?)');
  [
    ['wa_upt', '6285319323427', 'WhatsApp UPT Persampahan'],
    ['nama_upt', 'UPT Persampahan Kabonga Besar', 'Nama Unit'],
    ['alamat_upt', 'Kabonga Besar, Kec. Banawa, Kab. Donggala', 'Alamat UPT'],
    ['jam_operasi', 'Senin–Sabtu · Pagi 06.00–08.00 & Sore 16.00–18.00 WITA', 'Jam Operasi'],
  ].forEach(r => insertKontak.run(...r));

  console.log('✅ Seed complete.');
}

seedIfEmpty();

// ═══════════════════════════════════════════════════════════════════
// ROUTES — PUBLIC API (digunakan oleh frontend SIPAS)
// ═══════════════════════════════════════════════════════════════════

// GET all data for frontend in one call
app.get('/api/public/all', (req, res) => {
  try {
    const heroStats = db.prepare('SELECT * FROM hero_stats').all();
    const neraca = db.prepare('SELECT * FROM neraca').all();
    const armada = db.prepare('SELECT * FROM armada ORDER BY sort_order').all();
    const fasilitasTps = db.prepare('SELECT * FROM fasilitas_tps').all();
    const tpaInfo = db.prepare('SELECT key, value FROM tpa_info').all();
    const jadwal = db.prepare('SELECT * FROM jadwal ORDER BY sort_order').all();
    const dataSampah = db.prepare('SELECT * FROM data_sampah').all();
    const kelurahan = db.prepare('SELECT * FROM kelurahan ORDER BY kecamatan, sort_order').all();
    const edukasi = db.prepare('SELECT * FROM edukasi ORDER BY sort_order').all();
    const kontak = db.prepare('SELECT * FROM kontak').all();

    // Transform tpaInfo ke object
    const tpaObj = {};
    tpaInfo.forEach(r => { tpaObj[r.key] = r.value; });

    // Transform jadwal — wilayah pipe-separated
    const jadwalFormatted = jadwal.map(j => ({
      ...j,
      wilayah: j.wilayah.split('|'),
      kec: j.kecamatan ? j.kecamatan.split(',').filter(Boolean) : []
    }));

    // Transform data_sampah ke object keyed by kecamatan
    const dataSampahObj = {};
    dataSampah.forEach(d => { dataSampahObj[d.kecamatan] = d; });

    // Transform kelurahan ke grouped object
    const kelGrouped = {};
    kelurahan.forEach(k => {
      if (!kelGrouped[k.kecamatan]) kelGrouped[k.kecamatan] = [];
      kelGrouped[k.kecamatan].push(k.nama);
    });

    res.json({
      heroStats,
      neraca,
      armada,
      fasilitasTps,
      tpa: tpaObj,
      jadwal: jadwalFormatted,
      dataSampah: dataSampahObj,
      kelurahan: kelGrouped,
      edukasi,
      kontak: Object.fromEntries(kontak.map(k => [k.key, k.value]))
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST aduan
app.post('/api/aduan', (req, res) => {
  try {
    const { tiket, nama, telp, kecamatan, kelurahan, shift, jenis, lokasi, deskripsi } = req.body;
    if (!tiket || !nama || !telp || !kecamatan || !jenis || !lokasi || !deskripsi) {
      return res.status(400).json({ error: 'Field tidak lengkap' });
    }
    const stmt = db.prepare(`
      INSERT INTO aduan (tiket,nama,telp,kecamatan,kelurahan,shift,jenis,lokasi,deskripsi)
      VALUES (?,?,?,?,?,?,?,?,?)
    `);
    stmt.run(tiket, nama, telp, kecamatan, kelurahan || '', shift || '', jenis, lokasi, deskripsi);
    res.json({ success: true, tiket });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET tracking aduan
app.get('/api/aduan/:tiket', (req, res) => {
  try {
    const aduan = db.prepare('SELECT * FROM aduan WHERE tiket = ?').get(req.params.tiket);
    if (!aduan) return res.status(404).json({ error: 'Tiket tidak ditemukan' });
    res.json(aduan);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ROUTES — ADMIN API
// ═══════════════════════════════════════════════════════════════════

const adminAuth = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (token !== (process.env.ADMIN_TOKEN || 'sipas-admin-2025')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// ── Hero Stats ──
app.get('/api/admin/hero-stats', adminAuth, (req, res) => res.json(db.prepare('SELECT * FROM hero_stats').all()));
app.put('/api/admin/hero-stats/:id', adminAuth, (req, res) => {
  const { value, label } = req.body;
  db.prepare('UPDATE hero_stats SET value=?, label=? WHERE id=?').run(value, label, req.params.id);
  res.json({ success: true });
});

// ── Neraca ──
app.get('/api/admin/neraca', adminAuth, (req, res) => res.json(db.prepare('SELECT * FROM neraca').all()));
app.put('/api/admin/neraca/:id', adminAuth, (req, res) => {
  const { value, unit, label, sub } = req.body;
  db.prepare('UPDATE neraca SET value=?, unit=?, label=?, sub=? WHERE id=?').run(value, unit, label, sub, req.params.id);
  res.json({ success: true });
});

// ── Armada ──
app.get('/api/admin/armada', adminAuth, (req, res) => res.json(db.prepare('SELECT * FROM armada ORDER BY sort_order').all()));
app.post('/api/admin/armada', adminAuth, (req, res) => {
  const { nama, icon, jumlah, unit, ritasi, volume, kepemilikan, status } = req.body;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM armada').get().m || 0;
  const r = db.prepare('INSERT INTO armada (nama,icon,jumlah,unit,ritasi,volume,kepemilikan,status,sort_order) VALUES (?,?,?,?,?,?,?,?,?)').run(nama, icon, jumlah, unit, ritasi, volume, kepemilikan, status, maxOrder + 1);
  res.json({ success: true, id: r.lastInsertRowid });
});
app.put('/api/admin/armada/:id', adminAuth, (req, res) => {
  const { nama, icon, jumlah, unit, ritasi, volume, kepemilikan, status } = req.body;
  db.prepare('UPDATE armada SET nama=?,icon=?,jumlah=?,unit=?,ritasi=?,volume=?,kepemilikan=?,status=? WHERE id=?').run(nama, icon, jumlah, unit, ritasi, volume, kepemilikan, status, req.params.id);
  res.json({ success: true });
});
app.delete('/api/admin/armada/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM armada WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ── Fasilitas TPS ──
app.get('/api/admin/fasilitas-tps', adminAuth, (req, res) => res.json(db.prepare('SELECT * FROM fasilitas_tps').all()));
app.put('/api/admin/fasilitas-tps/:id', adminAuth, (req, res) => {
  const { nama, icon, jumlah, label, sub } = req.body;
  db.prepare('UPDATE fasilitas_tps SET nama=?,icon=?,jumlah=?,label=?,sub=? WHERE id=?').run(nama, icon, jumlah, label, sub, req.params.id);
  res.json({ success: true });
});

// ── TPA Info ──
app.get('/api/admin/tpa', adminAuth, (req, res) => res.json(db.prepare('SELECT * FROM tpa_info').all()));
app.put('/api/admin/tpa/:key', adminAuth, (req, res) => {
  const { value } = req.body;
  db.prepare('UPDATE tpa_info SET value=? WHERE key=?').run(value, req.params.key);
  res.json({ success: true });
});

// ── Jadwal ──
app.get('/api/admin/jadwal', adminAuth, (req, res) => res.json(db.prepare('SELECT * FROM jadwal ORDER BY sort_order').all()));
app.post('/api/admin/jadwal', adminAuth, (req, res) => {
  const { hari, wilayah, jam, kecamatan } = req.body;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM jadwal').get().m || 0;
  const r = db.prepare('INSERT INTO jadwal (hari,wilayah,jam,kecamatan,sort_order) VALUES (?,?,?,?,?)').run(hari, wilayah, jam, kecamatan, maxOrder + 1);
  res.json({ success: true, id: r.lastInsertRowid });
});
app.put('/api/admin/jadwal/:id', adminAuth, (req, res) => {
  const { hari, wilayah, jam, kecamatan } = req.body;
  db.prepare('UPDATE jadwal SET hari=?,wilayah=?,jam=?,kecamatan=? WHERE id=?').run(hari, wilayah, jam, kecamatan, req.params.id);
  res.json({ success: true });
});
app.delete('/api/admin/jadwal/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM jadwal WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ── Data Sampah ──
app.get('/api/admin/data-sampah', adminAuth, (req, res) => res.json(db.prepare('SELECT * FROM data_sampah').all()));
app.put('/api/admin/data-sampah/:id', adminAuth, (req, res) => {
  const { label, timbulan_total, layanan_uptd, bank_sampah, tpst, tidak_terkelola, persen_kelola, populasi_estimasi, catatan } = req.body;
  db.prepare('UPDATE data_sampah SET label=?,timbulan_total=?,layanan_uptd=?,bank_sampah=?,tpst=?,tidak_terkelola=?,persen_kelola=?,populasi_estimasi=?,catatan=? WHERE id=?')
    .run(label, timbulan_total, layanan_uptd, bank_sampah, tpst, tidak_terkelola, persen_kelola, populasi_estimasi, catatan, req.params.id);
  res.json({ success: true });
});

// ── Kelurahan ──
app.get('/api/admin/kelurahan', adminAuth, (req, res) => res.json(db.prepare('SELECT * FROM kelurahan ORDER BY kecamatan, sort_order').all()));
app.post('/api/admin/kelurahan', adminAuth, (req, res) => {
  const { kecamatan, nama } = req.body;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM kelurahan WHERE kecamatan=?').get(kecamatan).m || 0;
  const r = db.prepare('INSERT INTO kelurahan (kecamatan,nama,sort_order) VALUES (?,?,?)').run(kecamatan, nama, maxOrder + 1);
  res.json({ success: true, id: r.lastInsertRowid });
});
app.put('/api/admin/kelurahan/:id', adminAuth, (req, res) => {
  const { nama } = req.body;
  db.prepare('UPDATE kelurahan SET nama=? WHERE id=?').run(nama, req.params.id);
  res.json({ success: true });
});
app.delete('/api/admin/kelurahan/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM kelurahan WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ── Edukasi ──
app.get('/api/admin/edukasi', adminAuth, (req, res) => res.json(db.prepare('SELECT * FROM edukasi ORDER BY sort_order').all()));
app.post('/api/admin/edukasi', adminAuth, (req, res) => {
  const { type, icon, tag, title, desc } = req.body;
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM edukasi').get().m || 0;
  const r = db.prepare('INSERT INTO edukasi (type,icon,tag,title,desc,sort_order) VALUES (?,?,?,?,?,?)').run(type, icon, tag, title, desc, maxOrder + 1);
  res.json({ success: true, id: r.lastInsertRowid });
});
app.put('/api/admin/edukasi/:id', adminAuth, (req, res) => {
  const { type, icon, tag, title, desc } = req.body;
  db.prepare('UPDATE edukasi SET type=?,icon=?,tag=?,title=?,desc=? WHERE id=?').run(type, icon, tag, title, desc, req.params.id);
  res.json({ success: true });
});
app.delete('/api/admin/edukasi/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM edukasi WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ── Kontak ──
app.get('/api/admin/kontak', adminAuth, (req, res) => res.json(db.prepare('SELECT * FROM kontak').all()));
app.put('/api/admin/kontak/:key', adminAuth, (req, res) => {
  const { value, label } = req.body;
  db.prepare('UPDATE kontak SET value=?, label=? WHERE key=?').run(value, label, req.params.key);
  res.json({ success: true });
});

// ── Aduan Management ──
app.get('/api/admin/aduan', adminAuth, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM aduan';
  let countQuery = 'SELECT COUNT(*) as total FROM aduan';
  const params = [];
  if (status) {
    query += ' WHERE status=?';
    countQuery += ' WHERE status=?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const aduan = db.prepare(query).all(...params, limit, offset);
  const total = db.prepare(countQuery).get(...params).total;
  res.json({ aduan, total, page: +page, limit: +limit });
});

app.put('/api/admin/aduan/:id/status', adminAuth, (req, res) => {
  const { status, catatan_admin } = req.body;
  db.prepare('UPDATE aduan SET status=?, catatan_admin=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(status, catatan_admin || '', req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/aduan/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM aduan WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ── Dashboard Stats ──
app.get('/api/admin/dashboard-stats', adminAuth, (req, res) => {
  const totalAduan = db.prepare('SELECT COUNT(*) as c FROM aduan').get().c;
  const menunggu = db.prepare("SELECT COUNT(*) as c FROM aduan WHERE status='menunggu'").get().c;
  const proses = db.prepare("SELECT COUNT(*) as c FROM aduan WHERE status='proses'").get().c;
  const selesai = db.prepare("SELECT COUNT(*) as c FROM aduan WHERE status='selesai'").get().c;
  const recentAduan = db.prepare('SELECT * FROM aduan ORDER BY created_at DESC LIMIT 5').all();
  res.json({ totalAduan, menunggu, proses, selesai, recentAduan });
});

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║  🗑️  SIPAS Donggala — Backend Server     ║
║  Running on http://localhost:${PORT}       ║
║  Admin Token: sipas-admin-2025           ║
╚══════════════════════════════════════════╝
  `);
});
