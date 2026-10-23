# 06: Gradebook and Report Slice

**What to build:** Sistem penilaian fleksibel bagi guru pengampu mata pelajaran untuk memasukkan nilai formatif/tugas, UTS, dan UAS/sumatif dengan bobot persentase terkonfigurasi. Rekapitulasi otomatis buku nilai dan generasi tampilan kartu Rapor semester untuk siswa.

**Blocked by:** 03: Academic Structure Slice

**Status:** resolved

- [x] Schema `assessment_components` dan `student_grades` di Drizzle
- [x] Endpoint input nilai per mata pelajaran dan rombel oleh Guru
- [x] Kalkulasi nilai akhir semester berbasis bobot komponen
- [x] UI tabel buku nilai (Gradebook) interaktif bagi Guru
- [x] UI ringkasan Rapor semester di portal Siswa dan Wali

## Answer
Modul Buku Nilai & Rapor telah diimplementasikan:
- Schema `assessment_components` dan `student_grades` dengan bobot dinamis.
- Endpoint `/api/gradebook/scores`, `/api/gradebook/save`, dan `/api/gradebook/report-card`.
- Komponen `GradebookManager` di `apps/web` dengan switcher tab Buku Nilai Guru & Preview Kartu Rapor Siswa.
