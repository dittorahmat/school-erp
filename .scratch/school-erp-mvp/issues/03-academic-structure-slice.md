# 03: Academic Structure Slice

**What to build:** Fondasi struktur akademik sekolah: Tahun Ajaran (Academic Years), Tingkat (Grades), Rombel (Classrooms), Mata Pelajaran (Subjects), dan Penempatan Belajar Siswa (`student_enrollments`) untuk menjaga integritas data historis. API endpoint untuk manajemen data akademik dan antarmuka manajemen di `apps/web`.

**Blocked by:** 02: Auth and RBAC Slice

**Status:** ready-for-agent

- [ ] Schema tabel akademik di Drizzle ORM (`academic_years`, `classrooms`, `subjects`, `student_enrollments`)
- [ ] Endpoint CRUD data akademik oleh Admin TU
- [ ] Endpoint penempatan siswa ke dalam rombel per tahun ajaran
- [ ] UI daftar rombel dan penempatan siswa di `apps/web`
