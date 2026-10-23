# Domain Glossary: School ERP

Dokumen ini mendefinisikan istilah resmi (canonical vocabulary) yang digunakan dalam domain ERP Sekolah ini. Istilah di sini terbebas dari detail teknis implementasi.

---

### User & Akses
- **Pengguna (User)**: Entitas akun yang memiliki kredensial login ke dalam sistem. Terdiri dari peran (role): Admin TU, Guru, Siswa, dan Wali.
- **Admin Tata Usaha (Admin TU)**: Staf sekolah yang mengelola administrasi umum, konfigurasi kurikulum, pembagian kelas, penerbitan tagihan, dan verifikasi pembayaran.
- **Guru (Teacher)**: Pendidik yang mengampu mata pelajaran, memegang perwalian kelas (Wali Kelas), mencatat presensi, dan memasukkan nilai akademik/karakter.
- **Siswa (Student)**: Peserta didik yang terdaftar pada tahun ajaran aktif dan ditempatkan dalam suatu rombongan belajar.
- **Wali (Guardian/Parent)**: Orang tua atau perwakilan sah dari satu atau lebih siswa yang memiliki akses pemantauan presensi, nilai, dan kewajiban SPP melalui relasi akun perwalian (bisa mengaitkan multi-anak).
- **Relasi Wali-Siswa (Guardian-Student Association)**: Hubungan formal antara akun wali dan siswa (misalnya: Ayah, Ibu, Wali Sah) yang memungkinkan pemantauan terpusat untuk orang tua dengan lebih dari satu anak di sekolah yang sama.

### Akademik & Kesiswaan
- **Tahun Ajaran (Academic Year)**: Siklus kalender pendidikan sekolah (misalnya 2025/2026) yang dibagi menjadi dua periode: Semester Ganjil dan Semester Genap.
- **Tingkat (Grade Level)**: Jenjang kelas paralel dalam sekolah (misalnya Kelas 7, 8, 9 atau 10, 11, 12).
- **Rombongan Belajar / Rombel (Classroom / Section)**: Kelompok belajar fisik siswa dalam satu tingkatan pada tahun ajaran tertentu (misalnya "X-MIPA-1") yang dibimbing oleh seorang Wali Kelas.
- **Penempatan Belajar (Student Enrollment)**: Catatan penempatan siswa ke dalam rombongan belajar tertentu pada tahun ajaran dan semester aktif. Mempertahankan riwayat historis saat siswa naik kelas atau lulus.
- **Mata Pelajaran (Subject)**: Kurikulum materi belajar yang diajarkan oleh guru kepada siswa pada rombel tertentu.
- **Jadwal Pelajaran (Schedule)**: Alokasi hari, jam pelajaran, dan ruang untuk mata pelajaran tertentu bersama guru pengampu.

### Presensi (Attendance)
- **Sesi Presensi (Attendance Session)**: Catatan kehadiran harian (presensi sekolah) atau presensi per mata pelajaran.
- **Status Kehadiran (Attendance Status)**: Status kehadiran siswa/guru: Hadir, Sakit, Izin, atau Alpa (Tanpa Keterangan).

### Keuangan (Finance)
- **Komponen Biaya (Fee Component)**: Jenis pungutan biaya sekolah (contoh: SPP Bulanan, Uang Gedung/Pangkal, Biaya Kegiatan, Ujian).
- **Tagihan (Invoice / Bill)**: Dokumen penagihan yang diterbitkan oleh sekolah kepada siswa dengan nominal, tanggal jatuh tempo, dan rincian komponen biaya.
- **Bukti Pembayaran (Payment Proof)**: Berkas atau salinan transfer yang diunggah oleh wali/siswa untuk diverifikasi oleh Admin TU, atau catatan transaksi digital otomatis.
- **Status Pembayaran (Payment Status)**: Keadaan tagihan: Belum Dibayar (Unpaid), Menunggu Verifikasi (Pending), Lunas (Paid), atau Dibatalkan (Void).

### Penilaian (Gradebook)
- **Komponen Penilaian (Assessment Component)**: Unsur evaluasi belajar (misalnya: Tugas/PR, Kuis, Penilaian Harian/Formatif, UTS, UAS/Sumatif).
- **Buku Nilai (Gradebook)**: Rekapitulasi perolehan nilai siswa pada setiap komponen penilaian dalam satu mata pelajaran dan semester.
- **Rapor (Report Card)**: Dokumen ringkasan akhir capaian belajar akademik, presensi, dan catatan ekstrakurikuler/perilaku siswa dalam satu semester.
