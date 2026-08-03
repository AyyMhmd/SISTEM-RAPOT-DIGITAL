import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Users, UsersRound, BookOpen, UserPlus, UserCog, CalendarDays, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { downloadDatabaseBackup } from '../../utils/BackupDatabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ActivityLogWidget from '../../components/ActivityLogWidget';

export default function DashboardTU() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ siswa: 0, pengguna: 0, kelas: 0 });
  const [chartDataSiswa, setChartDataSiswa] = useState([]);
  const [chartDataPengguna, setChartDataPengguna] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [siswaRes, penggunaRes, kelasRes, siswaDetails, userDetails] = await Promise.all([
        supabase.from('siswa').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('kelas').select('id', { count: 'exact', head: true }),
        supabase.from('siswa').select('kelas:kelas_id(nama_kelas)'),
        supabase.from('users').select('role')
      ]);

      setStats({
        siswa: siswaRes.count || 0,
        pengguna: penggunaRes.count || 0,
        kelas: kelasRes.count || 0
      });

      // Proses Data Distribusi Siswa
      if (siswaDetails.data) {
        const classCount = {};
        siswaDetails.data.forEach(s => {
          const className = s.kelas?.nama_kelas || 'Tanpa Kelas';
          classCount[className] = (classCount[className] || 0) + 1;
        });
        const chartSiswa = Object.keys(classCount).map(key => ({
          name: key,
          Siswa: classCount[key]
        }));
        setChartDataSiswa(chartSiswa);
      }

      // Proses Data Komposisi Pengguna
      if (userDetails.data) {
        const roleCount = {};
        userDetails.data.forEach(u => {
          const roleName = u.role || 'Unknown';
          roleCount[roleName] = (roleCount[roleName] || 0) + 1;
        });
        const chartPengguna = Object.keys(roleCount).map(key => ({
          name: key,
          value: roleCount[key]
        }));
        setChartDataPengguna(chartPengguna);
      }

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
    backgroundColor: 'rgba(79, 121, 66, 0.1)',
    color: 'var(--text-primary)',
    padding: '1rem',
    borderRadius: '50%'
  };
  
  const COLORS = ['#F13E93', '#D97706', '#162E93', '#B91C1C', '#047857'];

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Beranda Tata Usaha</h1>
      
      {loading ? (
        <p>Memuat statistik...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="hover-card" style={statCardStyle}>
              <div style={iconContainerStyle}>
                <UsersRound size={28} />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>Total Siswa</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{stats.siswa}</h3>
              </div>
            </div>

            <div className="hover-card" style={statCardStyle}>
              <div style={iconContainerStyle}>
                <Users size={28} />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>Total Pengguna</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{stats.pengguna}</h3>
              </div>
            </div>

            <div className="hover-card" style={statCardStyle}>
              <div style={iconContainerStyle}>
                <BookOpen size={28} />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>Total Kelas</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{stats.kelas}</h3>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Aksi Cepat</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/tu/siswa" className="hover-card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
                <UserPlus size={20} /> Tambah Siswa
              </Link>
              <Link to="/tu/pengguna" className="hover-card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--primary)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
                <UserCog size={20} /> Kelola Pengguna
              </Link>
              <Link to="/tu/jadwal" className="hover-card" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--primary)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
                <CalendarDays size={20} /> Atur Jadwal
              </Link>
              <button 
                onClick={() => downloadDatabaseBackup(user)}
                className="hover-card" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#334155', color: 'white', border: 'none', cursor: 'pointer', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600 }}
              >
                <Download size={20} /> Unduh Backup Database
              </button>
            </div>
          </div>

          {/* Grafik Recharts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            
            {/* Grafik Distribusi Siswa */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-main)' }}>Distribusi Siswa per Kelas</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={chartDataSiswa} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--secondary)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--secondary)', color: 'var(--text-main)', borderRadius: 'var(--radius-md)' }} cursor={{fill: 'var(--secondary)', opacity: 0.4}} />
                    <Bar dataKey="Siswa" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grafik Komposisi Pengguna */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-main)' }}>Komposisi Pengguna</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chartDataPengguna} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                      {chartDataPengguna.map((entry, index) => (
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

          {/* Widget Histori Aktivitas */}
          <ActivityLogWidget roleView="TU" />

        </div>
      )}
    </div>
  );
}
