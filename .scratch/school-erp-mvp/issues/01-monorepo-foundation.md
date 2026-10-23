# 01: Monorepo Foundation

**What to build:** Inisialisasi struktur monorepo pnpm dengan workspace terkonfigurasi, TypeScript base configs, shared packages (`packages/db`, `packages/shared`), aplikasi backend `apps/api` (Hono + Cloudflare Workers Wrangler), dan aplikasi frontend `apps/web` (Vite + React + Tailwind CSS).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] File `pnpm-workspace.yaml` dan root `package.json` terkonfigurasi
- [ ] Paket `packages/shared` mengekspor tipe data dasar dan konstanta role
- [ ] Paket `packages/db` terkonfigurasi dengan Drizzle ORM untuk Cloudflare D1
- [ ] Aplikasi `apps/api` dapat dijalankan dengan Wrangler dev dan mengekspos health check route `/api/health`
- [ ] Aplikasi `apps/web` dapat di-build dengan Vite dan Tailwind terhubung
