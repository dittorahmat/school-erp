# 04: Attendance Slice

**What to build:** Sistem presensi harian dan per mata pelajaran untuk siswa dan guru. Sesi presensi yang diisi oleh Guru/Wali Kelas dengan status Hadir, Sakit, Izin, atau Alpa. Riwayat presensi dapat dilihat secara transparan oleh Siswa dan Wali di portal masing-masing.

**Blocked by:** 03: Academic Structure Slice

**Status:** ready-for-agent

- [ ] Schema `attendance_sessions` dan `attendance_records` di Drizzle
- [ ] Endpoint input dan update presensi oleh Guru
- [ ] Endpoint rekap kehadiran siswa per semester
- [ ] UI form checklist presensi cepat untuk Guru di `apps/web`
- [ ] UI riwayat kehadiran di portal Siswa/Wali
