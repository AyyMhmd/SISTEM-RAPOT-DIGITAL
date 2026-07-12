-- 1. Create Tabel Rapor Wali Kelas (Sikap, Ekskul, Catatan)
CREATE TABLE public.rapor_wali_kelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  semester semester_tipe NOT NULL,
  tahun_ajaran TEXT NOT NULL,
  
  -- Nilai Sikap
  sikap_spiritual TEXT,
  sikap_sosial TEXT,
  
  -- Ekstrakurikuler (bisa sampai 3)
  ekskul_1_nama TEXT,
  ekskul_1_nilai TEXT,
  ekskul_2_nama TEXT,
  ekskul_2_nilai TEXT,
  ekskul_3_nama TEXT,
  ekskul_3_nilai TEXT,
  
  -- Catatan Wali Kelas
  catatan TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Satu siswa hanya punya 1 catatan per semester di tahun ajaran tertentu
  UNIQUE(siswa_id, semester, tahun_ajaran)
);

-- Enable RLS
ALTER TABLE public.rapor_wali_kelas ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Semua staff dan wali kelas bisa melihat
CREATE POLICY "School staff can read all rapor_wali_kelas" ON public.rapor_wali_kelas
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('TU', 'KEPALA_SEKOLAH', 'WALI_KELAS'))
  );

-- Wali kelas bisa insert/update catatan hanya untuk kelas perwaliannya
CREATE POLICY "Wali Kelas can manage catatan for their class" ON public.rapor_wali_kelas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kelas 
      WHERE id = public.rapor_wali_kelas.kelas_id 
      AND wali_kelas_id = auth.uid()
    )
  );

-- Siswa bisa melihat catatannya sendiri
CREATE POLICY "Siswa can read their own catatan" ON public.rapor_wali_kelas
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.siswa WHERE id = public.rapor_wali_kelas.siswa_id AND user_id = auth.uid())
  );
