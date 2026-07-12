import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function DataMapel() {
  const [mapel, setMapel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nama_mapel: '',
    kelompok: 'A',
    kkm: 75
  });

  useEffect(() => {
    fetchMapel();
  }, []);

  const fetchMapel = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('mapel').select('*').order('kelompok').order('nama_mapel');
      if (error) throw error;
      setMapel(data);
    } catch (error) {
      console.error('Error fetching mapel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (m = null) => {
    if (m) {
      setFormData({
        nama_mapel: m.nama_mapel,
        kelompok: m.kelompok || 'A',
        kkm: m.kkm || 75
      });
      setEditingId(m.id);
    } else {
      setFormData({ nama_mapel: '', kelompok: 'A', kkm: 75 });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase.from('mapel').update(formData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('mapel').insert([formData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      Swal.fire('Berhasil!', 'Data mata pelajaran berhasil disimpan.', 'success');
      fetchMapel();
    } catch (error) {
      console.error('Error saving mapel:', error);
      Swal.fire('Error!', 'Gagal menyimpan mapel: ' + error.message, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Yakin ingin menghapus mata pelajaran ini?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--status-error)',
      cancelButtonColor: 'var(--secondary)',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase.from('mapel').delete().eq('id', id);
      if (error) throw error;
      Swal.fire('Terhapus!', 'Mata pelajaran berhasil dihapus.', 'success');
      fetchMapel();
    } catch (error) {
      console.error('Error deleting mapel:', error);
      Swal.fire('Error!', 'Gagal menghapus mapel.', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Data Mata Pelajaran</h1>
        <button 
          onClick={() => handleOpenModal()}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'var(--primary)', color: 'white',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
            border: 'none', cursor: 'pointer', fontWeight: 600
          }}
        >
          <Plus size={18} /> Tambah Mapel
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--secondary)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Kelompok</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Nama Mata Pelajaran</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>KKM</th>
              <th style={{ padding: '1rem', fontWeight: 600, width: '120px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</td></tr>
            ) : mapel.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Belum ada data mata pelajaran.</td></tr>
            ) : (
              mapel.map((m) => (
                <tr key={m.id} style={{ borderTop: '1px solid var(--secondary)' }}>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-main)', 
                      borderRadius: '4px', fontWeight: 600, fontSize: '0.875rem' 
                    }}>
                      Kelompok {m.kelompok}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{m.nama_mapel}</td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{m.kkm}</td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleOpenModal(m)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem' }}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(m.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer', padding: '0.5rem' }}
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
            width: '100%', maxWidth: '400px'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>{editingId ? 'Edit Mapel' : 'Tambah Mapel'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nama Mata Pelajaran</label>
                <input 
                  type="text" required value={formData.nama_mapel} 
                  onChange={(e) => setFormData({...formData, nama_mapel: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Kelompok Mapel</label>
                <select 
                  value={formData.kelompok} 
                  onChange={(e) => setFormData({...formData, kelompok: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                >
                  <option value="A">Kelompok A (Nasional)</option>
                  <option value="B">Kelompok B (Kewilayahan)</option>
                  <option value="C">Kelompok C (Kejuruan)</option>
                  <option value="Muatan Lokal">Muatan Lokal</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>KKM (Kriteria Ketuntasan)</label>
                <input 
                  type="number" required value={formData.kkm} min="0" max="100"
                  onChange={(e) => setFormData({...formData, kkm: parseInt(e.target.value)})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
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
