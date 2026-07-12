import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import RaporComponent from '../../components/RaporComponent';

export default function DashboardSiswa() {
  const { user } = useAuth();
  const [siswa, setSiswa] = useState(null);
  const [kelas, setKelas] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedSemester, setSelectedSemester] = useState('Ganjil');
  const [tahunAjaran, setTahunAjaran] = useState('2023/2024');

  // State untuk data Rapor
  const [raporData, setRaporData] = useState(null);
  const [raporLoading, setRaporLoading] = useState(false);

  useEffect(() => {
    if (user) fetchProfilSiswa();
  }, [user]);

  useEffect(() => {
    if (siswa && selectedSemester) {
      fetchRaporSiswa();
    }
  }, [siswa, selectedSemester]);

  const fetchProfilSiswa = async () => {
    setLoading(true);
    try {
      // Cari data siswa yang terhubung dengan akun login ini
      const { data: siswaData, error: siswaError } = await supabase
        .from('siswa')
        .select('*, kelas:kelas_id(*, users:wali_kelas_id(nama_lengkap))')
        .eq('user_id', user.id)
        .single();
        
      if (siswaError) {
        if (siswaError.code === 'PGRST116') {
          // Tidak ketemu
          setSiswa(null);
          return;
        }
        throw siswaError;
      }
      
      setSiswa(siswaData);
      setKelas(siswaData.kelas);
    } catch (error) {
      console.error('Error fetching profil siswa:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRaporSiswa = async () => {
    setRaporLoading(true);
    try {
      // Ambil Nilai Mapel
      const { data: nilai, error: nilaiError } = await supabase
        .from('nilai')
        .select('*, mapel:mapel_id(*)')
        .eq('siswa_id', siswa.id)
        .eq('semester', selectedSemester)
        .eq('tahun_ajaran', tahunAjaran);

      if (nilaiError) throw nilaiError;

      // Ambil Rapor Wali (Catatan dll)
      const { data: raporWali, error: rwError } = await supabase
        .from('rapor_wali_kelas')
        .select('*')
        .eq('siswa_id', siswa.id)
        .eq('semester', selectedSemester)
        .eq('tahun_ajaran', tahunAjaran)
        .single();

      if (rwError && rwError.code !== 'PGRST116') throw rwError;

      // Ambil Absensi
      const { data: absensi, error: absensiError } = await supabase
        .from('absensi')
        .select('status')
        .eq('siswa_id', siswa.id);
        
      if (absensiError) throw absensiError;
      
      const rekapAbsen = {
        hadir: absensi.filter(a => a.status?.toUpperCase() === 'HADIR').length,
        sakit: absensi.filter(a => a.status?.toUpperCase() === 'SAKIT').length,
        izin: absensi.filter(a => a.status?.toUpperCase() === 'IZIN').length,
        alpa: absensi.filter(a => a.status?.toUpperCase() === 'ALPA').length,
      };

      setRaporData({
        nilai: nilai || [],
        raporWali: raporWali || null,
        absensi: rekapAbsen
      });

    } catch (error) {
      console.error('Error fetching rapor:', error);
    } finally {
      setRaporLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat profil siswa...</div>;

  if (!siswa) {
    return (
      <div style={{ padding: '2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--status-error)', textAlign: 'center', color: 'var(--status-error)' }}>
        Akun login Anda belum terhubung dengan data Siswa manapun. Silakan hubungi Tata Usaha untuk menautkan akun Anda.
      </div>
    );
  }

  return (
    <div>
      <div className="no-print">
        <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Halo, {siswa.nama_lengkap}!</h1>

        <div style={{ 
          display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-card)', 
          padding: '1.5rem', borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--secondary)', marginBottom: '2rem',
          alignItems: 'center'
        }}>
          <label style={{ fontWeight: 600 }}>Lihat Rapor Semester:</label>
          <select 
            value={selectedSemester} 
            onChange={(e) => setSelectedSemester(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)', minWidth: '150px' }}
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>

      {raporLoading ? (
        <div className="no-print" style={{ padding: '2rem', textAlign: 'center' }}>Memuat data rapor Anda...</div>
      ) : raporData ? (
        <RaporComponent 
          siswa={siswa}
          kelas={kelas}
          tahunAjaran={tahunAjaran}
          semester={selectedSemester}
          nilai={raporData.nilai}
          raporWali={raporData.raporWali}
          absensi={raporData.absensi}
          onPrint={handlePrint}
        />
      ) : null}
    </div>
  );
}
