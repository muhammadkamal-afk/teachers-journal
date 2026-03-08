import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudents, addJournal, uploadFileToDrive, getOrCreateFolder } from '../services/googleServices';
import { detectStudents, polishMoM, generatePhotoDescription } from '../services/geminiService';
import { Sparkles, Upload, X, Check } from 'lucide-react';

const MODES = [
  { id: 'harian', label: '📝 Catatan Harian' },
  { id: 'mom-guru', label: '👥 MoM Rapat Guru' },
  { id: 'mom-kepsek', label: '🏫 MoM Kepsek' },
  { id: 'sesi-murid', label: '🗣️ Sesi Murid' },
];

export default function NewJournal() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('harian');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [detectedStudents, setDetectedStudents] = useState([]);
  const [confirmedStudents, setConfirmedStudents] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [polishedMoM, setPolishedMoM] = useState('');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getStudents(accessToken).then(setStudents).catch(console.error);
  }, [accessToken]);

  const handleDetectStudents = async () => {
    if (!content.trim()) return;
    setDetecting(true);
    try {
      const ids = await detectStudents(content, students);
      const found = students.filter(s => ids.includes(s.student_id));
      setDetectedStudents(found);
      setConfirmedStudents(found.map(s => s.student_id));
    } catch (err) {
      console.error(err);
    } finally {
      setDetecting(false);
    }
  };

  const handlePolishMoM = async () => {
    if (!content.trim()) return;
    setPolishing(true);
    try {
      const result = await polishMoM(content, mode);
      setPolishedMoM(result);
    } catch (err) {
      console.error(err);
    } finally {
      setPolishing(false);
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const toggleStudent = (id) => {
    setConfirmedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!content.trim()) return alert('Catatan tidak boleh kosong!');
    setLoading(true);
    try {
      // Upload foto ke Drive
      const photoUrls = [];
      if (photos.length > 0) {
        const desc = await generatePhotoDescription(content);
        const rootFolder = await getOrCreateFolder(accessToken, 'Teacher Journal');
        
        let targetFolder;
        if (mode === 'harian' || mode === 'sesi-murid') {
          const muridFolder = await getOrCreateFolder(accessToken, 'Murid', rootFolder);
          if (confirmedStudents.length === 1) {
            const student = students.find(s => s.student_id === confirmedStudents[0]);
            targetFolder = await getOrCreateFolder(accessToken, student?.name || 'Umum', muridFolder);
          } else {
            targetFolder = muridFolder;
          }
        } else if (mode === 'mom-guru' || mode === 'mom-kepsek') {
          targetFolder = await getOrCreateFolder(accessToken, 'MoM', rootFolder);
        } else {
          targetFolder = await getOrCreateFolder(accessToken, 'Kegiatan-Kelas', rootFolder);
        }

        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          const ext = file.name.split('.').pop();
          const num = String(i + 1).padStart(2, '0');
          const tipe = mode === 'harian' ? 'CATATAN' : mode === 'sesi-murid' ? 'SESI' : 'MOM';
          const fileName = `${date}_${tipe}_${desc}_${num}.${ext}`;
          const result = await uploadFileToDrive(accessToken, file, fileName, targetFolder);
          if (result.webViewLink) photoUrls.push(result.webViewLink);
        }
      }

      // Simpan jurnal
      const journal = {
        journal_id: `j_${Date.now()}`,
        date,
        mode,
        content: polishedMoM || content,
        students_tagged: confirmedStudents,
        photo_urls: photoUrls,
      };
      await addJournal(accessToken, journal);
      setSaved(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan jurnal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (saved) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
      <div style={{ width: '64px', height: '64px', backgroundColor: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={32} color="white" />
      </div>
      <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Jurnal berhasil disimpan!</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', marginBottom: '24px' }}>
        Jurnal Baru
      </h2>

      {/* Mode Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '8px' }}>
          Mode Jurnal
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              style={{
                padding: '10px', borderRadius: '8px', border: '2px solid',
                borderColor: mode === m.id ? '#3b82f6' : '#e2e8f0',
                backgroundColor: mode === m.id ? '#eff6ff' : 'white',
                color: mode === m.id ? '#3b82f6' : '#475569',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '8px' }}>
          Tanggal
        </label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '2px solid #e2e8f0', fontSize: '14px', color: '#1e293b',
            boxSizing: 'border-box',
          }} />
      </div>

      {/* Content */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '8px' }}>
          {mode === 'harian' ? 'Catatan' : mode === 'sesi-murid' ? 'Isi Sesi' : 'Catatan Rapat (tulis bebas, AI yang rapikan)'}
        </label>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder={
            mode === 'harian' ? 'Tulis catatan harianmu di sini...' :
            mode === 'sesi-murid' ? 'Ceritakan apa yang terjadi dalam sesi ini...' :
            'Tulis catatan kasar rapat di sini, tidak perlu rapi...'
          }
          rows={6}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: '8px',
            border: '2px solid #e2e8f0', fontSize: '14px', color: '#1e293b',
            resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6',
            boxSizing: 'border-box',
          }} />
      </div>

      {/* AI Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={handleDetectStudents} disabled={detecting || !content.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px',
            color: '#16a34a', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
            opacity: detecting || !content.trim() ? 0.6 : 1,
          }}>
          <Sparkles size={14} />
          {detecting ? 'Mendeteksi...' : 'Deteksi Murid (AI)'}
        </button>

        {(mode === 'mom-guru' || mode === 'mom-kepsek') && (
          <button onClick={handlePolishMoM} disabled={polishing || !content.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              backgroundColor: '#fdf4ff', border: '1px solid #d8b4fe', borderRadius: '8px',
              color: '#9333ea', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              opacity: polishing || !content.trim() ? 0.6 : 1,
            }}>
            <Sparkles size={14} />
            {polishing ? 'Merapikan...' : 'Rapikan MoM (AI)'}
          </button>
        )}
      </div>

      {/* Detected Students */}
      {detectedStudents.length > 0 && (
        <div style={{
          backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px',
          padding: '16px', marginBottom: '20px',
        }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a', marginBottom: '10px' }}>
            🤖 AI mendeteksi murid berikut — konfirmasi:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {detectedStudents.map(s => (
              <button key={s.student_id} onClick={() => toggleStudent(s.student_id)}
                style={{
                  padding: '6px 12px', borderRadius: '20px', border: '2px solid',
                  borderColor: confirmedStudents.includes(s.student_id) ? '#16a34a' : '#e2e8f0',
                  backgroundColor: confirmedStudents.includes(s.student_id) ? '#16a34a' : 'white',
                  color: confirmedStudents.includes(s.student_id) ? 'white' : '#475569',
                  cursor: 'pointer', fontSize: '13px',
                }}>
                {confirmedStudents.includes(s.student_id) ? '✓ ' : ''}{s.nickname || s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Polished MoM */}
      {polishedMoM && (
        <div style={{
          backgroundColor: '#fdf4ff', border: '1px solid #d8b4fe', borderRadius: '10px',
          padding: '16px', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#9333ea', margin: 0 }}>
              ✨ Hasil AI — siap disimpan & dibagikan:
            </p>
            <button onClick={() => navigator.clipboard.writeText(polishedMoM)}
              style={{
                fontSize: '12px', padding: '4px 10px', backgroundColor: '#9333ea',
                color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer',
              }}>
              Copy
            </button>
          </div>
          <pre style={{ fontSize: '13px', color: '#475569', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', lineHeight: '1.6' }}>
            {polishedMoM}
          </pre>
        </div>
      )}

      {/* Photo Upload */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '8px' }}>
          Foto (opsional)
        </label>
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '20px', border: '2px dashed #e2e8f0', borderRadius: '10px',
          cursor: 'pointer', color: '#94a3b8', fontSize: '14px',
          backgroundColor: '#f8fafc',
        }}>
          <Upload size={18} />
          Pilih foto (bisa lebih dari satu)
          <input type="file" accept="image/*" multiple onChange={handlePhotoChange} style={{ display: 'none' }} />
        </label>

        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {photos.map((file, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={URL.createObjectURL(file)} alt={`preview ${i}`}
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                <button onClick={() => removePhoto(i)}
                  style={{
                    position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px',
                    backgroundColor: '#ef4444', border: 'none', borderRadius: '50%',
                    color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                  }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={loading || !content.trim()}
        style={{
          width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white',
          border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600',
          cursor: 'pointer', opacity: loading || !content.trim() ? 0.6 : 1,
        }}>
        {loading ? 'Menyimpan...' : 'Simpan Jurnal'}
      </button>
    </div>
  );
}