import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { User, Activity, AlertCircle } from 'lucide-react';

export default function BerandaSiswa() {
  const { user } = useAuth();
  const [siswa, setSiswa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riwayatNilai, setRiwayatNilai] = useState([]);
  const [totalAbsensi, setTotalAbsensi] = useState({ sakit: 0, izin: 0, alpa: 0 });

  useEffect(() => {
    if (user) fetchProfilSiswa();
  }, [user]);

  const fetchProfilSiswa = async () => {
    try {
      const { data, error } = await supabase
        .from('siswa')
        .select('*, kelas(nama_kelas, tingkat, tahun_ajaran)')
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSiswa(data);
        await fetchStatistik(data.id);
      }
    } catch (error) {
      console.error('Error fetching profil siswa:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistik = async (siswaId) => {
    try {
      // Fetch nilai dari seluruh semester
      const { data: nilaiData, error: nilaiError } = await supabase
        .from('nilai')
        .select('*')
        .eq('siswa_id', siswaId);

      if (nilaiError) throw nilaiError;

      // Kelompokkan rata-rata nilai berdasarkan semester
      const semesterGroups = {};
      nilaiData.forEach(n => {
        const key = `${n.tahun_ajaran} - ${n.semester}`;
        if (!semesterGroups[key]) semesterGroups[key] = { total: 0, count: 0 };
        const rataRata = (n.nilai_tugas + n.nilai_uts + n.nilai_uas) / 3;
        semesterGroups[key].total += rataRata;
        semesterGroups[key].count++;
      });

      const chartData = Object.keys(semesterGroups).map(key => ({
        name: key,
        'Rata-rata Nilai': Math.round(semesterGroups[key].total / semesterGroups[key].count)
      })).sort((a, b) => a.name.localeCompare(b.name)); // simple string sort for academic year

      setRiwayatNilai(chartData);

      // Fetch absensi harian secara langsung
      const { data: absensiData, error: absensiError } = await supabase
        .from('absensi')
        .select('status')
        .eq('siswa_id', siswaId);

      if (absensiError) throw absensiError;

      let tSakit = 0, tIzin = 0, tAlpa = 0;
      absensiData.forEach(a => {
        const status = a.status?.toUpperCase();
        if (status === 'SAKIT') tSakit++;
        if (status === 'IZIN') tIzin++;
        if (status === 'ALPA') tAlpa++;
      });

      setTotalAbsensi({ sakit: tSakit, izin: tIzin, alpa: tAlpa });

    } catch (error) {
      console.error('Error fetching statistik:', error);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat dasbor...</div>;

  if (!siswa) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--status-error)' }}>
        <div style={{ padding: '2rem', border: '1px solid var(--status-error)', borderRadius: 'var(--radius-lg)', backgroundColor: '#FEF2F2' }}>
          <AlertCircle size={40} style={{ marginBottom: '1rem' }} />
          <h3>Akun login Anda belum terhubung dengan data Siswa manapun.</h3>
          <p>Silakan hubungi Tata Usaha untuk menautkan akun Anda.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <User size={24} color="var(--primary)" />
        Selamat datang, {siswa.nama_lengkap}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Card Profil */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Informasi Akademik</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ fontWeight: 600 }}>NIS / NISN</span>
            <span>: {siswa.nis || '-'} / {siswa.nisn || '-'}</span>
            <span style={{ fontWeight: 600 }}>Kelas Saat Ini</span>
            <span>: {siswa.kelas?.nama_kelas || '-'}</span>
            <span style={{ fontWeight: 600 }}>Tahun Ajaran</span>
            <span>: {siswa.kelas?.tahun_ajaran || '-'}</span>
          </div>
        </div>

        {/* Card Absensi */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Total Ketidakhadiran</h3>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, backgroundColor: '#FEF9C3', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#A16207' }}>{totalAbsensi.sakit}</div>
              <div style={{ fontSize: '0.75rem', color: '#854D0E', fontWeight: 600 }}>Sakit</div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#DBEAFE', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1D4ED8' }}>{totalAbsensi.izin}</div>
              <div style={{ fontSize: '0.75rem', color: '#1E3A8A', fontWeight: 600 }}>Izin</div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#FEE2E2', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#B91C1C' }}>{totalAbsensi.alpa}</div>
              <div style={{ fontSize: '0.75rem', color: '#991B1B', fontWeight: 600 }}>Alpa</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Perkembangan Nilai */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} color="var(--primary)" />
          Grafik Perkembangan Nilai Rata-rata
        </h3>
        
        {riwayatNilai.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
            Belum ada data riwayat nilai untuk ditampilkan.
          </div>
        ) : (
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riwayatNilai} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Rata-rata Nilai" 
                  stroke="var(--primary)" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
