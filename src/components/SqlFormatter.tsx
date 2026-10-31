import React, { useState } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { formatSql } from '../utils/formatters';

interface SqlFormatterProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const SAMPLE_SQL = `select u.id, u.username, u.email, count(o.id) as order_count, sum(o.total_amount) as total_spent from users u left join orders o on u.id = o.user_id where u.status = 'active' and u.created_at >= '2026-01-01' group by u.id, u.username, u.email having count(o.id) > 2 order by total_spent desc limit 50;`;

export const SqlFormatter: React.FC<SqlFormatterProps> = ({ onNotify }) => {
  const [input, setInput] = useState<string>(SAMPLE_SQL);
  const [output, setOutput] = useState<string>(formatSql(SAMPLE_SQL));

  const handleFormat = (custom?: string) => {
    const text = custom !== undefined ? custom : input;
    const formatted = formatSql(text);
    setOutput(formatted);
    onNotify('SQL query formatted');
  };

  const handleMinify = () => {
    const minified = input.replace(/\s+/g, ' ').trim();
    setOutput(minified);
    onNotify('SQL minified');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    onNotify('Copied SQL to clipboard');
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFormat()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
          >
            Format SQL
          </button>
          <button
            onClick={handleMinify}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            Minify Single-Line
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setInput(SAMPLE_SQL);
              handleFormat(SAMPLE_SQL);
            }}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          >
            Sample Query
          </button>
          <button
            onClick={() => {
              setInput('');
              setOutput('');
            }}
            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Raw SQL Input</span>
            <span className="text-xs text-zinc-500 font-mono">{input.length} chars</span>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste raw SQL query..."
            className="w-full h-80 p-4 bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Formatted Output</span>
            <button
              onClick={handleCopy}
              disabled={!output}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
          <div className="w-full h-80 p-4 overflow-auto bg-zinc-950 font-mono text-xs text-emerald-400 whitespace-pre leading-relaxed select-text">
            {output || <span className="text-zinc-600 italic">Formatted SQL will appear here...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
