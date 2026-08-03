import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div 
        className="hover-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--secondary)',
          boxShadow: 'var(--shadow-lg)',
          padding: '3rem 2.5rem',
        }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <img 
              src="/logo.jpg" 
              alt="Logo Sekolah" 
              style={{ width: '90px', height: '90px', objectFit: 'contain', borderRadius: '50%', boxShadow: 'var(--shadow-md)' }} 
            />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Sistem Rapor Digital</h1>
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
                  paddingLeft: '2.75rem'
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
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  paddingLeft: '2.75rem',
                  paddingRight: '3rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '0.5rem',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '0.875rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseOver={(e) => { 
              if (!loading) {
                e.target.style.backgroundColor = 'var(--primary-hover)';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => { 
              if (!loading) {
                e.target.style.backgroundColor = 'var(--primary)';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? 'Masuk...' : 'Masuk ke Dasbor'}
          </button>
        </form>
      </div>
    </div>
  );
}
