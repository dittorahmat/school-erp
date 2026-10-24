# 5. Unified Edge Monolith with Cloudflare Workers Static Assets

Date: 2026-10-23

## Status

Accepted (Supersedes ADR 0001 recommendation on Pages separation)

## Context

Awalnya frontend React (SPA) dan backend Hono API direncanakan berada pada dua service Cloudflare terpisah (Cloudflare Pages untuk web, dan Cloudflare Workers untuk API). Pemisahan ini memunculkan kerumitan konfigurasi CORS, otentikasi lintas domain via cookie `HttpOnly`, serta kebutuhan mengelola dua pipeline/project deployment terpisah.

Cloudflare Workers kini mendukung fitur **Workers Static Assets** (`[assets] directory = "../web/dist"`), yang memungkinkan berkas statis frontend SPA disajikan secara native dari edge worker yang sama dengan backend API.

## Decision

Kami memutuskan untuk menyatukan frontend SPA dan backend API ke dalam **satu Monolith Edge Worker tunggal** (`school-erp`):
1. **URL Tunggal**: Seluruh antarmuka web dan endpoint `/api/*` disajikan dari domain yang sama (`school-erp.tech1solusi.workers.dev`).
2. **Workers Static Assets Binding**: Satu-satunya konfigurasi Worker adalah `apps/api/wrangler.toml`, dengan `[assets] directory = "../web/dist"` dan fallback client-side routing. `wrangler.toml` di root repo dihapus agar tidak ada konfigurasi kedua yang bisa menyimpang.
3. **Zero CORS**: Cookie otentikasi `HttpOnly` berjalan first-party tanpa header CORS tambahan.
4. **Driver Database Pure-JS**: Tidak boleh menggunakan library native C++ bindings Node.js (`better-sqlite3`, dsb). Seluruh interaksi database D1 wajib menggunakan runtime native D1 binding (`drizzle-orm/d1`) atau pure-JS mocks.

## Consequences

### Positif
- **Deployment Tunggal**: Satu perintah `wrangler deploy` mendeploy frontend bundle dan API backend sekaligus.
- **Keamanan Lebih Baik**: Cookie sesi otentikasi bekerja secara first-party dan terlindungi penuh tanpa pembatasan SameSite lintas domain.
- **Zero CORS Overhead**: Mengeliminasi preflight request `OPTIONS` untuk request API dari frontend internal.

### Negatif / Mitigasi
- Ukuran total bundle Worker mencakup routing static assets.
  - *Mitigasi*: Static assets dikompresi otomatis oleh Cloudflare CDN Edge, ukuran script worker murni tetap sangat kecil (<1 MB).
