import React from 'react';

export default function RaporComponent({
  siswa, kelas, tahunAjaran, semester, nilai, raporWali, absensi, kepsek, onPrint, onSendWA
}) {
  const getFase = () => {
    const namaKelas = kelas?.nama_kelas || '';
    if (namaKelas.toUpperCase().startsWith('X ')) return 'E';
    if (namaKelas.toUpperCase().startsWith('XI ') || namaKelas.toUpperCase().startsWith('XII ')) return 'F';
    return '-';
  };

  const renderRowNilai = (mapel, index) => {
    const rataRata = Math.round((mapel.nilai_tugas + mapel.nilai_uts + mapel.nilai_uas) / 3) || 0;
    
    let capaian = '';
    if (mapel.deskripsi_pengetahuan && mapel.deskripsi_pengetahuan !== '-') capaian += mapel.deskripsi_pengetahuan + ' ';
    if (mapel.deskripsi_keterampilan && mapel.deskripsi_keterampilan !== '-') capaian += mapel.deskripsi_keterampilan;
    if (!capaian) capaian = '-';

    return (
      <tr key={mapel.id}>
        <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center', verticalAlign: 'top' }}>{index + 1}</td>
        <td style={{ border: '1px solid black', padding: '0.5rem', verticalAlign: 'top' }}>{mapel.mapel.nama_mapel}</td>
        <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center', verticalAlign: 'top' }}>{rataRata}</td>
        <td style={{ border: '1px solid black', padding: '0.5rem', fontSize: '0.875rem', verticalAlign: 'top' }}>
          {capaian}
        </td>
      </tr>
    );
  };

  const mapelUmum = nilai.filter(n => n.mapel.kelompok === 'Mata Pelajaran Umum');
  const mapelKejuruan = nilai.filter(n => n.mapel.kelompok === 'Mata Pelajaran Kejuruan');
  const mapelC1 = nilai.filter(n => n.mapel.kelompok === 'C1. Dasar Bidang Keahlian');
  const mapelLokal = nilai.filter(n => n.mapel.kelompok === 'Muatan Lokal');

  return (
    <div id="rapor-container" style={{ backgroundColor: 'white', padding: '2rem', color: 'black', fontFamily: 'serif', maxWidth: '900px', margin: '0 auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      {/* Header tombol saat tidak di-print */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
        {onSendWA && (
          <button
            onClick={onSendWA}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            Kirim ke WhatsApp
          </button>
        )}
        <button
          onClick={onPrint}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#1a365d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Cetak PDF (A4)
        </button>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', fontSize: '1rem', border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ width: '150px', padding: '0.2rem 0' }}>Nama Murid</td>
              <td style={{ width: '10px' }}>:</td>
              <td style={{ fontWeight: 'bold' }}>{siswa?.nama_lengkap}</td>

              <td style={{ width: '100px' }}>Kelas</td>
              <td style={{ width: '10px' }}>:</td>
              <td>{kelas?.nama_kelas}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.2rem 0' }}>NIS/NISN</td>
              <td>:</td>
              <td>{siswa?.nis || '-'} / {siswa?.nisn || '-'}</td>

              <td>Fase</td>
              <td>:</td>
              <td>{getFase()}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.2rem 0' }}>Sekolah</td>
              <td>:</td>
              <td>SMKS NANGKALEAH</td>

              <td>Semester</td>
              <td>:</td>
              <td>{semester === 'Ganjil' ? '1' : '2'}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.2rem 0' }}>Alamat</td>
              <td>:</td>
              <td>KP. NANGKALEAH</td>

              <td>Tahun Ajaran</td>
              <td>:</td>
              <td>{tahunAjaran}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>LAPORAN HASIL BELAJAR</h3>
      </div>

      {/* Nilai Mata Pelajaran */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '0.5rem', width: '5%' }}>No</th>
              <th style={{ border: '1px solid black', padding: '0.5rem', width: '25%' }}>Mata Pelajaran</th>
              <th style={{ border: '1px solid black', padding: '0.5rem', width: '10%' }}>Nilai Akhir</th>
              <th style={{ border: '1px solid black', padding: '0.5rem', width: '60%' }}>Capaian Kompetensi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="4" style={{ border: '1px solid black', padding: '0.5rem', fontWeight: 'bold' }}>Mata Pelajaran Umum</td>
            </tr>
            {mapelUmum.map((m, i) => renderRowNilai(m, i))}

            {mapelKejuruan.length > 0 && (
              <>
                <tr>
                  <td colSpan="4" style={{ border: '1px solid black', padding: '0.5rem', fontWeight: 'bold' }}>Mata Pelajaran Kejuruan</td>
                </tr>
                {mapelKejuruan.map((m, i) => renderRowNilai(m, i))}
              </>
            )}

            {mapelC1.length > 0 && (
              <>
                <tr>
                  <td colSpan="4" style={{ border: '1px solid black', padding: '0.5rem', fontWeight: 'bold' }}>C1. Dasar Bidang Keahlian</td>
                </tr>
                {mapelC1.map((m, i) => renderRowNilai(m, i))}
              </>
            )}

            {mapelLokal.length > 0 && (
              <>
                <tr>
                  <td colSpan="4" style={{ border: '1px solid black', padding: '0.5rem', fontWeight: 'bold' }}>Muatan Lokal</td>
                </tr>
                {mapelLokal.map((m, i) => renderRowNilai(m, i))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Kokurikuler */}
      <div style={{ marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>Kokurikuler</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid black', padding: '1rem', fontSize: '0.875rem' }}>
                Pada semester ini, ananda menunjukkan capaian yang baik dalam penguatan profil lulusan, yang ditunjukkan melalui kegiatan kokurikuler.<br/>
                Pada dimensi kreativitas, ananda cakap dalam subdimensi karya, gagasan baru.<br/>
                Pada dimensi kemandirian, ananda cakap dalam subdimensi pengembangan diri, bertanggung jawab.<br/>
                Pada dimensi kolaborasi, ananda cakap dalam subdimensi berbagi.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        {/* Ekstrakurikuler */}
        <div style={{ flex: '1 1 50%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid black', padding: '0.5rem', width: '10%' }}>No</th>
                <th style={{ border: '1px solid black', padding: '0.5rem', width: '60%' }}>Ekstrakurikuler</th>
                <th style={{ border: '1px solid black', padding: '0.5rem', width: '30%' }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>1</td>
                <td style={{ border: '1px solid black', padding: '0.5rem' }}>{raporWali?.ekskul_1_nama || ''}</td>
                <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>{raporWali?.ekskul_1_nilai || ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>2</td>
                <td style={{ border: '1px solid black', padding: '0.5rem' }}>{raporWali?.ekskul_2_nama || ''}</td>
                <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>{raporWali?.ekskul_2_nilai || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Ketidakhadiran & Catatan */}
        <div style={{ flex: '1 1 50%' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            <div style={{ flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', height: '100%' }}>
                <thead>
                  <tr><th colSpan="3" style={{ border: '1px solid black', padding: '0.5rem' }}>Ketidakhadiran</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '0.5rem' }}>Sakit</td>
                    <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center', width: '10px' }}>:</td>
                    <td style={{ border: '1px solid black', padding: '0.5rem' }}>{absensi?.sakit || 0} hari</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '0.5rem' }}>Izin</td>
                    <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>:</td>
                    <td style={{ border: '1px solid black', padding: '0.5rem' }}>{absensi?.izin || 0} hari</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '0.5rem' }}>Tanpa Keterangan</td>
                    <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>:</td>
                    <td style={{ border: '1px solid black', padding: '0.5rem' }}>{absensi?.alpa || 0} hari</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div style={{ flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', height: '100%' }}>
                <thead>
                  <tr><th style={{ border: '1px solid black', padding: '0.5rem' }}>Catatan Wali Kelas</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '0.5rem', verticalAlign: 'top', height: '100%' }}>
                      {raporWali?.catatan || '"Terus tingkatkan belajarmu!"'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Keterangan Kenaikan Kelas */}
      <div style={{ marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid black', padding: '0.5rem', fontWeight: 'bold', textAlign: 'center' }}>
                Keterangan Kenaikan Kelas : Naik ke kelas {kelas?.nama_kelas?.split(' ')[0] === 'X' ? 'XI' : kelas?.nama_kelas?.split(' ')[0] === 'XI' ? 'XII' : 'Lulus'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tanggapan Orang Tua */}
      <div style={{ marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th style={{ border: '1px solid black', padding: '0.5rem' }}>Tanggapan Orang Tua/Wali Murid</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid black', padding: '1rem', height: '80px' }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tanda Tangan */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', padding: '0 2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0 }}>&nbsp;</p>
          <p style={{ margin: '0.5rem 0' }}>Orang Tua Murid</p>
          <br /><br /><br /><br />
          <p style={{ margin: 0 }}>........................................</p>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0 }}>Tasikmalaya, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
          <p style={{ margin: '0.5rem 0' }}>Wali Kelas</p>
          <br /><br /><br /><br />
          <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>{kelas?.users?.nama_lengkap || '............................'}</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <p style={{ margin: 0 }}>Mengetahui,</p>
        <p style={{ margin: '0.5rem 0' }}>Kepala Sekolah</p>
        <br /><br /><br /><br />
        <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>{kepsek || '............................'}</p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: \
        @media print {
          body * {
            visibility: hidden;
          }
          #rapor-container, #rapor-container * {
            visibility: visible;
          }
          #rapor-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      \}} />
    </div>
  );
}

