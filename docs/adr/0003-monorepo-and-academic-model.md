# 3. Monorepo Structure and Academic Data Model

Date: 2026-10-23

## Status

Accepted

## Context

Sistem ERP Sekolah memiliki beberapa aplikasi (API di Cloudflare Workers, Web SPA untuk Admin/Guru/Orang Tua) serta model data akademik yang memerlukan integritas riwayat historis saat pergantian tahun ajaran atau kenaikan kelas.

## Decision

1. **Struktur Repositori**:
   - Menggunakan **pnpm workspaces monorepo**:
     - `apps/api`: Hono API serverless di Cloudflare Workers.
     - `apps/web`: Frontend SPA (Vite + React + Tailwind CSS + shadcn/ui).
     - `packages/db`: Drizzle ORM schema, migrasi D1, seed scripts.
     - `packages/shared`: Definisi types, schema validasi Zod (berbagi antara client dan server), dan konstanta domain.
2. **Model Akademik & Riwayat Kelas (`student_enrollments`)**:
   - Siswa tidak ditautkan langsung secara statis ke rombel di tabel siswa, melainkan melalui tabel `student_enrollments` yang mengaitkan `student_id`, `classroom_id`, `academic_year_id`, dan `semester`.
   - Hal ini menjamin nilai, presensi, dan wali kelas terdahulu tidak akan rusak saat siswa naik kelas ke rombel baru.
3. **Penerbitan Tagihan SPP**:
   - Tagihan SPP diterbitkan via batch generation terkontrol oleh Admin TU (dengan fleksibilitas penyesuaian diskon/dispensasi per siswa) sebelum didistribusikan ke portal wali murid.
4. **Fleksibilitas Penilaian**:
   - Menggunakan sistem bobot komponen penilaian dinamis per mata pelajaran/sekolah dengan preset standar (mendukung Kurikulum Merdeka: Formatif, Sumatif Lingkup Materi, Sumatif Akhir Semester).

## Consequences

### Positif
- **Integritas Data Abadi**: Tidak ada risiko data historis rapor dan riwayat rombel ter-overwrite saat kenaikan kelas.
- **Konsistensi Schema**: Monorepo memastikan validasi form di frontend dan validasi payload di backend menggunakan skema Zod yang sama dari `packages/shared`.
- **Modular & Clean**: Database schema di `packages/db` dapat diuji secara independen tanpa ketergantungan runtime browser atau worker.

### Negatif / Mitigasi
- Setup awal pnpm workspace memerlukan konfigurasi build dan path aliasing (tsconfig paths).
  - *Mitigasi*: Standardisasi `tsconfig.base.json` dan skrip pnpm turbo/build yang teruji.
