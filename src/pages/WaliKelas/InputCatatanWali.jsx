import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Save, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function InputCatatanWali() {
  const { user } = useAuth();
  const [kelasList, setKelasList] = useState([]);
  const [kelasActive, setKelasActive] = useState(null);
  const [siswaData, setSiswaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedSemester, setSelectedSemester] = useState('Ganjil');
  const [tahunAjaran, setTahunAjaran] = useState('2023/2024');

  useEffect(() => {
    if (user) fetchKelasList();
  }, [user]);

  useEffect(() => {
    if (kelasActive) {
      fetchSiswaData(kelasActive.id);
    }
  }, [kelasActive, selectedSemester, tahunAjaran]);

  const fetchKelasList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kelas')
        .select('*')
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
      console.error('Error fetching kelas list:', error);
      setLoading(false);
    }
  };

  const fetchSiswaData = async (kelasId) => {
    setLoading(true);
    try {
      // 2. Dapatkan siswa di kelas tersebut
      const { data: siswa, error: siswaError } = await supabase
          .from('siswa')
          .select('id, nis, nama_lengkap')
          .eq('kelas_id', kelasId)
          .order('nama_lengkap');
          
        if (siswaError) throw siswaError;

        // 3. Dapatkan data rapor_wali_kelas yang sudah ada
        const { data: rapor, error: raporError } = await supabase
          .from('rapor_wali_kelas')
          .select('*')
          .eq('kelas_id', kelasId)
          .eq('semester', selectedSemester)
          .eq('tahun_ajaran', tahunAjaran)
          .in('siswa_id', siswa.map(s => s.id));
          
        if (raporError) throw raporError;

        // 4. Gabungkan
        const gabungan = siswa.map(s => {
          const r = rapor.find(rp => rp.siswa_id === s.id);
          return {
            siswa_id: s.id,
            nis: s.nis,
            nama_lengkap: s.nama_lengkap,
            sikap_spiritual: r?.sikap_spiritual || '',
            sikap_sosial: r?.sikap_sosial || '',
            ekskul_1_nama: r?.ekskul_1_nama || '',
            ekskul_1_nilai: r?.ekskul_1_nilai || '',
            ekskul_2_nama: r?.ekskul_2_nama || '',
            ekskul_2_nilai: r?.ekskul_2_nilai || '',
            ekskul_3_nama: r?.ekskul_3_nama || '',
            ekskul_3_nilai: r?.ekskul_3_nilai || '',
            catatan: r?.catatan || ''
          };
        });

      setSiswaData(gabungan);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (siswa_id, field, value) => {
    setSiswaData(prev => prev.map(item => item.siswa_id === siswa_id ? { ...item, [field]: value } : item));
  };

  const handleSimpan = async () => {
    setSaving(true);
    try {
      const payload = siswaData.map(item => ({
        siswa_id: item.siswa_id,
        kelas_id: kelasActive.id,
        semester: selectedSemester,
        tahun_ajaran: tahunAjaran,
        sikap_spiritual: item.sikap_spiritual,
        sikap_sosial: item.sikap_sosial,
        ekskul_1_nama: item.ekskul_1_nama,
        ekskul_1_nilai: item.ekskul_1_nilai,
        ekskul_2_nama: item.ekskul_2_nama,
        ekskul_2_nilai: item.ekskul_2_nilai,
        ekskul_3_nama: item.ekskul_3_nama,
        ekskul_3_nilai: item.ekskul_3_nilai,
        catatan: item.catatan
      }));

      const { error } = await supabase
        .from('rapor_wali_kelas')
        .upsert(payload, { onConflict: 'siswa_id,semester,tahun_ajaran' });

      if (error) throw error;
      Swal.fire('Berhasil!', 'Data catatan wali kelas berhasil disimpan!', 'success');
    } catch (error) {
      console.error('Error saving records:', error);
      Swal.fire('Error!', 'Gagal menyimpan data.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!kelasActive && !loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Anda bukan wali kelas aktif.</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Input Catatan Wali Kelas & Ekstrakurikuler</h1>
        
        {kelasList.length > 1 && (
          <select 
            value={kelasActive?.id || ''}
            onChange={(e) => {
              const selected = kelasList.find(k => k.id === e.target.value);
              setKelasActive(selected);
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
        border: '1px solid var(--secondary)', marginBottom: '1.5rem',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: '1' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Kelas Perwalian</label>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}>
            {kelasActive?.nama_kelas || 'Memuat...'}
          </div>
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

        <div>
          <button 
            onClick={handleSimpan}
            disabled={saving || siswaData.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundcolor: 'var(--text-primary)', color: 'white',
              padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: (saving || siswaData.length === 0) ? 'not-allowed' : 'pointer', 
              fontWeight: 600, opacity: (saving || siswaData.length === 0) ? 0.7 : 1
            }}
          >
            <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {loading ? (
          <p>Memuat data siswa...</p>
        ) : siswaData.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>Belum ada siswa di kelas ini.</div>
        ) : (
          siswaData.map((item) => (
            <div key={item.siswa_id} style={{ 
              backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--secondary)', padding: '1.5rem',
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem'
            }}>
              {/* Kolom Kiri: Info & Sikap */}
              <div style={{ gridColumn: '1 / 2' }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{item.nama_lengkap}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>NIS: {item.nis}</p>
                
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600 }}>Sikap Spiritual (Predikat & Deskripsi)</label>
                <textarea 
                  value={item.sikap_spiritual} onChange={e => handleChange(item.siswa_id, 'sikap_spiritual', e.target.value)}
                  placeholder="Contoh: Sangat Baik. Selalu taat beribadah..." rows={3}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)', marginBottom: '1rem', resize: 'vertical' }}
                />

                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600 }}>Sikap Sosial (Predikat & Deskripsi)</label>
                <textarea 
                  value={item.sikap_sosial} onChange={e => handleChange(item.siswa_id, 'sikap_sosial', e.target.value)}
                  placeholder="Contoh: Baik. Selalu sopan kepada guru..." rows={3}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)', resize: 'vertical' }}
                />
              </div>

              {/* Kolom Tengah: Ekskul */}
              <div style={{ gridColumn: '2 / 3' }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>Kegiatan Ekstrakurikuler</h4>
                
                {/* Ekskul 1 */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="text" placeholder="Nama Ekskul 1" value={item.ekskul_1_nama} onChange={e => handleChange(item.siswa_id, 'ekskul_1_nama', e.target.value)} style={{ flex: 2, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)' }} />
                  <input type="text" placeholder="Nilai (A/B/C)" value={item.ekskul_1_nilai} onChange={e => handleChange(item.siswa_id, 'ekskul_1_nilai', e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)', textAlign: 'center' }} />
                </div>
                {/* Ekskul 2 */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="text" placeholder="Nama Ekskul 2" value={item.ekskul_2_nama} onChange={e => handleChange(item.siswa_id, 'ekskul_2_nama', e.target.value)} style={{ flex: 2, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)' }} />
                  <input type="text" placeholder="Nilai (A/B/C)" value={item.ekskul_2_nilai} onChange={e => handleChange(item.siswa_id, 'ekskul_2_nilai', e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)', textAlign: 'center' }} />
                </div>
                {/* Ekskul 3 */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" placeholder="Nama Ekskul 3" value={item.ekskul_3_nama} onChange={e => handleChange(item.siswa_id, 'ekskul_3_nama', e.target.value)} style={{ flex: 2, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)' }} />
                  <input type="text" placeholder="Nilai (A/B/C)" value={item.ekskul_3_nilai} onChange={e => handleChange(item.siswa_id, 'ekskul_3_nilai', e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)', textAlign: 'center' }} />
                </div>
              </div>

              {/* Kolom Kanan: Catatan */}
              <div style={{ gridColumn: '3 / 4' }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>Catatan Wali Kelas</h4>
                <textarea 
                  value={item.catatan} onChange={e => handleChange(item.siswa_id, 'catatan', e.target.value)}
                  placeholder="Tuliskan pesan, saran, atau motivasi untuk siswa di rapor..." rows={7}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)', resize: 'vertical' }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
