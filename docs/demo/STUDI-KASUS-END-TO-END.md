# Studi Kasus End-to-End: School ERP

Skenario ini menuntun satu siklus operasional sekolah dari konfigurasi akademik sampai pemantauan wali. Perkiraan durasi **25-30 menit** untuk empat peran.

> Semua angka di bawah berasal dari data seed pada database yang baru di-seed dan telah diverifikasi oleh `pnpm demo:smoke`. Smoke test menulis data uji; reset database sebelum menelusuri babak demo (lihat §2).

---

## 1. Peta data demo

| Entitas | Nilai |
| :--- | :--- |
| Tahun ajaran | 2026/2027 Ganjil, 13 Juli - 18 Desember 2026 |
| Rombel | X-MIPA-1, X-MIPA-2, XI-MIPA-1, XI-IPS-1, XII-MIPA-1, VII-B |
| Siswa | 12 siswa |
| Mapel bernilai | Matematika, Bahasa Indonesia, Fisika, Bahasa Inggris |
| Bobot nilai | Tugas 30%, UTS 30%, SAS 40% |
| Presensi | 45 hari, 24 Agustus - 23 Oktober 2026 (X-MIPA-1 dan X-MIPA-2) |
| Tagihan | 25 invoice; 2 menunggu verifikasi |
| Pinjaman aset | 1 menunggu, 1 aktif, 1 terlambat, 1 selesai, 1 ditolak |
| Stok | Spidol 16 kotak, kertas 49 rim, penghapus 3 buah (di bawah minimum 5) |

**Pemain utama**

- **Admin TU** (`admin`) — Siti Aminah.
- **Guru** (`guru_budi`) — Budi Purnomo, wali kelas X-MIPA-1.
- **Guru** (`guru_siti`) — Siti Rahmawati, wali kelas X-MIPA-2.
- **Siswa** (`siswa_ahmad`) — Ahmad Dahlan, X-MIPA-1.
- **Wali** (`wali_subagyo`) — ayah Ahmad Dahlan dan Dewi Sartika.
- **Wali** (`wali_hartono`) — wali Budi Santoso.

---

## 2. Persiapan

1. Siapkan rahasia lokal (sekali per clone). `JWT_SECRET` tidak lagi ada di repo:
   ```bash
   cp apps/api/.dev.vars.example apps/api/.dev.vars
   ```
   Di Windows PowerShell: `Copy-Item apps/api/.dev.vars.example apps/api/.dev.vars`. Tanpa langkah ini API menjawab 500 `JWT_SECRET belum dikonfigurasi`.

2. Pastikan dev server berhenti, lalu siapkan database bersih:
   ```bash
   pnpm demo:reset
   ```
   Perintah ini menghapus D1 lokal, menerapkan migrasi, menyalakan dev server sementara, menjalankan seed, lalu mematikannya lagi.

3. Jalankan `pnpm dev`, lalu buka `http://localhost:5173`.

4. Opsional, cek baseline otomatis:
   ```bash
   pnpm demo:smoke
   ```
   Hasil yang diharapkan: **semua pemeriksaan lulus**.

   > Smoke test menulis data uji (invoice Desember, satu pinjaman, satu requisisi) dan **mengubah saldo stok**. Karena itu, sebelum menelusuri babak demo, hentikan dev server lalu jalankan `pnpm demo:reset` sekali lagi. Dengan begitu angka pada studi kasus ini (stok spidol 16, kolektibilitas 41,7%, Dewi tanpa tunggakan) tetap akurat.

---

## 3. Babak 1 — Admin TU menyiapkan operasional

### 1.1 Login dan verifikasi header
- **Aksi:** login `admin` / `admin123`.
- **Hasil:** header menampilkan `Tahun Ajaran 2026/2027 · Semester Ganjil · 13 Jul 2026 - 18 Des 2026`, tanggal hari ini, dan KPI dari D1.
- **Cek:** KPI "Total Siswa Aktif" = **12**, "Rombongan Belajar" = **6**.

### 1.2 Dashboard sadar hari sekolah
- **Aksi:** buka tab **Ringkasan**.
- **Hasil:** label presensi memakai hari sekolah terakhir, misalnya `Presensi per 23 Okt 2026`, bukan "hari ini" saat demo dijalankan pada akhir pekan.
- **Cek:** `8 dari 8 hadir` pada 23 Oktober 2026.

