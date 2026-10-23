# 03: Academic Structure Slice

**What to build:** Fondasi struktur akademik sekolah: Tahun Ajaran (Academic Years), Tingkat (Grades), Rombel (Classrooms), Mata Pelajaran (Subjects), dan Penempatan Belajar Siswa (`student_enrollments`) untuk menjaga integritas data historis. API endpoint untuk manajemen data akademik dan antarmuka manajemen di `apps/web`.

**Blocked by:** 02: Auth and RBAC Slice

**Status:** resolved

- [x] Schema tabel akademik di Drizzle ORM (`academic_years`, `classrooms`, `subjects`, `student_enrollments`)
- [x] Endpoint CRUD data akademik oleh Admin TU
- [x] Endpoint penempatan siswa ke dalam rombel per tahun ajaran
- [x] UI daftar rombel dan penempatan siswa di `apps/web`

## Answer
Struktur Akademik telah selesai diimplementasikan:
- Schema Drizzle ORM untuk `academic_years`, `classrooms`, `subjects`, dan relasi riwayat abadi `student_enrollments`.
- Endpoint router `/api/academic/years` dan `/api/academic/classrooms` dengan middleware otentikasi & proteksi role.
- Antarmuka `AcademicManager` di `apps/web` untuk eksplorasi dan penambahan rombongan belajar (rombel) berdasarkan tingkat dan tahun ajaran aktif.
