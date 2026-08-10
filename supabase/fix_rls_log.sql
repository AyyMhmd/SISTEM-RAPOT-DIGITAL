-- Hapus kebijakan RLS lama yang terlalu ketat dan memblokir widget
DROP POLICY IF EXISTS "View logs based on role" ON public.log_aktivitas;

-- Buat kebijakan baru yang lebih sederhana
-- Mengizinkan semua user yang login untuk membaca tabel log_aktivitas
-- (Filter spesifik TU/Kepsek/Wakel akan dilakukan di kode frontend/widget)
CREATE POLICY "View logs based on role" ON public.log_aktivitas
  FOR SELECT
  USING (auth.role() = 'authenticated');
