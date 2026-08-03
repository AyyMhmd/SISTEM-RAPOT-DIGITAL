import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { UsersRound, Activity, AlertTriangle, BookOpen, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ActivityLogWidget from '../../components/ActivityLogWidget';

export default function DashboardWaliKelas() {
  const { user } = useAuth();
  const [kelasList, setKelasList] = useState([]);
  const [kelasActive, setKelasActive] = useState(null);
  
  const [jumlahSiswa, setJumlahSiswa] = useState(0);
  const [statistik, setStatistik] = useState({ ketidakhadiran: 0, rataRata: 0, remedial: 0 });
  const [loading, setLoading] = useState(true);
  
  const [daftarAbsen, setDaftarAbsen] = useState([]);
  const [daftarRemedial, setDaftarRemedial] = useState([]);
  const [showAbsenModal, setShowAbsenModal] = useState(false);
  const [showRemedialModal, setShowRemedialModal] = useState(false);
  const [chartDataAbsensi, setChartDataAbsensi] = useState([]);
  const [chartDataNilai, setChartDataNilai] = useState([]);

  // Fetch daftar kelas saat user login
  useEffect(() => {
    if (user) fetchKelasList();
  }, [user]);

  // Fetch data detail tiap kali kelasActive berubah
  useEffect(() => {
    if (kelasActive) {
      fetchDataForClass(kelasActive.id);
    }
  }, [kelasActive]);

  const fetchKelasList = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kelas')
        .select('*')
        .eq('wali_kelas_id', user.id)
        .order('nama_kelas');
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setKelasList(data);
        setKelasActive(data[0]);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching kelas list:', error);
      setLoading(false);
    }
  };

  const fetchDataForClass = async (kelasId) => {
    try {
      setLoading(true);
      const { data: siswaData, error: siswaError, count } = await supabase
        .from('siswa')
        .select('id, nama_lengkap', { count: 'exact' })
        .eq('kelas_id', kelasId);
        
      if (siswaError) throw siswaError;
      setJumlahSiswa(count || 0);

      if (siswaData && siswaData.length > 0) {
        const siswaIds = siswaData.map(s => s.id);
        
        // Fetch Absensi bulan ini
        const bulan = new Date().toISOString().slice(0, 7);
        const startDate = `${bulan}-01`;
        const lastDay = new Date(parseInt(bulan.split('-')[0]), parseInt(bulan.split('-')[1]), 0).getDate();
        const endDate = `${bulan}-${lastDay}`;
        
        const { data: absensiData } = await supabase
          .from('absensi')
          .select('siswa_id, status, tanggal')
          .in('siswa_id', siswaIds)
          .gte('tanggal', startDate)
          .lte('tanggal', endDate);
          
        let ketidakhadiran = 0;
        let countSakit = 0, countIzin = 0, countAlpa = 0;
        const listAbsen = [];
        if (absensiData) {
          absensiData.forEach(a => {
            const status = a.status?.toUpperCase();
            if (['SAKIT', 'IZIN', 'ALPA'].includes(status)) {
              ketidakhadiran++;
              if (status === 'SAKIT') countSakit++;
              if (status === 'IZIN') countIzin++;
              if (status === 'ALPA') countAlpa++;
              const siswaInfo = siswaData.find(s => s.id === a.siswa_id);
              listAbsen.push({
                nama: siswaInfo?.nama_lengkap || 'Unknown',
                status: status,
                tanggal: a.tanggal
              });
            }
          });
        }
        setDaftarAbsen(listAbsen);
        setChartDataAbsensi([
          { name: 'Sakit', value: countSakit },
          { name: 'Izin', value: countIzin },
          { name: 'Alpa', value: countAlpa }
        ]);

        // Fetch Nilai
        const { data: nilaiData } = await supabase
          .from('nilai')
          .select('siswa_id, nilai_tugas, nilai_uts, nilai_uas, mapel:mapel_id(kkm, nama_mapel)')
          .in('siswa_id', siswaIds);
          
        let totalNilai = 0;
        let countNilai = 0;
        let remedialCount = 0;
        let sumTugas = 0, sumUts = 0, sumUas = 0;
        const listRemedial = [];

        if (nilaiData) {
          nilaiData.forEach(n => {
            const rataRata = Math.round((n.nilai_tugas + n.nilai_uts + n.nilai_uas) / 3);
            totalNilai += rataRata;
            sumTugas += n.nilai_tugas;
            sumUts += n.nilai_uts;
            sumUas += n.nilai_uas;
            countNilai++;
            
            const kkm = n.mapel?.kkm || 75;
            if (rataRata < kkm) {
              remedialCount++;
              const siswaInfo = siswaData.find(s => s.id === n.siswa_id);
              listRemedial.push({
                nama: siswaInfo?.nama_lengkap || 'Unknown',
                mapel: n.mapel?.nama_mapel || 'Unknown',
                nilai: rataRata,
                kkm: kkm
              });
            }
          });
        }
        setDaftarRemedial(listRemedial);
        
        if (countNilai > 0) {
          setChartDataNilai([
            { name: 'Tugas', 'Rata-rata': Math.round(sumTugas / countNilai) },
            { name: 'UTS', 'Rata-rata': Math.round(sumUts / countNilai) },
            { name: 'UAS', 'Rata-rata': Math.round(sumUas / countNilai) }
          ]);
        }

        setStatistik({
          ketidakhadiran,
          rataRata: countNilai > 0 ? Math.round(totalNilai / countNilai) : 0,
          remedial: remedialCount
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Selamat Datang, Wali Kelas!</h1>
        {kelasList.length > 1 && (
          <select 
            value={kelasActive?.id || ''}
            onChange={(e) => {
              const selected = kelasList.find(k => k.id === e.target.value);
              setKelasActive(selected);
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--primary)',
              backgroundColor: 'rgba(79, 121, 66, 0.1)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {kelasList.map(k => (
              <option key={k.id} value={k.id}>Kelas {k.nama_kelas}</option>
            ))}
          </select>
        )}
      </div>
      
      {loading ? (
        <p>Memuat data kelas...</p>
      ) : !kelasActive ? (
        <div style={{ padding: '2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--status-error)', textAlign: 'center', color: 'var(--status-error)' }}>
          Anda belum ditugaskan sebagai Wali Kelas di kelas mana pun. Silakan hubungi Tata Usaha.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Info Kelas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div className="hover-card" style={{ 
              backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--secondary)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                <UsersRound size={28} />
                <h2 style={{ margin: 0 }}>Kelas {kelasActive.nama_kelas}</h2>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tingkat: {kelasActive.tingkat}</p>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Tahun Ajaran: {kelasActive.tahun_ajaran}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--secondary)' }}>
                <span style={{ fontWeight: 600 }}>Total Siswa</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{jumlahSiswa}</span>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {/* Absensi Card */}
            <div 
              className="hover-card"
              onClick={() => setShowAbsenModal(true)}
              style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: 'var(--shadow-sm)' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
              title="Klik untuk melihat detail ketidakhadiran"
            >
              <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', color: 'var(--status-error)', borderRadius: 'var(--radius-md)' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ketidakhadiran (Bulan Ini)</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{statistik.ketidakhadiran} <span style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>kali</span></h3>
              </div>
            </div>
            
            {/* Remedial Card */}
            <div 
              className="hover-card"
              onClick={() => setShowRemedialModal(true)}
              style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: 'var(--shadow-sm)' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
              title="Klik untuk melihat detail nilai remedial"
            >
              <div style={{ padding: '1rem', backgroundColor: '#FEFCE8', color: 'var(--status-warning)', borderRadius: 'var(--radius-md)' }}>
                <BookOpen size={24} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kasus Remedial (Tugas/Ujian)</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{statistik.remedial} <span style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>nilai</span></h3>
              </div>
            </div>

            {/* Rata-rata Card */}
            <div className="hover-card" style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '1rem', backgroundColor: '#ECFDF5', color: 'var(--status-success)', borderRadius: 'var(--radius-md)' }}>
                <Activity size={24} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rata-rata Kelas</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{statistik.rataRata}</h3>
              </div>
            </div>
          </div>

          {/* Grafik Recharts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            {/* Grafik Absensi */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-main)' }}>Distribusi Ketidakhadiran</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chartDataAbsensi} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      <Cell fill="var(--status-warning)" />
                      <Cell fill="var(--primary)" />
                      <Cell fill="var(--status-error)" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--secondary)', color: 'var(--text-main)', borderRadius: 'var(--radius-md)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grafik Nilai */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-main)' }}>Rata-rata Nilai per Kategori</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={chartDataNilai} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--secondary)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--secondary)', color: 'var(--text-main)', borderRadius: 'var(--radius-md)' }} cursor={{fill: 'var(--secondary)', opacity: 0.4}} />
                    <Bar dataKey="Rata-rata" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Widget Histori Aktivitas */}
      {kelasActive && (
        <ActivityLogWidget roleView="PERSONAL" />
      )}

      {/* Modal Absensi */}
      {showAbsenModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Detail Ketidakhadiran (Bulan Ini)</h2>
              <button onClick={() => setShowAbsenModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}><X size={24} /></button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {daftarAbsen.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Tidak ada data ketidakhadiran bulan ini.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: 'var(--secondary)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--secondary)' }}>Nama Siswa</th>
                      <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--secondary)' }}>Status</th>
                      <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--secondary)' }}>Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daftarAbsen.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid var(--secondary)' }}>
                        <td style={{ padding: '0.75rem' }}>{item.nama}</td>
                        <td style={{ padding: '0.75rem' }}>{item.status}</td>
                        <td style={{ padding: '0.75rem' }}>{item.tanggal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Remedial */}
      {showRemedialModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Detail Siswa Remedial</h2>
              <button onClick={() => setShowRemedialModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}><X size={24} /></button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {daftarRemedial.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Tidak ada siswa yang remedial saat ini.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: 'var(--secondary)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--secondary)' }}>Nama Siswa</th>
                      <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--secondary)' }}>Mata Pelajaran</th>
                      <th style={{ padding: '0.75rem', borderBottom: '2px solid var(--secondary)' }}>Nilai / KKM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daftarRemedial.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid var(--secondary)' }}>
                        <td style={{ padding: '0.75rem' }}>{item.nama}</td>
                        <td style={{ padding: '0.75rem' }}>{item.mapel}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ color: 'var(--status-error)', fontWeight: 600 }}>{item.nilai}</span> / {item.kkm}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
