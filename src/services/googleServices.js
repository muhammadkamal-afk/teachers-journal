const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID;

// ========== STUDENTS ==========

export async function getStudents(accessToken) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Students!A:D`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await response.json();
  const rows = data.values || [];
  if (rows.length <= 1) return [];
  return rows.slice(1).map(row => ({
    student_id: row[0],
    name: row[1],
    nickname: row[2],
    created_at: row[3],
  }));
}

export async function addStudent(accessToken, student) {
  const row = [student.student_id, student.name, student.nickname, new Date().toISOString()];
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Students!A:D:append?valueInputOption=RAW`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
}

// ========== JOURNAL ==========

export async function getJournals(accessToken) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Journal!A:G`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await response.json();
  const rows = data.values || [];
  if (rows.length <= 1) return [];
  return rows.slice(1).map(row => ({
    journal_id: row[0],
    date: row[1],
    mode: row[2],
    content: row[3],
    students_tagged: row[4] ? row[4].split(',') : [],
    photo_urls: row[5] ? row[5].split(',') : [],
    created_at: row[6],
  }));
}

export async function addJournal(accessToken, journal) {
  const row = [
    journal.journal_id,
    journal.date,
    journal.mode,
    journal.content,
    journal.students_tagged.join(','),
    journal.photo_urls.join(','),
    new Date().toISOString(),
  ];
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Journal!A:G:append?valueInputOption=RAW`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
}

// ========== DRIVE UPLOAD ==========

export async function uploadFileToDrive(accessToken, file, fileName, folderId) {
  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : [],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );
  return await response.json();
}

export async function getOrCreateFolder(accessToken, folderName, parentId) {
  // Cek apakah folder sudah ada
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentId ? ` and '${parentId}' in parents` : ''}`;
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encode