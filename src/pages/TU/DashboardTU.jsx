import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Users, UsersRound, BookOpen } from 'lucide-react';

export default function DashboardTU() {
  const [stats, setStats] = useState({ siswa: 0, pengguna: 0, kelas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [siswaRes, penggunaRes, kelasRes] = await Promise.all([
        supabase.from('siswa').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('kelas').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        siswa: siswaRes.count || 0,
        pengguna: penggunaRes.count || 0,
        kelas: kelasRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCardStyle = {
    backgroundColor: 'var(--bg-card)',
    padding: '1.5rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--secondary)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  };

  const iconContainerStyle = {
    backgroundColor: 'rgba(26, 54, 93, 0.1)',
    color: 'var(--primary)',
    padding: '1rem',
    borderRadius: '50%'
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Beranda Tata Usaha</h1>
      
      {loading ? (
        <p>Memuat statistik...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          
          <div style={statCardStyle}>
            <div style={iconContainerStyle}>
              <UsersRound size={28} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>Total Siswa</p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{stats.siswa}</h3>
            </div>
          </div>

          <div style={statCardStyle}>
            <div style={iconContainerStyle}>
              <Users size={28} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>Total Pengguna</p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{stats.pengguna}</h3>
            </div>
          </div>

          <div style={statCardStyle}>
            <div style={iconContainerStyle}>
              <BookOpen size={28} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>Total Kelas</p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{stats.kelas}</h3>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
