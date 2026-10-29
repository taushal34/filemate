import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Fingerprint, Shield, Key } from 'lucide-react';
import { generateUuidV4, hashString, computeMd5, computeHmac } from '../utils/crypto';

interface HashUuidProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const HashUuidGenerator: React.FC<HashUuidProps> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState<'uuid' | 'hash'>('uuid');

  // UUID states
  const [uuidCount, setUuidCount] = useState<number>(5);
  const [uuids, setUuids] = useState<string[]>([]);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [removeHyphens, setRemoveHyphens] = useState<boolean>(false);

  // Hash states
  const [hashInput, setHashInput] = useState<string>('Developer tools suite');
  const [hmacKey, setHmacKey] = useState<string>('');
  const [hashes, setHashes] = useState<{
    md5: string;
    sha1: string;
    sha256: string;
    sha512: string;
    hmacSha256?: string;
  }>({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: '',
  });

  const handleGenerateUuids = () => {
    const list: string[] = [];
    for (let i = 0; i < uuidCount; i++) {
      let u = generateUuidV4();
      if (removeHyphens) u = u.replace(/-/g, '');
      if (uppercase) u = u.toUpperCase();
      list.push(u);
    }
    setUuids(list);
    onNotify(`Generated ${uuidCount} UUIDs`);
  };

  useEffect(() => {
    handleGenerateUuids();
  }, [uuidCount, uppercase, removeHyphens]);

  useEffect(() => {
    async function calculate() {
      if (!hashInput) {
        setHashes({ md5: '', sha1: '', sha256: '', sha512: '' });
        return;
      }
      const md5 = computeMd5(hashInput);
      const sha1 = await hashString(hashInput, 'SHA-1');
      const sha256 = await hashString(hashInput, 'SHA-256');
      const sha512 = await hashString(hashInput, 'SHA-512');
      let hmac: string | undefined;
      if (hmacKey) {
        hmac = await computeHmac(hashInput, hmacKey, 'SHA-256');
      }
      setHashes({ md5, sha1, sha256, sha512, hmacSha256: hmac });
    }
    calculate();
  }, [hashInput, hmacKey]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onNotify(`Copied ${label}`);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-center p-1 bg-zinc-800 rounded-lg">
          <button
            onClick={() => setActiveTab('uuid')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'uuid' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            UUID v4 Generator
          </button>
          <button
            onClick={() => setActiveTab('hash')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'hash' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Cryptographic Hashes
          </button>
        </div>

        {activeTab === 'uuid' && (
          <button
            onClick={handleGenerateUuids}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </button>
        )}
      </div>

      {activeTab === 'uuid' ? (
        /* UUID Generator Tab */
        <div className="flex flex-col gap-4">
          {/* Controls */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">Quantity:</span>
              <div className="flex items-center gap-1">
                {[1, 5, 10, 20].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setUuidCount(cnt)}
                    className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer ${
                      uuidCount === cnt ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={e => setUppercase(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-indigo-600"
                />
                <span>Uppercase</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeHyphens}
                  onChange={e => setRemoveHyphens(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-indigo-600"
                />
                <span>No Hyphens</span>
              </label>
            </div>
          </div>

          {/* List of UUIDs */}
          <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden divide-y divide-zinc-800/60">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Generated UUIDs ({uuids.length})
              </span>
              <button
                onClick={() => handleCopy(uuids.join('\n'), 'All UUIDs')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All</span>
              </button>
            </div>
            {uuids.map((u, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-600 w-6">#{i + 1}</span>
                  <span className="text-xs font-mono text-emerald-400 select-all font-medium">{u}</span>
                </div>
                <button
                  onClick={() => handleCopy(u, 'UUID')}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Copy UUID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Hashes Tab */
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Input Text to Hash</label>
              <textarea
                value={hashInput}
                onChange={e => setHashInput(e.target.value)}
                placeholder="Type text to hash..."
                className="w-full h-20 p-3 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>HMAC Secret Key (optional)</span>
              </label>
              <input
                type="text"
                value={hmacKey}
                onChange={e => setHmacKey(e.target.value)}
                placeholder="Enter secret key for HMAC-SHA256 signature..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Results list */}
          <div className="flex flex-col gap-3">
            {[
              { label: 'MD5 (128-bit)', value: hashes.md5 },
              { label: 'SHA-1 (160-bit)', value: hashes.sha1 },
              { label: 'SHA-256 (256-bit)', value: hashes.sha256 },
              { label: 'SHA-512 (512-bit)', value: hashes.sha512 },
              ...(hashes.hmacSha256 ? [{ label: 'HMAC-SHA256', value: hashes.hmacSha256 }] : []),
            ].map((h, i) => (
              <div
                key={i}
                className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1 overflow-hidden">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{h.label}</span>
                  <span className="font-mono text-xs text-emerald-400 break-all select-all">{h.value || '...'}</span>
                </div>
                <button
                  onClick={() => handleCopy(h.value, h.label)}
                  disabled={!h.value}
                  className="shrink-0 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Copy hash"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
