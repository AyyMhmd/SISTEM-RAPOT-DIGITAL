import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function JadwalMengajar() {
  const [jadwal, setJadwal] = useState([]);
  const [guru, setGuru] = useState([]);
  const [mapel, setMapel] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    guru_id: '',
    mapel_id: '',
    kelas_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jadwalRes, guruRes, mapelRes, kelasRes] = await Promise.all([
        supabase.from('guru_mapel').select(`
          id, 
          users:guru_id(nama_lengkap),
          mapel:mapel_id(nama_mapel, kelompok),
          kelas:kelas_id(nama_kelas)
        `).order('created_at', { ascending: false }),
        supabase.from('users').select('id, nama_lengkap').in('role', ['GURU_MAPEL', 'WALI_KELAS']).order('nama_lengkap'),
        supabase.from('mapel').select('id, nama_mapel').order('nama_mapel'),
        supabase.from('kelas').select('id, nama_kelas').order('nama_kelas')
      ]);
      
      if (jadwalRes.error) throw jadwalRes.error;
      if (guruRes.error) throw guruRes.error;
      if (mapelRes.error) throw mapelRes.error;
      if (kelasRes.error) throw kelasRes.error;
      
      setJadwal(jadwalRes.data);
      setGuru(guruRes.data);
      setMapel(mapelRes.data);
      setKelas(kelasRes.data);
      
      if (guruRes.data.length > 0 && mapelRes.data.length > 0 && kelasRes.data.length > 0) {
        setFormData({
          guru_id: guruRes.data[0].id,
          mapel_id: mapelRes.data[0].id,
          kelas_id: kelasRes.data[0].id
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const { error } = await supabase.from('guru_mapel').insert([formData]);
      if (error) {
        if (error.code === '23505') {
          throw new Error('Jadwal ini sudah ada (Guru yang sama sudah mengajar mapel ini di kelas ini).');
        }
        throw error;
      }
      setIsModalOpen(false);
      Swal.fire('Berhasil!', 'Jadwal mengajar berhasil ditambahkan.', 'success');
      fetchData();
    } catch (error) {
      console.error('Error saving jadwal:', error);
      Swal.fire('Error!', error.message || 'Gagal menyimpan jadwal', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Yakin ingin menghapus jadwal mengajar ini?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--status-error)',
      cancelButtonColor: 'var(--secondary)',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase.from('guru_mapel').delete().eq('id', id);
      if (error) throw error;
      Swal.fire('Terhapus!', 'Jadwal berhasil dihapus.', 'success');
      fetchData();
    } catch (error) {
      console.error('Error deleting jadwal:', error);
      Swal.fire('Error!', 'Gagal menghapus jadwal.', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Pembagian Jadwal Mengajar</h1>
        <button 
          onClick={handleOpenModal}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundcolor: 'var(--text-primary)', color: 'white',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
            border: 'none', cursor: 'pointer', fontWeight: 600
          }}
        >
          <Plus size={18} /> Tambah Jadwal
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--secondary)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Nama Guru</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Mata Pelajaran</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Kelas</th>
              <th style={{ padding: '1rem', fontWeight: 600, width: '100px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</td></tr>
            ) : jadwal.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Belum ada pembagian jadwal mengajar.</td></tr>
            ) : (
              jadwal.map((j) => (
                <tr key={j.id} style={{ borderTop: '1px solid var(--secondary)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{j.users?.nama_lengkap}</td>
                  <td style={{ padding: '1rem' }}>{j.mapel?.nama_mapel}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', backgroundColor: 'rgba(26,54,93,0.1)', color: 'var(--text-primary)',
                      borderRadius: '4px', fontWeight: 600, fontSize: '0.875rem' 
                    }}>
                      {j.kelas?.nama_kelas}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => handleDelete(j.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer', padding: '0.5rem' }}
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{ 
            backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', 
            width: '100%', maxWidth: '500px'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Tambah Jadwal Mengajar</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Pilih Guru</label>
                <select 
                  required
                  value={formData.guru_id} 
                  onChange={(e) => setFormData({...formData, guru_id: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                >
                  <option value="" disabled>-- Pilih Guru --</option>
                  {guru.map(g => (
                    <option key={g.id} value={g.id}>{g.nama_lengkap}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Pilih Mata Pelajaran</label>
                <select 
                  required
                  value={formData.mapel_id} 
                  onChange={(e) => setFormData({...formData, mapel_id: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                >
                  <option value="" disabled>-- Pilih Mapel --</option>
                  {mapel.map(m => (
                    <option key={m.id} value={m.id}>{m.nama_mapel}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Pilih Kelas</label>
                <select 
                  required
                  value={formData.kelas_id}
                  onChange={(e) => setFormData({...formData, kelas_id: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                >
                  <option value="" disabled>-- Pilih Kelas --</option>
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.75rem 1.5rem', border: '1px solid var(--secondary)', backgroundColor: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" disabled={submitLoading}
                  style={{ padding: '0.75rem 1.5rem', border: 'none', backgroundcolor: 'var(--text-primary)', color: 'white', borderRadius: 'var(--radius-sm)', cursor: submitLoading ? 'not-allowed' : 'pointer' }}
                >
                  {submitLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