### 1.3 Konfigurasi Tahun Ajaran & Semester
- **Aksi:** buka **Struktur Akademik** → tab **Tahun Ajaran & Semester**. Admin dapat melihat daftar seluruh kalender akademik, menambahkan tahun ajaran baru (misalnya `2027/2028` Semester Ganjil dengan rentang tanggal kalender), atau mengklik tombol **Aktifkan** pada tahun ajaran yang dipilih.
- **Hasil:** tahun ajaran yang diaktifkan menjadi kalender berjalan secara instan (`isActive = true`), status visual berganti menjadi "Berjalan", dan tahun ajaran lainnya otomatis dinonaktifkan.
- **Cek:** data tahun ajaran dapat disunting rentang waktu dan semesternya melalui tombol **Sunting**.

### 1.4 Tambah rombel
- **Aksi:** buka tab **Rombongan Belajar (Rombel)**, isi nama `X-MIPA-3`, tingkat 10, klik **Tambah Rombel**.
- **Hasil:** kartu rombel baru muncul dengan 0 siswa dan wali "Belum ditentukan".
- **Cek:** reload halaman; rombel tetap ada karena tersimpan di D1.

### 1.5 Pendaftaran dan Manajemen Guru & Staf
- **Aksi:** buka menu **Data Guru & Staf**, klik **Tambah Guru & Staf**, masukkan NIP/username login, nama lengkap & gelar, kontak, peran (`teacher` atau `admin`), serta password akun.
- **Hasil:** akun staf baru terdaftar pada tabel direktori pegawai sekolah dan siap ditugaskan.
- **Cek:** biodata staf dapat disunting atau disetel ulang password-nya; akun staf dapat dihapus (dengan perlindungan akun admin yang sedang aktif tidak dapat menghapus dirinya sendiri).

### 1.6 Pendaftaran dan Manajemen Siswa
- **Aksi:** buka menu **Data Siswa**, klik **Tambah Siswa Baru**, masukkan NIS/username unik, nama lengkap, kontak, serta password akun.
- **Hasil:** siswa baru terdaftar pada tabel akun siswa dengan indikator rombel awal "Belum ditempatkan".
- **Cek:** biodata siswa dapat disunting atau disetel ulang password-nya melalui tombol aksi pada baris tabel; validasi mendeteksi username ganda bila mencoba mendaftarkan username yang sudah ada.

### 1.7 Penempatan Rombel & Penugasan Wali Kelas
- **Aksi:** buka **Struktur Akademik**. Pada setiap kartu rombel, admin dapat memilih guru sebagai **Wali Kelas** dari dropdown guru aktif atau menghapusnya. Klik **Kelola Anggota Siswa** untuk membuka dialog manajemen anggota kelas.
- **Hasil:** dialog menampilkan daftar siswa yang sedang terdaftar di rombel tersebut beserta opsi penambahan siswa dari daftar siswa aktif yang belum terdaftar.
- **Cek:** pilih salah satu siswa lalu klik **Masukkan**; siswa bertambah di rombel dan jumlah siswa di kartu rombel otomatis terbarui. Tombol **Keluarkan** mengeluarkan siswa dari rombel secara aman.

### 1.8 Pendaftaran dan Manajemen Orang Tua / Wali Siswa
- **Aksi:** buka menu **Data Orang Tua / Wali**, klik **Tambah Orang Tua / Wali**, masukkan nama lengkap, username login, kontak, password, serta centang siswa asuhan awal (misal siswa yang baru didaftarkan).
- **Hasil:** akun wali murid terdaftar pada master direktori wali dengan lencana siswa asuhan terkait.
- **Cek:** klik tombol **Relasi** pada baris wali murid untuk menambah atau melepas tautan siswa asuhan; profil wali murid dapat disunting atau disetel ulang password-nya.

### 1.9 Konfigurasi Tarif SPP & Pembuatan Tagihan
- **Aksi:** buka **Keuangan & SPP** sebagai admin. Buka tab **Komponen Biaya / Tarif** untuk melihat master tarif (seperti SPP Bulanan `fee_spp` Rp 350.000 atau Uang Kegiatan `fee_kegiatan` Rp 150.000). Admin dapat menambah tarif baru atau menyunting nominal tarif yang ada.
- **Penerbitan Otomatis:** pada tab tarif atau daftar tagihan, pilih bulan periode `2026-11` lalu klik **Terbitkan Tagihan Massal** (memanggil `POST /api/finance/batch-generate`).
- **Penerbitan Manual:** pada tab **Daftar Tagihan & Pembayaran**, klik tombol **Buat Tagihan Manual**, pilih siswa (misalnya Ahmad Dahlan `usr_student_1`), pilih jenis tarif, lalu simpan.
- **Hasil:** tagihan baru dibuat dan langsung tercantum di daftar tagihan dengan rincian siswa, nominal, dan status pembayaran.
- **Cek:** daftar tagihan memuat invoice untuk siswa dengan tanggal jatuh tempo terhitung otomatis.

