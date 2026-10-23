# 04: Attendance Slice

**What to build:** Sistem presensi harian dan per mata pelajaran untuk siswa dan guru. Sesi presensi yang diisi oleh Guru/Wali Kelas dengan status Hadir, Sakit, Izin, atau Alpa. Riwayat presensi dapat dilihat secara transparan oleh Siswa dan Wali di portal masing-masing.

**Blocked by:** 03: Academic Structure Slice

**Status:** resolved

- [x] Schema `attendance_sessions` dan `attendance_records` di Drizzle
- [x] Endpoint input dan update presensi oleh Guru
- [x] Endpoint rekap kehadiran siswa per semester
- [x] UI form checklist presensi cepat untuk Guru di `apps/web`
- [x] UI riwayat kehadiran di portal Siswa/Wali

## Answer
Modul Presensi Siswa telah diimplementasikan end-to-end:
- Schema `attendance_sessions` dan `attendance_records` dengan status Hadir, Sakit, Izin, dan Alpa.
- Endpoint `/api/attendance/session` dan `/api/attendance/summary` dengan verifikasi otorisasi.
- Komponen interaktif `AttendanceChecklist` di `apps/web` memungkinkan guru menandai kehadiran siswa secara visual dan cepat.
