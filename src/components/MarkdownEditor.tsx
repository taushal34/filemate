import React, { useState } from 'react';
import { Copy, Eye, FileText, Code2 } from 'lucide-react';

interface MarkdownEditorProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const SAMPLE_MD = `# DevPulse Developer Suite

DevPulse provides high-performance web engineering tools directly in your browser.

## Key Features
- **Zero Overhead**: Client-side execution with zero latency
- **JSON & TypeScript**: Real-time typing & schema generation
- **Cryptographic Tools**: Hashes, UUIDs, and JWT claim verification
- **CSS Playgrounds**: Flexbox, box shadows, and color accessibility

### Code Example
\`\`\`typescript
const greeting = "Hello, Developer!";
console.log(greeting);
\`\`\`

> *"Tools crafted with precision for developers who care about speed and polish."*

| Feature | Support |
| :--- | :--- |
| Client Crypto | WebCrypto Native |
| Formatters | Realtime |
`;

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ onNotify }) => {
  const [content, setContent] = useState<string>(SAMPLE_MD);

  // Simple clean markdown parser for rendering
  const renderSimpleMarkdown = (md: string) => {
    const lines = md.split('\n');
    let inCode = false;
    let codeContent: string[] = [];
    const elements: React.ReactNode[] = [];

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (inCode) {
          elements.push(
            <pre key={`code-${i}`} className="p-3 my-2 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-emerald-400 overflow-x-auto">
              {codeContent.join('\n')}
            </pre>
          );
          codeContent = [];
          inCode = false;
        } else {
          inCode = true;
        }
        return;
      }

      if (inCode) {
        codeContent.push(line);
        return;
      }

      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-xl font-bold text-zinc-100 my-2 pb-1 border-b border-zinc-800">{line.slice(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-lg font-semibold text-zinc-200 mt-4 mb-2">{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-sm font-semibold text-zinc-300 mt-3 mb-1">{line.slice(4)}</h3>);
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={i} className="pl-3 border-l-2 border-indigo-500 text-zinc-400 italic my-2">
            {line.slice(2)}
          </blockquote>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={i} className="list-disc ml-5 text-xs text-zinc-300 my-0.5">
            {line.slice(2)}
          </li>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      } else {
        elements.push(<p key={i} className="text-xs text-zinc-300 leading-relaxed my-1">{line}</p>);
      }
    });

    return elements;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(content);
    onNotify('Copied Markdown');
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>{content.length} characters</span>
          <span>·</span>
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setContent(SAMPLE_MD)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          >
            Load Sample
          </button>
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy MD</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Markdown Source
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full h-96 p-4 bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Live Preview */}
        <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Rendered Preview
          </div>
          <div className="w-full h-96 p-4 overflow-auto bg-zinc-950 select-text">
            {renderSimpleMarkdown(content)}
          </div>
        </div>
      </div>
    </div>
  );
};
