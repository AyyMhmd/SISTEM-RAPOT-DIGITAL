import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { catatLog } from './auditLogger';

/**
 * Mengambil seluruh data dari database dan menyimpannya sebagai file Excel.
 * 
 * @param {Object} user - Objek user yang sedang login (untuk mencatat log)
 */
export const downloadDatabaseBackup = async (user) => {
  try {
    Swal.fire({
      title: 'Menyiapkan Backup...',
      html: 'Sistem sedang mengunduh seluruh data (Siswa, Pengguna, Kelas, Nilai).<br/>Mohon tunggu sebentar...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // 1. Fetch data Siswa
    const { data: siswaData, error: siswaErr } = await supabase
      .from('siswa')
      .select(`
        nisn, nis, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, 
        agama, alamat, nama_ayah, nama_ibu, no_hp_ortu,
        kelas:kelas_id(nama_kelas)
      `);
    if (siswaErr) throw new Error('Gagal mengambil data Siswa: ' + siswaErr.message);

    // Format Siswa data
    const formattedSiswa = siswaData.map(s => ({
      NISN: s.nisn,
      NIS: s.nis,
      'Nama Lengkap': s.nama_lengkap,
      'L/P': s.jenis_kelamin,
      'Kelas': s.kelas?.nama_kelas || 'Belum ada kelas',
      'Tempat Lahir': s.tempat_lahir,
      'Tanggal Lahir': s.tanggal_lahir,
      'Agama': s.agama,
      'Alamat': s.alamat,
      'Nama Ayah': s.nama_ayah,
      'Nama Ibu': s.nama_ibu,
      'No HP Ortu': s.no_hp_ortu
    }));

    // 2. Fetch data Users (Pengguna)
    const { data: usersData, error: usersErr } = await supabase
      .from('users')
      .select('nama_lengkap, email, role, created_at');
    if (usersErr) throw new Error('Gagal mengambil data Pengguna: ' + usersErr.message);

    const formattedUsers = usersData.map(u => ({
      'Nama Lengkap': u.nama_lengkap,
      'Email / Username': u.email,
      'Role': u.role,
      'Dibuat Pada': new Date(u.created_at).toLocaleString('id-ID')
    }));

    // 3. Fetch data Kelas
    const { data: kelasData, error: kelasErr } = await supabase
      .from('kelas')
      .select('nama_kelas, tingkat, tahun_ajaran, wali:wali_kelas_id(nama_lengkap)');
    if (kelasErr) throw new Error('Gagal mengambil data Kelas: ' + kelasErr.message);

    const formattedKelas = kelasData.map(k => ({
      'Nama Kelas': k.nama_kelas,
      'Tingkat': k.tingkat,
      'Tahun Ajaran': k.tahun_ajaran,
      'Wali Kelas': k.wali?.nama_lengkap || 'Belum ditugaskan'
    }));

    // 4. Fetch data Nilai (Simplified)
    const { data: nilaiData, error: nilaiErr } = await supabase
      .from('nilai')
      .select(`
        nilai_tugas, nilai_uts, nilai_uas,
        siswa:siswa_id(nama_lengkap, nisn),
        mapel:mapel_id(nama_mapel)
      `);
    if (nilaiErr) throw new Error('Gagal mengambil data Nilai: ' + nilaiErr.message);

    const formattedNilai = nilaiData.map(n => ({
      'Nama Siswa': n.siswa?.nama_lengkap || 'Unknown',
      'NISN': n.siswa?.nisn || '',
      'Mata Pelajaran': n.mapel?.nama_mapel || 'Unknown',
      'Nilai Tugas': n.nilai_tugas,
      'Nilai UTS': n.nilai_uts,
      'Nilai UAS': n.nilai_uas,
      'Rata-Rata': Math.round((n.nilai_tugas + n.nilai_uts + n.nilai_uas) / 3)
    }));

    // Generate Excel Workbook
    const workbook = XLSX.utils.book_new();

    // Create Sheets
    const wsSiswa = XLSX.utils.json_to_sheet(formattedSiswa);
    const wsUsers = XLSX.utils.json_to_sheet(formattedUsers);
    const wsKelas = XLSX.utils.json_to_sheet(formattedKelas);
    const wsNilai = XLSX.utils.json_to_sheet(formattedNilai);

    // Append Sheets to Workbook
    XLSX.utils.book_append_sheet(workbook, wsSiswa, "Data Siswa");
    XLSX.utils.book_append_sheet(workbook, wsUsers, "Data Pengguna");
    XLSX.utils.book_append_sheet(workbook, wsKelas, "Data Kelas");
    XLSX.utils.book_append_sheet(workbook, wsNilai, "Data Nilai");

    // Get current date for filename
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Backup_Data_Sistem_Rapot_${dateStr}.xlsx`;

    // Save File
    XLSX.writeFile(workbook, fileName);

    // Log Activity
    if (user) {
      await catatLog(
        user.id, 
        user.nama_lengkap, 
        user.role, 
        'BACKUP DATABASE', 
        'Mengunduh seluruh isi database ke file Excel'
      );
    }

    Swal.fire('Berhasil!', 'Backup data berhasil diunduh ke komputer Anda.', 'success');

  } catch (error) {
    console.error('Backup failed:', error);
    Swal.fire('Error!', error.message || 'Gagal melakukan backup data.', 'error');
  }
};
