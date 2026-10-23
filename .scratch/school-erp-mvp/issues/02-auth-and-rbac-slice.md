# 02: Auth and RBAC Slice

**What to build:** Sistem autentikasi pengguna lengkap untuk 4 peran (Admin TU, Guru, Siswa, Wali). Schema D1 untuk `users` dan `refresh_tokens`. Endpoint Hono untuk login, logout, refresh token, dan current user (`/me`). Pengamanan token menggunakan Stateless JWT dalam cookie `HttpOnly`. Halaman login di `apps/web` dan auth state provider.

**Blocked by:** 01: Monorepo Foundation

**Status:** ready-for-agent

- [ ] Schema `users` dan `refresh_tokens` di Drizzle ORM
- [ ] Endpoint `/api/auth/login` memvalidasi kredensial (password hashing Web Crypto) dan mengeluarkan JWT cookie
- [ ] Endpoint `/api/auth/me` dan `/api/auth/logout` berfungsi
- [ ] Middleware proteksi rute Hono berdasarkan role pengguna
- [ ] Halaman login dan dashboard redirect di `apps/web`
