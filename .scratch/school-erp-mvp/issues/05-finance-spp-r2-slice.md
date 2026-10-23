# 05: Finance SPP and R2 Storage Slice

**What to build:** Pengelolaan penagihan SPP bulanan dan pembayaran sekolah. Penerbitan tagihan secara batch oleh Admin TU, antarmuka melihat tagihan bagi Wali murid, fitur upload bukti bayar multipart melalui Cloudflare Worker langsung ke Cloudflare R2 bucket, serta antarmuka verifikasi pembayaran oleh Admin TU untuk merubah status tagihan menjadi Lunas.

**Blocked by:** 03: Academic Structure Slice

**Status:** resolved

- [x] Schema `fee_components` dan `invoices` di Drizzle
- [x] Fitur batch generation tagihan SPP per rombel/tingkatan
- [x] Endpoint upload bukti transfer via Worker proxy ke R2 bucket
- [x] UI daftar tagihan & formulir upload bukti bayar di portal Wali
- [x] UI verifikasi pembayaran dan konfirmasi lunas oleh Admin TU

## Answer
Modul Keuangan & SPP telah selesai diimplementasikan end-to-end:
- Schema `fee_components` dan `invoices` untuk melacak tagihan bulanan berulang dengan status Unpaid, Pending, Paid, dan Void.
- Endpoint `/api/finance/batch-generate` untuk penerbitan tagihan berkala oleh Admin TU.
- Endpoint `/api/finance/upload-proof` menggunakan Worker Multipart Proxy langsung ke Cloudflare R2 object storage binding.
- Endpoint `/api/finance/verify` untuk validasi pelunasan tagihan oleh Admin TU.
- Komponen antarmuka `FinanceManager` di `apps/web` dengan dialog upload bukti pembayaran ke edge storage dan badge status real-time.
