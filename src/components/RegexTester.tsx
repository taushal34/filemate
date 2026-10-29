import React, { useState, useMemo } from 'react';
import { Copy, Sparkles, BookOpen, Check } from 'lucide-react';

interface RegexTesterProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const COMMON_PATTERNS = [
  { name: 'Email Address', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'g' },
  { name: 'URL (HTTP/HTTPS)', pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)', flags: 'g' },
  { name: 'IPv4 Address', pattern: '\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}\\b', flags: 'g' },
  { name: 'ISO Date (YYYY-MM-DD)', pattern: '\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b', flags: 'g' },
  { name: 'Hex Color (#fff / #ffffff)', pattern: '#(?:[a-fA-F0-9]{3}){1,2}\\b', flags: 'g' },
];

const DEFAULT_SAMPLE_TEXT = `Welcome to the test workbench!
Contact support at help@devpulse.io or direct queries to team-alpha@google.com.
Visit https://github.com/facebook/react or https://developer.mozilla.org.
Server IP: 192.168.1.1 or gateway at 10.0.0.254.
Created on 2026-10-27 with accent color #38bdf8 and secondary #10b981.`;

export const RegexTester: React.FC<RegexTesterProps> = ({ onNotify }) => {
  const [pattern, setPattern] = useState<string>('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
  const [flags, setFlags] = useState<{ g: boolean; i: boolean; m: boolean; s: boolean }>({
    g: true,
    i: false,
    m: false,
    s: false,
  });
  const [testText, setTestText] = useState<string>(DEFAULT_SAMPLE_TEXT);

  const flagString = useMemo(() => {
    let s = '';
    if (flags.g) s += 'g';
    if (flags.i) s += 'i';
    if (flags.m) s += 'm';
    if (flags.s) s += 's';
    return s;
  }, [flags]);

  const { matches, error } = useMemo(() => {
    if (!pattern) return { matches: [], error: null };
    try {
      const regex = new RegExp(pattern, flagString);
      const list: Array<{ match: string; index: number; groups: string[] }> = [];

      if (flags.g) {
        let m: RegExpExecArray | null;
        let guard = 0;
        while ((m = regex.exec(testText)) !== null && guard < 500) {
          list.push({
            match: m[0],
            index: m.index,
            groups: m.slice(1),
          });
          if (m.index === regex.lastIndex) {
            regex.lastIndex++;
          }
          guard++;
        }
      } else {
        const m = regex.exec(testText);
        if (m) {
          list.push({
            match: m[0],
            index: m.index,
            groups: m.slice(1),
          });
        }
      }

      return { matches: list, error: null };
    } catch (err: any) {
      return { matches: [], error: err.message };
    }
  }, [pattern, flagString, testText, flags.g]);

  const handleCopyMatches = () => {
    const text = matches.map(m => m.match).join('\n');
    navigator.clipboard.writeText(text);
    onNotify(`Copied ${matches.length} matches to clipboard`);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Pattern Input and Flags */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-zinc-500 text-lg">/</span>
          <input
            type="text"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="Regular expression pattern..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
          />
          <span className="font-mono text-zinc-500 text-lg">/</span>

          {/* Flags toggles */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-800 rounded-lg">
            {(['g', 'i', 'm', 's'] as const).map(flag => (
              <button
                key={flag}
                onClick={() => setFlags(prev => ({ ...prev, [flag]: !prev[flag] }))}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer ${
                  flags[flag] ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title={`Flag: ${flag}`}
              >
                {flag}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-xs text-rose-400 font-mono">
            Syntax Error: {error}
          </div>
        )}

        {/* Common preset chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/60">
          <span className="text-xs text-zinc-500">Presets:</span>
          {COMMON_PATTERNS.map(cp => (
            <button
              key={cp.name}
              onClick={() => {
                setPattern(cp.pattern);
                setFlags({ g: true, i: false, m: false, s: false });
                onNotify(`Applied ${cp.name} preset`);
              }}
              className="text-xs text-zinc-400 hover:text-indigo-300 hover:underline cursor-pointer"
            >
              {cp.name}
            </button>
          ))}
        </div>
      </div>

      {/* Test String & Matches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Test string editor */}
        <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Test Text</span>
            <span className="text-xs text-zinc-500 font-mono">{testText.length} chars</span>
          </div>
          <textarea
            value={testText}
            onChange={e => setTestText(e.target.value)}
            placeholder="Type or paste test string here..."
            className="w-full h-80 p-4 bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Matches Explorer */}
        <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Matches</span>
              <span className="text-xs text-indigo-400 font-mono font-medium">({matches.length})</span>
            </div>
            <button
              onClick={handleCopyMatches}
              disabled={matches.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy All</span>
            </button>
          </div>

          <div className="w-full h-80 p-3 overflow-auto bg-zinc-950 font-mono text-xs space-y-2">
            {matches.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">
                {error ? 'Invalid pattern' : 'No matches found in test string'}
              </div>
            ) : (
              matches.map((m, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                    <span className="text-indigo-400 font-semibold">Match #{idx + 1}</span>
                    <span>Index: {m.index}..{m.index + m.match.length}</span>
                  </div>
                  <div className="text-emerald-300 break-all select-all font-mono font-medium bg-zinc-950/80 p-1.5 rounded">
                    {m.match}
                  </div>
                  {m.groups.length > 0 && (
                    <div className="text-[11px] text-zinc-400 pl-2 border-l border-zinc-700">
                      Groups: {m.groups.map((g, gi) => `$${gi + 1}: "${g}"`).join(', ')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
