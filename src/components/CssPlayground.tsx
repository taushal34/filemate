import React, { useState } from 'react';
import { Copy, Layout, Box } from 'lucide-react';

interface CssPlaygroundProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const CssPlayground: React.FC<CssPlaygroundProps> = ({ onNotify }) => {
  const [tab, setTab] = useState<'flex' | 'shadow'>('flex');

  // Flexbox state
  const [direction, setDirection] = useState<'row' | 'column'>('row');
  const [justify, setJustify] = useState<string>('space-between');
  const [align, setAlign] = useState<string>('center');
  const [gap, setGap] = useState<number>(16);
  const [itemCount, setItemCount] = useState<number>(4);

  // Shadow state
  const [xOffset, setXOffset] = useState<number>(0);
  const [yOffset, setYOffset] = useState<number>(10);
  const [blur, setBlur] = useState<number>(25);
  const [spread, setSpread] = useState<number>(-5);
  const [shadowColor, setShadowColor] = useState<string>('rgba(0, 0, 0, 0.5)');

  const shadowCss = `${xOffset}px ${yOffset}px ${blur}px ${spread}px ${shadowColor}`;

  const flexCss = `display: flex;
flex-direction: ${direction};
justify-content: ${justify};
align-items: ${align};
gap: ${gap}px;`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onNotify(`Copied ${label}`);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-center p-1 bg-zinc-800 rounded-lg">
          <button
            onClick={() => setTab('flex')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              tab === 'flex' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Flexbox Playground
          </button>
          <button
            onClick={() => setTab('shadow')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              tab === 'shadow' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Box-Shadow Generator
          </button>
        </div>
      </div>

      {tab === 'flex' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Controls */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-4">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Flex Properties</span>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Direction</label>
              <div className="grid grid-cols-2 gap-2">
                {(['row', 'column'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    className={`py-1.5 text-xs rounded-md font-mono cursor-pointer ${
                      direction === d ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Justify Content</label>
              <select
                value={justify}
                onChange={e => setJustify(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-xs text-zinc-200"
              >
                <option value="flex-start">flex-start</option>
                <option value="center">center</option>
                <option value="flex-end">flex-end</option>
                <option value="space-between">space-between</option>
                <option value="space-around">space-around</option>
                <option value="space-evenly">space-evenly</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Align Items</label>
              <select
                value={align}
                onChange={e => setAlign(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-xs text-zinc-200"
              >
                <option value="flex-start">flex-start</option>
                <option value="center">center</option>
                <option value="flex-end">flex-end</option>
                <option value="stretch">stretch</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Gap ({gap}px)</span>
              </div>
              <input
                type="range"
                min="0"
                max="48"
                value={gap}
                onChange={e => setGap(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Item Count ({itemCount})</span>
              </div>
              <input
                type="range"
                min="2"
                max="8"
                value={itemCount}
                onChange={e => setItemCount(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Live Preview Container */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-xl min-h-[300px] flex overflow-hidden">
              <div
                className="w-full h-full border border-dashed border-zinc-800 p-4 rounded-lg min-h-[260px]"
                style={{
                  display: 'flex',
                  flexDirection: direction,
                  justifyContent: justify,
                  alignItems: align,
                  gap: `${gap}px`,
                }}
              >
                {Array.from({ length: itemCount }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-semibold flex items-center justify-center min-w-[60px] min-h-[60px]"
                  >
                    Box #{i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Generated CSS */}
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
              <pre className="font-mono text-xs text-emerald-400 whitespace-pre">{flexCss}</pre>
              <button
                onClick={() => handleCopy(flexCss, 'Flexbox CSS')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy CSS</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Box Shadow Generator */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-4">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Shadow Parameters</span>

            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>X Offset ({xOffset}px)</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={xOffset}
                onChange={e => setXOffset(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Y Offset ({yOffset}px)</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={yOffset}
                onChange={e => setYOffset(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Blur Radius ({blur}px)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={blur}
                onChange={e => setBlur(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Spread Radius ({spread}px)</span>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                value={spread}
                onChange={e => setSpread(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="p-12 bg-zinc-950 border border-zinc-800 rounded-xl min-h-[300px] flex items-center justify-center">
              <div
                className="w-48 h-32 bg-zinc-900 border border-zinc-700/60 rounded-xl flex items-center justify-center text-xs font-medium text-zinc-300"
                style={{
                  boxShadow: shadowCss,
                }}
              >
                Target Element
              </div>
            </div>

            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
              <pre className="font-mono text-xs text-emerald-400">box-shadow: {shadowCss};</pre>
              <button
                onClick={() => handleCopy(`box-shadow: ${shadowCss};`, 'Box Shadow CSS')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy CSS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
