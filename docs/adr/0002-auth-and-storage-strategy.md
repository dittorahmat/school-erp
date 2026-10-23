# 2. Authentication and File Storage Strategy

Date: 2026-10-23

## Status

Accepted

## Context

Aplikasi School ERP dioperasikan di atas Cloudflare Workers dan D1. Sistem memerlukan:
1. Autentikasi untuk multi-role (Admin TU, Guru, Siswa, Wali) yang efisien di edge tanpa membebani kuota D1 read operations.
2. Mekanisme pengunggahan dokumen dan bukti transfer pembayaran SPP ke Cloudflare R2 secara aman.

## Decision

1. **Autentikasi**:
   - Menggunakan **Stateless JWT** (disimpan dalam cookie `HttpOnly`, `SameSite=Lax`, `Secure`) untuk access token (masa berlaku pendek, misal 15-30 menit).
   - Menggunakan **Refresh Token** (disimpan di database D1) untuk rotasi token saat access token kadaluarsa.
   - Verifikasi otorisasi pada setiap request diproses langsung di runtime Worker menggunakan Web Crypto API tanpa query ke D1.
2. **Penyimpanan Berkas (R2)**:
   - Pengunggahan berkas bukti pembayaran dan foto diproses melalui **Worker Proxy multipart/form-data** (maksimum ukuran berkas 5 MB).
   - Worker memvalidasi session, tipe MIME berkas, dan ukuran sebelum melakukan `bucket.put()` ke Cloudflare R2.
3. **Model Perwalian**:
   - Akun Wali memiliki relasi many-to-many terhadap Siswa melalui tabel perantara (`guardian_students`), memungkinkan satu akun orang tua memantau beberapa anak sekaligus.

## Consequences

### Positif
- **Hemat D1 Quota**: Verifikasi request harian zero-query ke database berkat validasi kriptografis JWT di edge.
- **Keamanan Ketat**: Cookie `HttpOnly` melindungi token dari serangan XSS di sisi browser.
- **Sederhana & Terkendali**: Upload melalui Worker memudahkan validasi izin role dan sanitasi nama file sebelum masuk ke bucket R2.

### Negatif / Mitigasi
- Token revocation seketika (immediate blacklist) memerlukan mekanisme storage cepat jika user diblokir di tengah jalan.
  - *Mitigasi*: Simpan daftar blocklist ID user bermasalah di Cloudflare KV jika diperlukan pemblokiran instan.
