import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './lib/supabaseClient';

import DashboardTU from './pages/TU/DashboardTU';
import DataPengguna from './pages/TU/DataPengguna';
import DataKelas from './pages/TU/DataKelas';
import DataSiswa from './pages/TU/DataSiswa';
import Absensi from './pages/TU/Absensi';
import DataMapel from './pages/TU/DataMapel';
import JadwalMengajar from './pages/TU/JadwalMengajar';

import DashboardGuru from './pages/GuruMapel/DashboardGuru';
import InputNilai from './pages/GuruMapel/InputNilai';

import DashboardWaliKelas from './pages/WaliKelas/DashboardWaliKelas';
import LegerNilai from './pages/WaliKelas/LegerNilai';
import RekapAbsensi from './pages/WaliKelas/RekapAbsensi';
import InputCatatanWali from './pages/WaliKelas/InputCatatanWali';
import CetakRapor from './pages/WaliKelas/CetakRapor';

import DashboardKepsek from './pages/Kepsek/DashboardKepsek';
import ValidasiRapor from './pages/Kepsek/ValidasiRapor';
import DashboardSiswa from './pages/Siswa/DashboardSiswa';
import BerandaSiswa from './pages/Siswa/BerandaSiswa';

// Komponen penengah untuk redirect dari root '/' ke dashboard masing-masing role
function RootRedirect() {
  const { role, loading, user } = useAuth();
  
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // Jika user login tapi role null, berarti ada error saat mengambil data dari public.users (misal: RLS error)
  if (!role) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
        Terjadi kesalahan saat mengambil profil Anda dari database. 
        Pastikan RLS policy tidak mengalami infinite recursion atau hubungi administrator.
        <br/><br/>
        <button onClick={() => supabase.auth.signOut()}>Logout</button>
      </div>
    );
  }

  switch (role) {
    case 'TU': return <Navigate to="/tu" replace />;
    case 'GURU_MAPEL': return <Navigate to="/guru" replace />;
    case 'WALI_KELAS': return <Navigate to="/wali-kelas" replace />;
    case 'KEPALA_SEKOLAH': return <Navigate to="/kepsek" replace />;
    case 'SISWA': return <Navigate to="/siswa" replace />;
    default: return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Root Route (Auto Redirect) */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Routes Wrapper */}
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute allowedRoles={['TU']} />}>
              <Route path="/tu" element={<DashboardTU />} />
              <Route path="/tu/pengguna" element={<DataPengguna />} />
              <Route path="/tu/kelas" element={<DataKelas />} />
              <Route path="/tu/siswa" element={<DataSiswa />} />
              <Route path="/tu/absensi" element={<Absensi />} />
              <Route path="/tu/mapel" element={<DataMapel />} />
              <Route path="/tu/jadwal" element={<JadwalMengajar />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['GURU_MAPEL']} />}>
              <Route path="/guru" element={<DashboardGuru />} />
              <Route path="/guru/nilai" element={<InputNilai />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['WALI_KELAS']} />}>
              <Route path="/wali-kelas" element={<DashboardWaliKelas />} />
              <Route path="/wali-kelas/leger" element={<LegerNilai />} />
              <Route path="/wali-kelas/absensi" element={<RekapAbsensi />} />
              <Route path="/wali-kelas/catatan" element={<InputCatatanWali />} />
              <Route path="/wali-kelas/cetak" element={<CetakRapor />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['KEPALA_SEKOLAH']} />}>
              <Route path="/kepsek" element={<DashboardKepsek />} />
              <Route path="/kepsek/validasi" element={<ValidasiRapor />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['SISWA']} />}>
              <Route path="/siswa" element={<BerandaSiswa />} />
              <Route path="/siswa/rapor" element={<DashboardSiswa />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
