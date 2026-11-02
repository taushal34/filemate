export const SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const MAX_DRIVE_SIZE = 50 * 1024 * 1024;
let credential;
let loading;
let authorizing = false;
let generation = 0;

export function disconnectDrive() { credential = undefined; generation++; }

export function loadGoogle() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    const timer = setTimeout(() => fail(), 15000);
    const fail = () => { clearTimeout(timer); script.remove(); loading = undefined; reject(new Error('Google could not load. Check your connection and try again.')); };
    script.onerror = fail;
    script.onload = () => { clearTimeout(timer); resolve(); };
    document.head.appendChild(script);
  });
  return loading;
}

// Call directly from a click, after loadGoogle, to preserve popup activation.
export function connectDrive(clientId, signal) {
  if (authorizing) return Promise.reject(new Error('A Google consent window is already open.'));
  authorizing = true;
  const version = generation;
  return new Promise((resolve, reject) => {
    let settled = false;
    const abort = () => finish(new Error('Google connection cancelled.'));
    const timer = setTimeout(() => finish(new Error('Google consent timed out. Close the popup and try again.')), 120000);
    const finish = (error, value) => {
      if (settled) return;
      settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
      authorizing = false; error ? reject(error) : resolve(value);
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) { abort(); return; }
    try {
      window.google.accounts.oauth2.initTokenClient({
        client_id: clientId, scope: SCOPE, include_granted_scopes: false, prompt: 'select_account',
        callback: response => {
          if (settled) return;
          if (version !== generation) return finish(new Error('Connection cancelled. Try again.'));
          if (response.error || !response.access_token || !response.scope?.split(' ').includes(SCOPE)) return finish(new Error('Google Drive permission was not granted.'));
          credential = { token: response.access_token, expires: Date.now() + Number(response.expires_in) * 1000 - 60000 };
          finish(null, credential.token);
        },
        error_callback: () => finish(new Error('Google consent was closed or blocked. Allow popups and try again.')),
      }).requestAccessToken();
    } catch (error) { finish(error); }
  });
}

export function driveToken() {
  if (!credential || !(credential.expires > Date.now())) { credential = undefined; return null; }
  return credential.token;
}

export function validateOutput(output) {
  if (!output?.blob?.size) throw new Error('This result is empty. Process the file again.');
  if (output.blob.size > MAX_DRIVE_SIZE) throw new Error('Drive saving supports results up to 50 MB. Download this result instead.');
  const extension = output.name?.split('.').pop().toLowerCase();
  const types = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
  if (!types[extension]) throw new Error('This output format is not supported for Drive saving.');
  if (output.blob.type && output.blob.type !== types[extension]) throw new Error('Output filename and file type do not match. Download the result instead.');
  return types[extension];
}

export function sessionURL(location) {
  const url = new URL(location);
  if (url.origin !== 'https://www.googleapis.com' || url.username || url.password || url.pathname !== '/upload/drive/v3/files') throw new Error('Google returned an unexpected upload address.');
  return url.href;
}

export async function googleJSON(path, token, signal) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, { headers: { Authorization: `Bearer ${token}` }, signal });
  if (!response.ok) throw new Error(response.status === 401 ? 'Google connection expired. Reconnect to Drive.' : `Google Drive request failed (${response.status}). Check permissions, storage and connection.`);
  return response.json();
}

export async function uploadOutput(output, token, attempt, signal, onProgress) {
  const mime = validateOutput(output);
  if (!attempt.id) attempt.id = (await googleJSON('files/generateIds?count=1&space=drive&type=files', token, signal)).ids[0];
  // Reuse the generated ID on retry: an interrupted response cannot create a second file.
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink', {
    method: 'POST', signal,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Upload-Content-Type': mime, 'X-Upload-Content-Length': String(output.blob.size) },
    body: JSON.stringify({ id: attempt.id, name: output.name, mimeType: mime }),
  });
  if (response.status === 409) return googleJSON(`files/${encodeURIComponent(attempt.id)}?fields=id,name,webViewLink`, token, signal);
  if (!response.ok) throw new Error(`Drive could not start saving (${response.status}). Reconnect for expired permission; check storage for quota errors.`);
  const location = response.headers.get('Location');
  if (!location) throw new Error('Browser could not read the Google upload session. Download remains available.');
  const url = sessionURL(location);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const cleanup = () => signal.removeEventListener('abort', abort);
    xhr.open('PUT', url);
    xhr.timeout = 180000;
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', mime);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error('Upload response was unreadable. Retry to check the same file ID.')); }
      } else reject(new Error(`Upload not confirmed (${xhr.status}). Check Drive storage/connection, then retry to check the same file ID.`));
    };
    xhr.onerror = () => { cleanup(); reject(new Error('Connection lost. The file may have saved. Retry checks the same file ID.')); };
    xhr.ontimeout = xhr.onerror;
    xhr.onabort = () => { cleanup(); reject(new Error('Upload cancelled. It may have completed in Drive; retry checks the same file ID.')); };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) { cleanup(); reject(new Error('Upload cancelled.')); return; }
    xhr.send(output.blob);
  });
}
