# Demo End-to-End School ERP

Folder ini berisi studi kasus demo yang dapat dijalankan ulang untuk seluruh modul School ERP.

- **[STUDI-KASUS-END-TO-END.md](./STUDI-KASUS-END-TO-END.md)** — skenario lengkap 6 babak, hasil yang diharapkan, kasus negatif, dan checklist penerimaan.
- **Seeder** — `pnpm db:seed` menanam data demo secara idempoten.
- **Smoke test** — `pnpm demo:smoke` memverifikasi alur API end-to-end.

## Ringkasan data demo

| Aspek | Nilai |
| :--- | :--- |
| Tahun ajaran aktif | 2026/2027, Semester Ganjil |
| Rentang semester | 13 Juli - 18 Desember 2026 |
| Rombel | 6 (X-MIPA-1, X-MIPA-2, XI-MIPA-1, XI-IPS-1, XII-MIPA-1, VII-B) |
| Siswa | 12 |
| Guru | 2 akun login (Budi Purnomo, Siti Rahmawati) |
| Wali | 2 akun (multi-anak dan tunggal) |
| Presensi | 45 hari sekolah, 24 Agustus - 23 Oktober 2026 |
| Tagihan | 25 invoice (SPP September & Oktober 2026 + kegiatan) |
| Inventaris | 7 item, 10 unit aset, 5 pinjaman, 6 mutasi stok, 3 requisisi |

## Akun demo

| Peran | Username | Password | Fokus demo |
| :--- | :--- | :--- | :--- |
| Admin TU | `admin` | `admin123` | Akademik, SPP, verifikasi, inventaris |
| Guru wali kelas | `guru_budi` | `guru123` | Presensi, nilai, pinjam aset, requisisi |
| Guru mapel | `guru_siti` | `guru123` | Nilai dan presensi X-MIPA-2 |
| Siswa | `siswa_ahmad` | `siswa123` | Rapor, tagihan, unggah bukti |
| Siswa | `siswa_dewi` | `siswa123` | Rapor dan presensi X-MIPA-2 |
| Siswa | `siswa_budi` | `siswa123` | Tagihan menunggu verifikasi |
| Siswa | `siswa_citra` | `siswa123` | Tagihan lunas |
| Siswa | `siswa_eka` | `siswa123` | Nilai di bawah KKM |
| Siswa | `siswa_fajar` | `siswa123` | Presensi dan nilai stabil |
| Wali multi-anak | `wali_subagyo` | `wali123` | Ahmad Dahlan dan Dewi Sartika |
| Wali tunggal | `wali_hartono` | `wali123` | Budi Santoso |

Kesebelas akun di atas adalah akun login yang dipakai demo. Dataset seed total berisi 17 user, karena 12 siswa perlu ada sebagai data rombel walau tidak semuanya dipakai sebagai akun demo.

## Menjalankan lokal

```bash
pnpm install

# dari apps/api
pnpm exec wrangler d1 migrations apply school-erp-db --local

# dari root, terminal terpisah
pnpm dev

# terminal lain
pnpm db:seed
pnpm demo:smoke
```

Buka `http://localhost:5173`. Seed dapat dijalankan berulang tanpa menggandakan data.

## Menjalankan di produksi

```bash
# 1. Preflight: pastikan tabel yang ada di remote
cd apps/api
pnpm exec wrangler d1 execute school-erp-db --remote --command "SELECT name FROM sqlite_master WHERE type='table'"

# 1b. Jika tabel 0000 sudah ada tetapi riwayat migrasi belum ada, baseline dulu:
pnpm exec wrangler d1 execute school-erp-db --remote --command "CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL); INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0000_elite_lionheart.sql');"

# 2. Terapkan migrasi
pnpm exec wrangler d1 migrations apply school-erp-db --remote

# 3. Deploy edge monolith
cd ../..
pnpm run deploy

# 4. Tanam data demo (aditif, idempoten)
node scripts/seed-demo.mjs --base https://school-erp.tech1solusi.workers.dev

# 5. Verifikasi produksi (read-only, tidak menulis data)
pnpm verify:prod
```

Sebelum migrasi produksi, ekspor D1 sebagai cadangan:

```bash
cd apps/api
pnpm exec wrangler d1 export school-erp-db --remote --output backup-pre-demo.sql
```

Rollback aman: kembalikan Worker ke versi sebelumnya dengan `pnpm exec wrangler rollback`, lalu hapus baris demo berdasarkan ID tetap (`usr_*`, `cls_*`, `INV-*`) bila diperlukan. Migrasi `0001` hanya menambah tabel/kolom, tidak menghapus data.

Smoke test **tidak** dijalankan ke produksi secara default karena membuat data uji baru. Untuk produksi, gunakan `pnpm verify:prod` yang hanya membaca data, lalu telusuri studi kasus secara manual.

`pnpm run check` menegakkan guardrail berikut, dan CI menjalankan perintah yang sama pada setiap PR:

| Guardrail | Menangkap |
| :--- | :--- |
| `tsc` + Vitest | tipe, unit domain, matriks otorisasi rute (`authz.test.ts`) |
| `lint:ui` | pola desain terlarang |
| `lint:tokens` | warna hex di luar `index.css` `@theme` |
| `check:docs` | ID yang dikutip dokumen demo tetapi tidak ada di dataset seed |

## Reset data lokal

```bash
pnpm demo:reset
```

Perintah ini menghapus `apps/api/.wrangler/state`, menerapkan migrasi, menyalakan dev server sementara, menjalankan seed, lalu mematikannya lagi. Hentikan dev server dulu — script menolak berjalan bila masih ada server di `http://127.0.0.1:8787`. Untuk reset tanpa seed: `pnpm demo:reset --no-seed`.

Langkah manualnya tetap ada bila script tidak cocok: hapus `.wrangler/state` di `apps/api`, `pnpm exec wrangler d1 migrations apply school-erp-db --local`, jalankan `pnpm dev`, lalu `pnpm db:seed`.

Script demo memakai `http://127.0.0.1:8787`. Di Windows `localhost` bisa resolve ke IPv6 sementara Wrangler hanya mendengar di IPv4, sehingga gejalanya `fetch failed`.
