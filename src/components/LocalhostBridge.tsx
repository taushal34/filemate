import React, { useState } from 'react';
import { ExternalLink, Radio, CheckCircle2, AlertTriangle, Copy, Terminal, Upload, FileCode } from 'lucide-react';

interface LocalhostBridgeProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const LocalhostBridge: React.FC<LocalhostBridgeProps> = ({ onNotify }) => {
  const [pingStatus, setPingStatus] = useState<'idle' | 'checking' | 'reachable' | 'unreachable'>('idle');
  const [pingError, setPingError] = useState<string | null>(null);
  const [pastedCode, setPastedCode] = useState<string>('');
  const [fileName, setFileName] = useState<string>('LocalComponent.tsx');

  const checkLocalhost = async () => {
    setPingStatus('checking');
    setPingError(null);
    try {
      // Test fetching from the browser's perspective
      await fetch('http://localhost:5175', { mode: 'no-cors' });
      setPingStatus('reachable');
      onNotify('Detected local server running on port 5175!');
    } catch (err: any) {
      setPingStatus('unreachable');
      setPingError(
        'Unable to reach http://localhost:5175 from browser. Ensure your local dev server is running (`npm run dev -- --port 5175`).'
      );
      onNotify('Localhost 5175 unreachable', 'error');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    onNotify('Copied URL to clipboard');
  };

  const cloudUrl = window.location.origin + window.location.pathname + '#tools';

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Localhost (Port 5175) & Cloud Sync Guide</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Understanding localhost:5175 and connecting your local project with Google AI Studio
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Cloud Instance Card */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                Cloud Development URL
              </span>
              <p className="text-xs font-mono text-zinc-200 mt-1 break-all select-all">
                {cloudUrl}
              </p>
              <p className="text-[11px] text-zinc-500 mt-2">
                This Google Cloud Run environment is hosted globally and accessible from any browser or device.
              </p>
            </div>
            <button
              onClick={() => handleCopyUrl(cloudUrl)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Cloud Preview URL</span>
            </button>
          </div>

          {/* Localhost 5175 Status Card */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Target Local URL
              </span>
              <p className="text-xs font-mono text-emerald-400 mt-1">
                http://localhost:5175/#tools
              </p>
              <p className="text-[11px] text-zinc-500 mt-2">
                `localhost:5175` is located on your physical computer. The cloud container cannot connect into your local machine directly.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={checkLocalhost}
                disabled={pingStatus === 'checking'}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
              >
                <span>{pingStatus === 'checking' ? 'Testing connection...' : 'Test Localhost 5175'}</span>
              </button>
            </div>
          </div>
        </div>

        {pingStatus === 'reachable' && (
          <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Success: Your browser can reach port 5175 on your computer!</span>
          </div>
        )}

        {pingStatus === 'unreachable' && (
          <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{pingError}</span>
          </div>
        )}
      </div>

      {/* Code Importer Section */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>Import Code from your Local Project</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Paste code from your local machine (from your localhost:5175 project) to inspect or integrate it
            </p>
          </div>
          <input
            type="text"
            value={fileName}
            onChange={e => setFileName(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-200 w-48 focus:outline-none"
            placeholder="Filename..."
          />
        </div>

        <textarea
          value={pastedCode}
          onChange={e => setPastedCode(e.target.value)}
          placeholder="// Paste source code from your local project here (e.g. package.json, App.tsx, or components)..."
          className="w-full h-48 p-4 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
          spellCheck={false}
        />

        {pastedCode && (
          <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-400 font-mono">
            <span>{pastedCode.split('\n').length} lines · {pastedCode.length} characters</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(pastedCode);
                onNotify(`Copied ${fileName} contents`);
              }}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-sans"
            >
              Copy Code
            </button>
          </div>
        )}
      </div>

      {/* How to tunnel or sync section */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col gap-3 text-xs text-zinc-300">
        <h4 className="font-semibold text-zinc-100 text-sm">Three Ways to Sync Your Local Project:</h4>
        <ol className="list-decimal list-inside space-y-2 text-zinc-400">
          <li>
            <strong className="text-zinc-200">Share Code in Chat:</strong> You can paste your files or prompt instructions directly in this chat, and we will build or update the project here in real time.
          </li>
          <li>
            <strong className="text-zinc-200">Use Cloud URL as Primary:</strong> Instead of running `localhost:5175`, use the Google AI Studio cloud URL above to test and view `#tools` from any browser tab.
          </li>
          <li>
            <strong className="text-zinc-200">Public Tunnel (ngrok / Cloudflare):</strong> If you need your local dev server publicly exposed, run <code className="bg-zinc-800 text-emerald-400 px-1 py-0.5 rounded font-mono">npx ngrok http 5175</code> or Cloudflare Tunnel to generate an accessible HTTPS URL.
          </li>
        </ol>
      </div>
    </div>
  );
};
