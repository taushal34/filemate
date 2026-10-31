import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Palette, X } from 'lucide-react';
import { CATEGORIES } from '../data/tools';
import {
  PALETTES,
  PaletteConfig,
  getStoredPalette,
  saveStoredPalette,
} from '../utils/theme';

interface HeaderProps {
  dark: boolean;
  onToggleTheme: () => void;
  onSelectCategory: (cat: string) => void;
  onPaletteChange: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dark,
  onToggleTheme,
  onSelectCategory,
  onPaletteChange,
}) => {
  const [showPalette, setShowPalette] = useState<boolean>(false);
  const [currentPalette, setCurrentPalette] = useState<PaletteConfig>(getStoredPalette);
  const paletteRef = useRef<HTMLDivElement>(null);

  // Close palette on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setShowPalette(false);
      }
    };
    if (showPalette) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showPalette]);

  const handleApplyPreset = (name: string) => {
    const p = PALETTES[name];
    if (p) {
      setCurrentPalette(p);
      saveStoredPalette(p);
      onPaletteChange();
    }
  };

  const handleCustomColor = (key: keyof PaletteConfig, val: string) => {
    const updated = { ...currentPalette, [key]: val };
    setCurrentPalette(updated);
    saveStoredPalette(updated);
    onPaletteChange();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-fg">
          <svg width="24" height="28" viewBox="0 0 24 28" aria-hidden="true" className="shrink-0">
            <path d="M2 1h14l6 6v20H2z" className="fill-coral" />
            <path d="M16 1v6h6z" className="fill-glow" />
            <circle cx="9" cy="18" r="1.6" className="fill-ink" />
            <circle cx="17" cy="18" r="1.6" className="fill-ink" />
          </svg>
          <span>filemate</span>
        </a>

        {/* Categories Navigation */}
        <nav aria-label="Categories" className="hidden md:flex items-center gap-6 text-sm">
          {CATEGORIES.slice(1).map(cat => (
            <a
              key={cat}
              href="#tools"
              onClick={() => onSelectCategory(cat)}
              className="text-mute hover:text-accent font-medium transition-colors cursor-pointer"
            >
              {cat}
            </a>
          ))}
          <a href="#privacy" className="text-mute hover:text-accent font-medium transition-colors">
            Privacy
          </a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Palette Switcher */}
          <div className="relative" ref={paletteRef}>
            <button
              onClick={() => setShowPalette(!showPalette)}
              aria-label="Change color palette"
              className="grid h-10 w-10 place-items-center rounded-full border border-line hover:bg-pink hover:text-ink text-fg transition-colors cursor-pointer"
            >
              <Palette size={18} />
            </button>

            {showPalette && (
              <div
                role="dialog"
                aria-label="Color palette selector"
                className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-line bg-bg p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
                  <span className="font-display text-sm font-bold text-fg">Color Palettes</span>
                  <button
                    onClick={() => setShowPalette(false)}
                    className="p-1 text-mute hover:text-fg rounded-lg"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="space-y-2">
                  {Object.entries(PALETTES).map(([name, p]) => (
                    <button
                      key={name}
                      onClick={() => handleApplyPreset(name)}
                      className="w-full flex items-center justify-between p-2 rounded-xl border border-line hover:border-fg transition-colors text-left cursor-pointer group"
                    >
                      <span className="text-xs font-medium text-fg group-hover:text-accent">
                        {name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: p.dark }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: p.light }} />
                        <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: p.acc }} />
                        <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: p.glow }} />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Accent Picker */}
                <div className="mt-4 pt-3 border-t border-line">
                  <label className="text-[11px] font-medium text-mute block mb-1">
                    Custom Main Accent:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentPalette.acc}
                      onChange={e => handleCustomColor('acc', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="font-mono text-xs text-fg">{currentPalette.acc}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="grid h-10 w-10 place-items-center rounded-full border border-line hover:bg-pink hover:text-ink text-fg transition-colors cursor-pointer"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};
