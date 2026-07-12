import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function DataSiswa() {
  const [siswa, setSiswa] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [usersSiswa, setUsersSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nisn: '',
    nis: '',
    nama_lengkap: '',
    jenis_kelamin: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    agama: '',
    kelas_id: '',
    no_hp_ortu: '',
    user_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [siswaRes, kelasRes, usersRes] = await Promise.all([
        supabase.from('siswa').select(`*, kelas(nama_kelas)`).order('nama_lengkap'),
        supabase.from('kelas').select('id, nama_kelas').order('nama_kelas'),
        supabase.from('users').select('id, nama_lengkap, email').eq('role', 'SISWA')
      ]);
      
      if (siswaRes.error) throw siswaRes.error;
      if (kelasRes.error) throw kelasRes.error;
      if (usersRes.error) throw usersRes.error;
      
      setSiswa(siswaRes.data);
      setKelas(kelasRes.data);
      setUsersSiswa(usersRes.data);
      
      if (kelasRes.data.length > 0) {
        setFormData(prev => ({ ...prev, kelas_id: kelasRes.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (s = null) => {
    if (s) {
      setFormData({
        nisn: s.nisn || '',
        nis: s.nis || '',
        nama_lengkap: s.nama_lengkap || '',
        jenis_kelamin: s.jenis_kelamin || 'L',
        tempat_lahir: s.tempat_lahir || '',
        tanggal_lahir: s.tanggal_lahir || '',
        agama: s.agama || '',
        kelas_id: s.kelas_id || (kelas.length > 0 ? kelas[0].id : ''),
        no_hp_ortu: s.no_hp_ortu || '',
        user_id: s.user_id || ''
      });
      setEditingId(s.id);
    } else {
      setFormData({
        nisn: '', nis: '', nama_lengkap: '', jenis_kelamin: 'L',
        tempat_lahir: '', tanggal_lahir: '', agama: '', 
        kelas_id: kelas.length > 0 ? kelas[0].id : '',
        no_hp_ortu: '',
        user_id: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const payload = { ...formData };
      if (!payload.kelas_id) payload.kelas_id = null; // handle empty kelas_id
      if (!payload.tanggal_lahir) payload.tanggal_lahir = null;
      if (!payload.user_id) payload.user_id = null;

      if (editingId) {
        const { error } = await supabase.from('siswa').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('siswa').insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving siswa:', error);
      alert('Gagal menyimpan data siswa: ' + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus siswa ini?')) return;
    try {
      const { error } = await supabase.from('siswa').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting siswa:', error);
      alert('Gagal menghapus siswa');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Kelola Data Siswa</h1>
        <button 
          onClick={() => handleOpenModal()}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'var(--primary)', color: 'white',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
            border: 'none', cursor: 'pointer', fontWeight: 600
          }}
        >
          <Plus size={18} /> Tambah Siswa
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead style={{ backgroundColor: 'var(--secondary)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600 }}>NISN / NIS</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Nama Lengkap</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>L/P</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Kelas</th>
              <th style={{ padding: '1rem', fontWeight: 600, width: '120px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</td></tr>
            ) : siswa.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Belum ada data siswa.</td></tr>
            ) : (
              siswa.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--secondary)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{s.nisn || '-'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.nis || '-'}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{s.nama_lengkap}</td>
                  <td style={{ padding: '1rem' }}>{s.jenis_kelamin}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', backgroundColor: 'rgba(26,54,93,0.1)', color: 'var(--primary)',
                      borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600
                    }}>
                      {s.kelas?.nama_kelas || 'Belum ada kelas'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleOpenModal(s)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem' }}
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)}
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
            width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>{editingId ? 'Edit Siswa' : 'Tambah Siswa Baru'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>NISN</label>
                <input 
                  type="text" value={formData.nisn} onChange={(e) => setFormData({...formData, nisn: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>NIS</label>
                <input 
                  type="text" value={formData.nis} onChange={(e) => setFormData({...formData, nis: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Nama Lengkap *</label>
                <input 
                  type="text" required value={formData.nama_lengkap} onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Jenis Kelamin</label>
                <select 
                  value={formData.jenis_kelamin} onChange={(e) => setFormData({...formData, jenis_kelamin: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Kelas</label>
                <select 
                  value={formData.kelas_id} onChange={(e) => setFormData({...formData, kelas_id: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Tempat Lahir</label>
                <input 
                  type="text" value={formData.tempat_lahir} onChange={(e) => setFormData({...formData, tempat_lahir: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Tanggal Lahir</label>
                <input 
                  type="date" value={formData.tanggal_lahir} onChange={(e) => setFormData({...formData, tanggal_lahir: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>No HP Ortu/Wali (Cth: 628...)</label>
                <input 
                  type="text" placeholder="62812345678" value={formData.no_hp_ortu} onChange={(e) => setFormData({...formData, no_hp_ortu: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', padding: '1rem', backgroundColor: 'rgba(26,54,93,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(26,54,93,0.1)' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary)' }}>Tautkan Akun Login Siswa (Opsional)</label>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pilih akun yang didaftarkan di halaman Data Pengguna agar siswa ini bisa login melihat rapornya.</p>
                <select 
                  value={formData.user_id} onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                >
                  <option value="">-- Tidak Ditautkan --</option>
                  {usersSiswa.map(u => (
                    <option key={u.id} value={u.id}>{u.nama_lengkap} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.75rem 1.5rem', border: '1px solid var(--secondary)', backgroundColor: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" disabled={submitLoading}
                  style={{ padding: '0.75rem 1.5rem', border: 'none', backgroundColor: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-sm)', cursor: submitLoading ? 'not-allowed' : 'pointer' }}
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
