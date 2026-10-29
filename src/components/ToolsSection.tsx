import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { TOOLS, CATEGORIES, ToolDefinition } from '../data/tools';

interface ToolsSectionProps {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  recentToolIds: string[];
  onOpenTool: (tool: ToolDefinition) => void;
}

export const ToolsSection: React.FC<ToolsSectionProps> = ({
  activeCategory,
  onSelectCategory,
  recentToolIds,
  onOpenTool,
}) => {
  const [search, setSearch] = useState<string>('');

  const filteredTools = TOOLS.filter(t => {
    const matchCat = activeCategory === 'All' || t.cat === activeCategory;
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.cat.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const recentTools = recentToolIds
    .map(id => TOOLS.find(t => t.id === id))
    .filter((t): t is ToolDefinition => Boolean(t));

  return (
    <section id="tools" className="mx-auto max-w-7xl scroll-mt-16 px-5 py-20">
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Sticky Column */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-display text-5xl font-bold tracking-tight text-fg">Tools</h2>

          {/* Search bar */}
          <label className="mt-6 flex items-center gap-3 border-b border-fg py-2">
            <Search size={18} className="text-mute" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tools"
              className="w-full bg-transparent outline-none placeholder:text-mute text-sm text-fg"
            />
          </label>

          {/* Category Pills */}
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'border-coral bg-coral text-onacc font-medium'
                    : 'border-line text-mute hover:border-fg hover:text-fg'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Recently Used */}
          {recentTools.length > 0 && (
            <div className="mt-8 pt-6 border-t border-line">
              <p className="text-xs font-semibold text-mute uppercase tracking-wider">Recently used</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {recentTools.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onOpenTool(t)}
                    className="rounded-full border border-accent px-3.5 py-1 text-xs text-accent hover:bg-pink hover:text-ink transition-colors cursor-pointer"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Tools List Column */}
        <ul className="lg:col-span-8 divide-y divide-line">
          {filteredTools.map(tool => (
            <li key={tool.id} className="border-t border-line last:border-b">
              <button
                disabled={tool.soon}
                onClick={() => onOpenTool(tool)}
                className="group flex w-full items-baseline justify-between gap-4 py-6 text-left disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <div className="pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl font-bold text-fg transition-transform group-enabled:group-hover:translate-x-2 sm:text-3xl">
                      {tool.name}
                    </span>
                    {tool.soon && (
                      <span className="text-[11px] font-mono text-mute px-2 py-0.5 rounded border border-line">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-mute leading-relaxed max-w-xl">
                    {tool.desc}
                  </p>
                </div>

                {!tool.soon && (
                  <div className="shrink-0 p-2 rounded-full border border-transparent group-hover:border-fg group-hover:bg-fg group-hover:text-bg text-mute transition-all">
                    <ArrowRight size={18} />
                  </div>
                )}
              </button>
            </li>
          ))}

          {filteredTools.length === 0 && (
            <li className="py-12 text-center text-mute text-sm">
              No tools found matching "{search}".
            </li>
          )}
        </ul>
      </div>
    </section>
  );
};
