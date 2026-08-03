import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Clock, Info, X } from 'lucide-react';

/**
 * ActivityLogWidget Component
 * 
 * @param {string} roleView - Aturan visibilitas: 
 *   'ALL' = Tampilkan semua (Untuk Kepsek), 
 *   'TU' = Tampilkan semua aktivitas role TU,
 *   'PERSONAL' = Tampilkan HANYA aktivitas milik user yang sedang login (Untuk Wakel & Mapel).
 */
export default function ActivityLogWidget({ roleView }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
    
    // Opsional: Set interval untuk refresh log setiap 30 detik
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [roleView]);

  const fetchLogs = async () => {
    try {
      // Dapatkan info user yang sedang login
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('log_aktivitas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20); // Batasi 20 aktivitas terakhir

      // Aturan Filter
      if (roleView === 'TU') {
        query = query.eq('role', 'TU');
      } else if (roleView === 'PERSONAL') {
        query = query.eq('user_id', user.id);
      }
      // Jika 'ALL', tidak perlu filter tambahan

      const { data, error } = await query;
      if (error) throw error;
      
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear();
    
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    if (isToday) {
      return `Hari ini, ${date.toLocaleTimeString('id-ID', timeOptions)}`;
    }
    
    const dateOptions = { day: 'numeric', month: 'short' };
    return `${date.toLocaleDateString('id-ID', dateOptions)}, ${date.toLocaleTimeString('id-ID', timeOptions)}`;
  };

  const getActionColor = (aksi) => {
    const a = aksi.toUpperCase();
    if (a.includes('TAMBAH') || a.includes('IMPORT')) return '#10b981'; // Green
    if (a.includes('HAPUS')) return '#ef4444'; // Red
    if (a.includes('EDIT') || a.includes('UBAH')) return '#f59e0b'; // Orange
    if (a.includes('LOGIN')) return '#3b82f6'; // Blue
    return 'var(--text-muted)';
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)', 
      borderRadius: 'var(--radius-lg)', 
      border: '1px solid var(--secondary)',
      padding: '1.5rem',
      marginTop: '2rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Clock size={20} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Histori Aktivitas Terakhir</h3>
      </div>
      
      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Memuat histori...</p>
      ) : logs.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada histori aktivitas.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {logs.map((log) => (
            <div 
              key={log.id} 
              onClick={() => setSelectedLog(log)}
              style={{
                display: 'flex', 
                flexDirection: 'column',
                padding: '0.75rem',
                backgroundColor: 'rgba(26,54,93,0.02)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(26,54,93,0.05)',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(26,54,93,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(26,54,93,0.02)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {log.nama_pengguna}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatDate(log.created_at)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 600, 
                  backgroundColor: getActionColor(log.aksi) + '20', 
                  color: getActionColor(log.aksi),
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px'
                }}>
                  {log.aksi}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.keterangan}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail Histori */}
      {selectedLog && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div style={{ 
            backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', 
            width: '100%', maxWidth: '400px', position: 'relative'
          }}>
            <button 
              onClick={() => setSelectedLog(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
              <Info size={24} />
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Detail Aktivitas</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PENGGUNA</div>
                <div style={{ color: 'var(--text-main)' }}>{selectedLog.nama_pengguna} ({selectedLog.role})</div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>WAKTU</div>
                <div style={{ color: 'var(--text-main)' }}>{new Date(selectedLog.created_at).toLocaleString('id-ID')}</div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>AKSI</div>
                <div>
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 600, 
                    backgroundColor: getActionColor(selectedLog.aksi) + '20', 
                    color: getActionColor(selectedLog.aksi),
                    padding: '0.2rem 0.5rem', borderRadius: '4px'
                  }}>
                    {selectedLog.aksi}
                  </span>
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>KETERANGAN</div>
                <div style={{ color: 'var(--text-main)', lineHeight: '1.4' }}>{selectedLog.keterangan}</div>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
