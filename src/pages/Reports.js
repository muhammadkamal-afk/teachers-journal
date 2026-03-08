import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudents, getJournals, addStudent } from '../services/googleServices';
import { FileText, Plus, X, Check } from 'lucide-react';

const modeLabel = {
  'harian': '📝 Catatan Harian',
  'mom-guru': '👥 MoM Rapat Guru',
  'mom-kepsek': '🏫 MoM Kepsek',
  'sesi-murid': '🗣️ Sesi Murid',
};

export default function Reports() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [accessToken]);

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

  const handleAddStudent = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const student = {
        student_id: `s_${Date.now()}`,
        name: newName.trim(),
        nickname: newNickname.trim(),
      };
      await addStudent(accessToken, student);
      setNewName('');
      setNewNickname('');
      setShowAddStudent(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Gagal menambah murid.');
    } finally {
      setAdding(false);
    }
  };

  const getStudentJournals = (studentId) => {
    return journals
      .filter(j => j.students_tagged.includes(studentId))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const generateReport = (student) => {
    const sJournals = getStudentJournals(student.student_id);
    if (sJournals.length === 0) return 'Belum ada catatan untuk murid ini.';

    let report = `LAPORAN PERKEMBANGAN MURID\n`;
    report += `================================\n`;
    report += `Nama  : ${student.name}\n`;
    if (student.nickname) report += `Panggilan : ${student.nickname}\n`;
    report += `Total Catatan : ${sJournals.length}\n`;
    report += `Periode : ${new Date(sJournals[0].date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - ${new Date(sJournals[sJournals.length - 1].date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
    report += `================================\n\n`;

    sJournals.forEach(j => {
      report += `📅 ${new Date(j.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
      report += `${modeLabel[j.mode] || j.mode}\n`;
      report += `${j.content}\n`;
      if (j.photo_urls.length > 0) {
        report += `📎 ${j.photo_urls.length} foto terlampir\n`;
      }
      report += `\n`;
    });

    return report;
  };

  const handleCopyReport = (student) => {
    const report = generateReport(student);
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <p style={{ color: '#64748b' }}>Memuat data...</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          Murid & Laporan
        </h2>
        <button onClick={() => setShowAddStudent(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
            backgroundColor: '#3b82f6', color: 'white', border: 'none',
            borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
          }}>
          <Plus size={16} /> Tambah Murid
        </button>
      </div>

      {/* Add Student Modal */}
      {showAddStudent && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', padding: '32px',
            width: '90%', maxWidth: '400px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
                Tambah Murid Baru
              </h3>
              <button onClick={() => setShowAddStudent(false)}
                style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Nama Lengkap *
              </label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '2px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box',
                }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Nama Panggilan
              </label>
              <input value={newNickname} onChange={e => setNewNickname(e.target.value)}
                placeholder="Contoh: Budi"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '2px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box',
                }} />
            </div>
            <button onClick={handleAddStudent} disabled={adding || !newName.trim()}
              style={{
                width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white',
                border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600',
                cursor: 'pointer', opacity: adding || !newName.trim() ? 0.6 : 1,
              }}>
              {adding ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      {/* Student List */}
      {students.length === 0 ? (
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', padding: '48px',
          textAlign: 'center', color: '#94a3b8',
        }}>
          Belum ada murid. Tambahkan murid pertama dulu!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {students.map(student => {
            const count = getStudentJournals(student.student_id).length;
            return (
              <div key={student.student_id} style={{
                backgroundColor: 'white', borderRadius: '12px', padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                      {student.name}
                    </h3>
                    {student.nickname && (
                      <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0' }}>
                        {student.nickname}
                      </p>
                    )}
                  </div>
                  <span style={{
                    fontSize: '12px', backgroundColor: '#eff6ff', color: '#3b82f6',
                    padding: '4px 10px', borderRadius: '20px', fontWeight: '500',
                  }}>
                    {count} catatan
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => navigate(`/student/${student.student_id}`)}
                    style={{
                      flex: 1, padding: '8px', backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '13px', color: '#475569',
                    }}>
                    Lihat Timeline
                  </button>
                  <button onClick={() => handleCopyReport(student)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '6px', padding: '8px', backgroundColor: '#f0fdf4',
                      border: '1px solid #86efac', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '13px', color: '#16a34a',
                    }}>
                    {copied ? <><Check size={14} /> Copied!</> : <><FileText size={14} /> Copy Laporan</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}