import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-line px-5 py-12 transition-colors">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-mute">
        <a href="#top" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-fg">
          <svg width="20" height="24" viewBox="0 0 24 28" aria-hidden="true" className="shrink-0">
            <path d="M2 1h14l6 6v20H2z" className="fill-coral" />
            <path d="M16 1v6h6z" className="fill-glow" />
            <circle cx="9" cy="18" r="1.6" className="fill-ink" />
            <circle cx="17" cy="18" r="1.6" className="fill-ink" />
          </svg>
          <span>filemate</span>
        </a>

        <p className="text-xs sm:text-sm">
          Free and open source. Made to run on your device.
        </p>

        <div className="flex items-center gap-4 text-xs font-medium">
          <a href="#tools" className="hover:text-fg transition-colors">Tools</a>
          <span>·</span>
          <a href="#privacy" className="hover:text-fg transition-colors">Privacy</a>
          <span>·</span>
          <a href="#top" className="hover:text-fg transition-colors">Back to top</a>
        </div>
      </div>
    </footer>
  );
};
