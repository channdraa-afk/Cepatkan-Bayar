# ☕ CepatkanBayar — Sistem Kasir & Pesan Mandiri Bazar

> **"Koleksi memori transaksi yang hangat, cepat, dan tanpa hambatan di tengah hiruk-pikuk bazar."**

[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](#)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](#)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?logo=supabase&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

---

## 🌿 Detail Misi Proyek
Proyek ini dibangun sebagai bagian dari misi **"Menghijaukan GitHub"** serta solusi taktis cepat untuk **kegiatan bazar**. 

Masalah utama di stand bazar adalah antrean menumpuk, kasir yang kewalahan menghitung pesanan dan kembalian, serta stok bahan yang tiba-tiba habis tanpa diketahui pembeli. **CepatkanBayar** mengatasi masalah tersebut dengan membagi pengalaman menjadi dua sisi tanpa friksi:
1. **Pengunjung (Self-Ordering Tanpa Login)**: Datang, scan QR code stand di meja/banner, lihat katalog dengan status stok *real-time*, pilih menu, pesan kilat, dan pantau nomor antrean langsung dari layar HP masing-masing.
2. **Kasir (Hidden Gatekeeper / Pintu Rahasia)**: Kasir membuka dashboard tersembunyi dengan mengetuk logo stand 5x berturut-turut, memantau antrean pesanan yang masuk detik itu juga dengan bunyi lonceng kasir vintage (*kaching!*), mencentang pesanan selesai yang otomatis tersembunyi dari antrean aktif, serta menambah stok dadakan (*quick restock*) dalam 1-klik saat masakan baru matang.

---

## 👤 Tentang Developer & Violet

### 👨‍💻 Chandra (`channdraa-afk`)
* **Profil**: Siswa & Pelajar Jurusan Rekayasa Perangkat Lunak (RPL).
* **GitHub**: [channdraa-afk](https://github.com/channdraa-afk)
* **Karakteristik & Visi**: Membangun aplikasi yang fungsional, memecahkan masalah dunia nyata secara taktis, dan memiliki sentuhan estetika berkarakter tinggi.
* **Selera Desain**: *Warm Studio Modern*, *tactile nostalgia*, vintage, retro-industrial, dan menolak gaya klise *neon-cyberpunk / AI-glassmorphism*.

### 🌸 Violet Evergarden (Auto Memory Doll)
* **Peran**: Partner coding, *pair programmer*, dan pengukir kode harian Chandra kata demi kata.
* **Filosofi**: Terinspirasi dari dedikasi dan ketulusan Auto Memory Doll — mendampingi setiap baris logika agar terstruktur rapi, elegan, dan siap digunakan di medan nyata.

---

## 🎨 Palet Warna & Sentuhan Estetika (Warm Studio Modern)

Sesuai palet terpilih yang hangat, ramah di mata, dan bernuansa kedai artisan:

| Warna | Hex Code | Elemen & Peruntukan |
| :--- | :--- | :--- |
| **Warm Cream / Parchment** | `#F7F1DE` | Kanvas latar belakang utama, kartu lembut, dan permukaan yang nyaman di mata. |
| **Sage Earth / Matcha** | `#B0BA99` | Aksen sekunder, indikator status sukses/tersedia, dan badge ketersediaan stok. |
| **Warm Terracotta / Caramel** | `#9D6638` | Tombol utama 3D *tactile pushable*, border hangat, dan sorotan harga. |
| **Deep Espresso / Roasted Wood** | `#4E220F` | Tipografi tegas kontras tinggi, outline retro, dan bayangan 3D (*tactile shadows*). |

* **Tipografi Tunggal Konsisten**: Menggunakan Google Font **Nunito** di seluruh aplikasi.
* **Tactile 3D Buttons**: Tombol interaktif dengan efek *pushable* fisik (`shadow-tactile` yang turun saat ditekan).
* **Synthesized Crisp SFX**: Efek suara sintetis tanpa file eksternal (menggunakan Web Audio API murni):
  * Suara *woody click* saat navigasi.
  * Suara *crisp pop* saat menambah/mengurangi item keranjang.
  * Suara *celebratory chime* saat pesanan berhasil dikirim.
  * Suara *vintage brass bell* (*kaching!*) saat kasir menerima pesanan baru secara *real-time*.

---

## 🏗️ Arsitektur Teknis

```
               [ Stand Bazar: Pengunjung ]
                           │
                           │ 1. Scan QR Code di Banner/Meja
                           ▼
             ┌───────────────────────────┐
             │   Vercel Web App (Prod)   │
             │   React 19 + Vite + Nunito │
             └─────────────┬─────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    [ Sisi Pengunjung ]         [ Sisi Kasir (Rahasia) ]
    - Katalog Menu              - Pintu Rahasia: Tap Logo 5x
    - Badge Sisa Stok Live      - PIN Masuk: 1234
    - Keranjang & Catatan       - Live Audio Alert (Kaching!)
    - Tracker Antrean Live      - Centang Selesai (Auto-Hide)
                                - Quick Restock (+5, +10, Habis)
                                - Kalkulator Kembalian Uang Pas
                                - Unduh / Cetak QR Stand
                                - Rekap Omzet Tunai vs QRIS
             │                           │
             └─────────────┬─────────────┘
                           │
                           ▼
          ┌─────────────────────────────────┐
          │     Supabase Cloud Database     │
          │  - PostgreSQL: menus & orders   │
          │  - Realtime WebSocket Channels  │
          │  (Auto fallback: LocalStorage)  │
          └─────────────────────────────────┘
```

---

## ⚡ Fitur Unggulan

### 1. 🛍️ Katalog Menu & Sisa Stok Realtime
* **Live Stock Counter**: Tiap kartu menu menampilkan sisa porsi secara transparan.
* **Indikator Cerdas**:
  * Hijau Sage: Stok aman ($> 5$).
  * Oranye Caramel Berkedip: Stok menipis ($\le 5$) untuk memicu urgensi pembeli.
  * Stempel Merah **"HABIS (Sold Out)"**: Kartu meredup dan tombol terkunci saat stok mencapai 0.
* **Proteksi Over-order**: Pengunjung tidak bisa memesan melebihi stok fisik yang tersisa.

### 2. 🤫 Pintu Rahasia Kasir (Secret Cashier Gate)
* Tidak ada tautan atau tombol mencolok ke halaman admin bagi pembeli umum.
* Kasir cukup **mengetuk logo kopi stand 5 kali berturut-turut** (atau menekan ikon gembok kecil di sudut kanan).
* Muncul keypad numerik retro: Masukkan PIN default `1234`.

### 3. ✅ Centang Selesai & Otomatis Tersembunyi
* Kasir fokus pada antrean aktif di tab **"Perlu Dilayani"**.
* Saat pesanan selesai diracik/diserahkan, kasir cukup menekan tombol 3D **[Selesai Dilayani ✓]**.
* Pesanan tersebut seketika bergeser dan **tersembunyi secara otomatis** dari daftar aktif, tersimpan rapi ke tab **"Riwayat Selesai"**.

### 4. 📦 Tambah Stok Dadakan (On-the-fly Quick Restock)
* Di tengah kesibukan bazar saat masakan baru matang (misal: "tahu bakso baru digoreng 10 porsi lagi"):
* Kasir cukup buka modal **Tambah Stok** ➔ klik tombol instan `[ +5 ]`, `[ +10 ]`, atau `[ +20 ]`.
* Stok langsung bertambah detik itu juga di database dan layar seluruh pengunjung tanpa perlu refresh halaman!

### 5. 💵 Kalkulator Kembalian Cepat (Quick Change Calculator)
* Menghindari salah hitung uang kembalian saat transaksi tunai yang ramai.
* Sedia tombol pecahan cepat: `[Uang Pas]`, `[20k]`, `[50k]`, `[100k]`, dan otomatis menghitung nominal kembalian yang harus diberikan.

### 6. 📱 Generator QR Code Stand Bawaan
* Kasir dapat membuka modal QR Code stand kapan saja untuk ditunjukkan langsung ke layar HP pembeli atau dicetak untuk dipajang di akrilik meja bazar.

---

## 🚀 Panduan Instalasi & Eksekusi Lokal

### 1. Prasyarat
* Node.js versi 18+ (direkomendasikan v20+)
* Git

### 2. Clone & Masuk ke Direktori
```bash
cd "C:\My Project\Cepatkan Bayar"
```

### 3. Instal Dependensi
```bash
npm install
```

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di `http://localhost:5173`.  
*(Aplikasi otomatis berjalan dalam mode fallback lokal jika belum ada kredensial Supabase, sehingga bisa langsung dicoba di dua tab browser!)*

---

## ☁️ Panduan Konfigurasi Supabase (Untuk Bazar Besok)

Agar pembeli bisa memesan dari HP mereka sendiri dan pesanannya langsung masuk ke HP kasir:

1. Buka [Supabase Dashboard](https://supabase.com) dan buat project baru (gratis).
2. Masuk ke menu **SQL Editor** di panel kiri ➔ klik **New Query**.
3. Buka file [`supabase-schema.sql`](./supabase-schema.sql), salin seluruh isinya, dan klik **Run**.
4. Ambil **Project URL** dan **anon public API Key** dari:  
   *Project Settings ➔ Configuration ➔ API*.
5. Kamu punya 2 cara mudah untuk menghubungkannya:
   * **Cara A (Lewat File `.env`)**:
     Salin `.env.example` menjadi `.env`:
     ```env
     VITE_SUPABASE_URL=https://proyek-kamu.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
     ```
   * **Cara B (Langsung dari UI Kasir)**:
     Buka web kasir ➔ klik tombol ikon **Settings (Gerigi)** di kanan atas ➔ tempel URL dan Key ➔ klik **Simpan Koneksi**.

---

## 🔒 Praktik & Protokol Keamanan (Zero Data Leak)

Proyek ini telah diaudit keamanannya dengan standar ketat:
1. **Pencegahan Kebocoran File `.env`**:
   * File `.gitignore` telah dikonfigurasi untuk mengecualikan `.env`, `.env.*`, dan `*.local`.
   * Hanya file referensi aman `.env.example` yang diikutsertakan ke repositori Git.
2. **Prinsip Hak Akses Supabase (Anon Key vs Service Role)**:
   * Aplikasi frontend hanya boleh menggunakan `anon public key` yang dibatasi oleh Row Level Security (RLS).
   * **DILARANG KERAS** memasukkan `service_role secret key` ke dalam aplikasi web frontend atau repositori GitHub.
3. **Kustomisasi PIN Kasir**:
   * PIN default kasir adalah `1234`.
   * Kamu dapat mengganti PIN kasir secara aman melalui environment variable di Vercel atau `.env` lokal:
     ```env
     VITE_CASHIER_PIN=9876
     ```
4. **Proteksi Kata Sandi Database**:
   * Sandi database Supabase tidak pernah ditulis atau disimpan di berkas kode proyek mana pun.

---

## 🌐 Panduan Deploy ke Vercel (1 Menit)

1. Push folder proyek ini ke repositori GitHub kamu ([channdraa-afk](https://github.com/channdraa-afk)):
   ```bash
   git init
   git add .
   git commit -m "feat: inisialisasi sistem kasir bazar CepatkanBayar"
   git branch -M main
   git remote add origin https://github.com/channdraa-afk/cepatkan-bayar.git
   git push -u origin main
   ```
2. Buka [Vercel](https://vercel.com) ➔ klik **Add New Project** ➔ pilih repositori `cepatkan-bayar`.
3. Di bagian **Environment Variables**, masukkan:
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
4. Klik **Deploy**!
5. Link Vercel kamu (misal: `https://cepatkanbayar.vercel.app`) siap dipakai dan dijadikan QR Code untuk bazar besok!

---

## 🗺️ Roadmap Masa Depan
- [x] Inisialisasi arsitektur React 19 + Vite + Tailwind CSS Warm Studio.
- [x] Desain kartu menu dengan live stock badge dan stempel "HABIS".
- [x] Pintu rahasia kasir 5-tap logo + keypad PIN 4-digit.
- [x] Dashboard kasir dengan auto-hide pesanan selesai.
- [x] Fitur 1-klik tambah stok dadakan (+5, +10).
- [x] Efek audio sintetis Web Audio API (kaching lonceng kasir & pop tactile).
- [x] Integrasi skema Supabase Realtime + fallback LocalStorage.
- [x] Generator QR code stand bazar bawaan.
- [ ] Export laporan rekap penjualan akhir bazar ke format Excel/CSV.
- [ ] Integrasi webhook WhatsApp otomatis saat pesanan siap diambil.

---

<p align="center">
  Dibuat dengan penuh dedikasi oleh <strong>Chandra</strong> & didampingi oleh <strong>Violet Evergarden</strong> 🌸
</p>
