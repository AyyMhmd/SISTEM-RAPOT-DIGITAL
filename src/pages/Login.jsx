import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    let loginEmail = email.trim();
    // Interceptor: Jika tidak ada '@', asumsikan itu NISN/NUPTK/Username
    if (!loginEmail.includes('@')) {
      loginEmail = `${loginEmail}@smknangkaleah.sch.id`;
    }

    try {
      await login(loginEmail, password);
      // Navigate to root to let ProtectedRoute handle redirection based on role
      navigate('/');
    } catch (error) {
      setErrorMsg(error.message || 'Gagal login. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-main)',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--secondary)',
        padding: '2.5rem 2rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <img 
              src="/logo.jpg" 
              alt="Logo Sekolah" 
              style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '50%' }} 
            />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Sistem Rapor Digital</h1>
          <p style={{ color: 'var(--text-muted)' }}>Silakan masuk ke akun Anda</p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#FEF2F2',
            color: 'var(--status-error)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            border: '1px solid #FECACA'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Username / NISN / NUPTK
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <User size={18} />
              </div>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Masukkan NISN atau NUPTK"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--secondary)',
                  fontFamily: 'inherit',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={18} />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--secondary)',
                  fontFamily: 'inherit',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.875rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => { if (!loading) e.target.style.backgroundColor = 'var(--primary-hover)' }}
            onMouseOut={(e) => { if (!loading) e.target.style.backgroundColor = 'var(--primary)' }}
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