### 1.10 Verifikasi bukti transfer & otomatisasi buku kas
- **Aksi:** cari invoice `INV-2026-10-002` (Budi Santoso) berstatus **Menunggu Verifikasi**, klik **Verifikasi Lunas**.
- **Hasil:** status invoice berubah menjadi **Lunas**, `paidAt` terisi, dan mutasi debit kas otomatis terbentuk di Buku Kas sebesar nominal SPP (Rp 350.000) dengan deskripsi `Pembayaran SPP - 2026-10 (Budi Santoso)`.
- **Cek:**
  1. Pada dashboard, "Kolektibilitas SPP" naik dari 41,7% menjadi 50% setelah satu tagihan diverifikasi (baseline Oktober).
  2. Buka tab **Buku Kas & Mutasi** pada menu Keuangan & SPP: entri debit baru berlabel badge **Otomatis SPP** tampil pada baris teratas, dan total debit kas bertambah.

### 1.11 Pengelolaan buku kas & mutasi kas manual
- **Aksi:** di tab **Buku Kas & Mutasi**, isi form "Tambah Transaksi Kas Baru" untuk mencatat pengeluaran operasional (Kredit), misal kategori `ATK` atau `Listrik`, masukkan nominal dan deskripsi, lalu klik **Simpan Transaksi**.
- **Hasil:** transaksi kredit baru langsung tercatat pada tabel dengan saldo berjalan (*running balance*) terbarui secara otomatis.
- **Cek:** gunakan filter "Manual / Operasional" dan "Otomatis SPP" untuk membedakan transaksi kas yang bersumber dari verifikasi tagihan siswa vs pengeluaran kas manual sekolah.

### 1.12 Audit inventaris
- **Aksi:** buka **Katalog Inventaris** → sub-tab **Sirkulasi Pinjam**.
- **Hasil:** pinjaman laptop `AST/2026/2004` berlabel **Terlambat** karena estimasi kembali 22 Oktober 2026 sudah lewat.
- **Cek:** sub-tab **Persediaan ATK** menampilkan penghapus dengan saldo 3 di bawah minimum 5 (ambang batas peringatan stok).

---

## 4. Babak 2 — Guru menjalankan kelas

### 2.1 Presensi harian
- **Aksi:** login `guru_budi`, buka **Presensi Siswa**.
- **Hasil:** kelas default X-MIPA-1, tanggal otomatis ke hari sekolah terakhir pada data seed (23 Oktober 2026), dan 5 siswa dimuat.
- **Langkah:** ubah satu siswa menjadi **Sakit**, klik **Simpan Presensi**.
- **Cek:** reload; status tersimpan. Menyimpan kelas dan tanggal yang sama tidak membuat sesi ganda.

### 2.2 Rekap presensi
- **Aksi:** buka ringkasan Ahmad (API `GET /api/attendance/summary?studentId=usr_student_1`).
- **Hasil:** `hadir 42, sakit 2, izin 1, alpa 0, total 45, persentase 93.3%`.
- **Cek:** siswa lain tidak dapat membaca rekap Ahmad (403).

### 2.3 Input nilai
- **Aksi:** buka **Buku Nilai & Rapor**, pilih Matematika / X-MIPA-1, ubah Tugas Harian Ahmad dari 88 menjadi 90, klik **Simpan Nilai**.
- **Hasil:** nilai akhir Ahmad berubah dari **87.9** menjadi **88.5**; predikat tetap A.
- **Cek:** nilai di luar 0-100 ditolak dengan HTTP 400.

### 2.4 Ajukan pinjam aset
- **Aksi:** buka **Katalog Inventaris** → sub-tab **Sirkulasi Pinjam** → klik tombol **Ajukan Peminjaman** di kanan atas. Pilih mikroskop yang tersedia (`AST/2026/3002`), isi estimasi kembali 2 November 2026 dan alasan penggunaan, lalu klik **Ajukan Peminjaman**.
- **Hasil:** pengajuan berstatus **Menunggu Persetujuan**; unit fisik tetap `available` sampai disetujui.
- **Cek:** pada formulir, unit yang sedang dipinjam (mis. `AST/2026/1002`) tidak muncul dalam daftar pilihan unit yang tersedia.

