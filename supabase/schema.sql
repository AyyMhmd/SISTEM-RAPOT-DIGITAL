-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('TU', 'GURU_MAPEL', 'WALI_KELAS', 'KEPALA_SEKOLAH', 'SISWA');
CREATE TYPE jenis_kelamin AS ENUM ('L', 'P');

-- 2. Create public.users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nama_lengkap TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create public.kelas table
CREATE TABLE public.kelas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_kelas TEXT NOT NULL,
  tingkat TEXT NOT NULL,
  tahun_ajaran TEXT NOT NULL,
  wali_kelas_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on kelas
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;

-- 4. Create public.siswa table
CREATE TABLE public.siswa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nisn TEXT UNIQUE,
  nis TEXT UNIQUE,
  nama_lengkap TEXT NOT NULL,
  jenis_kelamin jenis_kelamin NOT NULL,
  tempat_lahir TEXT,
  tanggal_lahir DATE,
  agama TEXT,
  alamat TEXT,
  nama_ayah TEXT,
  nama_ibu TEXT,
  kelas_id UUID REFERENCES public.kelas(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- for login if needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on siswa
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;

-- 5. Create public.mapel table
CREATE TABLE public.mapel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_mapel TEXT NOT NULL,
  kelompok TEXT,
  kkm INTEGER DEFAULT 75 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on mapel
ALTER TABLE public.mapel ENABLE ROW LEVEL SECURITY;

-- 6. Create public.guru_mapel table
CREATE TABLE public.guru_mapel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guru_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mapel_id UUID NOT NULL REFERENCES public.mapel(id) ON DELETE CASCADE,
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on guru_mapel
ALTER TABLE public.guru_mapel ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Users Table Policies
CREATE POLICY "TU can manage all users" ON public.users
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'TU')
  );

CREATE POLICY "Users can read all user profiles" ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');


-- Kelas Table Policies
CREATE POLICY "TU can manage kelas" ON public.kelas
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'TU')
  );

CREATE POLICY "Everyone can read kelas" ON public.kelas
  FOR SELECT
  USING (auth.role() = 'authenticated');


-- Siswa Table Policies
CREATE POLICY "TU can manage siswa" ON public.siswa
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'TU')
  );

CREATE POLICY "Guru Mapel can read siswa in their classes" ON public.siswa
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'GURU_MAPEL') AND
    kelas_id IN (SELECT kelas_id FROM public.guru_mapel WHERE guru_id = auth.uid())
  );

CREATE POLICY "Wali Kelas can read siswa in their class" ON public.siswa
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.kelas WHERE id = public.siswa.kelas_id AND wali_kelas_id = auth.uid())
  );

CREATE POLICY "Kepala Sekolah can read all siswa" ON public.siswa
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'KEPALA_SEKOLAH')
  );

CREATE POLICY "Siswa can read their own data" ON public.siswa
  FOR SELECT
  USING (
    user_id = auth.uid()
  );


-- Mapel Table Policies
CREATE POLICY "TU can manage mapel" ON public.mapel
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'TU')
  );

CREATE POLICY "Everyone can read mapel" ON public.mapel
  FOR SELECT
  USING (auth.role() = 'authenticated');


-- Guru Mapel (Mapping) Table Policies
CREATE POLICY "TU can manage guru_mapel" ON public.guru_mapel
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'TU')
  );

CREATE POLICY "Everyone can read guru_mapel mapping" ON public.guru_mapel
  FOR SELECT
  USING (auth.role() = 'authenticated');
