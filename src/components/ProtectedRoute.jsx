import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to their respective dashboard if they try to access unauthorized routes
    switch (role) {
      case 'TU': return <Navigate to="/tu" replace />;
      case 'GURU_MAPEL': return <Navigate to="/guru" replace />;
      case 'WALI_KELAS': return <Navigate to="/wali-kelas" replace />;
      case 'KEPALA_SEKOLAH': return <Navigate to="/kepsek" replace />;
      case 'SISWA': return <Navigate to="/siswa" replace />;
      default: return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}
