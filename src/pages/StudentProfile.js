import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudents, getJournals } from '../services/googleServices';
import { ArrowLeft } from 'lucide-react';

const modeLabel = {
  'harian': '📝 Catatan Harian',
  'mom-guru': '👥 MoM Rapat Guru',
  'mom-kepsek': '🏫 MoM Kepsek',
  'sesi-murid': '🗣️ Sesi Murid',
};

const modeColor = {
  'harian': '#eff6ff',
  'mom-guru': '#f0fdf4',
  'mom-kepsek': '#fefce8',
  'sesi-murid': '#fdf4ff',
};

export default function StudentProfile() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [students, allJournals] = await Promise.all([
          getStudents(accessToken),
          getJournals(accessToken),
        ]);
        const found = students.find(s => s.student_id === id);
        const related = allJournals
          .filter(j => j.students_tagged.includes(id))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setStudent(found);
        setJournals(related);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, accessToken]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <p style={{ color: '#64748b' }}>Memuat data...</p>
    </div>
  );

  if (!student) return (
    <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
      Murid tidak ditemukan.
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)}
          style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            {student.name}
          </h2>
          {student.nickname && (
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Panggilan: {student.nickname}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        backgroundColor: 'white', borderRadius: '12px', padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px',
        display: 'flex', gap: '32px',
      }}>
        <div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>{journals.length}</p>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Total Catatan</p>
        </div>
        <div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
            {journals.filter(j => j.mode === 'harian').length}
          </p>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Catatan Harian</p>
        </div>
        <div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>
            {journals.filter(j => j.photo_urls.length > 0).length}
          </p>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Ada Foto</p>
        </div>
      </div>

      {/* Timeline */}
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
        Timeline Catatan
      </h3>

      {journals.length === 0 ? (
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', padding: '32px',
          textAlign: 'center', color: '#94a3b8',
        }}>
          Belum ada catatan untuk murid ini.
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute', left: '16px', top: '8px', bottom: '8px',
            width: '2px', backgroundColor: '#e2e8f0',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {journals.map(journal => (
              <div key={journal.journal_id} style={{ display: 'flex', gap: '16px', paddingLeft: '8px' }}>
                {/* Dot */}
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  backgroundColor: '#3b82f6', border: '3px solid white',
                  boxShadow: '0 0 0 2px #3b82f6', flexShrink: 0, marginTop: '16px',
                }} />

                {/* Card */}
                <div style={{
                  flex: 1, backgroundColor: 'white', borderRadius: '12px', padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  borderLeft: `4px solid ${modeColor[journal.mode] ? '#3b82f6' : '#e2e8f0'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: '600',
                      backgroundColor: modeColor[journal.mode] || '#f8fafc',
                      padding: '2px 10px', borderRadius: '20px', color: '#475569',
                    }}>
                      {modeLabel[journal.mode] || journal.mode}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {new Date(journal.date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: '1.6' }}>
                    {journal.content}
                  </p>
                  {journal.photo_urls.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {journal.photo_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`foto ${i+1}`}
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}