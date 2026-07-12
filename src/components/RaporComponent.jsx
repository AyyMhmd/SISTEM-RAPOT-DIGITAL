import React from 'react';

export default function RaporComponent({
  siswa, kelas, tahunAjaran, semester, nilai, raporWali, absensi, onPrint, onSendWA
}) {
  const renderRowNilai = (mapel, index) => {
    const rataRata = Math.round((mapel.nilai_tugas + mapel.nilai_uts + mapel.nilai_uas) / 3) || 0;
    const predikat = rataRata >= 90 ? 'A' : rataRata >= 80 ? 'B' : rataRata >= 70 ? 'C' : 'D';

    return (
      <tr key={mapel.id}>
        <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>{index + 1}</td>
        <td style={{ border: '1px solid black', padding: '0.5rem' }}>{mapel.mapel.nama_mapel}</td>
        <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>{mapel.mapel.kkm}</td>
        <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>{rataRata}</td>
        <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>{predikat}</td>
        <td style={{ border: '1px solid black', padding: '0.5rem', fontSize: '0.875rem' }}>
          Pengetahuan: {mapel.deskripsi_pengetahuan}<br />
          Keterampilan: {mapel.deskripsi_keterampilan}
        </td>
      </tr>
    );
  };

  const mapelA = nilai.filter(n => n.mapel.kelompok === 'A');
  const mapelB = nilai.filter(n => n.mapel.kelompok === 'B');
  const mapelC = nilai.filter(n => n.mapel.kelompok === 'C');
  const mapelLokal = nilai.filter(n => n.mapel.kelompok === 'Muatan Lokal');

  return (
    <div id="rapor-container" style={{ backgroundColor: 'white', padding: '2rem', color: 'black', fontFamily: 'serif', maxWidth: '800px', margin: '0 auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      {/* Header-header tombol saat tidak di-print */}
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

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>LAPORAN HASIL BELAJAR</h2>
        <h3 style={{ margin: '0.5rem 0 0 0' }}>(RAPOR)</h3>
      </div>

      <table style={{ width: '100%', marginBottom: '2rem', fontSize: '0.875rem' }}>
        <tbody>
          <tr>
            <td style={{ width: '150px', padding: '0.25rem 0' }}>Nama Peserta Didik</td>
            <td style={{ width: '10px' }}>:</td>
            <td style={{ fontWeight: 'bold' }}>{siswa?.nama_lengkap}</td>

            <td style={{ width: '100px' }}>Kelas</td>
            <td style={{ width: '10px' }}>:</td>
            <td>{kelas?.nama_kelas}</td>
          </tr>
          <tr>
            <td style={{ padding: '0.25rem 0' }}>NISN / NIS</td>
            <td>:</td>
            <td>{siswa?.nisn || '-'} / {siswa?.nis || '-'}</td>

            <td>Semester</td>
            <td>:</td>
            <td>{semester}</td>
          </tr>
          <tr>
            <td style={{ padding: '0.25rem 0' }}>Sekolah</td>
            <td>:</td>
            <td>SMK NANGKALEAH</td>

            <td>Tahun Ajaran</td>
            <td>:</td>
            <td>{tahunAjaran}</td>
          </tr>
        </tbody>
      </table>

      {/* Sikap */}
      <h4 style={{ marginBottom: '0.5rem' }}>A. Sikap</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid black', padding: '0.5rem', width: '30%', fontWeight: 'bold' }}>Sikap Spiritual</td>
            <td style={{ border: '1px solid black', padding: '0.5rem' }}>{raporWali?.sikap_spiritual || '-'}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid black', padding: '0.5rem', fontWeight: 'bold' }}>Sikap Sosial</td>
            <td style={{ border: '1px solid black', padding: '0.5rem' }}>{raporWali?.sikap_sosial || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Nilai Pengetahuan & Keterampilan */}
      <h4 style={{ marginBottom: '0.5rem' }}>B. Pengetahuan dan Keterampilan</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
        <thead style={{ backgroundColor: '#f3f4f6' }}>
          <tr>
            <th style={{ border: '1px solid black', padding: '0.5rem', width: '5%' }}>No</th>
            <th style={{ border: '1px solid black', padding: '0.5rem', width: '30%' }}>Mata Pelajaran</th>
            <th style={{ border: '1px solid black', padding: '0.5rem', width: '10%' }}>KKM</th>
            <th style={{ border: '1px solid black', padding: '0.5rem', width: '10%' }}>Nilai</th>
            <th style={{ border: '1px solid black', padding: '0.5rem', width: '10%' }}>Predikat</th>
            <th style={{ border: '1px solid black', padding: '0.5rem', width: '35%' }}>Deskripsi</th>
          </tr>
        </thead>
        <tbody>
          {mapelA.length > 0 && (
            <>
              <tr><td colSpan="6" style={{ border: '1px solid black', padding: '0.5rem', fontWeight: 'bold', backgroundColor: '#f9fafb' }}>Kelompok A (Nasional)</td></tr>
              {mapelA.map((m, i) => renderRowNilai(m, i))}
            </>
          )}
          {mapelB.length > 0 && (
            <>
              <tr><td colSpan="6" style={{ border: '1px solid black', padding: '0.5rem', fontWeight: 'bold', backgroundColor: '#f9fafb' }}>Kelompok B (Kewilayahan)</td></tr>
              {mapelB.map((m, i) => renderRowNilai(m, i))}
            </>
          )}
          {mapelC.length > 0 && (
            <>
              <tr><td colSpan="6" style={{ border: '1px solid black', padding: '0.5rem', fontWeight: 'bold', backgroundColor: '#f9fafb' }}>Kelompok C (Kejuruan)</td></tr>
              {mapelC.map((m, i) => renderRowNilai(m, i))}
            </>
          )}
          {mapelLokal.length > 0 && (
            <>
              <tr><td colSpan="6" style={{ border: '1px solid black', padding: '0.5rem', fontWeight: 'bold', backgroundColor: '#f9fafb' }}>Muatan Lokal</td></tr>
              {mapelLokal.map((m, i) => renderRowNilai(m, i))}
            </>
          )}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Ekstrakurikuler */}
        <div style={{ flex: 1 }}>
          <h4 style={{ marginBottom: '0.5rem' }}>C. Ekstrakurikuler</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <thead style={{ backgroundColor: '#f3f4f6' }}>
              <tr>
                <th style={{ border: '1px solid black', padding: '0.5rem', width: '10%' }}>No</th>
                <th style={{ border: '1px solid black', padding: '0.5rem', width: '70%' }}>Kegiatan Ekstrakurikuler</th>
                <th style={{ border: '1px solid black', padding: '0.5rem', width: '20%' }}>Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>1</td>
                <td style={{ border: '1px solid black', padding: '0.5rem' }}>{raporWali?.ekskul_1_nama || '-'}</td>
                <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>{raporWali?.ekskul_1_nilai || '-'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>2</td>
                <td style={{ border: '1px solid black', padding: '0.5rem' }}>{raporWali?.ekskul_2_nama || '-'}</td>
                <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>{raporWali?.ekskul_2_nilai || '-'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>3</td>
                <td style={{ border: '1px solid black', padding: '0.5rem' }}>{raporWali?.ekskul_3_nama || '-'}</td>
                <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>{raporWali?.ekskul_3_nilai || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Ketidakhadiran */}
        <div style={{ flex: 1 }}>
          <h4 style={{ marginBottom: '0.5rem' }}>D. Ketidakhadiran</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid black', padding: '0.5rem', width: '70%' }}>Sakit</td>
                <td style={{ border: '1px solid black', padding: '0.5rem', width: '30%', textAlign: 'center' }}>{absensi?.sakit || 0} hari</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '0.5rem' }}>Izin</td>
                <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>{absensi?.izin || 0} hari</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '0.5rem' }}>Tanpa Keterangan (Alpa)</td>
                <td style={{ border: '1px solid black', padding: '0.5rem', textAlign: 'center' }}>{absensi?.alpa || 0} hari</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Catatan Wali Kelas */}
      <h4 style={{ marginBottom: '0.5rem' }}>E. Catatan Wali Kelas</h4>
      <div style={{ border: '1px solid black', padding: '1rem', minHeight: '80px', marginBottom: '3rem' }}>
        {raporWali?.catatan || '-'}
      </div>

      {/* Tanda Tangan */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Mengetahui,</p>
          <p>Orang Tua / Wali</p>
          <br /><br /><br />
          <p>(................................................)</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p>................., ...........................</p>
          <p>Wali Kelas</p>
          <br /><br /><br />
          <p><strong>{kelas?.users?.nama_lengkap}</strong></p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
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
        }
      `}} />
    </div>
  );
}
