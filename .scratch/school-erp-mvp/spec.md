# Spec: School ERP MVP on Cloudflare Serverless

## Overview
School ERP adalah sistem informasi manajemen sekolah yang dibangun fullstack di atas ekosistem Cloudflare Serverless (Workers, D1, R2) dengan Hono API, Drizzle ORM, React SPA (Vite + Tailwind + shadcn/ui), dan monorepo pnpm.

## Arsitektur & Teknologi
- **Monorepo**: pnpm workspaces (`apps/api`, `apps/web`, `packages/db`, `packages/shared`).
- **Backend**: Hono web framework running on Cloudflare Workers.
- **Database**: Cloudflare D1 (SQLite di edge) dikelola dengan Drizzle ORM.
- **Storage**: Cloudflare R2 untuk penyimpanan dokumen & bukti transfer.
- **Autentikasi**: Stateless JWT di Cookie `HttpOnly` dengan Refresh Token di D1.
- **Role**: Admin TU, Guru, Siswa, Wali (Orang Tua).

## Bounded Contexts
1. **User & Auth**: Manajemen akun, peran, dan sesi kredensial.
2. **Akademik & Kesiswaan**: Tahun Ajaran, Tingkat, Rombel, Mata Pelajaran, dan Penempatan Siswa (`student_enrollments`).
3. **Presensi**: Sesi kehadiran manual oleh Guru/Wali Kelas (Hadir, Sakit, Izin, Alpa).
4. **Keuangan / SPP**: Komponen biaya, batch tagihan SPP, upload bukti transfer multipart ke R2, dan verifikasi pelunasan.
5. **Penilaian / Gradebook**: Komponen penilaian fleksibel, buku nilai guru, kalkulasi rapor semester.
6. **Portal Wali Multi-Siswa**: Tampilan pemantauan anak oleh orang tua dengan profil switcher.
