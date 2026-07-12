-- Tambahkan kolom no_hp_ortu ke tabel siswa
ALTER TABLE public.siswa ADD COLUMN IF NOT EXISTS no_hp_ortu TEXT;
