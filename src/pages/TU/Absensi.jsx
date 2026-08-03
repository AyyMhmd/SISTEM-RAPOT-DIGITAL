import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Calendar, Save } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Absensi() {
  const [kelas, setKelas] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [siswaAbsensi, setSiswaAbsensi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchKelas();
  }, []);

  useEffect(() => {
    if (selectedKelas && selectedDate) {
      fetchSiswaDanAbsensi();
    }
  }, [selectedKelas, selectedDate]);

  const fetchKelas = async () => {
    try {
      const { data, error } = await supabase.from('kelas').select('id, nama_kelas').order('nama_kelas');
      if (error) throw error;
      setKelas(data);
      if (data.length > 0) setSelectedKelas(data[0].id);
    } catch (error) {
      console.error('Error fetching kelas:', error);
    }
  };

  const fetchSiswaDanAbsensi = async () => {
    setLoading(true);
    try {
      // Ambil daftar siswa di kelas tersebut
      const { data: siswaData, error: siswaError } = await supabase
        .from('siswa')
        .select('id, nis, nama_lengkap')
        .eq('kelas_id', selectedKelas)
        .order('nama_lengkap');
      
      if (siswaError) throw siswaError;

      // Ambil data absensi di tanggal tersebut untuk siswa di kelas itu
      const { data: absenData, error: absenError } = await supabase
        .from('absensi')
        .select('id, siswa_id, status, keterangan')
        .eq('tanggal', selectedDate)
        .in('siswa_id', siswaData.map(s => s.id));
      
      if (absenError) throw absenError;

      // Gabungkan data
      const gabungan = siswaData.map(s => {
        const absenSiswa = absenData.find(a => a.siswa_id === s.id);
        return {
          siswa_id: s.id,
          nis: s.nis,
          nama_lengkap: s.nama_lengkap,
          absensi_id: absenSiswa ? absenSiswa.id : null,
          status: absenSiswa ? absenSiswa.status : 'HADIR', // Default HADIR
          keterangan: absenSiswa ? (absenSiswa.keterangan || '') : ''
        };
      });

      setSiswaAbsensi(gabungan);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (siswa_id, newStatus) => {
    setSiswaAbsensi(prev => 
      prev.map(item => item.siswa_id === siswa_id ? { ...item, status: newStatus } : item)
    );
  };

  const handleKeteranganChange = (siswa_id, newKeterangan) => {
    setSiswaAbsensi(prev => 
      prev.map(item => item.siswa_id === siswa_id ? { ...item, keterangan: newKeterangan } : item)
    );
  };

  const handleSimpan = async () => {
    setSaving(true);
    try {
      const payload = siswaAbsensi.map(item => ({
        siswa_id: item.siswa_id,
        tanggal: selectedDate,
        status: item.status,
        keterangan: item.keterangan
      }));

      // Menggunakan upsert (insert or update) berdasarkan UNIQUE(siswa_id, tanggal)
      const { error } = await supabase
        .from('absensi')
        .upsert(payload, { onConflict: 'siswa_id,tanggal' });

      if (error) throw error;
      Swal.fire('Berhasil!', 'Absensi berhasil disimpan!', 'success');
      fetchSiswaDanAbsensi(); // refresh data
    } catch (error) {
      console.error('Error saving absensi:', error);
      Swal.fire('Error!', 'Gagal menyimpan absensi: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Input Absensi Harian</h1>

      <div style={{ 
        display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-card)', 
        padding: '1.5rem', borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--secondary)', marginBottom: '1.5rem',
        alignItems: 'flex-end', flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Pilih Kelas</label>
          <select 
            value={selectedKelas} 
            onChange={(e) => setSelectedKelas(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
          >
            {kelas.map(k => (
              <option key={k.id} value={k.id}>{k.nama_kelas}</option>
            ))}
          </select>
        </div>
        
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tanggal Absensi</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '0.75rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Calendar size={18} />
            </div>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
            />
          </div>
        </div>

        <div>
          <button 
            onClick={handleSimpan}
            disabled={saving || siswaAbsensi.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundcolor: 'var(--text-primary)', color: 'white',
              padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: (saving || siswaAbsensi.length === 0) ? 'not-allowed' : 'pointer', 
              fontWeight: 600, opacity: (saving || siswaAbsensi.length === 0) ? 0.7 : 1
            }}
          >
            <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Absensi'}
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead style={{ backgroundColor: 'var(--secondary)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600, width: '150px' }}>NIS</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Nama Siswa</th>
              <th style={{ padding: '1rem', fontWeight: 600, width: '150px' }}>Kehadiran</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Keterangan (Opsional)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Memuat data siswa...</td></tr>
            ) : siswaAbsensi.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Tidak ada data siswa di kelas ini.</td></tr>
            ) : (
              siswaAbsensi.map((item) => (
                <tr key={item.siswa_id} style={{ borderTop: '1px solid var(--secondary)' }}>
                  <td style={{ padding: '1rem' }}>{item.nis || '-'}</td>
                  <td style={{ padding: '1rem' }}>{item.nama_lengkap}</td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.siswa_id, e.target.value)}
                      style={{ 
                        width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', 
                        border: '1px solid var(--secondary)',
                        backgroundColor: item.status === 'HADIR' ? '#ECFDF5' : 
                                         item.status === 'SAKIT' ? '#FEFCE8' : 
                                         item.status === 'IZIN' ? '#F0FDF4' : '#FEF2F2',
                        color: item.status === 'HADIR' ? '#047857' : 
                               item.status === 'SAKIT' ? '#854D0E' : 
                               item.status === 'IZIN' ? '#15803D' : '#B91C1C',
                        fontWeight: 600
                      }}
                    >
                      <option value="HADIR">Hadir</option>
                      <option value="SAKIT">Sakit</option>
                      <option value="IZIN">Izin</option>
                      <option value="ALPA">Alpa</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <input 
                      type="text" 
                      placeholder="Tambahkan catatan jika perlu..."
                      value={item.keterangan}
                      onChange={(e) => handleKeteranganChange(item.siswa_id, e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
