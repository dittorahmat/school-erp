# Agents Guidelines

## Agent skills

### Issue tracker

GitHub Issues at `dittorahmat/school-erp` via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`GLOSSARY.md` + `docs/adr/`). See `docs/agents/domain.md`.

### Engineering Mandate: YAGNI & Conciseness

- **Implement YAGNI**: Jangan membangun abstraksi, lapisan pembungkus, atau fitur spekulatif untuk masa depan yang belum diminta.
- **Prefer One-Liner Solutions**: Utamakan solusi langsung, ringkas, dan ekspresif. Hindari boilerplate berlebih bila konstruksi satu baris atau bawaan bahasa sudah mencukupi tanpa mengorbankan keterbacaan.

### Architecture & Deployment Mandate (Cloudflare Edge Monolith)

- **Single Fullstack Worker**: Seluruh aplikasi disajikan dari satu Edge Worker tunggal di `school-erp.tech1solusi.workers.dev`.
- **Workers Static Assets**: Frontend SPA di-bundle ke `apps/web/dist` dan disajikan via binding `[assets]` di `apps/api/wrangler.toml`. DILARANG memisahkan frontend ke project Cloudflare Pages terpisah kecuali diminta secara eksplisit.
- **Pure-JS Edge Drivers**: Hindari native C++ Node.js dependencies (`better-sqlite3`, native bcrypt). Gunakan Web Crypto API dan D1 bindings resmi (`@school-erp/db`).
- Lihat [ADR 0005](docs/adr/0005-unified-edge-monolith-with-static-assets.md).

### Database Consumption Pointer (`@school-erp/db`)

- Gunakan factory function kanonikal `createDb(c.env.DB)` untuk inisialisasi Drizzle client pada route Hono.
- Impor seluruh entity skema Drizzle langsung dari root package:
  ```ts
  import { createDb, <table_name>, desc, eq } from "@school-erp/db";
  ```
- Dilarang mengimpor dari subpath tidak terdaftar seperti `@school-erp/db/schema`.

### Architecture Mandate: Deep Modules & Pure Domain Seams

- **Deep Modules over Shallow Routes**: Hindari menaruh mutasi status multi-tabel, validasi state-machine, dan kalkulasi saldo mutasi langsung di dalam handler rute HTTP (`apps/api/src/`).
- **The Interface is the Test Surface**: Logika domain (misal: siklus peminjaman aset `AssetCirculation`, buku besar stok persediaan `StockLedger`) wajib dibungkus ke dalam modul domain murni dengan interface ringkas dan ekspresif.
- **Pure-JS In-Memory Testability**: Setiap modul domain wajib memiliki unit test Vitest terisolasi (`*.test.ts`) yang dapat diuji tanpa perlu mock seluruh server HTTP Hono. Handler HTTP hanya bertindak sebagai adapter tipis yang menerjemahkan payload JSON ke pemanggilan method modul.

### Verification & Automated Guardrails

- Setiap perubahan kode WAJIB divalidasi dengan menjalankan `pnpm run check` (menjalankan typecheck semua workspace, unit test Vitest, dan linter design-taste-frontend dengan alokasi heap aman).
- Pipeline `pnpm run check` harus keluar dengan status hijau (exit code 0) sebelum commit atau deploy.

### Frontend Design & UI Mandate

Semua perubahan pada komponen frontend (`apps/web/`) **WAJIB** melalui dan mematuhi panduan skill **`design-taste-frontend`** (tasteskill v2 anti-slop rules):
- Gunakan token tema resmi (DM Sans, tabular-nums untuk data/tabel, hindari gradien ungu/indigo generik, hilangkan fake drop-shadows pada elemen istirahat, hindari hairline dividers tanpa substansi).
- Verifikasi linter wajib bersih: `pnpm run lint:ui` (otomatis memindai seluruh file komponen di `apps/web/src`).

### Windows Terminal & Command Escaping Convention

- Hindari argumen inline panjang dengan simbol PowerShell sensitif (`&`, `(`, `)`, `|`).
- Untuk membuat issue GitHub atau commit git dengan format kaya, gunakan file sementara (`--body-file`) atau skrip batch `.bat` sederhana untuk mencegah parser crash.
