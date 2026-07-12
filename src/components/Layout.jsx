import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, LayoutDashboard, Users, UsersRound, CalendarCheck, BookOpen, CalendarDays, FileEdit, GraduationCap, School, Activity, Menu, X, FileCheck, FileText, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'TU': return 'Tata Usaha';
      case 'GURU_MAPEL': return 'Guru Mapel';
      case 'WALI_KELAS': return 'Wali Kelas';
      case 'KEPALA_SEKOLAH': return 'Kepala Sekolah';
      case 'SISWA': return 'Siswa';
      default: return 'Pengguna';
    }
  };

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    color: 'white',
    backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
    opacity: isActive ? 1 : 0.8,
    transition: 'all 0.2s ease',
  });

  return (
    <div className="layout-container">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''} no-print`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''} no-print`}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <img 
              src="/logo.jpg" 
              alt="Logo SMK Nangkaleah" 
              style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '50%', backgroundColor: 'white', padding: '2px' }} 
            />
            <div>
              <h2 style={{ color: 'white', margin: 0, fontSize: '1.125rem', lineHeight: '1.4' }}>SMK Nangkaleah</h2>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Sistem Rapor Digital</div>
            </div>
          </div>
          <button 
            className="mobile-only"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} 
          >
            <X size={24} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
          
          {/* Menu Khusus TU */}
          {role === 'TU' && (
            <>
              <NavLink to="/tu" end style={navLinkStyle}>
                <LayoutDashboard size={20} />
                Beranda
              </NavLink>
              <NavLink to="/tu/pengguna" style={navLinkStyle}>
                <Users size={20} />
                Data Pengguna
              </NavLink>
              <NavLink to="/tu/kelas" style={navLinkStyle}>
                <School size={20} />
                Data Kelas
              </NavLink>
              <NavLink to="/tu/siswa" style={navLinkStyle}>
                <UsersRound size={20} />
                Data Siswa
              </NavLink>
              <NavLink to="/tu/absensi" style={navLinkStyle}>
                <CalendarCheck size={20} />
                Absensi
              </NavLink>
              <NavLink to="/tu/mapel" style={navLinkStyle}>
                <BookOpen size={20} />
                Data Mapel
              </NavLink>
              <NavLink to="/tu/jadwal" style={navLinkStyle}>
                <CalendarDays size={20} />
                Jadwal Mengajar
              </NavLink>
            </>
          )}

          {/* Menu Khusus Guru Mapel */}
          {role === 'GURU_MAPEL' && (
            <>
              <NavLink to="/guru" end style={navLinkStyle}>
                <LayoutDashboard size={20} />
                Beranda
              </NavLink>
              <NavLink to="/guru/nilai" style={navLinkStyle}>
                <FileEdit size={20} />
                Input Nilai
              </NavLink>
            </>
          )}

          {/* Menu Khusus Kepala Sekolah */}
          {role === 'KEPALA_SEKOLAH' && (
            <>
              <NavLink to="/kepsek" end style={navLinkStyle}>
                <LayoutDashboard size={20} />
                Dasbor Eksekutif
              </NavLink>
              <NavLink to="/kepsek/validasi" style={navLinkStyle}>
                <FileCheck size={20} />
                Validasi Rapor
              </NavLink>
            </>
          )}

          {/* Fallback menu jika belum ada menu spesifik */}
          {!['TU', 'GURU_MAPEL', 'WALI_KELAS', 'SISWA', 'KEPALA_SEKOLAH'].includes(role) && (
            <>
              <NavLink to="/wali-kelas" end style={navLinkStyle}>
                <LayoutDashboard size={20} />
                Beranda
              </NavLink>
            </>
          )}

          {/* Menu Khusus Wali Kelas */}
          {role === 'WALI_KELAS' && (
            <>
              <div style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tugas Wali Kelas
              </div>
              <NavLink to="/wali-kelas" end style={navLinkStyle}>
                <LayoutDashboard size={20} />
                Beranda Wali Kelas
              </NavLink>
              <NavLink to="/wali-kelas/leger" style={navLinkStyle}>
                <Activity size={20} />
                Pantau Nilai
              </NavLink>
              <NavLink to="/wali-kelas/absensi" style={navLinkStyle}>
                <Users size={20} />
                Rekap Absensi
              </NavLink>
              <NavLink to="/wali-kelas/catatan" style={navLinkStyle}>
                <FileText size={20} />
                Catatan Wali Kelas
              </NavLink>
              <NavLink to="/wali-kelas/cetak" style={navLinkStyle}>
                <Printer size={20} />
                Cetak Rapor
              </NavLink>

              <div style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                Tugas Guru Mapel
              </div>
              <NavLink to="/guru/nilai" style={navLinkStyle}>
                <FileEdit size={20} />
                Input Nilai Mapel
              </NavLink>
            </>
          )}

          {/* Menu Khusus Siswa */}
          {role === 'SISWA' && (
            <>
              <NavLink to="/siswa" end style={navLinkStyle}>
                <LayoutDashboard size={20} />
                Beranda
              </NavLink>
              <NavLink to="/siswa/rapor" style={navLinkStyle}>
                <GraduationCap size={20} />
                Rapor Digital
              </NavLink>
            </>
          )}

        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <NavLink 
            to="/profil"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem',
              overflow: 'hidden',
              padding: '0.5rem',
              margin: '-0.5rem -0.5rem 0.5rem -0.5rem',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              transition: 'background-color 0.2s'
            })}
            className="profil-hover-link"
          >
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '50%', flexShrink: 0 }}>
              <User size={20} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{getRoleLabel()}</div>
            </div>
          </NavLink>
          
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 'var(--radius-md)',
              transition: 'background-color 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        
        {/* Mobile Header (Only visible on mobile) */}
        <header className="mobile-header no-print">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
          >
            <Menu size={24} color="var(--text-main)" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginRight: '1rem' }}>
            <img src="/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.125rem' }}>
              SMK Nangkaleah
            </h3>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="desktop-header no-print" style={{ 
          backgroundColor: 'white', 
          padding: '1.25rem 2rem', 
          borderBottom: '1px solid var(--secondary)',
          display: 'flex',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1.125rem' }}>
            {getRoleLabel()} Dashboard
          </h3>
        </header>
        
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
