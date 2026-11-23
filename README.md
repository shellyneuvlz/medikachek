# MedikaCheck — Sistem Monitoring Kesehatan & Nutrisi Terintegrasi

Aplikasi pemantauan kesehatan holistik, pencatatan nutrisi pra & pasca makan, analisis gejala, pola tidur, aktivitas fisik, hidrasi, serta rekap laporan medis komprehensif.

## Akun Demo Siap Pakai

| Role | Email | Password | Dashboard URL |
|---|---|---|---|
| **ADMIN** | `admin@medikacheck.id` | `Admin123!` | `/admin/dashboard` |
| **USER** | `user@medikacheck.id` | `User123!` | `/app/dashboard` |

> User juga dapat membuat akun baru melalui halaman **Register** (role otomatis diatur ke `USER` secara aman).

---

## Fitur Utama

1. **Autentikasi & Otorisasi Lengkap (JWT & RBAC)**
   - Login, Register, Lupa Password, Logout
   - Show/Hide Password, Remember Me, Validasi Formulir
   - Role-Based Access Control (`ADMIN` & `USER`)
   - Protected Routes & Auto-Logout jika Token Expired
2. **CRUD Kesehatan & Gaya Hidup Terhubung PostgreSQL**
   - Catatan Kesehatan harian (Energi, Mood, Tubuh, Lambung, Stres, Catatan)
   - Catatan Makanan (Sarapan, Siang, Malam, Snack, Porsi, Waktu)
   - Kondisi Sebelum Makan (Lapar, Energi, Mood, Lambung, Tubuh)
   - Kondisi Setelah Makan (Fullness, Energi, Mood, Kembung, Mual, Mengantuk, Discomfort)
   - Pelaporan Gejala (Nama gejala, Intensitas 1-10, Durasi, Waktu)
   - Catatan Tidur (Waktu tidur, bangun, durasi jam, kualitas)
   - Aktivitas Fisik (Durasi menit, intensitas, nama olahraga)
   - Hidrasi Harian (Jumlah ml air, target harian)
3. **Rekap Laporan & Visualisasi Interaktif (Recharts)**
   - Filter Periode: Hari Ini, 7 Hari, 30 Hari, 3 Bulan, Custom Date
   - 6 Grafik Interaktif: Tren Energi, Tren Mood, Durasi Tidur, Durasi Aktivitas, Respons Pasca Makan, Distribusi Kategori Makanan
   - Export Dokumen: PDF (lengkap dengan kop, grafik, dan disclaimer medis resmi), Excel (.xlsx), dan CSV
4. **Portal Manajemen Administrator**
   - Statistik agregat privasi aman pengguna dan aktivitas platform
   - CRUD Manajemen Pengguna (Aktifkan / Nonaktifkan akun)
   - CRUD Database Makanan Global
   - CRUD Artikel Edukasi Kesehatan
   - CRUD Kategori
   - CRUD Notifikasi & Pengumuman Sistem

---

## Menjalankan dengan Docker & Docker Compose

```bash
# Jalankan PostgreSQL dan MedikaCheck
docker compose up -d --build

# Buka di browser
http://localhost:3000
```
