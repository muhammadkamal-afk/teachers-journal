const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

// ========== STUDENTS ==========

export async function getStudents() {
  const response = await fetch(`${APPS_SCRIPT_URL}?action=getStudents`);
  return await response.json();
}

export async function addStudent(student) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'addStudent', ...student }),
  });
  return await response.json();
}

// ========== JOURNAL ==========

export async function getJournals() {
  const response = await fetch(`${APPS_SCRIPT_URL}?action=getJournals`);
  return await response.json();
}

export async function addJournal(journal) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'addJournal', ...journal }),
  });
  return await response.json();
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
  const trashed = 'trashed=false';
  const mime = "mimeType='application/vnd.google-apps.folder'";
  const name = `name='${folderName}'`;
  const parent = parentId ? ` and '${parentId}' in parents` : '';
  const query = `${name} and ${mime} and ${trashed}${parent}`;

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await response.json();

  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  const createResponse = await fetch(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : [],
      }),
    }
  );
  const folder = await createResponse.json();
  return folder.id;
}