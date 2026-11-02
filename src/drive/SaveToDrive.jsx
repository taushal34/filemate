import { useEffect, useRef, useState } from 'react';
import { connectDrive, disconnectDrive, driveToken, googleJSON, loadGoogle, uploadOutput, validateOutput } from './client';

const clientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID;
let uploading = false;
export function isDriveUploading() { return uploading; }

export default function SaveToDrive({ output }) {
  const [state, setState] = useState({ message: '', ready: false, account: '', busy: false, progress: 0, saved: false });
  const controller = useRef(null);
  const attempt = useRef({});
  const locked = useRef(false);
  const alive = useRef(true);
  const update = value => { if (alive.current) setState(s => ({ ...s, ...value })); };
  useEffect(() => {
    alive.current = true;
    const warn = e => { if (locked.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => { alive.current = false; controller.current?.abort(); window.removeEventListener('beforeunload', warn); };
  }, []);

  async function act() {
    if (locked.current) return;
    locked.current = true;
    controller.current = new AbortController();
    let ownsUpload = false;
    update({ busy: true, message: '' });
    try {
      validateOutput(output);
      if (!clientId) throw new Error('Drive saving needs its Google client configuration. Download is available now.');
      if (!state.ready) { await loadGoogle(); update({ ready: true, message: 'Google is ready. Click Connect to Drive to choose your account.' }); return; }
      let token = driveToken();
      if (!token || !state.account) {
        token = await connectDrive(clientId, controller.current.signal);
        const result = await googleJSON('about?fields=user(displayName,emailAddress)', token, controller.current.signal);
        update({ account: result.user.emailAddress || result.user.displayName, message: 'Connected. Saving sends this processed file directly to your chosen Google Drive, in My Drive. No public sharing.' });
        return;
      }
      if (uploading) throw new Error('Another file is saving. Wait for it to finish.');
      uploading = true; ownsUpload = true;
      update({ message: 'Saving to Google Drive…', progress: 0 });
      const result = await uploadOutput(output, token, attempt.current, controller.current.signal, progress => update({ progress }));
      if (!result.id) throw new Error('Drive did not confirm a file ID. Retry checks the same file ID.');
      update({ saved: true, link: `https://drive.google.com/file/d/${encodeURIComponent(result.id)}/view`, message: 'Saved to My Drive. Download is still available.' });
    } catch (error) { update({ message: error.message }); }
    finally { if (ownsUpload) uploading = false; locked.current = false; update({ busy: false }); }
  }
  return <div className="w-full text-xs text-mute">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={act} disabled={state.busy || state.saved} className="rounded-full border border-line px-4 py-2 text-fg disabled:opacity-60">
        {state.saved ? 'Saved to Drive' : state.busy ? `Working… ${state.progress}%` : state.account && driveToken() ? 'Save to Google Drive' : state.ready ? 'Connect to Drive' : 'Save to Google Drive'}
      </button>
      {state.busy && <button type="button" onClick={() => { disconnectDrive(); controller.current?.abort(); }} className="underline px-3 py-2">Cancel</button>}
      {state.account && !state.busy && <button type="button" className="underline px-3 py-2" onClick={() => { disconnectDrive(); update({ account: '', saved: false, message: 'Disconnected on this page. Google permissions can be removed in your Google Account.' }); }}>Disconnect</button>}
      {state.saved && state.link && <a href={state.link} target="_blank" rel="noopener noreferrer" className="underline px-3 py-2">Open in Drive</a>}
    </div>
    {state.account && <p className="mt-2 break-all">Drive account: {state.account}</p>}
    <p role="status" className="mt-2 break-words">{state.message || 'Optional: explicitly connect Google Drive to save a copy online. Download works without Google.'}</p>
  </div>;
}
