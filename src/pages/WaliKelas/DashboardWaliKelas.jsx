import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { UsersRound } from 'lucide-react';

export default function DashboardWaliKelas() {
  const { user } = useAuth();
  const [kelas, setKelas] = useState(null);
  const [jumlahSiswa, setJumlahSiswa] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchKelas();
  }, [user]);

  const fetchKelas = async () => {
    try {
      const { data, error } = await supabase
        .from('kelas')
        .select('*')
        .eq('wali_kelas_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setKelas(data);
        const { count, error: countError } = await supabase
          .from('siswa')
          .select('*', { count: 'exact', head: true })
          .eq('kelas_id', data.id);
          
        if (countError) throw countError;
        setJumlahSiswa(count || 0);
      }
    } catch (error) {
      console.error('Error fetching kelas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Selamat Datang, Wali Kelas!</h1>
      
      {loading ? (
        <p>Memuat data kelas...</p>
      ) : !kelas ? (
        <div style={{ padding: '2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--status-error)', textAlign: 'center', color: 'var(--status-error)' }}>
          Anda belum ditugaskan sebagai Wali Kelas di kelas mana pun. Silakan hubungi Tata Usaha.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--secondary)', 
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--primary)' }}>
              <UsersRound size={28} />
              <h2 style={{ margin: 0 }}>Kelas {kelas.nama_kelas}</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tingkat: {kelas.tingkat}</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Tahun Ajaran: {kelas.tahun_ajaran}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--secondary)' }}>
              <span style={{ fontWeight: 600 }}>Total Siswa</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{jumlahSiswa}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
