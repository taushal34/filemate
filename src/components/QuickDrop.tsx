import React, { useState, useRef } from 'react';
import { UploadCloud, ArrowRight } from 'lucide-react';
import { MascotFace } from './MascotFace';
import { TOOLS, ToolDefinition } from '../data/tools';
import { formatBytes } from '../utils/fileTools';

interface QuickDropProps {
  onSelectToolWithFiles: (tool: ToolDefinition, files: File[]) => void;
}

export const QuickDrop: React.FC<QuickDropProps> = ({ onSelectToolWithFiles }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: File[]) => {
    if (!files.length) return;
    setSelectedFiles(files);
  };

  // Find tools matching dropped files
  const suggestedTools = selectedFiles.length
    ? TOOLS.filter(tool => {
        if (tool.soon || tool.text) return false;
        if (!tool.accept) return false;

        const allMatch = selectedFiles.every(file => {
          if (tool.accept?.includes(file.type)) return true;
          if (tool.accept?.includes('application/pdf') && /\.pdf$/i.test(file.name)) return true;
          return false;
        });

        if (!allMatch) return false;
        return tool.multi || selectedFiles.length === 1;
      })
    : [];

  return (
    <section className="mx-auto max-w-7xl px-5 py-6">
      <div className="relative lg:ml-[16%]">
        {/* Shadow accent backdrop block */}
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2.5rem] bg-coral"
        />

        {/* Main drop card */}
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(Array.from(e.dataTransfer.files));
          }}
          className={`relative rounded-[2.5rem] border border-fg p-8 transition-colors sm:p-12 ${
            isDragging ? 'bg-pink text-ink' : 'bg-bg'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={e => {
              if (e.target.files) {
                handleFiles(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
          />

          {/* Peeking Mascot */}
          <div className="absolute -top-10 right-8">
            <MascotFace
              mood={isDragging ? 'drag' : selectedFiles.length ? 'happy' : 'idle'}
              size={68}
            />
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl text-fg">
                Drop a file. We’ll suggest what to do with it.
              </h2>
              <p className="mt-2 text-mute text-sm sm:text-base">
                PDF, JPG, PNG or WebP, up to 50 MB each.
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex shrink-0 items-center justify-center gap-2 rounded-full border border-fg px-6 py-3.5 hover:bg-fg hover:text-bg font-medium transition-colors cursor-pointer self-start sm:self-auto text-fg"
            >
              <UploadCloud size={20} />
              <span>Choose files</span>
            </button>
          </div>

          {/* Dropped files overview and recommendations */}
          {selectedFiles.length > 0 && (
            <div className="mt-8 pt-6 border-t border-line flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-mute uppercase tracking-wider">
                  Loaded {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}:
                </span>
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-xs text-mute hover:text-fg underline cursor-pointer"
                >
                  Clear
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-card text-xs text-fg font-mono"
                  >
                    <span className="truncate max-w-[200px]">{f.name}</span>
                    <span className="text-mute">({formatBytes(f.size)})</span>
                  </div>
                ))}
              </div>

              {/* Recommended tools buttons */}
              {suggestedTools.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-semibold text-mute uppercase tracking-wider block mb-2">
                    Recommended Actions:
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {suggestedTools.map(t => (
                      <button
                        key={t.id}
                        onClick={() => onSelectToolWithFiles(t, selectedFiles)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-coral hover:bg-pink hover:text-ink text-onacc text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-sm group"
                      >
                        <span>{t.name}</span>
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
