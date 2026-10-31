import React, { useState, useMemo } from 'react';
import { Copy, ShieldCheck, ShieldAlert, KeyRound, Clock } from 'lucide-react';
import { parseJwt } from '../utils/jwt';

interface JwtInspectorProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggTW9yZ2FuIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5OTk5OTk5OTl9.4zC9b1d12eZ...';

export const JwtInspector: React.FC<JwtInspectorProps> = ({ onNotify }) => {
  const [token, setToken] = useState<string>(SAMPLE_JWT);

  const decoded = useMemo(() => {
    return parseJwt(token);
  }, [token]);

  const handleCopy = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    onNotify('Copied claims to clipboard');
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Input Field */}
      <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Encoded JWT String</span>
          </div>
          <button
            onClick={() => setToken(SAMPLE_JWT)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          >
            Load Sample
          </button>
        </div>
        <textarea
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Paste JWT token (header.payload.signature)..."
          className="w-full h-24 p-3 bg-transparent font-mono text-xs text-amber-300 placeholder-zinc-600 focus:outline-none resize-none break-all"
          spellCheck={false}
        />
      </div>

      {/* Validation status badge */}
      {decoded.success && decoded.data && (
        <div className="flex items-center justify-between p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2.5 text-xs">
            {decoded.data.isExpired ? (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span className={decoded.data.isExpired ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
              {decoded.data.isExpired ? 'Token Expired' : 'Token Active (Not Expired)'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
            {decoded.data.expiresAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Exp: {new Date(decoded.data.expiresAt).toLocaleString()}</span>
              </span>
            )}
            {decoded.data.issuedAt && (
              <span>Iat: {new Date(decoded.data.issuedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {!decoded.success && (
        <div className="p-4 bg-rose-950/30 border border-rose-900/60 rounded-xl text-xs font-mono text-rose-300">
          {decoded.error}
        </div>
      )}

      {/* Header and Payload sections */}
      {decoded.success && decoded.data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Header */}
          <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Header (Algorithm & Type)</span>
              <button
                onClick={() => handleCopy(decoded.data?.header)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-4 bg-zinc-950 font-mono text-xs text-rose-300 overflow-auto h-64 leading-relaxed">
              {JSON.stringify(decoded.data.header, null, 2)}
            </pre>
          </div>

          {/* Payload */}
          <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Payload (Claims)</span>
              <button
                onClick={() => handleCopy(decoded.data?.payload)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-4 bg-zinc-950 font-mono text-xs text-purple-300 overflow-auto h-64 leading-relaxed">
              {JSON.stringify(decoded.data.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
