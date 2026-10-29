import React, { useState } from 'react';
import { Send, Copy, Globe, Terminal } from 'lucide-react';

interface HttpCurlTesterProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const HttpCurlTester: React.FC<HttpCurlTesterProps> = ({ onNotify }) => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [url, setUrl] = useState<string>('https://jsonplaceholder.typicode.com/todos/1');
  const [headers, setHeaders] = useState<string>('{\n  "Accept": "application/json"\n}');
  const [body, setBody] = useState<string>('{\n  "title": "New Task",\n  "completed": false\n}');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<{
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    data?: any;
    timeMs?: number;
    error?: string;
  } | null>(null);

  const curlCommand = React.useMemo(() => {
    let cmd = `curl -X ${method} "${url}"`;
    try {
      const parsedH = JSON.parse(headers);
      for (const [k, v] of Object.entries(parsedH)) {
        cmd += ` \\\n  -H "${k}: ${v}"`;
      }
    } catch {}

    if (method !== 'GET' && body.trim()) {
      cmd += ` \\\n  -d '${body.replace(/'/g, "\\'")}'`;
    }
    return cmd;
  }, [method, url, headers, body]);

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    const start = performance.now();

    try {
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(headers);
      } catch {}

      const options: RequestInit = {
        method,
        headers: parsedHeaders,
      };

      if (method !== 'GET' && body.trim()) {
        options.body = body;
      }

      const res = await fetch(url, options);
      const timeMs = Math.round(performance.now() - start);

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        resHeaders[k] = v;
      });

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        data,
        timeMs,
      });
      onNotify(`Response: ${res.status} ${res.statusText}`);
    } catch (err: any) {
      const timeMs = Math.round(performance.now() - start);
      setResponse({
        error: `${err.message} (Note: Browser CORS rules apply to direct client-side fetch requests)`,
        timeMs,
      });
      onNotify('Request failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onNotify(`Copied ${label}`);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* URL and Method Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
        <select
          value={method}
          onChange={e => setMethod(e.target.value as any)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 font-mono text-xs font-bold rounded-lg px-3 py-2 cursor-pointer focus:outline-none"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>

        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://api.example.com/v1/..."
          className="flex-1 min-w-[240px] bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{loading ? 'Sending...' : 'Send'}</span>
        </button>
      </div>

      {/* cURL Display */}
      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 overflow-hidden">
          <Terminal className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
          <pre className="font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre">{curlCommand}</pre>
        </div>
        <button
          onClick={() => handleCopy(curlCommand, 'cURL command')}
          className="shrink-0 p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
          title="Copy cURL"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Parameters Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Request Config */}
        <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Headers (JSON)
          </div>
          <textarea
            value={headers}
            onChange={e => setHeaders(e.target.value)}
            className="w-full h-32 p-3 bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
          {method !== 'GET' && (
            <>
              <div className="px-4 py-2 border-t border-b border-zinc-800 bg-zinc-900/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Body Payload (JSON)
              </div>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full h-36 p-3 bg-transparent font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </>
          )}
        </div>

        {/* Response View */}
        <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Response</span>
            {response && (
              <div className="flex items-center gap-3 text-xs font-mono">
                {response.status && (
                  <span
                    className={
                      response.status >= 200 && response.status < 300
                        ? 'text-emerald-400 font-bold'
                        : 'text-rose-400 font-bold'
                    }
                  >
                    {response.status} {response.statusText}
                  </span>
                )}
                {response.timeMs !== undefined && (
                  <span className="text-zinc-500">{response.timeMs}ms</span>
                )}
              </div>
            )}
          </div>
          <div className="w-full h-72 p-4 overflow-auto bg-zinc-950 font-mono text-xs text-zinc-300 leading-relaxed select-text">
            {response ? (
              response.error ? (
                <div className="text-rose-400">{response.error}</div>
              ) : (
                <pre className="text-emerald-400">
                  {typeof response.data === 'object'
                    ? JSON.stringify(response.data, null, 2)
                    : String(response.data)}
                </pre>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">
                Send request above to view status and JSON body...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
