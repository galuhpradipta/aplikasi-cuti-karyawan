# Sistem Manajemen Cuti Karyawan

Aplikasi web full-stack untuk mengelola pengajuan dan persetujuan cuti karyawan.

## Kebutuhan Sistem

### Frontend

- Node.js (versi 18 ke atas)
- npm atau yarn
- Browser web modern

### Backend

- Node.js (versi 18 ke atas)
- Database PostgreSQL
- npm atau yarn

## Fitur

- 👤 Autentikasi dan Otorisasi Pengguna
- 👥 Manajemen Pengguna (Admin)
  - Membuat, mengedit, dan mengelola akun pengguna
  - Menetapkan peran (Admin, Manajer, Karyawan)
- 📝 Manajemen Pengajuan Cuti
  - Mengajukan permohonan cuti
  - Menentukan jenis cuti, durasi, dan alasan
  - Melampirkan dokumen pendukung
- ✅ Alur Persetujuan Cuti
  - Proses persetujuan bertingkat
  - Notifikasi email
  - Pelacakan status
- 📊 Dashboard dan Laporan
  - Pelacakan saldo cuti
  - Riwayat cuti
  - Ekspor laporan ke CSV
- 🔐 Kontrol Akses Berbasis Peran
  - Tampilan dan izin berbeda untuk setiap peran
- 📱 Desain Responsif
  - Berfungsi di desktop dan perangkat mobile

## Alur Umum

1. **Autentikasi Pengguna**

   - Pengguna masuk dengan kredensial mereka
   - Sistem memvalidasi dan memberikan akses sesuai peran

2. **Proses Pengajuan Cuti**

   - Karyawan mengajukan permohonan cuti
   - Manajer menerima notifikasi
   - Manajer menyetujui/menolak permohonan
   - Karyawan menerima notifikasi keputusan

3. **Pelaporan dan Pelacakan**
   - Admin dapat menghasilkan laporan
   - Pengguna dapat melacak saldo cuti mereka
   - Manajer dapat melihat status cuti tim

## Panduan Instalasi dan Menjalankan Aplikasi

### Prasyarat

1. Install Node.js (versi 18 ke atas)
2. Install PostgreSQL
3. Clone repositori ini

### Setup Frontend

1. Masuk ke direktori utama

```bash
cd project_cuti_karyawan
```

2. Install dependensi

```bash
npm install
```

3. Buat file .env (salin dari .env.example)

```bash
cp .env.example .env
```

4. Jalankan server development

```bash
npm run dev
```

### Setup Backend

1. Masuk ke direktori backend

```bash
cd backend
```

2. Install dependensi

```bash
npm install
```

3. Setup database

```bash
# Generate Prisma client
npm run prisma:generate

# Jalankan migrasi database
npm run prisma:migrate
```

4. Jalankan server backend

```bash
npm run dev
```

## Teknologi yang Digunakan

### Frontend

- React dengan TypeScript
- Vite untuk build tooling
- Komponen Material-UI
- React Router untuk navigasi
- Axios untuk request API
- TailwindCSS untuk styling

### Backend

- Node.js dengan Express
- Prisma ORM
- Database PostgreSQL
- JWT untuk autentikasi
- bcrypt untuk hashing password

## Perintah yang Tersedia

### Frontend

- `npm run dev` - Menjalankan server development
- `npm run build` - Build untuk production
- `npm run preview` - Preview build production
- `npm run lint` - Menjalankan ESLint

### Backend

- `npm run dev` - Menjalankan server development dengan hot reload
- `npm start` - Menjalankan server production
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Menjalankan migrasi database
- `npm run prisma:studio` - Membuka Prisma Studio

## Variabel Lingkungan

Pastikan untuk mengatur variabel lingkungan berikut di file .env Anda:

### Frontend (.env)

```
VITE_API_URL=http://localhost:3000
```

### Backend (.env)

```
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
JWT_SECRET=your_jwt_secret
PORT=3000
```

## Kontribusi

1. Fork repositori
2. Buat branch fitur Anda
3. Commit perubahan Anda
4. Push ke branch
5. Buat Pull Request baru

## Lisensi

Proyek ini dilisensikan di bawah Lisensi ISC.
