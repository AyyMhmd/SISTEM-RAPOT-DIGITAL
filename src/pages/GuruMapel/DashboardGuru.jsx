import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, UsersRound } from 'lucide-react';

export default function DashboardGuru() {
  const { user } = useAuth();
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchJadwal();
  }, [user]);

  const fetchJadwal = async () => {
    try {
      const { data, error } = await supabase
        .from('guru_mapel')
        .select(`
          id,
          mapel:mapel_id(nama_mapel, kelompok),
          kelas:kelas_id(nama_kelas, tingkat)
        `)
        .eq('guru_id', user.id);

      if (error) throw error;
      setJadwal(data);
    } catch (error) {
      console.error('Error fetching jadwal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Selamat Datang, Guru!</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Berikut adalah daftar kelas dan mata pelajaran yang Anda ampu.</p>

      {loading ? (
        <p>Memuat jadwal mengajar...</p>
      ) : jadwal.length === 0 ? (
        <div style={{ padding: '2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--secondary)', textAlign: 'center' }}>
          Belum ada jadwal mengajar yang ditugaskan kepada Anda. Hubungi Tata Usaha.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {jadwal.map(j => (
            <div key={j.id} style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--secondary)', 
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                <BookOpen size={24} />
                <h3 style={{ margin: 0 }}>{j.mapel?.nama_mapel}</h3>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                <UsersRound size={18} style={{ color: 'var(--text-muted)' }} />
                <strong>Kelas:</strong> {j.kelas?.nama_kelas} (Tingkat {j.kelas?.tingkat})
              </div>
              
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Kelompok Mapel: {j.mapel?.kelompok}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
