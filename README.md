# SIPAS Donggala — Sistem Informasi Pengelolaan Sampah
## Panduan Setup Backend + Admin Dashboard

---

## 📁 Struktur Proyek

```
sipas/
├── backend/
│   ├── server.js       ← Backend API (Express + SQLite)
│   ├── package.json    ← Dependencies Node.js
│   └── sipas.db        ← Database SQLite (auto-dibuat saat pertama run)
└── frontend/
    ├── admin.html      ← Admin Dashboard (buka langsung di browser)
    └── SIPAS_Donggala_v2.html  ← Frontend publik (salin dari file asli)
```

---

## 🚀 Cara Menjalankan

### 1. Install Node.js
Download dari https://nodejs.org (minimal v18)

### 2. Install Dependencies Backend
```bash
cd sipas/backend
npm install
```

### 3. Jalankan Server Backend
```bash
node server.js
```
Server berjalan di: **http://localhost:3001**

### 4. Buka Admin Dashboard
Buka file `frontend/admin.html` langsung di browser.

Default login token: `sipas-admin-2025`

---

## 🔐 Keamanan

Ubah token admin sebelum deployment production:
```bash
ADMIN_TOKEN=token_rahasia_anda node server.js
```

Lalu update token di Admin Dashboard → Pengaturan API.

---

## 🌐 API Endpoints

### Public (tanpa auth)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/public/all` | Semua data untuk frontend |
| POST | `/api/aduan` | Submit aduan baru |
| GET | `/api/aduan/:tiket` | Cek status aduan |

### Admin (header: `x-admin-token: TOKEN`)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admin/dashboard-stats` | Statistik dashboard |
| GET/PUT | `/api/admin/hero-stats/:id` | Statistik hero |
| GET/PUT | `/api/admin/neraca/:id` | Data neraca |
| GET/POST/PUT/DELETE | `/api/admin/armada/:id` | Manajemen armada |
| GET/PUT | `/api/admin/tpa/:key` | Info TPA |
| GET/POST/PUT/DELETE | `/api/admin/jadwal/:id` | Jadwal pengangkutan |
| GET/PUT | `/api/admin/data-sampah/:id` | Data timbulan |
| GET/POST/PUT/DELETE | `/api/admin/kelurahan/:id` | Daftar kelurahan |
| GET/POST/PUT/DELETE | `/api/admin/edukasi/:id` | Konten edukasi |
| GET/PUT | `/api/admin/kontak/:key` | Info kontak |
| GET/PUT/DELETE | `/api/admin/aduan/...` | Manajemen aduan |

---

## 📡 Integrasi Frontend ke Backend

Tambahkan script berikut di `SIPAS_Donggala_v2.html` untuk memuat data dari backend:

```javascript
const API = 'http://localhost:3001';

async function loadFromBackend() {
  try {
    const res = await fetch(API + '/api/public/all');
    const data = await res.json();
    
    // Update data global
    Object.assign(JADWAL_DATA, { semua: data.jadwal });
    Object.assign(dataSampah, data.dataSampah);
    Object.assign(KELURAHAN_DATA, data.kelurahan);
    
    // Update kontak WA
    if (data.kontak.wa_upt) {
      document.querySelectorAll('a[href^="https://wa.me/"]').forEach(el => {
        el.href = el.href.replace(/wa\.me\/\d+/, 'wa.me/' + data.kontak.wa_upt);
      });
    }
    
    // Re-render jadwal
    renderJadwal(JADWAL_DATA.semua);
  } catch (e) {
    console.warn('Backend tidak terhubung, menggunakan data statis.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadFromBackend();
  // ... kode init lainnya
});
```

---

## 🏗️ Deployment Production

### Menggunakan PM2 (recommended)
```bash
npm install -g pm2
pm2 start server.js --name sipas-backend
pm2 startup
pm2 save
```

### Environment Variables
```bash
PORT=3001
ADMIN_TOKEN=password_kuat_anda
```

---

*SIPAS Donggala — Sistem Informasi Pengelolaan Sampah Kabupaten Donggala*
*Dikembangkan untuk Dinas Lingkungan Hidup Kab. Donggala*
