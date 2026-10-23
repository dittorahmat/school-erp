# 07: Parent Portal Multi-Student Slice

**What to build:** Pengalaman portal Wali (Orang Tua) yang terintegrasi penuh untuk mendukung orang tua dengan lebih dari satu anak di sekolah (`guardian_students`). Fitur profile switcher anak yang mengubah konteks aktif untuk melihat rangkuman presensi, rincian tagihan SPP, dan buku nilai/rapor anak yang dipilih secara seamless.

**Blocked by:** 04: Attendance Slice, 05: Finance SPP and R2 Storage Slice, 06: Gradebook and Report Slice

**Status:** ready-for-agent

- [ ] Schema relasi `guardian_students` di Drizzle
- [ ] Endpoint `/api/parent/children` dan detail agregat per siswa
- [ ] UI komponen Child Selector / Switcher di header portal Wali
- [ ] Tampilan terintegrasi ringkasan akademik, presensi, dan tagihan per anak
