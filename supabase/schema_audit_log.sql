-- Create table for Audit Logs (Histori Aktivitas)
CREATE TABLE IF NOT EXISTS public.log_aktivitas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  nama_pengguna text NOT NULL,
  role text NOT NULL,
  aksi text NOT NULL, -- e.g., 'TAMBAH', 'EDIT', 'HAPUS', 'LOGIN'
  keterangan text NOT NULL, -- e.g., 'Menambahkan data siswa Budi'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.log_aktivitas ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view logs based on their roles
CREATE POLICY "View logs based on role" ON public.log_aktivitas
  FOR SELECT
  USING (
    -- Kepsek can see everything
    (auth.uid() IN (SELECT id FROM public.users WHERE role = 'KEPALA_SEKOLAH'))
    OR
    -- TU can see all TU activities
    (auth.uid() IN (SELECT id FROM public.users WHERE role = 'TU') AND role = 'TU')
    OR
    -- Wakel and Mapel can only see their OWN activities
    (user_id = auth.uid())
  );

-- Allow authenticated users to insert logs
CREATE POLICY "Allow authenticated users to insert logs" ON public.log_aktivitas
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
