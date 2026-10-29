import React, { useState, useMemo } from 'react';
import { Copy, Eye, Sliders, Check } from 'lucide-react';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, getContrastRatio, RgbColor } from '../utils/color';

interface ColorStudioProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#6366F1', '#EC4899', '#F59E0B', '#EF4444', '#14B8A6', '#8B5CF6', '#06B6D4', '#F97316'
];

export const ColorStudio: React.FC<ColorStudioProps> = ({ onNotify }) => {
  const [hex, setHex] = useState<string>('#3B82F6');

  const rgb = useMemo<RgbColor>(() => {
    return hexToRgb(hex) || { r: 59, g: 130, b: 246 };
  }, [hex]);

  const hsl = useMemo(() => {
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
  }, [rgb]);

  // Contrast against black and white
  const contrastWhite = useMemo(() => {
    return getContrastRatio(rgb, { r: 255, g: 255, b: 255 });
  }, [rgb]);

  const contrastBlack = useMemo(() => {
    return getContrastRatio(rgb, { r: 0, g: 0, b: 0 });
  }, [rgb]);

  // Generate tints and shades
  const shades = useMemo(() => {
    const list: string[] = [];
    for (let l = 10; l <= 90; l += 10) {
      const rgbTint = hslToRgb(hsl.h, hsl.s, l);
      list.push(rgbToHex(rgbTint.r, rgbTint.g, rgbTint.b));
    }
    return list;
  }, [hsl]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onNotify(`Copied ${label} (${text})`);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Interactive Picker & Live Preview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Color preview box */}
        <div
          className="rounded-xl border border-zinc-800 p-6 flex flex-col justify-between shadow-inner h-52 relative overflow-hidden transition-all duration-200"
          style={{ backgroundColor: hex }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-mono font-bold px-2.5 py-1 rounded-md"
              style={{
                backgroundColor: contrastWhite > 4.5 ? '#ffffff22' : '#00000033',
                color: contrastWhite > 4.5 ? '#ffffff' : '#000000',
              }}
            >
              {hex}
            </span>
          </div>

          <div
            className="text-sm font-semibold tracking-wide"
            style={{ color: contrastWhite > 4.5 ? '#ffffff' : '#000000' }}
          >
            Sample Text Display
            <p className="text-xs font-normal opacity-85 mt-0.5">
              Testing readability and perceptual luminosity
            </p>
          </div>
        </div>

        {/* Inputs and color picker */}
        <div className="md:col-span-2 p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="color"
              value={hex}
              onChange={e => setHex(e.target.value.toUpperCase())}
              className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
            />
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-zinc-400 block mb-1">Hex Code</label>
              <input
                type="text"
                value={hex}
                onChange={e => {
                  const val = e.target.value;
                  setHex(val);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 font-mono text-xs text-zinc-100 uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-xs text-zinc-500 block mb-2">Palette Presets</span>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setHex(c)}
                  className="w-6 h-6 rounded-md border border-white/10 shadow hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Formats Conversion Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => handleCopy(hex, 'HEX')}
          className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-zinc-700 transition-colors"
        >
          <div>
            <span className="text-[11px] text-zinc-500 uppercase font-semibold">HEX</span>
            <p className="text-xs font-mono text-zinc-200 mt-0.5">{hex}</p>
          </div>
          <Copy className="w-3.5 h-3.5 text-zinc-500" />
        </div>

        <div
          onClick={() => handleCopy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'RGB')}
          className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-zinc-700 transition-colors"
        >
          <div>
            <span className="text-[11px] text-zinc-500 uppercase font-semibold">RGB</span>
            <p className="text-xs font-mono text-zinc-200 mt-0.5">rgb({rgb.r}, {rgb.g}, {rgb.b})</p>
          </div>
          <Copy className="w-3.5 h-3.5 text-zinc-500" />
        </div>

        <div
          onClick={() => handleCopy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'HSL')}
          className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-zinc-700 transition-colors"
        >
          <div>
            <span className="text-[11px] text-zinc-500 uppercase font-semibold">HSL</span>
            <p className="text-xs font-mono text-zinc-200 mt-0.5">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</p>
          </div>
          <Copy className="w-3.5 h-3.5 text-zinc-500" />
        </div>
      </div>

      {/* WCAG Contrast Assessment */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-3">
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          WCAG 2.1 Accessibility Contrast Checker
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* On White */}
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400">Against White (#FFFFFF)</span>
              <p className="text-base font-bold font-mono text-zinc-100 mt-0.5">
                {contrastWhite.toFixed(2)} : 1
              </p>
            </div>
            <div className="flex gap-2 text-xs font-mono">
              <span className={contrastWhite >= 4.5 ? 'text-emerald-400' : 'text-rose-400'}>
                AA {contrastWhite >= 4.5 ? '✓ Pass' : '✗ Fail'}
              </span>
              <span className="text-zinc-600">·</span>
              <span className={contrastWhite >= 7.0 ? 'text-emerald-400' : 'text-rose-400'}>
                AAA {contrastWhite >= 7.0 ? '✓ Pass' : '✗ Fail'}
              </span>
            </div>
          </div>

          {/* On Black */}
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400">Against Black (#000000)</span>
              <p className="text-base font-bold font-mono text-zinc-100 mt-0.5">
                {contrastBlack.toFixed(2)} : 1
              </p>
            </div>
            <div className="flex gap-2 text-xs font-mono">
              <span className={contrastBlack >= 4.5 ? 'text-emerald-400' : 'text-rose-400'}>
                AA {contrastBlack >= 4.5 ? '✓ Pass' : '✗ Fail'}
              </span>
              <span className="text-zinc-600">·</span>
              <span className={contrastBlack >= 7.0 ? 'text-emerald-400' : 'text-rose-400'}>
                AAA {contrastBlack >= 7.0 ? '✓ Pass' : '✗ Fail'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Shade Scale */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-2.5">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Lightness Spectrum (10% - 90%)
        </span>
        <div className="grid grid-cols-9 h-12 rounded-lg overflow-hidden border border-zinc-800">
          {shades.map((s, idx) => (
            <button
              key={s}
              onClick={() => handleCopy(s, `Luminance ${idx + 1}0%`)}
              className="h-full relative group cursor-pointer transition-opacity hover:opacity-90 flex items-center justify-center"
              style={{ backgroundColor: s }}
              title={`Click to copy: ${s}`}
            >
              <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 bg-black/60 px-1 py-0.5 rounded text-white transition-opacity">
                {s}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
