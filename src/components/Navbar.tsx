import React from 'react';
import { Menu, Share2, Radio, ExternalLink, Copy } from 'lucide-react';
import { TOOLS_DATA } from '../data/toolsData';

interface NavbarProps {
  currentToolId: string | null;
  onOpenSidebar: () => void;
  onSelectTool: (id: string | null) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentToolId,
  onOpenSidebar,
  onSelectTool,
  onNotify,
}) => {
  const activeTool = TOOLS_DATA.find(t => t.id === currentToolId);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    onNotify('Copied link to current view');
  };

  return (
    <header className="h-14 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => onSelectTool(null)}
            className="text-zinc-400 hover:text-zinc-200 transition-colors font-medium cursor-pointer"
          >
            Tools
          </button>
          {activeTool && (
            <>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-100 font-semibold">{activeTool.name}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Localhost bridge badge button */}
        <button
          onClick={() => onSelectTool('bridge')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
            currentToolId === 'bridge'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 font-semibold'
              : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-300'
          }`}
          title="Connect or troubleshoot localhost:5175"
        >
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Localhost:5175 Bridge</span>
          <span className="sm:hidden">Bridge</span>
        </button>

        {/* Share current hash link */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 transition-colors cursor-pointer"
          title="Share current URL"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </header>
  );
};
