# 1. Cloudflare Serverless Stack (Workers, D1, R2, Drizzle ORM, Hono)

Date: 2026-10-23

## Status

Accepted

## Context

Aplikasi School ERP membutuhkan infrastruktur yang ringan, hemat biaya pemeliharaan (low-maintenance), memiliki latensi rendah di edge, serta skalabilitas tinggi tanpa mengelola VPS/server database konvensional. 

Platform Cloudflare menawarkan solusi edge serverless:
- **Cloudflare Workers**: runtime V8 edge berkemampuan komputasi cepat.
- **Cloudflare D1**: database SQL relasional (SQLite) terdistribusi di edge.
- **Cloudflare R2**: penyimpanan objek (object storage) S3-compatible tanpa biaya egress bandwidth untuk dokumen dan gambar (bukti transfer, scan rapor, foto profil).
- **Hono**: web framework ultra-cepat dan ergonomis yang native mendukung ekosistem Cloudflare.
- **Drizzle ORM**: ORM TypeScript yang ringan dengan dialect SQLite/D1 dan tipe data strict.

## Decision

Kami memutuskan untuk membangun School ERP dengan arsitektur **Fullstack Cloudflare Serverless**:
1. **Backend**: Hono Web API berjalan di atas Cloudflare Workers.
2. **Database**: Cloudflare D1 dikelola menggunakan Drizzle ORM untuk skema dan migrasi.
3. **Penyimpanan Berkas**: Cloudflare R2 untuk penyimpanan bukti pembayaran, foto profil, dan lampiran dokumen akademik.
4. **Frontend**: Vite React SPA yang di-host di Cloudflare Pages atau disajikan via Workers Static Assets.

## Consequences

### Positif
- **Zero Cold Start & Low Latency**: Performa aplikasi sangat cepat karena dieksekusi di edge node Cloudflare terdekat.
- **Cost Effective**: Model serverless tanpa biaya sewa server 24/7 saat jam sekolah tutup (malam/libur). Tanpa biaya egress bandwidth pada R2.
- **Type Safety End-to-End**: Berbagi skema dan types Drizzle dan Hono RPC antara client dan worker.

### Negatif / Mitigasi
- **Keterbatasan SQLite/D1**: D1 beroperasi dengan *single-primary write* dan batas ukuran database per D1 instance.
  - *Mitigasi*: Optimasi skema (indexing tepat, hindari N+1 query), arsipkan data log tahun ajaran lampau jika volume data membengkak.
- **Tidak ada library native Node.js C-bindings**: Harus menggunakan pustaka JavaScript murni atau WebAssembly yang kompatibel dengan runtime Workers.
