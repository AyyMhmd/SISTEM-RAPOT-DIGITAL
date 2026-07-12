-- 1. Enum Semester (jika belum ada)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'semester_tipe') THEN
        CREATE TYPE semester_tipe AS ENUM ('Ganjil', 'Genap');
    END IF;
END$$;

-- 2. Create Tabel Nilai
CREATE TABLE public.nilai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  mapel_id UUID NOT NULL REFERENCES public.mapel(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  semester semester_tipe NOT NULL,
  tahun_ajaran TEXT NOT NULL,
  
  nilai_tugas NUMERIC,
  nilai_uts NUMERIC,
  nilai_uas NUMERIC,
  
  deskripsi_pengetahuan TEXT,
  deskripsi_keterampilan TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Satu siswa hanya punya 1 record nilai per mapel di satu semester & tahun ajaran tertentu
  UNIQUE(siswa_id, mapel_id, semester, tahun_ajaran)
);

-- Enable RLS
ALTER TABLE public.nilai ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies untuk Nilai

-- Staff sekolah bisa melihat nilai
CREATE POLICY "School staff can read all nilai" ON public.nilai
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('TU', 'KEPALA_SEKOLAH', 'WALI_KELAS', 'GURU_MAPEL'))
  );

-- Guru Mapel bisa input (INSERT/UPDATE/DELETE) nilai jika mereka yang mengajar kelas dan mapel tersebut
CREATE POLICY "Guru Mapel can manage nilai for their classes" ON public.nilai
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.guru_mapel 
      WHERE guru_id = auth.uid() 
      AND mapel_id = public.nilai.mapel_id 
      AND kelas_id = public.nilai.kelas_id
    )
  );

-- Siswa bisa melihat nilainya sendiri
CREATE POLICY "Siswa can read their own nilai" ON public.nilai
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.siswa WHERE id = public.nilai.siswa_id AND user_id = auth.uid())
  );
