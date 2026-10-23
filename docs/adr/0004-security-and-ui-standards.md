# 4. Security, UI Design System, and Codebase Initialization

Date: 2026-10-23

## Status

Accepted

## Context

Untuk memulai pembangunan School ERP di ekosistem Cloudflare, diperlukan ketetapan mengenai library keamanan kredensial, design system antarmuka, serta kontrol repositori awal.

## Decision

1. **Password Hashing di Workers**:
   - Menghindari library Node.js native binding (`bcrypt`) yang tidak kompatibel dengan Cloudflare Workers.
   - Menggunakan Web Crypto API native atau `@oslojs/crypto` / PBKDF2 / Argon2 WASM yang 100% kompatibel dengan runtime edge V8.
2. **UI & Styling (`apps/web`)**:
   - Menggunakan React (Vite) + Tailwind CSS + shadcn/ui + Lucide Icons.
   - Layout responsif: Sidebar navigasi desktop untuk Admin TU & Guru, serta Bottom Navigation / Mobile-friendly layout untuk Siswa dan Orang Tua/Wali.
3. **Repositori & Version Control**:
   - Menggunakan Git dengan branch default `main` dan struktur workspace pnpm terpusat.

## Consequences

### Positif
- Kompatibilitas 100% tanpa kompilasi native C++ di runtime edge Cloudflare Workers.
- Antarmuka modular, konsisten, dan mudah dimodifikasi dengan tema institusi pendidikan.
