import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudents, getJournals } from '../services/googleServices';
import { Search as SearchIcon } from 'lucide-react';

const modeLabel = {
  'harian': '📝 Catatan Harian',
  'mom-guru': '👥 MoM Rapat Guru',
  'mom-kepsek': '🏫 MoM Kepsek',
  'sesi-murid': '🗣️ Sesi Murid',
};

export default function Search() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [journals, setJournals] = useState([]);
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState('semua');
  const [filterStudent, setFilterStudent] = useState('semua');
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

  const filtered = journals.filter(j => {
    const matchQuery = query === '' || j.content.toLowerCase().includes(query.toLowerCase());
    const matchMode = filterMode === 'semua' || j.mode === filterMode;
    const matchStudent = filterStudent === 'semua' || j.students_tagged.includes(filterStudent);
    return matchQuery && matchMode && matchStudent;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <p style={{ color: '#64748b' }}>Memuat data...</p>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', marginBottom: '24px' }}>
        Pencarian
      </h2>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <SearchIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Cari isi catatan..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px 12px 42px',
            borderRadius: '10px', border: '2px solid #e2e8f0',
            fontSize: '14px', color: '#1e293b', boxSizing: 'border-box',
          }} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select value={filterMode} onChange={e => setFilterMode(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: '8px', border: '2px solid #e2e8f0',
            fontSize: '13px', color: '#475569', backgroundColor: 'white', cursor: 'pointer',
          }}>
          <option value="semua">Semua Mode</option>
          <option value="harian">📝 Catatan Harian</option>
          <option value="mom-guru">👥 MoM Rapat Guru</option>
          <option value="mom-kepsek">🏫 MoM Kepsek</option>
          <option value="sesi-murid">🗣️ Sesi Murid</option>
        </select>

        <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: '8px', border: '2px solid #e2e8f0',
            fontSize: '13px', color: '#475569', backgroundColor: 'white', cursor: 'pointer',
          }}>
          <option value="semua">Semua Murid</option>
          {students.map(s => (
            <option key={s.student_id} value={s.student_id}>
              {s.nickname || s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
        {filtered.length} catatan ditemukan
      </p>

      {filtered.length === 0 ? (
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', padding: '32px',
          textAlign: 'center', color: '#94a3b8',
        }}>
          Tidak ada catatan yang cocok.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(journal => (
            <div key={journal.journal_id} style={{
              backgroundColor: 'white', borderRadius: '12px', padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#3b82f6' }}>
                  {modeLabel[journal.mode] || journal.mode}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {new Date(journal.date).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>
              <p style={{
                fontSize: '14px', color: '#475569', margin: 0, lineHeight: '1.6',
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
              }}>
                {journal.content}
              </p>
              {journal.students_tagged.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
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
  );
}