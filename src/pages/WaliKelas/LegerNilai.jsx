import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function LegerNilai() {
  const { user } = useAuth();
  const [kelas, setKelas] = useState(null);
  const [siswa, setSiswa] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [nilai, setNilai] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSemester, setSelectedSemester] = useState('Ganjil');
  const [tahunAjaran, setTahunAjaran] = useState('2023/2024');

  useEffect(() => {
    if (user) fetchData();
  }, [user, selectedSemester]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Dapatkan kelas perwalian
      const { data: kelasData, error: kelasError } = await supabase
        .from('kelas')
        .select('*')
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
      setSiswa(siswaData);

      // 3. Dapatkan Mapel yang diajarkan di kelas ini
      const { data: jadwalData, error: jadwalError } = await supabase
        .from('guru_mapel')
        .select('mapel_id, mapel:mapel_id(nama_mapel)')
        .eq('kelas_id', kelasData.id);
        
      if (jadwalError) throw jadwalError;

      // Unique mapel (in case ada duplikat jadwal)
      const uniqueMapel = [];
      const mapelMap = new Map();
      for (const item of jadwalData) {
        if (!mapelMap.has(item.mapel_id) && item.mapel) {
          mapelMap.set(item.mapel_id, true);
          uniqueMapel.push({ id: item.mapel_id, nama: item.mapel.nama_mapel });
        }
      }
      setMapelList(uniqueMapel);

      // 4. Dapatkan Nilai
      const { data: nilaiData, error: nilaiError } = await supabase
        .from('nilai')
        .select('*')
        .eq('kelas_id', kelasData.id)
        .eq('semester', selectedSemester)
        .eq('tahun_ajaran', tahunAjaran);
        
      if (nilaiError) throw nilaiError;
      setNilai(nilaiData);

    } catch (error) {
      console.error('Error fetching leger:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNilaiRata = (siswaId, mapelId) => {
    const n = nilai.find(x => x.siswa_id === siswaId && x.mapel_id === mapelId);
    if (!n) return '-';
    return Math.round((n.nilai_tugas + n.nilai_uts + n.nilai_uas) / 3);
  };

  const getTotalNilai = (siswaId) => {
    let total = 0;
    let count = 0;
    mapelList.forEach(m => {
      const val = getNilaiRata(siswaId, m.id);
      if (val !== '-') {
        total += val;
        count++;
      }
    });
    return { total, avg: count > 0 ? Math.round(total / count) : '-' };
  };

  if (!kelas && !loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Anda bukan wali kelas aktif.</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Pantau Nilai (Leger Kelas)</h1>

      <div style={{ 
        display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-card)', 
        padding: '1.5rem', borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--secondary)', marginBottom: '1.5rem',
        alignItems: 'center'
      }}>
        <label style={{ fontWeight: 600 }}>Semester:</label>
        <select 
          value={selectedSemester} 
          onChange={(e) => setSelectedSemester(e.target.value)}
          style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)', minWidth: '150px' }}
        >
          <option value="Ganjil">Ganjil</option>
          <option value="Genap">Genap</option>
        </select>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead style={{ backgroundColor: 'var(--secondary)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600, borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }} rowSpan={2}>Nama Siswa</th>
              <th style={{ padding: '0.5rem', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid #e2e8f0' }} colSpan={mapelList.length === 0 ? 1 : mapelList.length}>Mata Pelajaran (Rata-rata)</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }} rowSpan={2}>Total Nilai</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid #e2e8f0' }} rowSpan={2}>Rata-rata Siswa</th>
            </tr>
            <tr>
              {mapelList.length === 0 ? (
                <th style={{ padding: '0.5rem', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem' }}>Belum Ada Mapel</th>
              ) : (
                mapelList.map(m => (
                  <th key={m.id} style={{ padding: '0.5rem', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', minWidth: '80px' }}>
                    {m.nama}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={mapelList.length + 3} style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</td></tr>
            ) : siswa.length === 0 ? (
              <tr><td colSpan={mapelList.length + 3} style={{ padding: '2rem', textAlign: 'center' }}>Belum ada data siswa.</td></tr>
            ) : (
              siswa.map(item => {
                const stats = getTotalNilai(item.id);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', borderRight: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 600 }}>{item.nama_lengkap}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIS: {item.nis}</div>
                    </td>
                    {mapelList.length === 0 ? (
                      <td style={{ padding: '1rem', textAlign: 'center' }}>-</td>
                    ) : (
                      mapelList.map(m => {
                        const val = getNilaiRata(item.id, m.id);
                        const isEmpty = val === '-';
                        return (
                          <td key={m.id} style={{ padding: '1rem', textAlign: 'center', backgroundColor: isEmpty ? 'var(--bg-main)' : 'transparent', color: isEmpty ? 'var(--text-muted)' : 'var(--text-main)' }}>
                            {val}
                          </td>
                        )
                      })
                    )}
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, borderLeft: '1px solid #e2e8f0', color: 'var(--primary)' }}>
                      {stats.total}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                      {stats.avg}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
