import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { User, Lock, Save, GraduationCap } from 'lucide-react';

export default function Profil() {
  const { user, role } = useAuth();
  
  // Data user dari tabel users (untuk staff/guru)
  const [userData, setUserData] = useState(null);
  
  // Data siswa dari tabel siswa (jika role SISWA)
  const [siswaData, setSiswaData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  
  // State untuk ubah password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Ambil data dasar pengguna
      const { data: uData, error: uError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (uError) throw uError;
      setUserData(uData);

      // Jika role SISWA, ambil detail dari tabel siswa
      if (uData.role === 'SISWA') {
        const { data: sData, error: sError } = await supabase
          .from('siswa')
          .select(`
            *,
            kelas:kelas_id(nama_kelas)
          `)
          .eq('user_id', user.id)
          .single();
          
        if (sError && sError.code !== 'PGRST116') {
          console.error("Error fetch siswa data:", sError);
        } else if (sData) {
          setSiswaData(sData);
        }
      }
      
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });
    
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'Password minimal 6 karakter.' });
      return;
    }

    try {
      setPassLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      setPassMsg({ type: 'success', text: 'Password berhasil diperbarui!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Error updating password:", error);
      setPassMsg({ type: 'error', text: error.message || 'Gagal mengubah password.' });
    } finally {
      setPassLoading(false);
    }
  };

  const getRoleLabel = (r) => {
    switch (r) {
      case 'TU': return 'Tata Usaha';
      case 'GURU_MAPEL': return 'Guru Mapel';
      case 'WALI_KELAS': return 'Wali Kelas';
      case 'KEPALA_SEKOLAH': return 'Kepala Sekolah';
      case 'SISWA': return 'Siswa';
      default: return 'Pengguna';
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data profil...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <User size={24} color="var(--primary)" />
        Profil Pribadi
      </h1>

      {/* Identitas Diri */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--secondary)' }}>
          <div style={{ backgroundColor: 'var(--secondary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={40} color="var(--text-muted)" />
          </div>
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: 'var(--text-main)' }}>
              {userData?.nama_lengkap || user?.email}
            </h2>
            <div style={{ display: 'inline-block', backgroundColor: 'var(--primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.875rem', fontWeight: 600 }}>
              {getRoleLabel(userData?.role)}
            </div>
          </div>
        </div>

        {/* Informasi Akun Standar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: role === 'SISWA' ? '2rem' : '0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email Akun</label>
            <div style={{ fontWeight: 600 }}>{user?.email}</div>
          </div>
          {role !== 'SISWA' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Terdaftar Sejak</label>
              <div style={{ fontWeight: 600 }}>{new Date(user?.created_at).toLocaleDateString('id-ID')}</div>
            </div>
          )}
        </div>

        {/* Informasi Khusus Siswa */}
        {role === 'SISWA' && (
          <div style={{ borderTop: '1px solid var(--secondary)', paddingTop: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={20} color="var(--primary)" /> Data Induk Siswa
            </h3>
            
            {!siswaData ? (
              <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: '#B91C1C', borderRadius: '4px' }}>
                Data identitas siswa Anda belum ditautkan oleh Tata Usaha.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Kelas</label>
                  <div style={{ fontWeight: 600 }}>{siswaData.kelas?.nama_kelas || '-'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>NISN / NIS</label>
                  <div style={{ fontWeight: 600 }}>{siswaData.nisn || '-'} / {siswaData.nis || '-'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Tempat, Tanggal Lahir</label>
                  <div style={{ fontWeight: 600 }}>
                    {siswaData.tempat_lahir || '-'}, {siswaData.tanggal_lahir ? new Date(siswaData.tanggal_lahir).toLocaleDateString('id-ID') : '-'}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jenis Kelamin</label>
                  <div style={{ fontWeight: 600 }}>{siswaData.jenis_kelamin === 'L' ? 'Laki-Laki' : siswaData.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Agama</label>
                  <div style={{ fontWeight: 600 }}>{siswaData.agama || '-'}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Alamat</label>
                  <div style={{ fontWeight: 600, lineHeight: '1.5' }}>
                    {siswaData.alamat || '-'}<br/>
                    {siswaData.jalan && `Jl. ${siswaData.jalan}`}{siswaData.kelurahan && `, Kel. ${siswaData.kelurahan}`}{siswaData.kecamatan && `, Kec. ${siswaData.kecamatan}`}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Nama Ayah</label>
                  <div style={{ fontWeight: 600 }}>{siswaData.nama_ayah || '-'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Nama Ibu</label>
                  <div style={{ fontWeight: 600 }}>{siswaData.nama_ibu || '-'}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Ubah Password */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={20} color="var(--primary)" /> Ubah Kata Sandi (Password)
        </h3>
        
        {passMsg.text && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '4px',
            backgroundColor: passMsg.type === 'error' ? '#FEF2F2' : '#F0FDF4',
            color: passMsg.type === 'error' ? '#B91C1C' : '#15803D',
            border: `1px solid ${passMsg.type === 'error' ? '#FECACA' : '#BBF7D0'}`
          }}>
            {passMsg.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Password Baru</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Konfirmasi Password Baru</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
            />
          </div>
          <button 
            type="submit"
            disabled={passLoading}
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 'var(--radius-sm)', 
              cursor: passLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              opacity: passLoading ? 0.7 : 1
            }}
          >
            <Save size={18} />
            {passLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>

    </div>
  );
}
