import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Edit2, Eye, EyeOff, Shield, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

export default function DataPengguna() {
  const [pengguna, setPengguna] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
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
      if (editingId) {
        // Mode Edit: Hanya ubah role dan nama_lengkap di tabel users
        const { error } = await supabase
          .from('users')
          .update({
            nama_lengkap: formData.nama_lengkap,
            role: formData.role
          })
          .eq('id', editingId);

        if (error) throw error;
        Swal.fire({
          title: 'Berhasil!',
          text: 'Data pengguna berhasil diperbarui.',
          icon: 'success'
        });
      } else {
        // Mode Tambah: Buat user auth baru
        let finalEmail = formData.email.trim();
        if (!finalEmail.includes('@')) {
          finalEmail = `${finalEmail}@smknangkaleah.sch.id`;
        }

        const { data, error } = await supabase.rpc('create_user_by_tu', {
          new_email: finalEmail.toLowerCase(),
          new_password: formData.password,
          new_nama_lengkap: formData.nama_lengkap,
          new_role: formData.role
        });

        if (error) throw error;

        Swal.fire({
          title: 'Berhasil membuat pengguna!',
          html: `<b>Username/NUPTK:</b> ${formData.email}<br/><b>Password:</b> ${formData.password}<br/><br/><small style="color:red">Simpan password ini karena tidak akan ditampilkan lagi!</small>`,
          icon: 'success'
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ email: '', nama_lengkap: '', role: 'GURU_MAPEL', password: '' });
      setGeneratedPassword('');
      fetchPengguna();
    } catch (error) {
      console.error('Error saving user:', error);
      setErrorMsg(error.message || 'Gagal menyimpan pengguna');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Yakin ingin menghapus pengguna ini? (Sesi login di Auth Supabase juga akan terpengaruh)",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--status-error)',
      cancelButtonColor: 'var(--secondary)',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;
    
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      Swal.fire('Terhapus!', 'Pengguna berhasil dihapus.', 'success');
      fetchPengguna();
    } catch (error) {
      console.error('Error deleting user:', error);
      Swal.fire('Error!', 'Gagal menghapus pengguna.', 'error');
    }
  };

  const handleEdit = (u) => {
    setEditingId(u.id);
    setFormData({
      email: u.email.endsWith('@smknangkaleah.sch.id') ? u.email.split('@')[0] : u.email,
      nama_lengkap: u.nama_lengkap,
      role: u.role,
      password: ''
    });
    setGeneratedPassword('');
    setIsModalOpen(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Kelola Data Pengguna</h1>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ email: '', nama_lengkap: '', role: 'GURU_MAPEL', password: '' });
            generatePassword();
            setIsModalOpen(true);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundcolor: 'var(--text-primary)', color: 'white',
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
              <th style={{ padding: '1rem', fontWeight: 600 }}>Username / NUPTK</th>
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
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{u.nama_lengkap}</td>
                  <td style={{ padding: '1rem' }}>
                    {u.email.endsWith('@smknangkaleah.sch.id') 
                      ? u.email.split('@')[0] 
                      : u.email}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      backgroundColor: 'rgba(26,54,93,0.1)', 
                      color: 'var(--text-primary)',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleEdit(u)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.5rem' }}
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer', padding: '0.5rem' }}
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
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
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>{editingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
            
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Username / NUPTK {editingId && '(Tidak dapat diubah)'}</label>
                <input 
                  type="text" required={!editingId} value={formData.email} disabled={!!editingId}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)', backgroundColor: editingId ? 'var(--bg-main)' : 'white' }}
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Password {editingId ? '(Tidak dapat diubah di sini)' : '(Auto-generated)'}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={editingId ? '********' : formData.password} 
                    disabled={!!editingId}
                    onChange={(e) => {
                      setFormData({...formData, password: e.target.value});
                      setGeneratedPassword(e.target.value);
                    }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)', backgroundColor: editingId ? 'var(--bg-main)' : 'white' }}
                  />
                  {!editingId && (
                    <>
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ padding: '0 1rem', background: 'none', border: '1px solid var(--secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button 
                        type="button" 
                        onClick={generatePassword}
                        style={{ padding: '0 1rem', background: 'none', border: '1px solid var(--secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Generate Ulang Password"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'var(--secondary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
                  Batal
                </button>
                <button type="submit" disabled={submitLoading} style={{ flex: 1, padding: '0.75rem', backgroundcolor: 'var(--text-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
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
