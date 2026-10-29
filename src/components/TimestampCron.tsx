import React, { useState, useEffect } from 'react';
import { Copy, Clock, Calendar, RefreshCw } from 'lucide-react';

interface TimestampCronProps {
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const CRON_PRESETS = [
  { label: 'Every 5 min', expr: '*/5 * * * *', desc: 'Every 5 minutes' },
  { label: 'Every hour', expr: '0 * * * *', desc: 'At the start of every hour' },
  { label: 'Daily at midnight', expr: '0 0 * * *', desc: 'At 00:00 every day' },
  { label: 'Weekdays at 9am', expr: '0 9 * * 1-5', desc: 'At 09:00, Monday through Friday' },
  { label: 'Sunday midnight', expr: '0 0 * * 0', desc: 'Every Sunday at 00:00' },
];

export const TimestampCron: React.FC<TimestampCronProps> = ({ onNotify }) => {
  const [currentNow, setCurrentNow] = useState<Date>(new Date());

  // Timestamp converter
  const [epochInput, setEpochInput] = useState<string>(Math.floor(Date.now() / 1000).toString());
  const [humanDateInput, setHumanDateInput] = useState<string>(new Date().toISOString().slice(0, 19));

  // Cron parser
  const [cronExpr, setCronExpr] = useState<string>('*/15 * * * *');

  useEffect(() => {
    const timer = setInterval(() => setCurrentNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const parsedDate = React.useMemo(() => {
    let num = parseInt(epochInput.trim(), 10);
    if (isNaN(num)) return null;
    // Check if seconds or milliseconds
    if (epochInput.trim().length <= 10) {
      num *= 1000;
    }
    const d = new Date(num);
    return isNaN(d.getTime()) ? null : d;
  }, [epochInput]);

  const convertedEpoch = React.useMemo(() => {
    const d = new Date(humanDateInput);
    if (isNaN(d.getTime())) return null;
    return {
      seconds: Math.floor(d.getTime() / 1000),
      millis: d.getTime(),
    };
  }, [humanDateInput]);

  const describeCron = (expr: string): string => {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) {
      return 'Standard cron format requires 5 fields: minute hour day-of-month month day-of-week';
    }
    const [min, hour, dom, mon, dow] = parts;
    const descParts: string[] = [];

    if (min.startsWith('*/')) descParts.push(`every ${min.slice(2)} minutes`);
    else if (min === '*') descParts.push('every minute');
    else descParts.push(`at minute ${min}`);

    if (hour.startsWith('*/')) descParts.push(`every ${hour.slice(2)} hours`);
    else if (hour !== '*') descParts.push(`past hour ${hour}`);

    if (dom !== '*') descParts.push(`on day-of-month ${dom}`);
    if (mon !== '*') descParts.push(`in month ${mon}`);
    if (dow !== '*') descParts.push(`on day-of-week ${dow}`);

    return descParts.join(', ');
  };

  const handleCopy = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    onNotify(`Copied ${label}`);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Live Clock Bar */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-900/50">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 uppercase font-semibold">Live System Time</span>
            <p className="text-sm font-mono text-zinc-100 font-bold mt-0.5">
              {currentNow.toUTCString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-zinc-500 block text-[10px]">Unix Epoch (sec)</span>
            <span
              onClick={() => handleCopy(Math.floor(currentNow.getTime() / 1000).toString(), 'Current Epoch')}
              className="text-emerald-400 font-bold hover:underline cursor-pointer"
            >
              {Math.floor(currentNow.getTime() / 1000)}
            </span>
          </div>
          <div className="h-6 w-px bg-zinc-800" />
          <div>
            <span className="text-zinc-500 block text-[10px]">Local Time</span>
            <span className="text-zinc-300">{currentNow.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Epoch Converter Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Epoch to Date */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-3">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Epoch Timestamp to Human Date
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={epochInput}
              onChange={e => setEpochInput(e.target.value)}
              placeholder="e.g. 1761579600"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => setEpochInput(Math.floor(Date.now() / 1000).toString())}
              className="px-2.5 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            >
              Now
            </button>
          </div>

          {parsedDate ? (
            <div className="mt-2 space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">ISO 8601</span>
                  <span className="text-emerald-400">{parsedDate.toISOString()}</span>
                </div>
                <button
                  onClick={() => handleCopy(parsedDate.toISOString(), 'ISO timestamp')}
                  className="p-1 text-zinc-500 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Local Format</span>
                  <span className="text-zinc-200">{parsedDate.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => handleCopy(parsedDate.toLocaleString(), 'Local date')}
                  className="p-1 text-zinc-500 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-rose-400 italic">Invalid numeric timestamp</div>
          )}
        </div>

        {/* Date to Epoch */}
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-3">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Date to Epoch Timestamp
          </span>
          <input
            type="datetime-local"
            value={humanDateInput}
            onChange={e => setHumanDateInput(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
          />

          {convertedEpoch ? (
            <div className="mt-2 space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Seconds</span>
                  <span className="text-emerald-400 font-bold">{convertedEpoch.seconds}</span>
                </div>
                <button
                  onClick={() => handleCopy(convertedEpoch.seconds.toString(), 'Epoch seconds')}
                  className="p-1 text-zinc-500 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Milliseconds</span>
                  <span className="text-indigo-400 font-bold">{convertedEpoch.millis}</span>
                </div>
                <button
                  onClick={() => handleCopy(convertedEpoch.millis.toString(), 'Epoch milliseconds')}
                  className="p-1 text-zinc-500 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-rose-400 italic">Invalid date input</div>
          )}
        </div>
      </div>

      {/* Cron Expression Inspector */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-3">
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          Cron Expression Inspector
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={cronExpr}
            onChange={e => setCronExpr(e.target.value)}
            placeholder="* * * * *"
            className="flex-1 min-w-[200px] bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-zinc-200">{describeCron(cronExpr)}</span>
          </div>
          <button
            onClick={() => handleCopy(cronExpr, 'Cron expression')}
            className="p-1 text-zinc-500 hover:text-white"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/60">
          <span className="text-xs text-zinc-500">Presets:</span>
          {CRON_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => {
                setCronExpr(p.expr);
                onNotify(`Loaded "${p.label}"`);
              }}
              className="text-xs text-zinc-400 hover:text-indigo-300 hover:underline cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
