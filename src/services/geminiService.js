const GEMINI_API_KEY = 'AIzaSyBJZ4bFJYeyCq-fhNaL2yYEh3HIFVaj8jA';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    }),
  });
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Deteksi nama murid dari teks catatan
export async function detectStudents(content, studentList) {
  const names = studentList.map(s => `${s.name} (panggilan: ${s.nickname})`).join(', ');
  const prompt = `Kamu adalah asisten guru. Dari catatan berikut, deteksi nama murid mana saja yang disebutkan.
  
Daftar murid: ${names}

Catatan: "${content}"

Jawab HANYA dengan JSON array berisi student_id yang disebutkan. Contoh: ["id1", "id2"]
Jika tidak ada murid yang disebutkan, jawab: []`;

  const result = await callGemini(prompt);
  try {
    const clean = result.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}

// Rapikan catatan MoM
export async function polishMoM(content, mode) {
  const modeLabel = {
    'mom-guru': 'Rapat Guru',
    'mom-kepsek': 'Rapat dengan Kepala Sekolah',
  }[mode] || 'Rapat';

  const prompt = `Kamu adalah asisten notulis profesional. Rapikan catatan rapat berikut menjadi notulen yang terstruktur dan mudah dibaca.

Jenis rapat: ${modeLabel}
Catatan kasar: "${content}"

Format output:
📋 NOTULEN ${modeLabel.toUpperCase()}
📅 [tanggal hari ini]

*Agenda:* [ringkas agenda]

*Hasil Keputusan:*
- [poin-poin keputusan]

*Tindak Lanjut:*
- [nama] → [tugas] (deadline: [jika ada])

Tulis dalam Bahasa Indonesia yang baik dan profesional.`;

  return await callGemini(prompt);
}

// Generate deskripsi singkat untuk nama file foto
export async function generatePhotoDescription(content) {
  const prompt = `Dari catatan berikut, buat deskripsi singkat maksimal 4 kata dalam bahasa Indonesia untuk nama file foto. Gunakan tanda hubung (-) antar kata, huruf kecil semua, tanpa spasi.

Catatan: "${content}"

Contoh output: konflik-dengan-teman atau kegiatan-literasi-kelas
Jawab HANYA dengan deskripsinya saja, tanpa penjelasan tambahan.`;

  const result = await callGemini(prompt);
  return result.trim().toLowerCase().replace(/\s+/g, '-');
}