import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Edit2, UploadCloud } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { useAuth } from '../../contexts/AuthContext';
import { catatLog } from '../../utils/auditLogger';

export default function DataSiswa() {
  const { user } = useAuth();
  const [siswa, setSiswa] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [usersSiswa, setUsersSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [isKenaikanModalOpen, setIsKenaikanModalOpen] = useState(false);
  const [kenaikanSourceKelas, setKenaikanSourceKelas] = useState('');
  const [kenaikanTargetKelas, setKenaikanTargetKelas] = useState('');
  const [kenaikanLoading, setKenaikanLoading] = useState(false);

  const [filterKelas, setFilterKelas] = useState('');
  
  const [formData, setFormData] = useState({
    nisn: '',
    nis: '',
    nama_lengkap: '',
    jenis_kelamin: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    agama: '',
    alamat: '',
    nama_ayah: '',
    nama_ibu: '',
    kelas_id: '',
    no_hp_ortu: '',
    user_id: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [siswaRes, kelasRes, usersRes] = await Promise.all([
        supabase.from('siswa').select(`*, kelas(nama_kelas)`).order('nama_lengkap'),
        supabase.from('kelas').select('id, nama_kelas').order('nama_kelas'),
        supabase.from('users').select('id, nama_lengkap, email').eq('role', 'SISWA')
      ]);
      
      if (siswaRes.error) throw siswaRes.error;
      if (kelasRes.error) throw kelasRes.error;
      if (usersRes.error) throw usersRes.error;
      
      setSiswa(siswaRes.data);
      setKelas(kelasRes.data);
      setUsersSiswa(usersRes.data);
      
      if (kelasRes.data.length > 0) {
        setFormData(prev => ({ ...prev, kelas_id: kelasRes.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (s = null) => {
    if (s) {
      setFormData({
        nisn: s.nisn || '',
        nis: s.nis || '',
        nama_lengkap: s.nama_lengkap || '',
        jenis_kelamin: s.jenis_kelamin || 'L',
        tempat_lahir: s.tempat_lahir || '',
        tanggal_lahir: s.tanggal_lahir || '',
        agama: s.agama || '',
        alamat: s.alamat || '',
        nama_ayah: s.nama_ayah || '',
        nama_ibu: s.nama_ibu || '',
        kelas_id: s.kelas_id || (kelas.length > 0 ? kelas[0].id : ''),
        no_hp_ortu: s.no_hp_ortu || '',
        user_id: s.user_id || ''
      });
      setEditingId(s.id);
    } else {
      setFormData({
        nisn: '', nis: '', nama_lengkap: '', jenis_kelamin: 'L',
        tempat_lahir: '', tanggal_lahir: '', agama: '', alamat: '',
        nama_ayah: '', nama_ibu: '',
        kelas_id: kelas.length > 0 ? kelas[0].id : '',
        no_hp_ortu: '',
        user_id: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const payload = { ...formData };
      if (!payload.kelas_id) payload.kelas_id = null; // handle empty kelas_id
      if (!payload.tanggal_lahir) payload.tanggal_lahir = null;
      if (!payload.user_id) payload.user_id = null;

      if (editingId) {
        const { error } = await supabase.from('siswa').update(payload).eq('id', editingId);
        if (error) throw error;
        await catatLog(user.id, user.nama_lengkap, user.role, 'EDIT', `Mengubah data siswa: ${payload.nama_lengkap} (NISN: ${payload.nisn})`);
      } else {
        const { error } = await supabase.from('siswa').insert([payload]);
        if (error) throw error;
        await catatLog(user.id, user.nama_lengkap, user.role, 'TAMBAH', `Menambahkan siswa baru: ${payload.nama_lengkap} (NISN: ${payload.nisn})`);
      }

      setIsModalOpen(false);
      Swal.fire('Berhasil!', 'Data siswa berhasil disimpan.', 'success');
      fetchData();
    } catch (error) {
      console.error('Error saving siswa:', error);
      Swal.fire('Error!', 'Gagal menyimpan data siswa: ' + error.message, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Yakin ingin menghapus siswa ini?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--status-error)',
      cancelButtonColor: 'var(--secondary)',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      const siswaToDelete = siswa.find(s => s.id === id);
      const { error } = await supabase.from('siswa').delete().eq('id', id);
      if (error) throw error;
      
      await catatLog(user.id, user.nama_lengkap, user.role, 'HAPUS', `Menghapus data siswa: ${siswaToDelete?.nama_lengkap || 'Unknown'}`);
      
      Swal.fire('Terhapus!', 'Siswa berhasil dihapus.', 'success');
      fetchData();
    } catch (error) {
      console.error('Error deleting siswa:', error);
      Swal.fire('Error!', 'Gagal menghapus siswa.', 'error');
    }
  };

  const handleKenaikanMassal = async (e) => {
    e.preventDefault();
    if (kenaikanSourceKelas === kenaikanTargetKelas) {
      Swal.fire('Error!', 'Kelas asal dan kelas tujuan tidak boleh sama.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Semua siswa di kelas asal akan dipindahkan ke kelas tujuan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--primary)',
      cancelButtonColor: 'var(--status-error)', // Mengubah warna tombol Batal menjadi merah
      confirmButtonText: 'Ya, Pindahkan!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    setKenaikanLoading(true);
    try {
      const { error } = await supabase
        .from('siswa')
        .update({ kelas_id: kenaikanTargetKelas })
        .eq('kelas_id', kenaikanSourceKelas);

      if (error) throw error;

      const sourceName = kelas.find(k => k.id === kenaikanSourceKelas)?.nama_kelas || 'Unknown';
      const targetName = kelas.find(k => k.id === kenaikanTargetKelas)?.nama_kelas || 'Unknown';
      await catatLog(user.id, user.nama_lengkap, user.role, 'UBAH KELAS MASSAL', `Memindahkan semua siswa dari Kelas ${sourceName} ke Kelas ${targetName}`);

      Swal.fire('Berhasil!', 'Siswa berhasil dipindahkan ke kelas baru.', 'success');
      setIsKenaikanModalOpen(false);
      setKenaikanSourceKelas('');
      setKenaikanTargetKelas('');
      fetchData();
    } catch (error) {
      console.error('Error pindah kelas:', error);
      Swal.fire('Error!', 'Gagal memindahkan siswa.', 'error');
    } finally {
      setKenaikanLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Minta user memilih kelas tujuan terlebih dahulu
    if (kelas.length === 0) {
      Swal.fire('Error', 'Belum ada data kelas. Silakan tambahkan kelas terlebih dahulu.', 'error');
      return;
    }

    const kelasOptions = {};
    kelas.forEach(k => {
      kelasOptions[k.id] = k.nama_kelas;
    });

    const { value: selectedKelasId } = await Swal.fire({
      title: 'Pilih Kelas Tujuan',
      text: 'Siswa dari file Excel ini akan dimasukkan ke kelas mana?',
      input: 'select',
      inputOptions: kelasOptions,
      inputPlaceholder: 'Pilih Kelas...',
      showCancelButton: true,
      inputValidator: (value) => {
        return new Promise((resolve) => {
          if (value) resolve();
          else resolve('Anda harus memilih kelas tujuan!');
        });
      }
    });

    if (!selectedKelasId) {
      e.target.value = null; // Reset input
      return;
    }

    // 2. Baca file Excel
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          Swal.fire('Error', 'File Excel kosong!', 'error');
          return;
        }

        Swal.fire({
          title: 'Memproses Import...',
          html: 'Mohon tunggu, jangan tutup halaman ini.<br/>Sistem sedang membuatkan akun login & menyimpan data.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        let successCount = 0;
        let failCount = 0;

        for (const row of data) {
          const nisn = row['NISN']?.toString() || row['nisn']?.toString() || '';
          if (!nisn) {
            failCount++;
            continue; // Skip jika tidak ada NISN
          }

          const nis = row['NIS']?.toString() || row['nis']?.toString() || '';
          const nama = row['Nama Lengkap'] || row['nama'] || row['NAMA'] || 'Siswa Tanpa Nama';
          const lp = row['L/P'] || row['JK'] || row['Jenis Kelamin'] || 'L';
          const jk = lp.toUpperCase().startsWith('P') ? 'P' : 'L';
          const tempatLahir = row['Tempat Lahir'] || '';
          const agama = row['Agama'] || '';
          const alamat = row['Alamat'] || '';
          const namaAyah = row['Nama Ayah'] || '';
          const namaIbu = row['Nama Ibu'] || '';
          
          let tanggalLahir = null;
          // Excel date to JS Date if it's a number
          if (row['Tanggal Lahir'] && !isNaN(row['Tanggal Lahir'])) {
            const excelDate = row['Tanggal Lahir'];
            const jsDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
            tanggalLahir = jsDate.toISOString().split('T')[0];
          } else if (typeof row['Tanggal Lahir'] === 'string') {
            // Coba parsing standar
            tanggalLahir = row['Tanggal Lahir']; 
          }

          // Generate Email & Password Default
          const email = `${nisn}@smknangkaleah.sch.id`.toLowerCase();
          const password = `Siswa123!`;

          try {
            // 1. Buat User Auth (jika email sudah ada, mungkin akan error, kita tangkap)
            const { data: userRes, error: userErr } = await supabase.rpc('create_user_by_tu', {
              new_email: email,
              new_password: password,
              new_nama_lengkap: nama,
              new_role: 'SISWA'
            });

            let newUserId = null;
            if (userErr) {
              console.warn(`Gagal buat user untuk ${nama}:`, userErr.message);
              // Lanjut tanpa user_id jika gagal, atau bisa juga dicari user yang sudah ada
            } else {
              // RPC mengembalikan array UUID, userRes[0] adalah ID
              newUserId = userRes && userRes.length > 0 ? userRes[0] : null;
            }

            // 2. Simpan Data Siswa
            const payload = {
              nisn,
              nis,
              nama_lengkap: nama,
              jenis_kelamin: jk,
              kelas_id: selectedKelasId,
              tempat_lahir: tempatLahir,
              tanggal_lahir: tanggalLahir,
              agama,
              alamat,
              nama_ayah: namaAyah,
              nama_ibu: namaIbu,
              user_id: newUserId
            };

            const { error: insertErr } = await supabase.from('siswa').insert([payload]);
            if (insertErr) {
              // Jika konflik (NISN sudah ada), abaikan atau catat
              failCount++;
            } else {
              successCount++;
            }
            
          } catch (err) {
            failCount++;
          }
        } // End loop

        const kelasTujuanName = kelas.find(k => k.id === selectedKelasId)?.nama_kelas || 'Unknown';
        await catatLog(user.id, user.nama_lengkap, user.role, 'IMPORT EXCEL', `Mengimpor ${successCount} data siswa ke Kelas ${kelasTujuanName}`);

        fetchData();
        Swal.fire(
          'Import Selesai!',
          `Berhasil: ${successCount} siswa.<br/>Gagal/Dilewati: ${failCount} siswa (NISN duplikat atau kosong).`,
          'success'
        );

      } catch (err) {
        console.error("Parse error", err);
        Swal.fire('Error', 'Gagal memproses file Excel. Pastikan formatnya benar.', 'error');
      } finally {
        e.target.value = null; // Reset
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Kelola Data Siswa</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select 
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
          >
            <option value="">Semua Kelas</option>
            {kelas.map(k => (
              <option key={k.id} value={k.id}>{k.nama_kelas}</option>
            ))}
          </select>
          <button 
            onClick={() => setIsKenaikanModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: '#3b82f6', color: 'white',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', fontWeight: 600
            }}
          >
            Pindah Kelas Massal
          </button>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: '#10b981', color: 'white',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', fontWeight: 600
            }}
          >
            <UploadCloud size={18} /> Import Excel
          </button>
          <button 
            onClick={() => handleOpenModal()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: 'var(--primary)', color: 'white',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer', fontWeight: 600
            }}
          >
            <Plus size={18} /> Tambah Siswa
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--secondary)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead style={{ backgroundColor: 'var(--secondary)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600 }}>NISN / NIS</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Nama Lengkap</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>L/P</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Kelas</th>
              <th style={{ padding: '1rem', fontWeight: 600, width: '120px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Memuat data...</td></tr>
            ) : siswa.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Belum ada data siswa.</td></tr>
            ) : (
              (filterKelas ? siswa.filter(s => s.kelas_id === filterKelas) : siswa).map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--secondary)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{s.nisn || '-'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.nis || '-'}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{s.nama_lengkap}</td>
                  <td style={{ padding: '1rem' }}>{s.jenis_kelamin}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', backgroundColor: 'rgba(26,54,93,0.1)', color: 'var(--text-primary)',
                      borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600
                    }}>
                      {s.kelas?.nama_kelas || 'Belum ada kelas'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleOpenModal(s)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.5rem' }}
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer', padding: '0.5rem' }}
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{ 
            backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', 
            width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>{editingId ? 'Edit Siswa' : 'Tambah Siswa Baru'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>NISN</label>
                <input 
                  type="text" value={formData.nisn} onChange={(e) => setFormData({...formData, nisn: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>NIS</label>
                <input 
                  type="text" value={formData.nis} onChange={(e) => setFormData({...formData, nis: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Nama Lengkap *</label>
                <input 
                  type="text" required value={formData.nama_lengkap} onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Jenis Kelamin</label>
                <select 
                  value={formData.jenis_kelamin} onChange={(e) => setFormData({...formData, jenis_kelamin: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Kelas</label>
                <select 
                  value={formData.kelas_id} onChange={(e) => setFormData({...formData, kelas_id: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Tempat Lahir</label>
                <input 
                  type="text" value={formData.tempat_lahir} onChange={(e) => setFormData({...formData, tempat_lahir: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Tanggal Lahir</label>
                <input 
                  type="date" value={formData.tanggal_lahir} onChange={(e) => setFormData({...formData, tanggal_lahir: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Agama</label>
                <input 
                  type="text" placeholder="Islam / Kristen / dll" value={formData.agama} onChange={(e) => setFormData({...formData, agama: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Alamat Lengkap</label>
                <textarea 
                  rows="2" value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Nama Ayah</label>
                <input 
                  type="text" value={formData.nama_ayah} onChange={(e) => setFormData({...formData, nama_ayah: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Nama Ibu</label>
                <input 
                  type="text" value={formData.nama_ibu} onChange={(e) => setFormData({...formData, nama_ibu: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>No HP Ortu/Wali (Cth: 628...)</label>
                <input 
                  type="text" placeholder="62812345678" value={formData.no_hp_ortu} onChange={(e) => setFormData({...formData, no_hp_ortu: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', padding: '1rem', backgroundColor: 'rgba(26,54,93,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(26,54,93,0.1)' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Tautkan Akun Login Siswa (Opsional)</label>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pilih akun yang didaftarkan di halaman Data Pengguna agar siswa ini bisa login melihat rapornya.</p>
                <select 
                  value={formData.user_id} onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                >
                  <option value="">-- Tidak Ditautkan --</option>
                  {usersSiswa.map(u => (
                    <option key={u.id} value={u.id}>{u.nama_lengkap} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.75rem 1.5rem', border: '1px solid var(--secondary)', backgroundColor: 'transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" disabled={submitLoading}
                  style={{ padding: '0.75rem 1.5rem', border: 'none', backgroundColor: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-sm)', cursor: submitLoading ? 'not-allowed' : 'pointer' }}
                >
                  {submitLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kenaikan Kelas Massal */}
      {isKenaikanModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{ 
            backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', 
            width: '100%', maxWidth: '500px'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Pindah Kelas Massal (Kenaikan Kelas)</h2>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Fitur ini akan memindahkan <strong>semua</strong> siswa dari kelas asal ke kelas tujuan secara bersamaan.
            </p>
            
            <form onSubmit={handleKenaikanMassal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Dari Kelas (Asal)</label>
                <select 
                  required
                  value={kenaikanSourceKelas} onChange={(e) => setKenaikanSourceKelas(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                >
                  <option value="">-- Pilih Kelas Asal --</option>
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Ke Kelas (Tujuan)</label>
                <select 
                  required
                  value={kenaikanTargetKelas} onChange={(e) => setKenaikanTargetKelas(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary)' }}
                >
                  <option value="">-- Pilih Kelas Tujuan --</option>
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" onClick={() => setIsKenaikanModalOpen(false)}
                  style={{ padding: '0.75rem 1.5rem', border: '1px solid var(--secondary)', backgroundColor: '#FF0000', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" disabled={kenaikanLoading}
                  style={{ padding: '0.75rem 1.5rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', borderRadius: 'var(--radius-sm)', cursor: kenaikanLoading ? 'not-allowed' : 'pointer' }}
                >
                  {kenaikanLoading ? 'Memproses...' : 'Pindahkan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
