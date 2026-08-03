import { supabase } from '../lib/supabaseClient';

/**
 * Mencatat aktivitas pengguna ke dalam tabel log_aktivitas.
 * 
 * @param {string} userId - ID Supabase dari user yang melakukan aksi
 * @param {string} namaPengguna - Nama lengkap user
 * @param {string} role - Role dari user (e.g., 'TU', 'GURU_MAPEL', 'WALI_KELAS', 'KEPALA_SEKOLAH')
 * @param {string} aksi - Jenis aksi (e.g., 'TAMBAH', 'EDIT', 'HAPUS', 'IMPORT', 'LOGIN', dll)
 * @param {string} keterangan - Deskripsi detail dari aksi yang dilakukan
 */
export const catatLog = async (userId, namaPengguna, role, aksi, keterangan) => {
  try {
    const { error } = await supabase.from('log_aktivitas').insert([
      {
        user_id: userId,
        nama_pengguna: namaPengguna,
        role: role,
        aksi: aksi,
        keterangan: keterangan
      }
    ]);

    if (error) {
      console.error('Gagal mencatat log aktivitas:', error);
    }
  } catch (err) {
    console.error('Terjadi kesalahan saat mencatat log aktivitas:', err);
  }
};
