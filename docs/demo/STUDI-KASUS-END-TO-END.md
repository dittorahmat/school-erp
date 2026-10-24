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

1. Jalankan migrasi D1 lokal dari `apps/api`:
   ```bash
   pnpm exec wrangler d1 migrations apply school-erp-db --local
   ```
2. Jalankan `pnpm dev`, lalu buka `http://localhost:5173`.
3. Tanam data demo:
   ```bash
   pnpm db:seed
   ```
4. Pastikan baseline sehat:
   ```bash
   pnpm demo:smoke
   ```
   Hasil yang diharapkan: **semua pemeriksaan lulus**.

   > Smoke test menulis data uji (invoice Desember, satu pinjaman, satu requisisi) dan **mengubah saldo stok**. Karena itu jalankan smoke test pada database sekali pakai, lalu reset sebelum menelusuri babak demo:
   > ```bash
   > # hentikan wrangler dev, dari apps/api
   > Remove-Item -Recurse -Force .wrangler/state
   > pnpm exec wrangler d1 migrations apply school-erp-db --local
   > # jalankan dev server lagi, lalu
   > pnpm db:seed
   > ```
   > Dengan begitu angka pada studi kasus ini (stok spidol 16, kolektibilitas 41,7%, Dewi tanpa tunggakan) tetap akurat.

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

### 1.3 Tambah rombel
- **Aksi:** buka **Struktur Akademik**, isi nama `X-MIPA-3`, tingkat 10, klik **Tambah Rombel**.
- **Hasil:** kartu rombel baru muncul dengan 0 siswa dan wali "Belum ditentukan".
- **Cek:** reload halaman; rombel tetap ada karena tersimpan di D1.

### 1.4 Terbitkan SPP November 2026
- **Aksi:** buka **Keuangan & SPP** sebagai admin. Penerbitan massal dilakukan melalui API/alat demo:
  ```
  POST /api/finance/batch-generate  { "month": "2026-11" }
  ```
- **Hasil:** 12 tagihan baru dibuat; menjalankan ulang menghasilkan 0 tagihan baru.
- **Cek:** daftar tagihan memuat invoice November untuk 12 siswa.

### 1.5 Verifikasi bukti transfer
- **Aksi:** cari invoice `INV-2026-10-002` (Budi Santoso) berstatus **Menunggu Verifikasi**, klik **Verifikasi Lunas**.
- **Hasil:** status berubah menjadi **Lunas**, `paidAt` terisi, dan KPI verifikasi tertunda berkurang.
- **Cek:** pada dashboard, "Kolektibilitas SPP" naik dari 41,7% menjadi 50% setelah satu tagihan diverifikasi (baseline Oktober).

### 1.6 Audit inventaris
- **Aksi:** buka **Katalog Inventaris** → tab **Sirkulasi Pinjam**.
- **Hasil:** pinjaman laptop `AST/2026/2004` berlabel **Terlambat** karena estimasi kembali 22 Oktober 2026 sudah lewat.
- **Cek:** tab **Habis Pakai** menampilkan penghapus dengan saldo 3 di bawah minimum 5.

---

## 4. Babak 2 — Guru menjalankan kelas

### 2.1 Presensi harian
- **Aksi:** login `guru_budi`, buka **Presensi Siswa**.
- **Hasil:** kelas default X-MIPA-1, tanggal otomatis ke hari sekolah terakhir (23 Oktober 2026 saat demo dijalankan 24 Oktober), dan 5 siswa dimuat.
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
- **Aksi:** buka **Inventaris** → **Sirkulasi Pinjam** → ajukan pinjaman mikroskop yang tersedia (`AST/2026/3002`), estimasi kembali 2 November 2026.
- **Hasil:** pengajuan berstatus **Menunggu Persetujuan**; unit tetap `available` sampai disetujui.
- **Cek:** meminjam unit yang sedang dipinjam (mis. `AST/2026/1002`) ditolak.

### 2.5 Ajukan barang habis pakai
- **Aksi:** tab **Habis Pakai** → ajukan 1 kotak spidol dengan alasan "Kebutuhan papan tulis".
- **Hasil:** requisisi berstatus **Menunggu** dan muncul di daftar permintaan.
- **Cek:** stok belum berubah sampai admin menyetujui.

---

## 5. Babak 3 — Admin memproses persetujuan dan pengembalian

### 3.1 Setujui pinjaman
- **Aksi:** login `admin`, buka **Sirkulasi Pinjam**, setujui pengajuan mikroskop.
- **Hasil:** status pinjaman menjadi **Sedang Dipinjam**, unit aset menjadi `loaned`.
- **Cek:** menyetujui dua kali ditolak (HTTP 400).

### 3.2 Inspeksi pengembalian
- **Aksi:** klik **Terima & Cek** pada pinjaman aktif, pilih kondisi **Rusak Ringan**, isi catatan, simpan.
- **Hasil:** status menjadi **Sudah Kembali**, `actualReturnDate` terisi, kondisi unit berubah menjadi `light_damage`, dan unit kembali `available`.
- **Cek:** pengembalian kedua ditolak.

### 3.3 Setujui requisisi
- **Aksi:** tab **Habis Pakai** → setujui permintaan spidol.
- **Hasil:** status requisisi **Disetujui** dan otomatis tercatat mutasi keluar.
- **Cek:** saldo spidol turun dari **16** menjadi **14** kotak (requisisi seed berjumlah 2 kotak).

### 3.4 Opname stok
- **Aksi:** catat mutasi **Koreksi/Opname** untuk penghapus sesuai hitungan fisik, misalnya 3.
- **Hasil:** saldo baru menjadi dasar reorder berikutnya; riwayat mutasi menyimpan siapa dan kapan.
- **Cek:** pengeluaran melebihi saldo ditolak.

### 3.5 Label aset
- **Aksi:** buka detail unit aset → **Label Tag Aset**.
- **Hasil:** label memuat asset tag unik `AST/2026/xxxx`, nama barang, dan lokasi.
- **Cek:** asset tag tidak boleh duplikat.

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
- **JWT_SECRET produksi** masih berupa nilai di konfigurasi repo. Ini temuan keamanan terpisah dan tidak diubah oleh demo ini.
- **UI portal wali** menampilkan ringkasan; detail riwayat per tagihan masih melalui kartu SPP.
- **Presensi** disimpan per kelas dan tanggal; dukungan presensi per mata pelajaran sudah ada di skema tetapi belum diekspos di UI.

---

## 10. Perintah ringkas

| Kebutuhan | Perintah |
| :--- | :--- |
| Migrasi lokal | `cd apps/api && pnpm exec wrangler d1 migrations apply school-erp-db --local` |
| Jalankan aplikasi | `pnpm dev` |
| Seed demo | `pnpm db:seed` |
| Smoke test | `pnpm demo:smoke` |
| Guardrail | `pnpm run check` |
| Deploy | `pnpm run deploy` |
| Seed produksi | `node scripts/seed-demo.mjs --base https://school-erp.tech1solusi.workers.dev` |
