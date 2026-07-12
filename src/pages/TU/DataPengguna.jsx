import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

export default function DataPengguna() {
  const [pengguna, setPengguna] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    nama_lengkap: '',
    role: 'GURU_MAPEL',
    password: ''
  });
  
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchPengguna();
  }, []);

  const fetchPengguna = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPengguna(data);
    } catch (error) {
      console.error('Error fetching pengguna:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: pass });
    setGeneratedPassword(pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.rpc('create_user_by_tu', {
        new_email: formData.email,
        new_password: formData.password,
        new_nama_lengkap: formData.nama_lengkap,
        new_role: formData.role
      });

      if (error) throw error;

      alert(`Berhasil membuat pengguna!\nEmail: ${formData.email}\nPassword: ${formData.password}\nSimpan password ini karena tidak akan ditampilkan lagi!`);
      setIsModalOpen(false);
      setFormData({ email: '', nama_lengkap: '', role: 'GURU_MAPEL', password: '' });
      setGeneratedPassword('');
      fetchPengguna();
    } catch (error) {
      console.error('Error creating user:', error);
      setErrorMsg(error.message || 'Gagal membuat pengguna');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pengguna ini? (Aksi ini belum menghapus sesi login di Auth Supabase jika trigger belum dibuat)')) return;
    
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      fetchPengguna();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Gagal menghapus pengguna.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Kelola Data Pengguna</h1>
        <button 
          onClick={() => {
            generatePassword();
            setIsModalOpen(true);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'var(--primary)', color: 'white',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
            border: 'none', cursor: 'pointer', fontWeight: 600
          }}
        >
          <Plus size={18} /> Tambah Pengguna
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--secondary)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Nama Lengkap</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '1rem', fontWeight: 600, width: '100px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</td></tr>
            ) : pengguna.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Belum ada data pengguna.</td></tr>
            ) : (
              pengguna.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--secondary)' }}>
                  <td style={{ padding: '1rem' }}>{u.nama_lengkap}</td>
                  <td style={{ padding: '1rem' }}>{u.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      backgroundColor: 'rgba(26,54,93,0.1)', 
                      color: 'var(--primary)',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => handleDelete(u.id)}
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

      {/* Modal Tambah Pengguna */}
      {isModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', 
            width: '100%', maxWidth: '500px' 
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Tambah Pengguna Baru</h2>
            
            {errorMsg && (
              <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nama Lengkap</label>
                <input 
                  type="text" required value={formData.nama_lengkap} 
                  onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email</label>
                <input 
                  type="email" required value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Role</label>
                <select 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                >
                  <option value="GURU_MAPEL">Guru Mapel</option>
                  <option value="WALI_KELAS">Wali Kelas</option>
                  <option value="KEPALA_SEKOLAH">Kepala Sekolah</option>
                  <option value="TU">Tata Usaha</option>
                  <option value="SISWA">Siswa</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Password (Auto-generated)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={(e) => {
                      setFormData({...formData, password: e.target.value});
                      setGeneratedPassword(e.target.value);
                    }}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ padding: '0 1rem', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button type="button" onClick={generatePassword} style={{ padding: '0 1rem', cursor: 'pointer' }}>Generate</button>
                </div>
                <small style={{ color: 'var(--text-muted)' }}>* Salin password ini untuk diberikan kepada pengguna.</small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.75rem 1.5rem', border: '1px solid var(--secondary)', backgroundColor: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={submitLoading}
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
