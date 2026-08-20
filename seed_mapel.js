import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newMapels = [
  // Mata Pelajaran Umum
  { nama_mapel: 'Pendidikan Agama Islam dan Budi Pekerti', kelompok: 'Mata Pelajaran Umum', kkm: 75 },
  { nama_mapel: 'Pendidikan Pancasila', kelompok: 'Mata Pelajaran Umum', kkm: 75 },
  { nama_mapel: 'Bahasa Indonesia', kelompok: 'Mata Pelajaran Umum', kkm: 75 },
  { nama_mapel: 'Bahasa Inggris', kelompok: 'Mata Pelajaran Umum', kkm: 75 },
  { nama_mapel: 'Matematika', kelompok: 'Mata Pelajaran Umum', kkm: 75 },
  { nama_mapel: 'Sejarah', kelompok: 'Mata Pelajaran Umum', kkm: 75 },
  { nama_mapel: 'Projek IPAS', kelompok: 'Mata Pelajaran Umum', kkm: 75 },
  { nama_mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', kelompok: 'Mata Pelajaran Umum', kkm: 75 },
  { nama_mapel: 'Bimbingan dan Konseling/Konselor (BP/BK)', kelompok: 'Mata Pelajaran Umum', kkm: 75 },
  { nama_mapel: 'Seni Musik', kelompok: 'Mata Pelajaran Umum', kkm: 75 },

  // Mata Pelajaran Kejuruan
  { nama_mapel: 'Dasar Dasar Pengembangan Perangkat Lunak dan Gim', kelompok: 'Mata Pelajaran Kejuruan', kkm: 75 },
  
  // C1. Dasar Bidang Keahlian
  { nama_mapel: 'Informatika', kelompok: 'C1. Dasar Bidang Keahlian', kkm: 75 },

  // Muatan Lokal
  { nama_mapel: 'Bahasa Arab', kelompok: 'Muatan Lokal', kkm: 75 },
  { nama_mapel: 'Bahasa Sunda', kelompok: 'Muatan Lokal', kkm: 75 }
];

async function seed() {
  console.log("Menghapus data mapel lama...");
  // Hapus semua data mapel (jika memungkinkan). Supabase RLS bisa jadi memblokir ini jika pakai anon key.
  // Tapi kita coba dulu.
  const { error: delErr } = await supabase.from('mapel').delete().neq('id', 0);
  if (delErr) {
    console.error("Gagal menghapus data lama (mungkin RLS):", delErr.message);
  } else {
    console.log("Data lama berhasil dihapus.");
  }

  console.log("Memasukkan data mapel baru...");
  const { error: insErr } = await supabase.from('mapel').insert(newMapels);
  if (insErr) {
    console.error("Gagal memasukkan data baru:", insErr.message);
  } else {
    console.log("Data mapel baru berhasil dimasukkan!");
  }
}

seed();
