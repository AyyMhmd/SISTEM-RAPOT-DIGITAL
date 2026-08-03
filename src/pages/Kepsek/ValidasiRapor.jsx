import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { CheckCircle, AlertCircle, FileCheck } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ValidasiRapor() {
  const [kelas, setKelas] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [tahunAjaran, setTahunAjaran] = useState('2023/2024');
  const [semester, setSemester] = useState('Ganjil');
  const [raporData, setRaporData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchKelas();
  }, []);

  useEffect(() => {
    if (selectedKelas) {
      fetchRapor();
    } else {
      setRaporData([]);
    }
  }, [selectedKelas, tahunAjaran, semester]);

  const fetchKelas = async () => {
    try {
      const { data, error } = await supabase.from('kelas').select('id, nama_kelas').order('nama_kelas');
      if (error) throw error;
      setKelas(data);
      if (data.length > 0) setSelectedKelas(data[0].id);
    } catch (error) {
      console.error('Error fetching kelas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRapor = async () => {
    try {
      setLoading(true);
      const { data: siswaData, error: siswaError } = await supabase
        .from('siswa')
        .select('id, nama_lengkap, nis')
        .eq('kelas_id', selectedKelas)
        .order('nama_lengkap');

      if (siswaError) throw siswaError;

      const siswaIds = siswaData.map(s => s.id);
      
      let raporMap = {};
      if (siswaIds.length > 0) {
        const { data: raporWaliData, error: raporError } = await supabase
          .from('rapor_wali_kelas')
          .select('id, siswa_id, is_approved_by_kepsek')
          .eq('tahun_ajaran', tahunAjaran)
          .eq('semester', semester)
          .in('siswa_id', siswaIds);

        if (raporError) throw raporError;

        raporWaliData.forEach(r => {
          raporMap[r.siswa_id] = r;
        });
      }

      const combined = siswaData.map(s => ({
        ...s,
        rapor_id: raporMap[s.id]?.id || null,
        is_approved: raporMap[s.id]?.is_approved_by_kepsek || false,
        has_rapor: !!raporMap[s.id]
      }));

      setRaporData(combined);
    } catch (error) {
      console.error('Error fetching rapor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (raporId, currentStatus) => {
    if (!raporId) return;
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('rapor_wali_kelas')
        .update({ is_approved_by_kepsek: !currentStatus })
        .eq('id', raporId);

      if (error) throw error;
      fetchRapor();
    } catch (error) {
      console.error('Error approving rapor:', error);
      Swal.fire('Error!', 'Gagal mengubah status approval.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveAll = async () => {
    const unapproved = raporData.filter(r => r.has_rapor && !r.is_approved).map(r => r.rapor_id);
    if (unapproved.length === 0) {
      Swal.fire('Info', 'Semua rapor yang tersedia sudah di-approve.', 'info');
      return;
    }

    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Yakin ingin menyetujui ${unapproved.length} rapor sekaligus?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtoncolor: 'var(--text-primary)',
      cancelButtonColor: 'var(--secondary)',
      confirmButtonText: 'Ya, setujui semua!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('rapor_wali_kelas')
        .update({ is_approved_by_kepsek: true })
        .in('id', unapproved);

      if (error) throw error;
      Swal.fire('Berhasil!', 'Semua rapor berhasil disetujui.', 'success');
      fetchRapor();
    } catch (error) {
      console.error('Error approving all:', error);
      Swal.fire('Error!', 'Gagal menyetujui massal.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <FileCheck size={24} color="var(--text-primary)" />
        Validasi & Tanda Tangan Rapor
      </h1>

      <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Pilih Kelas</label>
          <select 
            value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
          >
            {kelas.map(k => (
              <option key={k.id} value={k.id}>{k.nama_kelas}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Tahun Ajaran</label>
          <select 
            value={tahunAjaran} onChange={(e) => setTahunAjaran(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
          >
            <option value="2023/2024">2023/2024</option>
            <option value="2024/2025">2024/2025</option>
          </select>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Semester</label>
          <select 
            value={semester} onChange={(e) => setSemester(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
          >
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Daftar Siswa</h3>
        <button
          onClick={handleApproveAll}
          disabled={actionLoading || raporData.length === 0}
          style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <CheckCircle size={18} /> Approve Semua
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead style={{ backgroundColor: 'var(--secondary)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600 }}>NIS</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Nama Siswa</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center' }}>Status Rapor</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center' }}>Validasi Kepsek</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center', width: '150px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</td></tr>
            ) : raporData.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Belum ada siswa di kelas ini.</td></tr>
            ) : (
              raporData.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--secondary)' }}>
                  <td style={{ padding: '1rem' }}>{s.nis}</td>
                  <td style={{ padding: '1rem' }}>{s.nama_lengkap}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {s.has_rapor ? (
                      <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#DBEAFE', color: '#1D4ED8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        Siap Validasi
                      </span>
                    ) : (
                      <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        Belum Diisi Wali
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {s.is_approved ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--status-success)', fontWeight: 600, fontSize: '0.875rem' }}>
                        <CheckCircle size={16} /> Approved
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        <AlertCircle size={16} /> Menunggu
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleApprove(s.rapor_id, s.is_approved)}
                      disabled={!s.has_rapor || actionLoading}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: !s.has_rapor ? '#e2e8f0' : (s.is_approved ? '#f87171' : 'var(--primary)'),
                        color: !s.has_rapor ? '#94a3b8' : 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !s.has_rapor ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      {s.is_approved ? 'Batalkan' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