### 2.5 Ajukan barang habis pakai
- **Aksi:** buka sub-tab **Persediaan ATK** → klik tombol **Ajukan Permintaan ATK** di kanan atas. Pilih Spidol Boardmarker, jumlah 1 kotak, alasan "Kebutuhan papan tulis kelas X-MIPA-1", lalu klik **Kirim Permintaan**.
- **Hasil:** requisisi berstatus **Menunggu** dan langsung muncul di daftar Permintaan Barang Habis Pakai.
- **Cek:** saldo spidol belum berkurang sampai admin menyetujui.

---

## 5. Babak 3 — Admin memproses persetujuan dan pengembalian

### 3.1 Setujui pinjaman
- **Aksi:** login `admin`, buka **Katalog Inventaris** → sub-tab **Sirkulasi Pinjam**, klik ikon centang hijau (**Setujui**) pada pengajuan mikroskop.
- **Hasil:** status pinjaman menjadi **Sedang Dipinjam**, unit aset menjadi `loaned`.
- **Cek:** menyetujui dua kali ditolak (HTTP 400).

### 3.2 Inspeksi pengembalian
- **Aksi:** klik **Terima & Cek** pada pinjaman aktif (misal proyektor `AST/2026/1002`), pilih kondisi **Rusak Ringan**, isi catatan hasil inspeksi, lalu klik **Konfirmasi Pengembalian**.
- **Hasil:** status menjadi **Sudah Kembali**, `actualReturnDate` terisi, kondisi unit berubah menjadi `light_damage`, dan unit kembali `available`.
- **Cek:** pengembalian kedua ditolak.

### 3.3 Setujui requisisi
- **Aksi:** buka sub-tab **Persediaan ATK** → klik tombol centang hijau (**Setujui**) pada baris permintaan spidol.
- **Hasil:** status requisisi berubah menjadi **Disetujui** dan otomatis tercatat mutasi keluar pada kartu kendali persediaan.
- **Cek:** jika menyetujui permintaan guru baru (1 kotak), saldo spidol turun dari **16** menjadi **15** kotak. Jika menyetujui permintaan seed yang berstatus menunggu (2 kotak), saldo turun menjadi **14** kotak.

### 3.4 Opname stok
- **Aksi:** klik **Catat Mutasi Persediaan**, pilih jenis mutasi **Koreksi / Opname Fisik**, pilih barang Penghapus Papan Tulis dengan saldo riil 3.
- **Hasil:** saldo baru menjadi dasar reorder berikutnya; kartu kendali menyimpan riwayat mutasi koreksi lengkap dengan waktu dan keterangan.
- **Cek:** pengeluaran melebihi saldo ditolak.

### 3.5 Label aset
- **Aksi:** buka sub-tab **Unit Fisik**, klik tombol **Preview Tag** pada salah satu unit aset (misal `AST/2026/2004`).
- **Hasil:** kartu label menampilkan asset tag unik `AST/2026/2004`, nama barang, lokasi, dan QR preview.
- **Cek:** asset tag unik dan tidak boleh duplikat.

---

## 6. Babak 4 — Wali dan siswa memantau

### 4.1 Portal wali multi-anak
- **Aksi:** login `wali_subagyo`, buka **Portal Orang Tua**.
- **Hasil:** dua tombol anak: **Ahmad Dahlan (X-MIPA-1)** dan **Dewi Sartika (X-MIPA-2)**.
- **Cek:** Ahmad menampilkan kehadiran **93.3%**, tunggakan **1 tagihan / Rp 350.000**, rata-rata **86.15**. Dewi menampilkan kehadiran **97.8%**, tanpa tunggakan, rata-rata **90.5**.

### 4.2 Wali tunggal
- **Aksi:** login `wali_hartono`.
- **Hasil:** hanya **Budi Santoso** yang tampil.
- **Cek:** tidak ada data anak lain yang bocor.

### 4.3 Unggah bukti transfer
- **Aksi:** login `siswa_ahmad`, buka **Keuangan & SPP**, pilih invoice Oktober yang belum dibayar, unggah gambar bukti.
- **Hasil:** status berubah menjadi **Menunggu Verifikasi** dan file tersimpan di R2 dengan key `proofs/...`.
- **Cek:** admin kemudian memverifikasi menjadi **Lunas**.

