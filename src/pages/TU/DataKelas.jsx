import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { catatLog } from '../../utils/auditLogger';

export default function DataKelas() {
  const { user } = useAuth();
  const [kelas, setKelas] = useState([]);
  const [waliKelasList, setWaliKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    tingkat: 'X',
    nama_kelas: '',
    tahun_ajaran: '2023/2024',
    wali_kelas_id: ''
  });

  useEffect(() => {
    fetchKelas();
    fetchWaliKelas();
  }, []);

  const fetchKelas = async () => {
    try {
      const { data, error } = await supabase
        .from('kelas')
        .select('*, users:wali_kelas_id(nama_lengkap)')
        .order('tingkat')
        .order('nama_kelas');
      if (error) throw error;
      setKelas(data);
    } catch (error) {
      console.error('Error fetching kelas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaliKelas = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nama_lengkap')
        .eq('role', 'WALI_KELAS');
      if (error) throw error;
      setWaliKelasList(data);
    } catch (error) {
      console.error('Error fetching wali kelas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.wali_kelas_id) payload.wali_kelas_id = null;

      if (editId) {
        const { error } = await supabase.from('kelas').update(payload).eq('id', editId);
        if (error) throw error;
        await catatLog(user.id, user.nama_lengkap, user.role, 'EDIT', `Mengubah data kelas: ${payload.nama_kelas}`);
      } else {
        const { error } = await supabase.from('kelas').insert([payload]);
        if (error) throw error;
        await catatLog(user.id, user.nama_lengkap, user.role, 'TAMBAH', `Menambahkan kelas baru: ${payload.nama_kelas}`);
      }
      
      setIsModalOpen(false);
      Swal.fire('Berhasil!', 'Data kelas berhasil disimpan.', 'success');
      fetchKelas();
    } catch (error) {
      console.error('Error saving kelas:', error);
      Swal.fire('Error!', 'Gagal menyimpan data: ' + error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data siswa di dalam kelas ini bisa terpengaruh!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--status-error)',
      cancelButtonColor: 'var(--secondary)',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      const kelasToDelete = kelas.find(k => k.id === id);
      const { error } = await supabase.from('kelas').delete().eq('id', id);
      if (error) throw error;
      
      await catatLog(user.id, user.nama_lengkap, user.role, 'HAPUS', `Menghapus data kelas: ${kelasToDelete?.nama_kelas || 'Unknown'}`);
      
      Swal.fire('Terhapus!', 'Kelas berhasil dihapus.', 'success');
      fetchKelas();
    } catch (error) {
      console.error('Error deleting kelas:', error);
      Swal.fire('Error!', 'Gagal menghapus kelas.', 'error');
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditId(item.id);
      setFormData({
        tingkat: item.tingkat,
        nama_kelas: item.nama_kelas,
        tahun_ajaran: item.tahun_ajaran,
        wali_kelas_id: item.wali_kelas_id || ''
      });
    } else {
      setEditId(null);
      setFormData({
        tingkat: 'X',
        nama_kelas: '',
        tahun_ajaran: '2023/2024',
        wali_kelas_id: ''
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Manajemen Data Kelas</h1>
        <button 
          onClick={() => openModal()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
        >
          <Plus size={18} /> Tambah Kelas
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--secondary)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Tingkat</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Nama Kelas</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Tahun Ajaran</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Wali Kelas</th>
              <th style={{ padding: '1rem', fontWeight: 600, width: '100px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</td></tr>
            ) : kelas.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Belum ada data kelas.</td></tr>
            ) : (
              kelas.map(item => (
                <tr key={item.id} style={{ borderTop: '1px solid var(--secondary)' }}>
                  <td style={{ padding: '1rem' }}>{item.tingkat}</td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{item.nama_kelas}</td>
                  <td style={{ padding: '1rem' }}>{item.tahun_ajaran}</td>
                  <td style={{ padding: '1rem' }}>{item.users?.nama_lengkap || '-'}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button onClick={() => openModal(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', marginRight: '0.5rem' }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-error)' }}>
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
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ margin: '0 0 1.5rem 0' }}>{editId ? 'Edit Kelas' : 'Tambah Kelas'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tingkat</label>
                <select 
                  value={formData.tingkat} onChange={e => setFormData({...formData, tingkat: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)' }}
                >
                  <option value="X">X</option>
                  <option value="XI">XI</option>
                  <option value="XII">XII</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nama Kelas (Cth: X RPL 1)</label>
                <input 
                  type="text" required value={formData.nama_kelas} onChange={e => setFormData({...formData, nama_kelas: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tahun Ajaran</label>
                <input 
                  type="text" required value={formData.tahun_ajaran} onChange={e => setFormData({...formData, tahun_ajaran: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Wali Kelas</label>
                <select 
                  value={formData.wali_kelas_id} onChange={e => setFormData({...formData, wali_kelas_id: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary)' }}
                >
                  <option value="">-- Tidak Ada / Pilih Wali Kelas --</option>
                  {waliKelasList.map(w => (
                    <option key={w.id} value={w.id}>{w.nama_lengkap}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--secondary)', borderRadius: '4px', background: 'transparent', cursor: 'pointer' }}>Batal</button>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', border: 'none', borderRadius: '4px', background: 'var(--primary)', color: 'white', cursor: 'pointer' }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
