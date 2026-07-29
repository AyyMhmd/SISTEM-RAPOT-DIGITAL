import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, UsersRound, FileEdit, School } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function DashboardGuru() {
  const { user } = useAuth();
  const [jadwal, setJadwal] = useState([]);
  const [stats, setStats] = useState({ totalKelas: 0, totalMapel: 0 });
  const [chartData, setChartData] = useState([]);
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
          mapel:mapel_id(id, nama_mapel, kelompok),
          kelas:kelas_id(id, nama_kelas, tingkat)
        `)
        .eq('guru_id', user.id);

      if (error) throw error;
      setJadwal(data);

      if (data && data.length > 0) {
        // Calculate Stats
        const uniqueClasses = new Set(data.map(d => d.kelas?.id));
        const uniqueMapel = new Set(data.map(d => d.mapel?.id));
        setStats({
          totalKelas: uniqueClasses.size,
          totalMapel: uniqueMapel.size
        });

        // Calculate Chart Data (Beban Mengajar)
        const mapelCount = {};
        data.forEach(d => {
          const mapelName = d.mapel?.nama_mapel || 'Unknown';
          mapelCount[mapelName] = (mapelCount[mapelName] || 0) + 1;
        });

        const chart = Object.keys(mapelCount).map(key => ({
          name: key,
          value: mapelCount[key]
        }));
        setChartData(chart);
      }
    } catch (error) {
      console.error('Error fetching jadwal:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#4F7942', '#D97706', '#1F2937', '#B91C1C', '#047857'];

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Selamat Datang, Guru!</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Berikut adalah statistik dan daftar kelas yang Anda ampu.</p>

      {loading ? (
        <p>Memuat jadwal mengajar...</p>
      ) : jadwal.length === 0 ? (
        <div style={{ padding: '2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--secondary)', textAlign: 'center' }}>
          Belum ada jadwal mengajar yang ditugaskan kepada Anda. Hubungi Tata Usaha.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Top Section: Summary & Chart */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="hover-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '1rem', backgroundColor: 'rgba(79, 121, 66, 0.1)', color: 'var(--primary)', borderRadius: '50%' }}>
                  <School size={28} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>Total Kelas</p>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{stats.totalKelas}</h3>
                </div>
              </div>

              <div className="hover-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '1rem', backgroundColor: 'rgba(217, 119, 6, 0.1)', color: 'var(--accent)', borderRadius: '50%' }}>
                  <BookOpen size={28} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>Total Mata Pelajaran</p>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{stats.totalMapel}</h3>
                </div>
              </div>
            </div>

            {/* Chart Beban Mengajar */}
            <div className="hover-card" style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-main)' }}>Alokasi Mengajar</h3>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--secondary)', color: 'var(--text-main)', borderRadius: 'var(--radius-md)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Bottom Section: Jadwal Mengajar */}
          <div>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Jadwal Mengajar Anda</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {jadwal.map(j => (
                <div key={j.id} className="hover-card" style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderRadius: 'var(--radius-lg)', 
                  border: '1px solid var(--secondary)', 
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                      <BookOpen size={24} />
                      <h3 style={{ margin: 0 }}>{j.mapel?.nama_mapel}</h3>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      <UsersRound size={18} style={{ color: 'var(--text-muted)' }} />
                      <strong>Kelas:</strong> {j.kelas?.nama_kelas} (Tingkat {j.kelas?.tingkat})
                    </div>
                    
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                      Kelompok Mapel: {j.mapel?.kelompok}
                    </div>
                  </div>

                  <Link 
                    to="/guru/nilai" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.5rem', 
                      backgroundColor: 'rgba(79, 121, 66, 0.1)', 
                      color: 'var(--primary)', 
                      padding: '0.75rem', 
                      borderRadius: 'var(--radius-md)', 
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(79, 121, 66, 0.1)';
                      e.currentTarget.style.color = 'var(--primary)';
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                  >
                    <FileEdit size={18} /> Input Nilai
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
