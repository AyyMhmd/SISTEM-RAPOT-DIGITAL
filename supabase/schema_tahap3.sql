-- 1. Create Enum untuk Absensi
CREATE TYPE absensi_status AS ENUM ('HADIR', 'SAKIT', 'IZIN', 'ALPA');

-- 2. Create Tabel Absensi
CREATE TABLE public.absensi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  status absensi_status NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Satu siswa hanya bisa punya satu status absen di tanggal yang sama
  UNIQUE(siswa_id, tanggal) 
);

-- Enable RLS on absensi
ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies untuk Absensi
CREATE POLICY "TU can manage absensi" ON public.absensi
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'TU')
  );

CREATE POLICY "Everyone can read absensi" ON public.absensi
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 4. Function untuk TU membuat akun tanpa logout
-- Menggunakan SECURITY DEFINER agar punya akses untuk menulis ke auth.users
CREATE OR REPLACE FUNCTION public.create_user_by_tu(
  new_email TEXT,
  new_password TEXT,
  new_nama_lengkap TEXT,
  new_role user_role
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Validasi: Hanya TU yang boleh memanggil fungsi ini
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'TU') THEN
    RAISE EXCEPTION 'Unauthorized: Hanya TU yang dapat membuat pengguna baru.';
  END IF;

  -- Buat UUID baru dengan fungsi bawaan
  new_user_id := gen_random_uuid();

  -- Insert ke auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    new_email,
    extensions.crypt(new_password, extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Insert ke public.users
  INSERT INTO public.users (id, email, nama_lengkap, role)
  VALUES (new_user_id, new_email, new_nama_lengkap, new_role);

  RETURN new_user_id;
END;
$$;
