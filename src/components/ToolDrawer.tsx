import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, UploadCloud, Download, Check, AlertCircle } from 'lucide-react';
import { ToolDefinition } from '../data/tools';
import {
  formatBytes,
  MAX_FILE_SIZE,
  getWordMetrics,
  CASE_CONVERTERS,
} from '../utils/fileTools';
import { MascotFace, ParticleBurst } from './MascotFace';

interface ToolDrawerProps {
  tool: ToolDefinition;
  preloadedFiles?: File[];
  onClose: () => void;
}

export const ToolDrawer: React.FC<ToolDrawerProps> = ({
  tool,
  preloadedFiles = [],
  onClose,
}) => {
  const [files, setFiles] = useState<File[]>(preloadedFiles);
  const [options, setOptions] = useState<Record<string, any>>(() =>
    Object.fromEntries((tool.opts || []).map(opt => [opt.k, opt.def]))
  );

  // Execution state
  const [busy, setBusy] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [results, setResults] = useState<Array<{ name: string; blob: Blob }>>([]);

  // Text tools state
  const [textInput, setTextInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create downloadable object URLs
  const downloadUrls = useMemo(() => {
    return results.map(r => URL.createObjectURL(r.blob));
  }, [results]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      downloadUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [downloadUrls]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Validate and add files
  const handleAddFiles = (incoming: File[]) => {
    setError('');
    const newFiles = tool.multi ? [...files, ...incoming] : incoming.slice(0, 1);

    // Validation
    for (const f of newFiles) {
      if (f.size > MAX_FILE_SIZE) {
        setError(`${f.name} is ${formatBytes(f.size)}, exceeding the 50 MB limit.`);
        return;
      }
      if (tool.accept && !tool.accept.includes(f.type)) {
        if (!(tool.accept.includes('application/pdf') && /\.pdf$/i.test(f.name))) {
          setError(`${f.name} isn't supported. This tool accepts ${tool.kind}.`);
          return;
        }
      }
    }

    setFiles(newFiles);
    setResults([]);
  };

  const handleRun = async () => {
    if (!tool.run || files.length === 0) return;
    setBusy(true);
    setProgress(0);
    setError('');
    setResults([]);

    // Brief delay so UI renders transition
    await new Promise(r => setTimeout(r, 40));

    try {
      const res = await tool.run(files, options, p => {
        setProgress(p);
      });
      setResults(res);
      setProgress(1);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check the file and try again.');
    } finally {
      setBusy(false);
    }
  };

  // Compression savings calculation
  const savingsPct = useMemo(() => {
    if (tool.id !== 'compress' || results.length === 0) return 0;
    const originalTotal = files.reduce((sum, f) => sum + f.size, 0);
    const resultTotal = results.reduce((sum, r) => sum + r.blob.size, 0);
    if (!originalTotal) return 0;
    return Math.round((1 - resultTotal / originalTotal) * 100);
  }, [tool.id, files, results]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(textInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={tool.name}
        onClick={e => e.stopPropagation()}
        className="h-full w-full max-w-xl overflow-y-auto bg-bg p-6 sm:p-10 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250 border-l border-line text-fg"
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-fg">
              {tool.name}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-10 w-10 place-items-center rounded-full border border-line hover:bg-pink hover:text-ink text-fg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          <p className="mt-2 text-mute text-sm leading-relaxed">{tool.desc}</p>

          {/* Content Area */}
          <div className="mt-8">
            {tool.text ? (
              /* Text tools: Words or Case Converter */
              <div className="space-y-4">
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  rows={7}
                  placeholder="Paste or type text here..."
                  className="w-full rounded-2xl border border-line bg-card p-4 text-sm text-fg placeholder:text-mute focus:outline-none focus:border-fg transition-colors resize-none leading-relaxed"
                />

                {tool.text === 'count' ? (
                  <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {getWordMetrics(textInput).map(([label, val]) => (
                      <div key={label} className="border-t border-line pt-3">
                        <dd className="font-display text-3xl font-bold text-fg">{val}</dd>
                        <dt className="text-xs text-mute mt-1">{label}</dt>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(CASE_CONVERTERS).map(([caseName, converter]) => (
                        <button
                          key={caseName}
                          onClick={() => setTextInput(converter(textInput))}
                          className="rounded-full border border-line px-4 py-2 text-xs font-medium text-fg hover:bg-pink hover:text-ink transition-colors cursor-pointer"
                        >
                          {caseName}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleCopyText}
                      disabled={!textInput}
                      className="mt-2 flex items-center justify-center gap-2 rounded-full bg-coral py-3 px-6 text-sm font-medium text-onacc hover:bg-pink hover:text-ink disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {copied ? <Check size={16} /> : null}
                      <span>{copied ? 'Copied to clipboard!' : 'Copy text'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* File tools: Compress, Resize, Convert, Merge, Split, ImagesToPdf */
              <div className="space-y-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  multiple={tool.multi}
                  accept={tool.accept?.join(',')}
                  onChange={e => {
                    if (e.target.files) {
                      handleAddFiles(Array.from(e.target.files));
                      e.target.value = '';
                    }
                  }}
                />

                {/* Dropzone */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    handleAddFiles(Array.from(e.dataTransfer.files));
                  }}
                  className="w-full rounded-2xl border border-dashed border-fg p-8 text-center hover:bg-pink hover:text-ink transition-colors cursor-pointer group"
                >
                  <UploadCloud size={24} className="mx-auto mb-2 text-mute group-hover:text-ink" />
                  <span className="text-sm font-medium">
                    {files.length ? 'Add or replace files' : `Choose or drop ${tool.kind}`}
                  </span>
                </button>

                {/* Selected Files List */}
                {files.length > 0 && (
                  <ul className="divide-y divide-line text-sm border-t border-b border-line">
                    {files.map((f, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="truncate max-w-[260px] text-fg font-mono text-xs">
                          {f.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-mute">{formatBytes(f.size)}</span>
                          <button
                            onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                            className="text-mute hover:text-rose-500 text-xs p-1"
                            title="Remove file"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Options Controls */}
                {tool.opts && (
                  <div className="space-y-4 pt-2">
                    {tool.opts.map(opt => (
                      <label key={opt.k} className="block text-sm">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-fg">{opt.label}</span>
                          {opt.type === 'range' && (
                            <span className="text-xs font-mono font-bold text-accent">
                              {options[opt.k]}%
                            </span>
                          )}
                        </div>

                        {opt.type === 'select' ? (
                          <select
                            value={options[opt.k]}
                            onChange={e => setOptions({ ...options, [opt.k]: e.target.value })}
                            className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-xs text-fg focus:outline-none focus:border-fg"
                          >
                            {opt.options?.map(([val, label]) => (
                              <option key={val} value={val} className="text-ink">
                                {label}
                              </option>
                            ))}
                          </select>
                        ) : opt.type === 'range' ? (
                          <input
                            type="range"
                            min={opt.min}
                            max={opt.max}
                            value={options[opt.k]}
                            onChange={e => setOptions({ ...options, [opt.k]: Number(e.target.value) })}
                            className="w-full accent-coral cursor-pointer"
                          />
                        ) : (
                          <input
                            type={opt.type}
                            min={opt.min}
                            max={opt.max}
                            value={options[opt.k]}
                            onChange={e => setOptions({ ...options, [opt.k]: e.target.value })}
                            className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-xs text-fg focus:outline-none focus:border-fg"
                          />
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {/* Run Button */}
                <button
                  disabled={!files.length || busy}
                  onClick={handleRun}
                  className="w-full rounded-full bg-coral py-4 font-medium text-onacc hover:bg-pink hover:text-ink disabled:opacity-40 transition-colors cursor-pointer text-sm shadow-md"
                >
                  {busy ? 'Working…' : 'Run'}
                </button>

                {/* Progress Bar */}
                {busy && (
                  <div className="h-1.5 overflow-hidden rounded bg-line">
                    <div
                      className="h-full bg-coral transition-all duration-150"
                      style={{ width: `${Math.max(10, progress * 100)}%` }}
                    />
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-accent/40 bg-pink/20 text-accent text-xs">
                    <MascotFace mood="oops" size={32} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Results View */}
                {results.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-line space-y-4 animate-in fade-in duration-200">
                    <ParticleBurst />

                    <div className="flex items-center gap-3">
                      <MascotFace mood="happy" size={44} />
                      <h3 className="font-display text-xl font-bold text-fg">
                        {tool.id === 'compress' && savingsPct > 0
                          ? `Squeezed it down ${savingsPct}%!`
                          : 'Done. Files stay on your device.'}
                      </h3>
                    </div>

                    <ul className="divide-y divide-line text-sm border-t border-line">
                      {results.map((res, idx) => (
                        <li key={idx} className="flex items-center justify-between gap-3 py-3">
                          <div className="truncate">
                            <span className="text-xs font-mono font-medium text-fg block truncate">
                              {res.name}
                            </span>
                            <span className="text-[11px] text-mute">
                              {formatBytes(res.blob.size)}
                            </span>
                          </div>

                          <a
                            href={downloadUrls[idx]}
                            download={res.name}
                            className="flex shrink-0 items-center gap-1.5 rounded-full bg-coral px-4 py-2 font-medium text-xs text-onacc hover:bg-pink hover:text-ink transition-colors"
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
