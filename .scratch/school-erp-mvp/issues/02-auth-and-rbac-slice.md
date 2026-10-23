# 02: Auth and RBAC Slice

**What to build:** Sistem autentikasi pengguna lengkap untuk 4 peran (Admin TU, Guru, Siswa, Wali). Schema D1 untuk `users` dan `refresh_tokens`. Endpoint Hono untuk login, logout, refresh token, dan current user (`/me`). Pengamanan token menggunakan Stateless JWT dalam cookie `HttpOnly`. Halaman login di `apps/web` dan auth state provider.

**Blocked by:** 01: Monorepo Foundation

**Status:** resolved

- [x] Schema `users` dan `refresh_tokens` di Drizzle ORM
- [x] Endpoint `/api/auth/login` memvalidasi kredensial (password hashing Web Crypto) dan mengeluarkan JWT cookie
- [x] Endpoint `/api/auth/me` dan `/api/auth/logout` berfungsi
- [x] Middleware proteksi rute Hono berdasarkan role pengguna
- [x] Halaman login dan dashboard redirect di `apps/web`

## Answer
Sistem Autentikasi dan Otorisasi RBAC telah selesai diimplementasikan secara end-to-end:
- Hashing password menggunakan Web Crypto API (PBKDF2 SHA-256) dan Stateless JWT signing HS256 yang kompatibel penuh dengan edge runtime Cloudflare Workers.
- Middleware `authMiddleware` dan `requireRoles` untuk pengamanan route Hono.
- Router autentikasi `/api/auth/login`, `/api/auth/logout`, dan `/api/auth/me` terintegrasi dengan cookie `HttpOnly`.
- Auth Context dan antarmuka Halaman Login + Dashboard responsif di `apps/web` berhasil di-build dan siap digunakan.
