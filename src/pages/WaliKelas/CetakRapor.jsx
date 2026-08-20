import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import RaporComponent from '../../components/RaporComponent';
import Swal from 'sweetalert2';

export default function CetakRapor() {
  const { user } = useAuth();
  const [kelasList, setKelasList] = useState([]);
  const [kelasActive, setKelasActive] = useState(null);
  const [siswaData, setSiswaData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSemester, setSelectedSemester] = useState('Ganjil');
  const [tahunAjaran, setTahunAjaran] = useState('2023/2024');
  const [selectedSiswaId, setSelectedSiswaId] = useState('');

  // State untuk data Rapor Siswa yang dipilih
  const [raporData, setRaporData] = useState(null);
  const [raporLoading, setRaporLoading] = useState(false);

  const [kepsek, setKepsek] = useState(null);

  useEffect(() => {
    if (user) {
      fetchKelasList();
      fetchKepsek();
    }
  }, [user]);

  const fetchKepsek = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('nama_lengkap')
        .eq('role', 'KEPSEK')
        .limit(1)
        .single();
      
      if (!error && data) {
        setKepsek(data.nama_lengkap);
      }
    } catch (error) {
      console.error('Error fetching kepsek:', error);
    }
  };

  useEffect(() => {
    if (kelasActive) fetchSiswaForClass(kelasActive.id);
  }, [kelasActive]);

  useEffect(() => {
    if (selectedSiswaId && selectedSemester) {
      fetchRaporSiswa();
    } else {
      setRaporData(null);
    }
  }, [selectedSiswaId, selectedSemester]);

  const fetchKelasList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kelas')
        .select('*, users:wali_kelas_id(nama_lengkap)')
        .eq('wali_kelas_id', user.id)
        .order('nama_kelas');
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setKelasList(data);
        setKelasActive(data[0]);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchSiswaForClass = async (kelasId) => {
    setLoading(true);
    try {
      const { data: siswa, error: siswaError } = await supabase
        .from('siswa')
        .select('id, nis, nisn, nama_lengkap, no_hp_ortu')
        .eq('kelas_id', kelasId)
        .order('nama_lengkap');
        
      if (siswaError) throw siswaError;
      setSiswaData(siswa);
    } catch (error) {
      console.error('Error fetching siswa:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRaporSiswa = async () => {
    setRaporLoading(true);
    try {
      const siswa = siswaData.find(s => s.id === selectedSiswaId);

      // Ambil Nilai Mapel
      const { data: nilai, error: nilaiError } = await supabase
        .from('nilai')
        .select('*, mapel:mapel_id(*)')
        .eq('siswa_id', selectedSiswaId)
        .eq('semester', selectedSemester)
        .eq('tahun_ajaran', tahunAjaran);

      if (nilaiError) throw nilaiError;

      // Ambil Rapor Wali (Catatan dll)
      const { data: raporWali, error: rwError } = await supabase
        .from('rapor_wali_kelas')
        .select('*')
        .eq('siswa_id', selectedSiswaId)
        .eq('semester', selectedSemester)
        .eq('tahun_ajaran', tahunAjaran)
        .single();

      if (rwError && rwError.code !== 'PGRST116') throw rwError;

      // Ambil Absensi dan agregasi
      const { data: absensi, error: absensiError } = await supabase
        .from('absensi')
        .select('status')
        .eq('siswa_id', selectedSiswaId);
        
      if (absensiError) throw absensiError;
      
      const rekapAbsen = {
        hadir: absensi.filter(a => a.status?.toUpperCase() === 'HADIR').length,
        sakit: absensi.filter(a => a.status?.toUpperCase() === 'SAKIT').length,
        izin: absensi.filter(a => a.status?.toUpperCase() === 'IZIN').length,
        alpa: absensi.filter(a => a.status?.toUpperCase() === 'ALPA').length,
      };

      setRaporData({
        siswa,
        nilai: nilai || [],
        raporWali: raporWali || null,
        absensi: rekapAbsen
      });

    } catch (error) {
      console.error('Error fetching rapor:', error);
      Swal.fire('Error!', 'Gagal memuat data rapor siswa.', 'error');
    } finally {
      setRaporLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleKirimWA = () => {
    if (!raporData || !raporData.siswa.no_hp_ortu) {
      Swal.fire('Info', 'Nomor HP Orang Tua / Wali tidak tersedia untuk siswa ini. Silakan hubungi Tata Usaha untuk melengkapinya.', 'info');
      return;
    }

    const { siswa, nilai, raporWali, absensi } = raporData;
    
    let text = `*Laporan Hasil Belajar (Rapor Digital)*\n`;
    text += `Nama Siswa: ${siswa.nama_lengkap}\n`;
    text += `Kelas: ${kelasActive.nama_kelas}\n`;
    text += `Semester: ${selectedSemester} (${tahunAjaran})\n\n`;
    
    text += `*Nilai Mata Pelajaran:*\n`;
    if (nilai.length === 0) text += `- Belum ada nilai\n`;
    nilai.forEach(n => {
      const rataRata = Math.round((n.nilai_tugas + n.nilai_uts + n.nilai_uas) / 3) || 0;
      text += `- ${n.mapel.nama_mapel}: ${rataRata}\n`;
    });
    
    text += `\n*Ketidakhadiran:*\n`;
    text += `Sakit: ${absensi.sakit}, Izin: ${absensi.izin}, Alpa: ${absensi.alpa}\n\n`;
    
    text += `*Catatan Wali Kelas:*\n`;
    text += `"${raporWali?.catatan || '-'}"\n\n`;
    text += `Terima kasih.`;

    const encodedText = encodeURIComponent(text);
    // Pastikan nomor hp diformat dengan 62
    let phone = siswa.no_hp_ortu.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
  };

  if (!kelasActive && !loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Anda bukan wali kelas aktif.</div>;
  }

  return (
    <div>
      <div className="no-print">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Cetak Rapor Siswa</h1>
            {kelasActive && <p style={{ color: 'var(--text-muted)', margin: 0 }}>Kelas {kelasActive.nama_kelas}</p>}
          </div>

          {kelasList.length > 1 && (
            <select 
              value={kelasActive?.id || ''}
              onChange={(e) => {
                const selected = kelasList.find(k => k.id === e.target.value);
                setKelasActive(selected);
                setSelectedSiswaId(''); // Reset siswa ketika kelas berubah
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--secondary)',
                backgroundColor: 'var(--bg-card)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {kelasList.map(k => (
                <option key={k.id} value={k.id}>Kelas {k.nama_kelas}</option>
              ))}
            </select>
          )}
        </div>

        <div style={{ 
          display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-card)', 
          padding: '1.5rem', borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--secondary)', marginBottom: '2rem',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: '2' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Pilih Siswa</label>
            <select 
              value={selectedSiswaId} 
              onChange={(e) => setSelectedSiswaId(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
            >
              <option value="">-- Pilih Siswa --</option>
              {siswaData.map(s => (
                <option key={s.id} value={s.id}>{s.nama_lengkap} (NIS: {s.nis})</option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: '1' }}>
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
        </div>
      </div>

      {raporLoading ? (
        <div className="no-print" style={{ padding: '2rem', textAlign: 'center' }}>Memuat desain rapor...</div>
      ) : raporData ? (
        <RaporComponent 
          siswa={raporData.siswa}
          kelas={kelasActive}
          tahunAjaran={tahunAjaran}
          semester={selectedSemester}
          nilai={raporData.nilai}
          raporWali={raporData.raporWali}
          absensi={raporData.absensi}
          kepsek={kepsek}
          onPrint={handlePrint}
          onSendWA={handleKirimWA}
        />
      ) : (
        <div className="no-print" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Silakan pilih siswa untuk melihat rapor.
        </div>
      )}
    </div>
  );
}
