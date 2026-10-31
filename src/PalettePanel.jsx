import { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, X } from 'lucide-react';
import { PRESETS, DEFAULT, loadPalette, savePalette } from './palette';

const FIELDS = [
  ['dark', 'Dark background'],
  ['light', 'Light background'],
  ['acc', 'Main accent'],
  ['glow', 'Glow'],
];

export default function PalettePanel({ onChange }) {
  const [open, setOpen] = useState(false);
  const [currentPalette, setCurrentPalette] = useState(loadPalette);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Apply and persist palette
  const handleSelectPalette = useCallback(
    newPalette => {
      setCurrentPalette(newPalette);
      savePalette(newPalette);
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onChange?.();
      }, 80);
    },
    [onChange]
  );

  // Robust outside-click and Escape key detection using React refs
  useEffect(() => {
    if (!open) return;

    const handlePointerDownOutside = event => {
      const isInsidePanel = panelRef.current && panelRef.current.contains(event.target);
      const isInsideTrigger = triggerRef.current && triggerRef.current.contains(event.target);

      if (!isInsidePanel && !isInsideTrigger) {
        setOpen(false);
      }
    };

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const togglePanel = () => {
    setOpen(prev => !prev);
  };

  const handleClose = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Change colors"
        onClick={togglePanel}
        className="grid h-10 w-10 place-items-center rounded-full border border-line hover:bg-pink hover:text-ink text-fg transition-colors cursor-pointer"
      >
        <Palette size={18} />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Theme & Color Settings"
          className="absolute right-0 top-12 z-50 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-line bg-bg p-4 shadow-2xl transition-all"
        >
          {/* Header with Title and Explicit Close Button */}
          <div className="flex items-center justify-between pb-2 border-b border-line mb-3">
            <span className="font-display font-bold text-sm text-fg">Theme & Colors</span>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close theme panel"
              className="grid h-7 w-7 place-items-center rounded-full text-mute hover:text-fg hover:bg-pink hover:text-ink transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Curated Presets */}
          <p className="font-display text-xs font-semibold uppercase tracking-wider text-mute mb-2">
            Curated Presets
          </p>
          <div className="grid gap-2">
            {Object.entries(PRESETS).map(([name, val]) => {
              const isSelected =
                currentPalette.dark === val.dark &&
                currentPalette.light === val.light &&
                currentPalette.acc === val.acc &&
                currentPalette.glow === val.glow;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectPalette(val)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'border-accent bg-pink/20 font-medium text-fg shadow-xs'
                      : 'border-line text-fg hover:border-fg'
                  }`}
                >
                  <span className="truncate">{name}</span>
                  <span className="flex rounded overflow-hidden border border-line shrink-0 ml-2 shadow-xs">
                    {[val.dark, val.acc, val.glow, val.light].map((c, i) => (
                      <i key={i} className="h-3.5 w-3.5" style={{ background: c }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Colors */}
          <p className="mt-4 font-display text-xs font-semibold uppercase tracking-wider text-mute mb-2">
            Fine-tune Colors
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {FIELDS.map(([k, label]) => (
              <label key={k} className="text-[11px] text-mute block">
                <span className="truncate block">{label}</span>
                <div className="mt-1 flex items-center gap-1.5 rounded-lg border border-line bg-card p-1">
                  <input
                    type="color"
                    value={currentPalette[k]}
                    onChange={e => handleSelectPalette({ ...currentPalette, [k]: e.target.value })}
                    className="h-6 w-7 cursor-pointer rounded border-0 bg-transparent p-0 block"
                  />
                  <span className="font-mono text-[10px] text-fg uppercase truncate">
                    {currentPalette[k]}
                  </span>
                </div>
              </label>
            ))}
          </div>

          {/* Footer Reset & Status */}
          <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleSelectPalette(DEFAULT)}
              className="text-xs text-accent hover:underline cursor-pointer font-medium"
            >
              Reset to Graphite & Lime
            </button>
            <span className="text-[10px] text-mute">Applied live</span>
          </div>
        </div>
      )}
    </div>
  );
}
