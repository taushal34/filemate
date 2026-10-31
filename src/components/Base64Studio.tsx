import React, { useState } from 'react';
import { Copy, Upload, ArrowUpDown, FileText, Image as ImageIcon } from 'lucide-react';

interface Base64StudioProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const Base64Studio: React.FC<Base64StudioProps> = ({ onNotify }) => {
  const [mode, setMode] = useState<'text' | 'file' | 'url'>('text');
  const [textInput, setTextInput] = useState<string>('Developer tools suite for modern web applications 🚀');
  const [textOutput, setTextOutput] = useState<string>('');
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');

  // File state
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileMime, setFileMime] = useState<string>('');

  // Process text whenever inputs change
  const handleProcessText = (customInput?: string, customDir?: 'encode' | 'decode') => {
    const txt = customInput !== undefined ? customInput : textInput;
    const dir = customDir || direction;

    try {
      if (mode === 'url') {
        if (dir === 'encode') {
          setTextOutput(encodeURIComponent(txt));
        } else {
          setTextOutput(decodeURIComponent(txt));
        }
      } else {
        if (dir === 'encode') {
          const encoded = btoa(unescape(encodeURIComponent(txt)));
          setTextOutput(encoded);
        } else {
          const decoded = decodeURIComponent(escape(atob(txt)));
          setTextOutput(decoded);
        }
      }
    } catch (err: any) {
      setTextOutput(`Error: ${err.message}`);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onNotify('Copied to clipboard');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileMime(file.type || 'application/octet-stream');

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setFileBase64(dataUrl);
      onNotify(`Processed ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Tab Switcher & Direction */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-zinc-800 rounded-lg">
            <button
              onClick={() => {
                setMode('text');
                handleProcessText(textInput, direction);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                mode === 'text' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Base64 Text
            </button>
            <button
              onClick={() => {
                setMode('url');
                handleProcessText(textInput, direction);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                mode === 'url' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              URL Encode
            </button>
            <button
              onClick={() => setMode('file')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                mode === 'file' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              File to Base64
            </button>
          </div>

          {mode !== 'file' && (
            <div className="flex items-center p-1 bg-zinc-800 rounded-lg">
              <button
                onClick={() => {
                  setDirection('encode');
                  handleProcessText(textInput, 'encode');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  direction === 'encode' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Encode
              </button>
              <button
                onClick={() => {
                  setDirection('decode');
                  handleProcessText(textInput, 'decode');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  direction === 'decode' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Decode
              </button>
            </div>
          )}
        </div>

        {mode !== 'file' && (
          <button
            onClick={() => {
              const prevOutput = textOutput;
              setTextInput(prevOutput);
              const nextDir = direction === 'encode' ? 'decode' : 'encode';
              setDirection(nextDir);
              handleProcessText(prevOutput, nextDir);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Invert Input/Output</span>
          </button>
        )}
      </div>

      {mode === 'file' ? (
        /* File to Base64 converter */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-xl gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-200">Drag & drop an image or file, or browse</p>
              <p className="text-[11px] text-zinc-500 mt-1">PNG, JPG, SVG, WebP, PDF or any asset</p>
            </div>
            <label className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer">
              Choose File
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
            {fileName && (
              <span className="text-xs text-emerald-400 font-mono mt-2">
                Loaded: {fileName} ({fileMime})
              </span>
            )}
          </div>

          <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Base64 Data URI</span>
              {fileBase64 && (
                <button
                  onClick={() => handleCopy(fileBase64)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy URI</span>
                </button>
              )}
            </div>
            <div className="p-4 flex flex-col gap-4 h-80 overflow-auto bg-zinc-950">
              {fileBase64 ? (
                <>
                  {fileMime.startsWith('image/') && (
                    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center max-h-36 overflow-hidden">
                      <img src={fileBase64} alt="Preview" className="max-h-32 object-contain rounded" />
                    </div>
                  )}
                  <div className="font-mono text-xs text-zinc-300 break-all select-all leading-relaxed">
                    {fileBase64}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">
                  Upload a file on the left to generate its Base64 data URI
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Text input/output split */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {direction === 'encode' ? 'Plain Text' : 'Encoded Input'}
              </span>
              <button
                onClick={() => handleProcessText()}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              >
                Execute
              </button>
            </div>
            <textarea
              value={textInput}
              onChange={e => {
                setTextInput(e.target.value);
                handleProcessText(e.target.value);
              }}
              placeholder="Enter text..."
              className="w-full h-72 p-4 bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {direction === 'encode' ? 'Encoded Output' : 'Decoded Plain Text'}
              </span>
              <button
                onClick={() => handleCopy(textOutput)}
                disabled={!textOutput}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
            <div className="w-full h-72 p-4 overflow-auto bg-zinc-950 font-mono text-xs text-emerald-400/90 whitespace-pre-wrap break-all leading-relaxed select-text">
              {textOutput || <span className="text-zinc-600 italic">Result will show here...</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
