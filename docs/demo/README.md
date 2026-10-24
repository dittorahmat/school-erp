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
| Wali multi-anak | `wali_subagyo` | `wali123` | Ahmad Dahlan dan Dewi Sartika |
| Wali tunggal | `wali_hartono` | `wali123` | Budi Santoso |

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

# 2. Terapkan migrasi
pnpm exec wrangler d1 migrations apply school-erp-db --remote

# 3. Deploy edge monolith
cd ../..
pnpm run deploy

# 4. Tanam data demo (aditif, idempoten)
node scripts/seed-demo.mjs --base https://school-erp.tech1solusi.workers.dev
```

Smoke test **tidak** dijalankan ke produksi secara default karena membuat data uji baru. Untuk produksi, verifikasi manual melalui studi kasus.

## Reset data lokal

```bash
# hentikan wrangler dev, lalu dari apps/api
rm -rf .wrangler/state
pnpm exec wrangler d1 migrations apply school-erp-db --local

# jalankan lagi dev server, lalu
pnpm db:seed
```

Di Windows PowerShell: `Remove-Item -Recurse -Force .wrangler/state`.
