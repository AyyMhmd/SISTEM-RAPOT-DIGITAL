import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Save } from 'lucide-react';

export default function InputNilai() {
  const { user } = useAuth();
  const [jadwal, setJadwal] = useState([]);
  const [selectedJadwal, setSelectedJadwal] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('Ganjil');
  const [tahunAjaran, setTahunAjaran] = useState('2023/2024'); // Harusnya dari global setting
  
  const [siswaNilai, setSiswaNilai] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchJadwal();
  }, [user]);

  useEffect(() => {
    if (selectedJadwal && selectedSemester) {
      fetchSiswaDanNilai();
    }
  }, [selectedJadwal, selectedSemester]);

  const fetchJadwal = async () => {
    try {
      const { data, error } = await supabase
        .from('guru_mapel')
        .select(`
          id,
          mapel_id,
          kelas_id,
          mapel:mapel_id(nama_mapel, kkm),
          kelas:kelas_id(nama_kelas)
        `)
        .eq('guru_id', user.id);

      if (error) throw error;
      setJadwal(data);
      if (data.length > 0) setSelectedJadwal(data[0].id);
    } catch (error) {
      console.error('Error fetching jadwal:', error);
    }
  };

  const fetchSiswaDanNilai = async () => {
    setLoading(true);
    const jadwalAktif = jadwal.find(j => j.id === selectedJadwal);
    if (!jadwalAktif) return;

    try {
      // 1. Ambil daftar siswa di kelas tersebut
      const { data: siswaData, error: siswaError } = await supabase
        .from('siswa')
        .select('id, nis, nama_lengkap')
        .eq('kelas_id', jadwalAktif.kelas_id)
        .order('nama_lengkap');
      
      if (siswaError) throw siswaError;

      // 2. Ambil nilai yang sudah ada untuk mapel, kelas, dan semester tersebut
      const { data: nilaiData, error: nilaiError } = await supabase
        .from('nilai')
        .select('*')
        .eq('mapel_id', jadwalAktif.mapel_id)
        .eq('kelas_id', jadwalAktif.kelas_id)
        .eq('semester', selectedSemester)
        .eq('tahun_ajaran', tahunAjaran)
        .in('siswa_id', siswaData.map(s => s.id));
      
      if (nilaiError) throw nilaiError;

      // 3. Gabungkan
      const gabungan = siswaData.map(s => {
        const nilaiSiswa = nilaiData.find(n => n.siswa_id === s.id);
        return {
          siswa_id: s.id,
          nis: s.nis,
          nama_lengkap: s.nama_lengkap,
          nilai_tugas: nilaiSiswa?.nilai_tugas ?? 0,
          nilai_uts: nilaiSiswa?.nilai_uts ?? 0,
          nilai_uas: nilaiSiswa?.nilai_uas ?? 0,
          deskripsi_pengetahuan: nilaiSiswa?.deskripsi_pengetahuan || '',
          deskripsi_keterampilan: nilaiSiswa?.deskripsi_keterampilan || ''
        };
      });

      setSiswaNilai(gabungan);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNilaiChange = (siswa_id, field, value) => {
    // Validasi angka 0-100
    let numVal = parseInt(value);
    if (isNaN(numVal)) numVal = 0;
    if (numVal < 0) numVal = 0;
    if (numVal > 100) numVal = 100;

    setSiswaNilai(prev => 
      prev.map(item => item.siswa_id === siswa_id ? { ...item, [field]: numVal } : item)
    );
  };

  const handleDescChange = (siswa_id, field, value) => {
    setSiswaNilai(prev => 
      prev.map(item => item.siswa_id === siswa_id ? { ...item, [field]: value } : item)
    );
  };

  const calculateRataRata = (tugas, uts, uas) => {
    return Math.round((tugas + uts + uas) / 3);
  };

  const handleSimpan = async () => {
    setSaving(true);
    const jadwalAktif = jadwal.find(j => j.id === selectedJadwal);

    try {
      const payload = siswaNilai.map(item => ({
        siswa_id: item.siswa_id,
        mapel_id: jadwalAktif.mapel_id,
        kelas_id: jadwalAktif.kelas_id,
        semester: selectedSemester,
        tahun_ajaran: tahunAjaran,
        nilai_tugas: item.nilai_tugas,
        nilai_uts: item.nilai_uts,
        nilai_uas: item.nilai_uas,
        deskripsi_pengetahuan: item.deskripsi_pengetahuan,
        deskripsi_keterampilan: item.deskripsi_keterampilan
      }));

      const { error } = await supabase
        .from('nilai')
        .upsert(payload, { onConflict: 'siswa_id,mapel_id,semester,tahun_ajaran' });

      if (error) throw error;
      alert('Nilai berhasil disimpan!');
    } catch (error) {
      console.error('Error saving nilai:', error);
      alert('Gagal menyimpan nilai: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const activeKkm = jadwal.find(j => j.id === selectedJadwal)?.mapel?.kkm || 75;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Input Nilai Siswa</h1>

      <div style={{ 
        display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-card)', 
        padding: '1.5rem', borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--secondary)', marginBottom: '1.5rem',
        alignItems: 'flex-end', flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 250px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Pilih Kelas & Mapel</label>
          <select 
            value={selectedJadwal} 
            onChange={(e) => setSelectedJadwal(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
          >
            {jadwal.length === 0 && <option value="">Belum ada jadwal</option>}
            {jadwal.map(j => (
              <option key={j.id} value={j.id}>
                Kelas {j.kelas?.nama_kelas} - {j.mapel?.nama_mapel}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Semester</label>
          <select 
            value={selectedSemester} 
            onChange={(e) => setSelectedSemester(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>

        <div>
          <button 
            onClick={handleSimpan}
            disabled={saving || siswaNilai.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: 'var(--primary)', color: 'white',
              padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: (saving || siswaNilai.length === 0) ? 'not-allowed' : 'pointer', 
              fontWeight: 600, opacity: (saving || siswaNilai.length === 0) ? 0.7 : 1
            }}
          >
            <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Nilai'}
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
          <thead style={{ backgroundColor: 'var(--secondary)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600, width: '250px' }}>Nama Siswa</th>
              <th style={{ padding: '1rem', fontWeight: 600, width: '100px', textAlign: 'center' }}>Tugas</th>
              <th style={{ padding: '1rem', fontWeight: 600, width: '100px', textAlign: 'center' }}>UTS</th>
              <th style={{ padding: '1rem', fontWeight: 600, width: '100px', textAlign: 'center' }}>UAS</th>
              <th style={{ padding: '1rem', fontWeight: 600, width: '100px', textAlign: 'center' }}>Rata-rata</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Deskripsi Capaian</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Memuat data siswa...</td></tr>
            ) : siswaNilai.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Tidak ada data siswa di kelas ini.</td></tr>
            ) : (
              siswaNilai.map((item) => {
                const rataRata = calculateRataRata(item.nilai_tugas, item.nilai_uts, item.nilai_uas);
                const isUnderKkm = rataRata < activeKkm;

                return (
                  <tr key={item.siswa_id} style={{ borderTop: '1px solid var(--secondary)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{item.nama_lengkap}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIS: {item.nis || '-'}</div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <input 
                        type="number" 
                        value={item.nilai_tugas}
                        onChange={(e) => handleNilaiChange(item.siswa_id, 'nilai_tugas', e.target.value)}
                        style={{ width: '60px', padding: '0.5rem', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--secondary)' }}
                      />
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <input 
                        type="number" 
                        value={item.nilai_uts}
                        onChange={(e) => handleNilaiChange(item.siswa_id, 'nilai_uts', e.target.value)}
                        style={{ width: '60px', padding: '0.5rem', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--secondary)' }}
                      />
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <input 
                        type="number" 
                        value={item.nilai_uas}
                        onChange={(e) => handleNilaiChange(item.siswa_id, 'nilai_uas', e.target.value)}
                        style={{ width: '60px', padding: '0.5rem', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--secondary)' }}
                      />
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: isUnderKkm ? 'var(--status-error)' : 'var(--text-main)' }}>
                      {rataRata}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <textarea 
                        placeholder="Deskripsi pencapaian kompetensi..."
                        value={item.deskripsi_pengetahuan}
                        onChange={(e) => handleDescChange(item.siswa_id, 'deskripsi_pengetahuan', e.target.value)}
                        rows={2}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)', resize: 'vertical' }}
                      />
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
