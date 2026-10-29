import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Copy, RefreshCw } from 'lucide-react';
import { computeLineDiff } from '../utils/diff';

interface DiffViewerProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const SAMPLE_ORIGINAL = `export interface UserConfig {
  theme: 'light' | 'dark';
  notifications: boolean;
  maxRetries: number;
  apiEndpoint: string;
  debugMode: boolean;
}`;

const SAMPLE_MODIFIED = `export interface UserConfig {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  timeoutMs: number;
  maxRetries: number;
  apiEndpoint: string;
  debugMode: boolean;
  version: '2.0.0';
}`;

export const DiffViewer: React.FC<DiffViewerProps> = ({ onNotify }) => {
  const [original, setOriginal] = useState<string>(SAMPLE_ORIGINAL);
  const [modified, setModified] = useState<string>(SAMPLE_MODIFIED);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');

  const diff = useMemo(() => {
    return computeLineDiff(original, modified);
  }, [original, modified]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    diff.forEach(item => {
      if (item.type === 'added') added++;
      if (item.type === 'removed') removed++;
    });
    return { added, removed, total: diff.length };
  }, [diff]);

  const handleSwap = () => {
    const temp = original;
    setOriginal(modified);
    setModified(temp);
    onNotify('Swapped left and right text');
  };

  const handleCopyUnified = () => {
    const text = diff
      .map(item => {
        const prefix = item.type === 'added' ? '+ ' : item.type === 'removed' ? '- ' : '  ';
        return `${prefix}${item.value}`;
      })
      .join('\n');
    navigator.clipboard.writeText(text);
    onNotify('Copied unified diff to clipboard');
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-zinc-800 rounded-lg">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'side-by-side' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'unified' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Unified
            </button>
          </div>

          <button
            onClick={handleSwap}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-emerald-400">+{stats.added} added</span>
          <span className="text-rose-400">-{stats.removed} removed</span>
          <button
            onClick={handleCopyUnified}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Diff</span>
          </button>
        </div>
      </div>

      {/* Input Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Original Text</span>
            <span className="text-xs text-zinc-500 font-mono">{original.split('\n').length} lines</span>
          </div>
          <textarea
            value={original}
            onChange={e => setOriginal(e.target.value)}
            placeholder="Paste original text here..."
            className="w-full h-44 p-3 bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Modified Text</span>
            <span className="text-xs text-zinc-500 font-mono">{modified.split('\n').length} lines</span>
          </div>
          <textarea
            value={modified}
            onChange={e => setModified(e.target.value)}
            placeholder="Paste modified text here..."
            className="w-full h-44 p-3 bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Diff Output Panel */}
      <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Computed Differences</span>
          <span className="text-xs text-zinc-500 font-mono">{diff.length} compared rows</span>
        </div>

        <div className="max-h-96 overflow-auto font-mono text-xs divide-y divide-zinc-800/40 bg-zinc-950">
          {diff.length === 0 ? (
            <div className="p-6 text-center text-zinc-600">Both texts are identical</div>
          ) : (
            diff.map((item, idx) => {
              if (item.type === 'added') {
                return (
                  <div key={idx} className="flex items-start bg-emerald-950/25 text-emerald-300 hover:bg-emerald-950/40">
                    <span className="w-12 py-1 px-2 text-right select-none text-zinc-600 border-r border-emerald-900/40">
                      {item.newLineNumber}
                    </span>
                    <span className="w-8 py-1 text-center font-bold text-emerald-400 select-none">+</span>
                    <span className="py-1 px-3 whitespace-pre-wrap break-all flex-1">{item.value || ' '}</span>
                  </div>
                );
              }
              if (item.type === 'removed') {
                return (
                  <div key={idx} className="flex items-start bg-rose-950/25 text-rose-300 hover:bg-rose-950/40">
                    <span className="w-12 py-1 px-2 text-right select-none text-zinc-600 border-r border-rose-900/40">
                      {item.oldLineNumber}
                    </span>
                    <span className="w-8 py-1 text-center font-bold text-rose-400 select-none">-</span>
                    <span className="py-1 px-3 whitespace-pre-wrap break-all flex-1">{item.value || ' '}</span>
                  </div>
                );
              }
              return (
                <div key={idx} className="flex items-start text-zinc-400 hover:bg-zinc-900/60">
                  <span className="w-12 py-1 px-2 text-right select-none text-zinc-600 border-r border-zinc-800">
                    {item.oldLineNumber}
                  </span>
                  <span className="w-8 py-1 text-center select-none text-zinc-600"> </span>
                  <span className="py-1 px-3 whitespace-pre-wrap break-all flex-1 text-zinc-300">{item.value || ' '}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
