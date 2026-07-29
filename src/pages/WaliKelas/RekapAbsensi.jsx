import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

export default function RekapAbsensi() {
  const { user } = useAuth();
  const [kelas, setKelas] = useState(null);
  const [rekap, setRekap] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default ke bulan saat ini
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    if (user) fetchRekap();
  }, [user, bulan]);

  const fetchRekap = async () => {
    setLoading(true);
    try {
      // 1. Dapatkan kelas perwalian
      const { data: kelasData, error: kelasError } = await supabase
        .from('kelas')
        .select('id, nama_kelas')
        .eq('wali_kelas_id', user.id)
        .single();
        
      if (kelasError && kelasError.code !== 'PGRST116') throw kelasError;
      if (!kelasData) return;
      
      setKelas(kelasData);
      
      // 2. Dapatkan siswa
      const { data: siswaData, error: siswaError } = await supabase
        .from('siswa')
        .select('id, nis, nama_lengkap')
        .eq('kelas_id', kelasData.id)
        .order('nama_lengkap');
        
      if (siswaError) throw siswaError;

      // 3. Dapatkan absensi di bulan yang dipilih
      const startDate = `${bulan}-01`;
      const year = parseInt(bulan.split('-')[0]);
      const month = parseInt(bulan.split('-')[1]);
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${bulan}-${lastDay}`;

      const siswaIds = siswaData.map(s => s.id);
      if (siswaIds.length === 0) {
        setRekap([]);
        setLoading(false);
        return;
      }

      const { data: absensiData, error: absensiError } = await supabase
        .from('absensi')
        .select('siswa_id, status')
        .in('siswa_id', siswaIds)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (absensiError) throw absensiError;

      // 4. Kalkulasi Rekap per Siswa
      const rekapData = siswaData.map(s => {
        const absenSiswa = absensiData.filter(a => a.siswa_id === s.id);
        return {
          ...s,
          hadir: absenSiswa.filter(a => a.status?.toUpperCase() === 'HADIR').length,
          sakit: absenSiswa.filter(a => a.status?.toUpperCase() === 'SAKIT').length,
          izin: absenSiswa.filter(a => a.status?.toUpperCase() === 'IZIN').length,
          alpa: absenSiswa.filter(a => a.status?.toUpperCase() === 'ALPA').length,
        };
      });

      setRekap(rekapData);
    } catch (error) {
      console.error('Error fetching rekap:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (rekap.length === 0) return;

    const exportData = rekap.map((item, index) => ({
      'No': index + 1,
      'NIS': item.nis || '-',
      'Nama Siswa': item.nama_lengkap,
      'Hadir': item.hadir,
      'Sakit': item.sakit,
      'Izin': item.izin,
      'Alpa': item.alpa
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Absensi");
    
    // Auto-size columns
    const wscols = [
      {wch: 5},
      {wch: 15},
      {wch: 30},
      {wch: 10},
      {wch: 10},
      {wch: 10},
      {wch: 10}
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Rekap_Absensi_Kelas_${kelas?.nama_kelas}_${bulan}.xlsx`);
  };

  if (!kelas && !loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Anda bukan wali kelas aktif.</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Rekapitulasi Absensi Kelas {kelas?.nama_kelas}</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <label style={{ marginRight: '1rem', fontWeight: 600 }}>Pilih Bulan:</label>
          <input 
            type="month" 
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)' }}
          />
        </div>
        
        <button 
          onClick={handleExportExcel}
          disabled={loading || rekap.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)',
            backgroundColor: '#10B981', color: 'white', border: 'none',
            cursor: (loading || rekap.length === 0) ? 'not-allowed' : 'pointer',
            fontWeight: 600, opacity: (loading || rekap.length === 0) ? 0.6 : 1
          }}
        >
          <Download size={18} /> Export Excel
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--secondary)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Nama Siswa</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center' }}>Hadir</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center' }}>Sakit</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center' }}>Izin</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center' }}>Alpa</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Memuat data rekap...</td></tr>
            ) : rekap.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Belum ada data siswa.</td></tr>
            ) : (
              rekap.map(item => (
                <tr key={item.id} style={{ borderTop: '1px solid var(--secondary)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{item.nama_lengkap}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIS: {item.nis}</div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--status-success)' }}>{item.hadir}</td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--status-warning)' }}>{item.sakit}</td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--status-warning)' }}>{item.izin}</td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--status-error)' }}>{item.alpa}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
