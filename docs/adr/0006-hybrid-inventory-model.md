# 0006: Hybrid Inventory and Asset Circulation Model

- **Status**: Accepted
- **Deciders**: Tech Lead, Product Owner
- **Date**: 2026-10-23

## Context and Problem Statement

Sekolah membutuhkan pencatatan logistik sarana dan prasarana terpadu. Terdapat dua karakteristik barang dengan kebutuhan pengelolaan yang kontras:
1. **Aset Tetap / Modal (Fixed Assets)**: Unit fisik berharga yang harus dilacak per unit/serial/kode barcode, memiliki kondisi fisik (baik/rusak), ditempatkan di ruangan tertentu, dan disirkulasikan melalui peminjaman sementara oleh guru/staf.
2. **Barang Habis Pakai (Consumables / ATK)**: Perlengkapan harian (spidol, kertas, baterai, cairan lab) yang dilacak berdasarkan kuantitas stok agregat, ambang batas minimum (*reorder point*), dan berkurang saat dikeluarkan/diminta.

Kami perlu memutuskan struktur domain, pola persistensi pada Cloudflare D1/SQLite, dan tingkat integrasi terhadap modul lain.

## Decision Drivers

- **Simplicity & Performance**: Menjaga efisiensi query D1 tanpa abstraksi polimorfik yang membingungkan.
- **Data Integrity**: Memastikan pelacakan unit unik tidak tercampur baur dengan penyesuaian kuantitas massal.
- **Traceability**: Riwayat mutasi stok habis pakai dan sirkulasi peminjaman aset harus tercatat auditnya (siapa yang meminjam, menyetujui, dan kondisi saat kembali).
- **Loose Coupling**: Modul inventory harus dapat beroperasi mandiri tanpa memblokir atau bergantung langsung pada jurnal akuntansi keuangan ganda di fase awal.

## Considered Options

1. **Fully Polymorphic Table (Single Items Table)**: Menggabungkan semua atribut aset unik dan stok agregat ke satu tabel tabel raksasa dengan banyak kolom opsional/nullable.
2. **Separated Silo Tables**: Membuat dua modul terpisah tanpa katalog bersama (`fixed_assets` vs `consumable_supplies`).
3. **Shared Item Master with Dedicated Sub-tables (Hybrid Catalog)**: Satu katalog induk (`inventory_items`) yang membedakan tipe barang (`fixed_asset` vs `consumable`), lalu dihubungkan ke entitas unit unik (`inventory_asset_units`) atau transaksi mutasi saldo kuantitas (`inventory_stock_movements`).

## Decision Outcome

Dipilih **Opsi 3: Shared Item Master with Dedicated Sub-tables (Hybrid Catalog)**.

### Arsitektur Data:
- `inventory_items`: Katalog induk (nama, kode/SKU, kategori, tipe: `fixed_asset` | `consumable`, satuan ukur, deskripsi).
- `inventory_asset_units`: Menyimpan setiap unit fisik unik untuk barang tipe `fixed_asset` (nomor registrasi/tag unik, nomor seri pabrikan, lokasi ruangan/fasilitas, status: `available` | `loaned` | `maintenance` | `disposed`, kondisi fisik: `good` | `light_damage` | `heavy_damage` | `lost`).
- `inventory_stock_movements`: Log mutasi kuantitas untuk barang tipe `consumable` (`in` / restock, `out` / requisition, `adjustment` / opname), mencatat selisih stok, stok akhir, referensi pemohon, dan alasan.
- `inventory_loans`: Siklus peminjaman aset fisik oleh guru/staf dengan approval oleh Admin Sarpras/TU, mencatat estimasi tanggal kembali, tanggal aktual kembali, inspeksi kondisi saat keluar dan kembali, serta status keterlambatan (*overdue*).
- `inventory_requisitions`: Pengajuan alokasi barang habis pakai oleh guru/unit kelas dengan approval oleh Admin TU.

### Batasan Integrasi:
- **Finance**: Nilai beli/perolehan dicatat sebagai metadata referensi historis, bukan entri pembukuan double-entry otomatis.
- **Ruangan & Fasilitas**: Menggunakan referensi lokasi ruangan fisik (`room_id`), namun tidak mengambil alih modul jadwal pemesanan kelas/ruangan (*facility booking*).

## Consequences

### Positive:
- Struktur pencarian katalog tunggal yang mudah digunakan pengguna.
- Audit trail jelas untuk peminjaman aset maupun selisih opname stok habis pakai.
- Mendukung cetak label / scan barcode melalui nomor registrasi unik aset.

### Negative / Trade-offs:
- Perlu validasi bisnis di API layer untuk mencegah transaksi mutasi kuantitas pada barang yang bertipe `fixed_asset` dan sebaliknya.
