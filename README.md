# School ERP - Cloudflare Serverless Edge Monolith

Sistem Informasi Manajemen Sekolah (ERP) modern, cepat, dan hemat biaya pemeliharaan yang dibangun *fullstack* di atas ekosistem **Cloudflare Serverless** (Workers, D1 Database, R2 Object Storage) dengan arsitektur **Edge Monolith**.

🌐 **Live URL Aplikasi**: [https://school-erp.tech1solusi.workers.dev](https://school-erp.tech1solusi.workers.dev)  
🚀 **API Health Check**: [https://school-erp.tech1solusi.workers.dev/api/health](https://school-erp.tech1solusi.workers.dev/api/health)

---

## ✨ Fitur Utama

1. **Struktur Akademik & Kesiswaan**:
   - Manajemen Tahun Ajaran aktif (Semester Ganjil & Genap).
   - Rombongan Belajar (Rombel) bertingkat (Kelas 7–12) dengan alokasi Wali Kelas.
   - Penempatan belajar (`student_enrollments`) yang menjaga integritas riwayat kenaikan kelas abadi.
2. **Presensi Siswa Harian**:
   - Checklist kehadiran interaktif untuk Wali Kelas / Guru Pengampu (Hadir, Sakit, Izin, Alpa).
   - Rekapitulasi persentase kehadiran siswa real-time.
3. **Keuangan & SPP (dengan Cloudflare R2)**:
   - Penerbitan tagihan berkala bulanan otomatis.
   - Portal penagihan siswa & orang tua.
   - Unggah bukti transfer multipart via Worker proxy langsung ke bucket Cloudflare R2.
   - Alur verifikasi pelunasan oleh Admin TU.
4. **Buku Nilai (Gradebook) & Rapor Semester**:
   - Kalkulasi nilai berbasis bobot dinamis Kurikulum Merdeka (Tugas Harian, UTS/Sumatif Tengah, SAS/Sumatif Akhir).
   - Tampilan Kartu Hasil Belajar (Rapor Siswa) lengkap dengan capaian kompetensi dan rekap presensi.
5. **Portal Orang Tua (Multi-Child Switcher)**:
   - Satu akun wali murid dapat memantau lebih dari satu anak dalam satu sekolah.
   - Quick switcher profil anak untuk melihat IPK rata-rata, presensi, dan status tagihan SPP.
6. **Desain Anti-Slop (Taste Skill v2)**:
   - Tipografi resmi **DM Sans** dengan angka `tabular-nums` pada seluruh tabel & KPI.
   - Palet *Accent Ladder* raspberry profesional tanpa gradien ungu/indigo generik.
   - Layout *Ruled T-frame* yang bersih, fungsional, dan bebas dari *fake drop shadows*.

---

## 🔑 Akun Demo Siap Pakai

Sistem dilengkapi akun demo untuk menguji keempat hak akses peran (**Role-Based Access Control**):

| Peran (Role) | Nama Pengguna (Username) | Kata Sandi (Password) | Hak Akses & Fokus Utama |
| :--- | :--- | :--- | :--- |
| **Admin Tata Usaha** | `admin` | `admin123` | Konfigurasi Rombel, Terbitkan SPP, Verifikasi Bukti R2 |
| **Guru (Wali Kelas)** | `guru_budi` | `guru123` | Checklist Presensi Kelas, Input Buku Nilai Matematika |
| **Guru Bahasa** | `guru_siti` | `guru123` | Pengampu Bahasa Indonesia & Pengisian Nilai Siswa |
| **Siswa** | `siswa_ahmad` | `siswa123` | Pantau Rapor Semester, Jadwal Belajar, Tagihan SPP |
| **Siswa** | `siswa_dewi` | `siswa123` | Riwayat Kehadiran 97.8%, Rapor Kelas X-MIPA-2 |
| **Siswa** | `siswa_budi` | `siswa123` | Tagihan menunggu verifikasi |
| **Siswa** | `siswa_citra` | `siswa123` | Tagihan lunas |
| **Orang Tua / Wali** | `wali_subagyo` | `wali123` | **Multi-Child Switcher** (Ahmad Dahlan & Dewi Sartika) |
| **Orang Tua / Wali** | `wali_hartono` | `wali123` | Pemantauan Siswa Budi Santoso |

---

## 🧪 Demo End-to-End

Studi kasus lengkap untuk seluruh modul tersedia di [docs/demo/STUDI-KASUS-END-TO-END.md](docs/demo/STUDI-KASUS-END-TO-END.md).

```bash
# dari apps/api
pnpm exec wrangler d1 migrations apply school-erp-db --local

# dari root
pnpm dev          # terminal 1
pnpm db:seed      # terminal 2
pnpm demo:smoke   # verifikasi alur API end-to-end
```

Data demo memakai tahun ajaran **2026/2027 Semester Ganjil** dan dapat ditanam ulang secara idempoten.

---

## 🏗️ Arsitektur Teknologi

- **Runtime**: Cloudflare Workers (Edge V8) dengan arsitektur **Unified Edge Monolith** ([ADR 0005](docs/adr/0005-unified-edge-monolith-with-static-assets.md)).
- **Frontend SPA**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons disajikan via Workers Static Assets binding `[assets]`.
- **Backend API**: Hono web framework running on Workers.
- **Database**: Cloudflare D1 (Distributed SQLite di Edge) dikelola dengan Drizzle ORM.
- **Object Storage**: Cloudflare R2 (S3-compatible storage tanpa biaya egress).
- **Keamanan**: Stateless JWT di Cookie `HttpOnly` dengan password hashing berbasis Web Crypto API (PBKDF2 SHA-256).
- **Monorepo**: pnpm workspaces (`apps/api`, `apps/web`, `packages/db`, `packages/shared`).

---

## 🛠️ Panduan Pengembangan Lokal

### Prasyarat
- Node.js >= 20
- pnpm >= 10
- Cloudflare Wrangler CLI (`pnpm dlx wrangler`)

### Instalasi & Menjalankan Aplikasi
```bash
# Clone repositori
git clone https://github.com/dittorahmat/school-erp.git
cd school-erp

# Install seluruh dependensi
pnpm install

# Jalankan typecheck, test, dan lint UI
pnpm run check

# Jalankan dev server lokal
pnpm run dev
```

### Deploy ke Cloudflare Workers
```bash
# Build frontend dan deploy backend monolith dalam satu perintah
pnpm run deploy
```

---

## 📜 Lisensi
MIT License &copy; 2026 School ERP. Built on Cloudflare Serverless Stack.
