import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, Sparkles, Terminal, Wrench } from 'lucide-react';
import { TOOLS_DATA } from '../data/toolsData';
import { ToolCategory, ToolItem } from '../types';
import * as LucideIcons from 'lucide-react';

interface ToolsOverviewProps {
  onSelectTool: (id: string) => void;
}

const CATEGORIES: { id: ToolCategory; label: string }[] = [
  { id: 'all', label: 'All Utilities' },
  { id: 'formatters', label: 'Formatters' },
  { id: 'converters', label: 'Converters' },
  { id: 'inspectors', label: 'Inspectors' },
  { id: 'generators', label: 'Generators' },
  { id: 'security', label: 'Security' },
  { id: 'web', label: 'Web & API' },
];

export const ToolsOverview: React.FC<ToolsOverviewProps> = ({ onSelectTool }) => {
  const [search, setSearch] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<ToolCategory>('all');

  const filteredTools = useMemo(() => {
    return TOOLS_DATA.filter(tool => {
      const matchesCategory = selectedCat === 'all' || tool.category === selectedCat;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords.some(k => k.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCat]);

  // Helper to render lucide icon dynamically
  const renderIcon = (name: string) => {
    const IconComponent = (LucideIcons as any)[name] || Wrench;
    return <IconComponent className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Developer Workbench Suite</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
            All-in-One Developer Utilities
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-2 leading-relaxed">
            Fast, zero-latency tools directly in your browser. Inspect tokens, diff code, format JSON & SQL, generate UUIDs, calculate hashes, test regex, and bridge with local environments.
          </p>
        </div>

        {/* Search input in banner */}
        <div className="mt-6 max-w-md relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tools (e.g. json, regex, jwt, diff, base64, hash)..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              selectedCat === cat.id
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTools.map(tool => (
          <div
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className="group p-5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700/80 rounded-xl transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                {renderIcon(tool.iconName)}
              </div>
              <span className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400">
                {tool.hash}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                {tool.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                {tool.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
              <span className="text-zinc-500 capitalize">{tool.category}</span>
              <div className="flex items-center gap-1 text-indigo-400 group-hover:translate-x-0.5 transition-transform font-medium">
                <span>Launch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800/60 rounded-xl text-zinc-500 text-xs">
          No tools matched your search "{search}". Try searching for "json", "diff", or "token".
        </div>
      )}
    </div>
  );
};
