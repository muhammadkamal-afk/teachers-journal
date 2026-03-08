import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudents, getJournals } from '../services/googleServices';
import { PenSquare, Users, BookOpen, Clock } from 'lucide-react';

export default function Dashboard() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [s, j] = await Promise.all([
          getStudents(accessToken),
          getJournals(accessToken),
        ]);
        setStudents(s);
        setJournals(j);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [accessToken]);

  const recentJournals = [...journals]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const modeLabel = {
    'harian': '📝 Catatan Harian',
    'mom-guru': '👥 MoM Rapat Guru',
    'mom-kepsek': '🏫 MoM Kepsek',
    'sesi-murid': '🗣️ Sesi Murid',
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <p style={{ color: '#64748b' }}>Memuat data...</p>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b' }}>Dashboard</h2>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Selamat datang kembali! 👋</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { icon: <Users size={20} color="#3b82f6" />, label: 'Total Murid', value: students.length, bg: '#eff6ff' },
          { icon: <BookOpen size={20} color="#10b981" />, label: 'Total Jurnal', value: journals.length, bg: '#f0fdf4' },
          { icon: <Clock size={20} color="#f59e0b" />, label: 'Bulan Ini', value: journals.filter(j => new Date(j.created_at).getMonth() === new Date().getMonth()).length, bg: '#fffbeb' },
        ].map((stat, i) => (
          <div key={i} style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{ backgroundColor: stat.bg, width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              {stat.icon}
            </div>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{stat.value}</p>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>Aksi Cepat</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <button onClick={() => navigate('/journal/new')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px',
              backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontSize: '14px', fontWeight: '500',
            }}>
            <PenSquare size={18} /> Tulis Jurnal
          </button>
          <button onClick={() => navigate('/reports')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px',
              backgroundColor: 'white', color: '#1e293b', border: '2px solid #e2e8f0',
              borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
            }}>
            <Users size={18} /> Lihat Murid
          </button>
        </div>
      </div>

      {/* Recent Journals */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>Jurnal Terbaru</h3>
        {recentJournals.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
            Belum ada jurnal. Mulai tulis jurnal pertamamu!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentJournals.map(journal => (
              <div key={journal.journal_id} style={{
                backgroundColor: 'white', borderRadius: '12px', padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#3b82f6' }}>
                    {modeLabel[journal.mode] || journal.mode}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(journal.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#475569', margin: 0, 
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {journal.content}
                </p>
                {journal.students_tagged.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {journal.students_tagged.map(id => {
                      const student = students.find(s => s.student_id === id);
                      return student ? (
                        <span key={id} onClick={() => navigate(`/student/${id}`)}
                          style={{
                            fontSize: '11px', backgroundColor: '#eff6ff', color: '#3b82f6',
                            padding: '2px 8px', borderRadius: '20px', cursor: 'pointer',
                          }}>
                          {student.nickname || student.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}