### 4.4 Rapor semester
- **Aksi:** buka **Buku Nilai & Rapor** → **Preview Rapor Siswa**.
- **Hasil:** rapor Ahmad menampilkan 4 mapel, rata-rata semester, dan rekap kehadiran 42/2/1/0.
- **Cek:** rapor memakai tahun ajaran aktif dari D1, bukan teks hardcoded.

---

## 7. Babak 5 — Kasus negatif dan RBAC

| Kasus | Aksi | Hasil yang diharapkan |
| :--- | :--- | :--- |
| Password salah | Login `admin` dengan password acak | 401, pesan "Username atau password salah" |
| Siswa verifikasi SPP | `POST /api/finance/verify` sebagai siswa | 403 |
| Siswa lihat presensi lain | `GET /api/attendance/summary?studentId=usr_student_2` sebagai Ahmad | 403 |
| Nilai tidak valid | Simpan nilai 101 | 400 |
| Pinjam unit terpakai | Pinjam `AST/2026/1002` | 400 "tidak tersedia" |
| Approval ganda | Setujui pinjaman yang sudah disetujui | 400 |
| Return ganda | Kembalikan pinjaman yang sudah kembali | 400 |
| Requisisi ganda | Setujui requisisi yang sudah diproses | 400 |
| Stok kurang | Mutasi keluar melebihi saldo | 400 "stok tidak mencukupi" |

---

## 8. Babak 6 — Verifikasi otomatis dan checklist

Jalankan:

```bash
pnpm demo:smoke
```

Yang diperiksa: health, login lima peran, seed idempoten, tahun ajaran, rombel, roster, presensi, rekap, RBAC presensi, tagihan, filter siswa, batch idempoten, upload R2, verifikasi, RBAC verifikasi, buku nilai, simpan nilai, validasi nilai, rapor, overdue, pinjam, approve, approve ganda, return, return ganda, requisisi, potong stok, portal wali multi/tunggal, dan dashboard.

**Checklist penerimaan**

- [ ] Header menampilkan 2026/2027 dan rentang 13 Jul 2026 - 18 Des 2026.
- [ ] Presensi tersimpan dan tidak duplikat.
- [ ] Rekap Ahmad 42/2/1/0 (93.3%).
- [ ] SPP dapat diterbitkan, diunggah, dan diverifikasi.
- [ ] Nilai berbobot 30/30/40 dan rapor terhitung.
- [ ] Portal wali menampilkan anak yang benar.
- [ ] Pinjaman/requisisi mematuhi state machine.
- [ ] `pnpm run check` hijau.
- [ ] `pnpm demo:smoke` lulus seluruh pemeriksaan.

---

## 9. Keterbatasan yang perlu diketahui

- **NISN** belum menjadi kolom database; rapor menampilkan `-`. Identifier lain (ID siswa, username) tetap unik.
- **Smoke test default lokal** karena membuat invoice, pinjaman, dan requisisi uji. Untuk produksi, gunakan verifikasi manual.
- **Seed bersifat aditif**. Tidak ada tombol reset di produksi; reset hanya untuk D1 lokal.
- **R2 lokal** disimulasikan Miniflare. Unggahan produksi masuk ke bucket `school-erp-storage`.
- **JWT_SECRET** tidak ada di repo: lokal lewat `apps/api/.dev.vars`, produksi lewat `wrangler secret put`. Rotasi membatalkan semua sesi yang sedang aktif.
- **UI portal wali** menampilkan ringkasan; detail riwayat per tagihan masih melalui kartu SPP.
- **Presensi** disimpan per kelas dan tanggal; dukungan presensi per mata pelajaran sudah ada di skema tetapi belum diekspos di UI.

---

## 10. Perintah ringkas

| Kebutuhan | Perintah |
| :--- | :--- |
| Rahasia lokal (sekali) | `cp apps/api/.dev.vars.example apps/api/.dev.vars` |
| Reset + migrate + seed lokal | `pnpm demo:reset` (dev server harus berhenti) |
| Migrasi lokal saja | `cd apps/api && pnpm exec wrangler d1 migrations apply school-erp-db --local` |
| Jalankan aplikasi | `pnpm dev` |
| Seed saat dev berjalan | `pnpm db:seed` |
| Smoke test | `pnpm demo:smoke` |
| Guardrail | `pnpm run check` |
| Set/rotate secret produksi | `cd apps/api && pnpm exec wrangler secret put JWT_SECRET` |
| Deploy | `pnpm run deploy` |
| Seed produksi | `node scripts/seed-demo.mjs --base https://school-erp.tech1solusi.workers.dev` |
