import React, { useState } from 'react';
import { TOOLS_DATA } from '../data/toolsData';
import { ToolItem } from '../types';
import * as LucideIcons from 'lucide-react';
import { Search, ChevronLeft, LayoutGrid, Radio, Wrench } from 'lucide-react';

interface SidebarProps {
  currentToolId: string | null;
  onSelectTool: (id: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentToolId,
  onSelectTool,
  isOpen,
  onClose,
}) => {
  const [filter, setFilter] = useState<string>('');

  const filtered = TOOLS_DATA.filter(t =>
    t.name.toLowerCase().includes(filter.toLowerCase()) ||
    t.category.toLowerCase().includes(filter.toLowerCase())
  );

  const renderIcon = (iconName: string) => {
    const Comp = (LucideIcons as any)[iconName] || Wrench;
    return <Comp className="w-4 h-4 shrink-0" />;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-zinc-800 flex items-center justify-between">
          <button
            onClick={() => {
              onSelectTool(null);
              onClose();
            }}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              DP
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                DevPulse
              </span>
              <span className="text-[10px] text-zinc-500 block -mt-0.5">Developer Hub</span>
            </div>
          </button>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filter */}
        <div className="p-3 border-b border-zinc-800/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter tools..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {/* Overview item */}
          <button
            onClick={() => {
              onSelectTool(null);
              onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentToolId === null
                ? 'bg-zinc-850 text-indigo-400 border border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span>All Tools Overview</span>
          </button>

          <div className="pt-2 pb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Available Tools
          </div>

          {filtered.map(tool => {
            const isActive = currentToolId === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  onSelectTool(tool.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {renderIcon(tool.iconName)}
                  <span className="truncate">{tool.name}</span>
                </div>
                {tool.id === 'bridge' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Localhost:5175 shortcut */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/60">
          <button
            onClick={() => {
              onSelectTool('bridge');
              onClose();
            }}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-left transition-colors cursor-pointer group"
          >
            <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="text-xs font-medium text-zinc-200 block truncate group-hover:text-white">
                Localhost:5175 Sync
              </span>
              <span className="text-[10px] text-zinc-500 truncate block">Import local project</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
