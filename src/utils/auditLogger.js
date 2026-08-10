import { supabase } from '../lib/supabaseClient';
import Swal from 'sweetalert2';

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
    let finalNama = namaPengguna;
    let finalRole = role;

    // Jika namaPengguna atau role kosong (undefined), ambil dari database users
    if (!finalNama || !finalRole) {
      const { data } = await supabase.from('users').select('nama_lengkap, role').eq('id', userId).single();
      if (data) {
        finalNama = finalNama || data.nama_lengkap;
        finalRole = finalRole || data.role;
      }
    }

    const { error } = await supabase.from('log_aktivitas').insert([
      {
        user_id: userId,
        nama_pengguna: finalNama || 'Unknown User',
        role: finalRole || 'Unknown Role',
        aksi: aksi,
        keterangan: keterangan
      }
    ]);

    if (error) {
      console.error('Gagal mencatat log aktivitas:', error);
      Swal.fire('Error Debug Log', 'Gagal insert log: ' + error.message + ' (Detail: ' + error.details + ')', 'error');
    }
  } catch (err) {
    console.error('Terjadi kesalahan saat mencatat log aktivitas:', err);
    Swal.fire('Error Catch Log', err.message, 'error');
  }
};
