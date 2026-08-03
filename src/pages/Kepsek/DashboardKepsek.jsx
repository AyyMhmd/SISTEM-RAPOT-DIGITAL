import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { UsersRound, School, Users, Activity, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import ActivityLogWidget from '../../components/ActivityLogWidget';

export default function DashboardKepsek() {
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalKelas: 0,
    totalGuru: 0
  });
  
  const [chartData, setChartData] = useState([]);
  const [daftarWali, setDaftarWali] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch total siswa
      const { count: countSiswa } = await supabase.from('siswa').select('*', { count: 'exact', head: true });
      
      // 2. Fetch total kelas
      const { count: countKelas } = await supabase.from('kelas').select('*', { count: 'exact', head: true });
      
      // 3. Fetch total guru (GURU_MAPEL & WALI_KELAS)
      const { count: countGuru } = await supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['GURU_MAPEL', 'WALI_KELAS']);
      
      setStats({
        totalSiswa: countSiswa || 0,
        totalKelas: countKelas || 0,
        totalGuru: countGuru || 0
      });

      // 4. Fetch daftar kelas dan wali kelasnya
      const { data: kelasData } = await supabase
        .from('kelas')
        .select(`
          id, nama_kelas, tahun_ajaran, 
          wali_kelas:users!wali_kelas_id(nama_lengkap)
        `)
        .order('nama_kelas');
      
      setDaftarWali(kelasData || []);

      // 5. Fetch rata-rata nilai per kelas untuk chart
      // Ambil nilai join siswa join kelas
      const { data: nilaiData } = await supabase
        .from('nilai')
        .select(`
          nilai_tugas, nilai_uts, nilai_uas,
          siswa:siswa_id (
            kelas_id,
            kelas:kelas_id (nama_kelas)
          )
        `);

      if (nilaiData) {
        const kelasGroups = {};
        
        nilaiData.forEach(n => {
          if (!n.siswa || !n.siswa.kelas) return;
          const namaKelas = n.siswa.kelas.nama_kelas;
          
          if (!kelasGroups[namaKelas]) {
            kelasGroups[namaKelas] = { total: 0, count: 0 };
          }
          
          const rataRata = (n.nilai_tugas + n.nilai_uts + n.nilai_uas) / 3;
          kelasGroups[namaKelas].total += rataRata;
          kelasGroups[namaKelas].count++;
        });

        const finalChart = Object.keys(kelasGroups).map(k => ({
          name: k,
          'Rata-rata Kelas': Math.round(kelasGroups[k].total / kelasGroups[k].count)
        })).sort((a, b) => a.name.localeCompare(b.name));

        setChartData(finalChart);
      }

    } catch (error) {
      console.error('Error fetching kepsek dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (chartData.length === 0) {
      Swal.fire('Info', 'Belum ada data untuk diekspor!', 'info');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(chartData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RataRataKelas");
    XLSX.writeFile(workbook, "Laporan_Rata_Rata_Kelas.xlsx");
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat dasbor...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={24} color="var(--text-primary)" />
          Dasbor Eksekutif
        </h1>
        <button 
          onClick={exportToExcel}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Download size={18} />
          Ekspor Excel
        </button>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ backgroundColor: '#DBEAFE', padding: '1rem', borderRadius: '50%' }}>
            <UsersRound size={28} color="#1D4ED8" />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Total Siswa</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalSiswa}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ backgroundColor: '#FEF9C3', padding: '1rem', borderRadius: '50%' }}>
            <School size={28} color="#A16207" />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Total Kelas Aktif</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalKelas}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ backgroundColor: '#FEE2E2', padding: '1rem', borderRadius: '50%' }}>
            <Users size={28} color="#B91C1C" />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Total Tenaga Pendidik</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalGuru}</div>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Grafik Performa */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem' }}>Perbandingan Rata-rata Nilai Antarkelas</h3>
          {chartData.length === 0 ? (
             <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data nilai.</div>
          ) : (
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickMargin={10} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    cursor={{fill: 'rgba(26,54,93,0.05)'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                  />
                  <Legend />
                  <Bar dataKey="Rata-rata Kelas" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tabel Wali Kelas */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)', overflowX: 'auto' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem' }}>Daftar Wali Kelas</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '350px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--secondary)' }}>
                <th style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Kelas</th>
                <th style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Wali Kelas</th>
                <th style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>T.A</th>
              </tr>
            </thead>
            <tbody>
              {daftarWali.length === 0 ? (
                <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center' }}>Belum ada kelas.</td></tr>
              ) : (
                daftarWali.map((k) => (
                  <tr key={k.id} style={{ borderBottom: '1px solid var(--secondary)' }}>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{k.nama_kelas}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>{k.wali_kelas?.nama_lengkap || <span style={{ color: 'var(--status-error)' }}>Belum ditugaskan</span>}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{k.tahun_ajaran}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      <ActivityLogWidget roleView="ALL" />

    </div>
  );
}
