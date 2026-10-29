import React, { useState } from 'react';
import { Copy, Upload, Trash2, FileCode, AlertCircle } from 'lucide-react';
import { formatJson, minifyJson, jsonToTypeScript, jsonToZod, jsonToCsv } from '../utils/formatters';

interface JsonStudioProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const SAMPLE_JSON = `{
  "id": "usr_948210",
  "name": "Jane Cooper",
  "email": "jane.cooper@example.com",
  "role": "Lead Architect",
  "verified": true,
  "stats": {
    "projects": 14,
    "commits": 842,
    "rating": 4.95
  },
  "tags": ["cloud", "react", "systems"]
}`;

export const JsonStudio: React.FC<JsonStudioProps> = ({ onNotify }) => {
  const [input, setInput] = useState<string>(SAMPLE_JSON);
  const [output, setOutput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'formatted' | 'ts' | 'zod' | 'csv'>('formatted');
  const [error, setError] = useState<string | null>(null);

  const handleFormat = (customInput?: string) => {
    const textToFormat = customInput !== undefined ? customInput : input;
    const res = formatJson(textToFormat, 2);
    if (res.success && res.result) {
      setOutput(res.result);
      setError(null);
      setActiveTab('formatted');
    } else {
      setError(res.error || 'Invalid JSON');
    }
  };

  const handleMinify = () => {
    const res = minifyJson(input);
    if (res.success && res.result) {
      setOutput(res.result);
      setError(null);
      setActiveTab('formatted');
      onNotify('JSON minified');
    } else {
      setError(res.error || 'Invalid JSON');
    }
  };

  const handleToTypeScript = () => {
    const res = jsonToTypeScript(input, 'User');
    if (res.success && res.result) {
      setOutput(res.result);
      setError(null);
      setActiveTab('ts');
      onNotify('Generated TypeScript interfaces');
    } else {
      setError(res.error || 'Invalid JSON');
    }
  };

  const handleToZod = () => {
    const res = jsonToZod(input, 'userSchema');
    if (res.success && res.result) {
      setOutput(res.result);
      setError(null);
      setActiveTab('zod');
      onNotify('Generated Zod schema');
    } else {
      setError(res.error || 'Invalid JSON');
    }
  };

  const handleToCsv = () => {
    const res = jsonToCsv(input);
    if (res.success && res.result) {
      setOutput(res.result);
      setError(null);
      setActiveTab('csv');
      onNotify('Exported to CSV');
    } else {
      setError(res.error || 'Invalid JSON for CSV export');
    }
  };

  const handleCopy = () => {
    const text = output || input;
    navigator.clipboard.writeText(text);
    onNotify('Copied to clipboard');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        const content = ev.target?.result as string;
        setInput(content);
        handleFormat(content);
        onNotify(`Loaded ${file.name}`);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFormat()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
          >
            Format JSON
          </button>
          <button
            onClick={handleMinify}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            Minify
          </button>
          <div className="h-4 w-px bg-zinc-700" />
          <button
            onClick={handleToTypeScript}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            TypeScript
          </button>
          <button
            onClick={handleToZod}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            Zod Schema
          </button>
          <button
            onClick={handleToCsv}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            To CSV
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={() => {
              setInput(SAMPLE_JSON);
              handleFormat(SAMPLE_JSON);
            }}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          >
            Sample
          </button>
          <button
            onClick={() => {
              setInput('');
              setOutput('');
              setError(null);
            }}
            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor & Output Split Panes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Pane */}
        <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Input JSON</span>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>{input.length} characters</span>
              <span>·</span>
              <span>{input.split('\n').length} lines</span>
            </div>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste raw JSON here..."
            className="w-full h-96 p-4 bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Output Pane */}
        <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Output</span>
              <span className="text-xs text-zinc-500 font-mono">({activeTab})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!output}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
          <div className="w-full h-96 p-4 overflow-auto bg-zinc-950/50 font-mono text-xs text-emerald-400/90 whitespace-pre leading-relaxed select-text">
            {output ? output : <span className="text-zinc-600 italic">Formatted result or generated types will appear here...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
