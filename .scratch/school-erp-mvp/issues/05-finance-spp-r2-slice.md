# 05: Finance SPP and R2 Storage Slice

**What to build:** Pengelolaan penagihan SPP bulanan dan pembayaran sekolah. Penerbitan tagihan secara batch oleh Admin TU, antarmuka melihat tagihan bagi Wali murid, fitur upload bukti bayar multipart melalui Cloudflare Worker langsung ke Cloudflare R2 bucket, serta antarmuka verifikasi pembayaran oleh Admin TU untuk merubah status tagihan menjadi Lunas.

**Blocked by:** 03: Academic Structure Slice

**Status:** ready-for-agent

- [ ] Schema `fee_components` dan `invoices` di Drizzle
- [ ] Fitur batch generation tagihan SPP per rombel/tingkatan
- [ ] Endpoint upload bukti transfer via Worker proxy ke R2 bucket
- [ ] UI daftar tagihan & formulir upload bukti bayar di portal Wali
- [ ] UI verifikasi pembayaran dan konfirmasi lunas oleh Admin TU
