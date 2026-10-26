# Agents Guidelines

## Agent skills

### Issue tracker

GitHub Issues at `dittorahmat/school-erp` via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`GLOSSARY.md` + `docs/adr/`). See `docs/agents/domain.md`.

### Demo runbook

`docs/demo/STUDI-KASUS-END-TO-END.md` dan `docs/demo/README.md` memuat studi kasus, akun demo, serta prosedur migrate/seed/deploy. `pnpm demo:reset` mengosongkan D1 lokal, migrate, lalu seed dalam satu perintah (hentikan dev server dulu).

## Verification loop

- `pnpm run check` adalah seluruh guardrail: build & typecheck semua workspace, Vitest, taste lint, `lint:tokens`, dan `check:docs`. Wajib exit 0 sebelum commit dan sebelum deploy.
- CI `.github/workflows/check.yml` menjalankan perintah yang sama pada setiap PR, jadi merah berarti tidak bisa merge.
- Setelah edit yang mengubah import, export, atau tipe, jalankan `pnpm --filter @school-erp/api build` sebelum memanggil endpoint. Dev server akan reload refactor yang belum selesai dan gagal dengan pesan minified.
- Perbaikan yang bisa diperiksa mesin masuk ke guardrail, bukan ke file ini: `scripts/lint-tokens.mjs`, `scripts/check-docs.mjs`, `apps/api/src/authz.test.ts`, atau unit test Vitest.

## Menembak API

- `pnpm probe <role> <METHOD> <path> [json]` — login sesuai peran lalu cetak status dan body. Peran: `admin`, `guru`, `guru2`, `siswa`, `siswa2`, `wali`, `wali2`. Contoh: `pnpm probe siswa GET /api/attendance/summary`.
- `pnpm demo:smoke` menguji alur demo end-to-end; `pnpm verify:prod` adalah pemeriksaan produksi **read-only**. Keduanya menerima `--base=`.
- Script demo default ke `http://127.0.0.1:8787` dan keluar dengan **exit 2** bila server tidak merespons. Exit 1 berarti ada pemeriksaan yang gagal; jangan men-debug produk saat yang mati adalah dev server.
- Jangan menulis blok PowerShell/curl inline untuk memanggil endpoint.

## Konfigurasi otoritatif

- Satu-satunya konfigurasi Worker adalah `apps/api/wrangler.toml`. Tidak ada `wrangler.toml` di root.
- **Konfigurasi rahasia**: rahasia tidak pernah masuk `wrangler.toml`. Produksi memakai `wrangler secret put JWT_SECRET`; lokal memakai `apps/api/.dev.vars` (gitignored, contoh di `apps/api/.dev.vars.example`). `scripts/check-secrets.mjs` menolak rahasia di `[vars]` atau `.dev.vars` yang ter-track.
- Migrasi D1 berada di `packages/db/migrations`, terhubung lewat `migrations_dir`.
- Frontend di-bundle ke `apps/web/dist` dan disajikan dari binding `[assets]`. Jangan memisahkan frontend ke Cloudflare Pages terpisah kecuali diminta eksplisit. Lihat [ADR 0005](docs/adr/0005-unified-edge-monolith-with-static-assets.md).

## Arsitektur (butuh judgement, bukan lint)

- **Prinsip desain**: implement YAGNI. prefer one liner solutions. Jangan membuat abstraksi spekulatif untuk skenario masa depan yang belum ada; utamakan solusi ringkas, langsung pada sasaran, dan minim overhead.
- **Satu Worker fullstack** di `school-erp.tech1solusi.workers.dev`. Driver database pure-JS: Web Crypto dan binding D1, tanpa dependensi native C++.
- **Akses database**: inisialisasi dengan `createDb(c.env.DB)`, impor skema dan helper Drizzle dari root `@school-erp/db`. Subpath seperti `@school-erp/db/schema` tidak terdaftar.
- **Deep modules**: mutasi multi-tabel, validasi state-machine, integritas referensial lintas-entitas, dan kalkulasi saldo berada di modul domain murni dengan unit test Vitest terisolasi (memakai generic `DatabaseAdapter`). Handler HTTP (Hono router) hanya bertindak sebagai adapter tipis yang menerjemahkan payload JSON ke pemanggilan modul dan mengonversi domain error menjadi HTTP status code. Dilarang menulis validasi multi-query bertumpuk atau orkestrasi mutasi multi-tabel langsung di handler route.
  - *Inventaris*: `apps/api/src/inventory/circulation.ts` (peminjaman aset), `ledger.ts` (mutasi stok ATK), dan `catalog.ts` (master katalog item & guard penghapusan).
  - *Akademik*: `apps/api/src/academic/enrollment.ts` (penempatan siswa rombel & perwalian homeroom teacher).
  - *Keuangan*: `apps/api/src/finance/billing.ts` (batch billing tagihan & settlement pelunasan sinkron kas umum) dan `cash-ledger.ts` (buku kas debit-kredit & running balance).
- **Otorisasi**: setiap rute menyatakan perannya. Tabel rute tunggal ada di `apps/api/src/testing/routes.ts`; `authz.test.ts` membuktikan allow list-nya secara otomatis terhadap semua rute Hono dan `fallback.test.ts` membuktikan setiap GET menjawab 500 saat query gagal. Tambahkan rute baru di tabel itu, bukan di tiap suite.
- **Akses siswa**: `canReadStudent`, `visibleStudentIds`, dan `activeYearId` ada di `apps/api/src/access/student-access.ts`. Rute memanggil modul itu; jangan menyalin cek wali atau tahun ajaran ke handler.
- **Data demo**: `packages/db/src/seed/demo.ts` satu-satunya dataset. Fallback hanya lewat `isEmptyDatabase` (`apps/api/src/empty-database.ts`) saat database belum pernah di-seed; database terisi yang kosong untuk satu query menjawab kosong. Dikunci `fallback.test.ts`.
- **Dokumen demo**: `check:docs` memvalidasi setiap ID yang dikutip di `docs/demo/` terhadap dataset. Jangan menulis jumlah pemeriksaan secara hardcoded.

## Frontend

- Semua perubahan komponen mengikuti skill `design-taste-frontend`; `pnpm run lint:ui` menegakkan aturan mekanisnya.
- Warna hanya lewat token `@theme` di `apps/web/src/index.css` (`bg-accent`, `text-muted`, `border-border`, ...). `pnpm run lint:tokens` menolak hex di luar blok itu.
- Angka pada tabel dan KPI memakai `tabular-nums`; font DM Sans.

## Tooling & CLI di Windows

- Untuk pencarian teks cepat, gunakan `rtk rg` (atau `rg`) karena ripgrep terpasang di sistem (`C:\Users\User\.local\bin\rg.exe`). Jangan gunakan `grep` langsung (tidak ada di PATH Windows default).
- Operasi branch worktree: saat menghapus branch fitur setelah merge ke integration branch yang posisinya mendahului branch root (`main`), jalankan `git branch -d` pada direktori worktree integrasi terkait atau gunakan `-C <worktree-path>`.
- Pemanggilan GitHub CLI (`gh`): lakukan dengan penanganan retry atau timeout yang cukup jika terjadi kendala jaringan sesaat.

## Issue & commit di Windows

- Untuk body issue/PR yang panjang, tulis ke file lalu gunakan `--body-file`; jangan menempel argumen inline dengan simbol PowerShell sensitif.
