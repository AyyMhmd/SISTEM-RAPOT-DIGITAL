-- 1. Menambahkan kolom is_approved_by_kepsek pada tabel rapor_wali_kelas
ALTER TABLE public.rapor_wali_kelas
ADD COLUMN is_approved_by_kepsek BOOLEAN DEFAULT false;

-- Keterangan:
-- Kolom ini digunakan untuk menyimpan status persetujuan dari Kepala Sekolah.
-- Jika true, maka RaporComponent akan menampilkan tanda tangan digital Kepala Sekolah.
