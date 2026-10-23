# 01: Monorepo Foundation

**What to build:** Inisialisasi struktur monorepo pnpm dengan workspace terkonfigurasi, TypeScript base configs, shared packages (`packages/db`, `packages/shared`), aplikasi backend `apps/api` (Hono + Cloudflare Workers Wrangler), dan aplikasi frontend `apps/web` (Vite + React + Tailwind CSS).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] File `pnpm-workspace.yaml` dan root `package.json` terkonfigurasi
- [x] Paket `packages/shared` mengekspor tipe data dasar dan konstanta role
- [x] Paket `packages/db` terkonfigurasi dengan Drizzle ORM untuk Cloudflare D1
- [x] Aplikasi `apps/api` dapat dijalankan dengan Wrangler dev dan mengekspos health check route `/api/health`
- [x] Aplikasi `apps/web` dapat di-build dengan Vite dan Tailwind terhubung

## Answer
Fondasi monorepo pnpm telah selesai dikonfigurasi dan diverifikasi hijau:
- Root monorepo dengan pnpm workspace (`packages/*`, `apps/*`).
- `packages/shared` dengan domain constants (roles, invoice/attendance status) & Zod schemas teruji (Vitest passed).
- `packages/db` dengan Drizzle ORM SQLite/D1 schemas dan Drizzle Kit configuration.
- `apps/api` dengan Hono framework di Cloudflare Workers, routing CORS, dan health check endpoint teruji (Vitest passed).
- `apps/web` dengan Vite + React 19 + Tailwind CSS + Lucide Icons sukses di-build.
