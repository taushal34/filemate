import { useState, useRef, useMemo, useEffect, lazy, Suspense, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  Upload,
  Search,
  Download,
  Lock,
  Cpu,
  Layers,
  X,
  Sun,
  Moon,
  Check,
  AlertTriangle,
} from 'lucide-react';
import PalettePanel from './PalettePanel';
import AuthScreen, { AccountNav } from './auth/AuthScreen';
import { AUTH_PATHS, useRoute, navigate } from './auth/navigation';
import { TOOLS, CATS, stats, CASES, fmt, validate } from './tools';

const Hero3D = lazy(() => import('./Hero3D'));

const Reveal = ({ children, className = '' }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
  >
    {children}
  </motion.div>
);

function Magnetic({ children, className = '', ...p }) {
  const r = useRef();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16 });
  const sy = useSpring(y, { stiffness: 220, damping: 16 });

  return (
    <motion.button
      ref={r}
      style={{ x: sx, y: sy }}
      className={className}
      {...p}
      onMouseMove={e => {
        if (!r.current) return;
        const b = r.current.getBoundingClientRect();
        x.set((e.clientX - b.left - b.width / 2) * 0.25);
        y.set((e.clientY - b.top - b.height / 2) * 0.25);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.button>
  );
}

const Mascot = ({ mood = 'idle', size = 64 }) => (
  <svg
    width={size}
    height={size * 1.15}
    viewBox="0 0 52 60"
    aria-hidden="true"
    className={mood === 'drag' ? 'float' : ''}
  >
    <path d="M4 2h30l14 14v42H4z" className="fill-coral" />
    <path d="M34 2v14h14z" className="fill-pink" />
    <g className="blink fill-ink">
      <ellipse cx="19" cy="34" rx="3" ry={mood === 'happy' ? 1.2 : 3.5} />
      <ellipse cx="33" cy="34" rx="3" ry={mood === 'happy' ? 1.2 : 3.5} />
    </g>
    <path
      d={
        {
          idle: 'M21 44q5 4 10 0',
          drag: 'M22 43a4 4 0 1 0 8 0z',
          happy: 'M19 42q7 9 14 0',
          oops: 'M21 47q5-4 10 0',
          work: 'M22 45h8',
        }[mood]
      }
      strokeWidth="2"
      strokeLinecap="round"
      className={mood === 'drag' ? 'stroke-ink fill-ink' : 'stroke-ink fill-none'}
    />
  </svg>
);

const Burst = () => (
  <div aria-hidden="true" className="pointer-events-none relative h-0">
    {Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * 6.28;
      return (
        <motion.span
          key={i}
          className="absolute left-1/2 top-4 h-2 w-2 rounded-full bg-glow"
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: Math.cos(a) * 90, y: Math.sin(a) * 60, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      );
    })}
  </div>
);

function homeAnchor(event, target) {
  if (window.location.pathname === '/' || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault(); navigate('/');
  requestAnimationFrame(() => document.querySelector(target)?.scrollIntoView());
}

const Mark = () => (
  <a
    href="/#top"
    onClick={event => homeAnchor(event, '#top')}
    aria-label="FileMate home"
    className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-fg"
  >
    <svg width="24" height="28" viewBox="0 0 26 30" aria-hidden="true">
      <path d="M2 2h14l8 8v18H2z" className="fill-coral" />
      <path d="M16 2v8h8z" className="fill-glow" />
      <circle cx="9" cy="19" r="1.8" className="fill-ink" />
      <circle cx="17" cy="19" r="1.8" className="fill-ink" />
    </svg>
    filemate
  </a>
);

function Nav({ dark, toggle, setCat, onPal }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-5">
        <Mark />
        <nav aria-label="Categories" className="hidden gap-6 text-sm lg:flex">
          {CATS.slice(1).map(c => (
            <a
              key={c}
              href="/#tools"
              onClick={event => { setCat(c); homeAnchor(event, '#tools'); }}
              className="text-mute hover:text-accent font-medium transition-colors"
            >
              {c}
            </a>
          ))}
          <a href="/#privacy" onClick={event => homeAnchor(event, '#privacy')} className="text-mute hover:text-accent font-medium transition-colors">
            Privacy
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <AccountNav />
          <PalettePanel onChange={onPal} />
          <button
            onClick={toggle}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="grid h-10 w-10 place-items-center rounded-full border border-line hover:bg-pink hover:text-ink text-fg transition-colors cursor-pointer"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}

const OBJ = [
  { t: 'PDF', c: 'var(--acc)', l: '6%', tp: '8%', z: 90, r: -10 },
  { t: 'JPG', c: 'var(--glow)', l: '46%', tp: '30%', z: 30, r: 7 },
  { t: 'DOCX', c: 'var(--frost)', l: '18%', tp: '56%', z: -40, r: -4 },
];

function FileObj({ o, sx, sy, i }) {
  const x = useTransform(sx, v => v * o.z * 0.6);
  const y = useTransform(sy, v => v * o.z * 0.4);
  return (
    <motion.div
      style={{ x, y, left: o.l, top: o.tp, translateZ: o.z, rotate: o.r, transformStyle: 'preserve-3d' }}
      className="absolute"
    >
      <div className="float" style={{ animationDelay: `${i * -2}s` }}>
        <div
          style={{
            background: o.c,
            clipPath: 'polygon(0 0, 72% 0, 100% 22%, 100% 100%, 0 100%)',
            boxShadow: '0 30px 40px -20px rgba(0,0,0,0.4)',
          }}
          className="grid h-44 w-36 place-items-end p-4 font-display text-3xl font-bold text-ink sm:h-52 sm:w-44 select-none"
        >
          {o.t}
        </div>
      </div>
    </motion.div>
  );
}

function Hero({ pulse }) {
  // Mobile 3D Hero Fix: Enable 3D on all compatible devices (phones, tablets, desktop)
  const use3D = useMemo(() => {
    try {
      if (typeof window === 'undefined') return false;
      const c = document.createElement('canvas');
      const hasWebGL = Boolean(
        window.WebGLRenderingContext &&
          (c.getContext('webgl') || c.getContext('experimental-webgl'))
      );
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return hasWebGL && !reducedMotion;
    } catch {
      return false;
    }
  }, []);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 16 });
  const sy = useSpring(my, { stiffness: 60, damping: 16 });
  const ry = useTransform(sx, [-1, 1], [-14, 14]);
  const rx = useTransform(sy, [-1, 1], [10, -10]);

  const move = e => {
    if (e.pointerType === 'touch') return;
    const b = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - b.left) / b.width) * 2 - 1);
    my.set(((e.clientY - b.top) / b.height) * 2 - 1);
  };

  return (
    <section id="top" className="relative mx-auto grid max-w-7xl gap-6 overflow-hidden px-5 pb-10 pt-12 lg:grid-cols-12 lg:pt-20">
      <div aria-hidden className="float absolute -right-24 top-10 h-80 w-80 rounded-full bg-glow opacity-25 blur-3xl pointer-events-none" />

      <div className="relative lg:col-span-7 flex flex-col justify-center">
        <h1 className="font-display text-[clamp(3.4rem,10.5vw,9rem)] font-bold leading-[0.9] tracking-tighter text-fg">
          Your files,
          <br />
          <span className="text-accent">handled quietly.</span>
        </h1>
        <p className="mt-8 max-w-md text-lg text-mute leading-relaxed">
          Compress, convert, merge and split right here in your browser. Your files never leave this tab.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Magnetic
            onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-full bg-coral px-8 py-4 font-medium text-onacc hover:bg-pink hover:text-ink transition-colors cursor-pointer shadow-md"
          >
            Choose a tool
          </Magnetic>
          <a
            href="#privacy"
            className="border-b border-line pb-1 text-mute hover:text-accent font-medium transition-colors"
          >
            How it stays private
          </a>
        </div>
      </div>

      <div
        onPointerMove={move}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        className="relative h-[340px] sm:h-[400px] lg:col-span-5 lg:h-[460px] select-none"
        style={{ perspective: use3D ? undefined : 1000 }}
        aria-hidden
      >
        {use3D ? (
          <Suspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-line border-t-accent animate-spin" />
              </div>
            }
          >
            <Hero3D pulse={pulse} />
          </Suspense>
        ) : (
          <motion.div
            style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
            className="absolute inset-0"
          >
            {OBJ.map((o, i) => (
              <FileObj key={o.t} o={o} sx={sx} sy={sy} i={i} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function Drop({ onFiles, files }) {
  const [over, setOver] = useState(false);
  const ref = useRef();

  const sug = files.length
    ? TOOLS.filter(
        t =>
          !t.soon &&
          !t.text &&
          t.accept &&
          files.every(
            f =>
              t.accept.includes(f.type) ||
              (t.accept.includes('application/pdf') && /\.pdf$/i.test(f.name)) ||
              (t.accept.some(a => a.startsWith('image/')) && /\.(jpe?g|png|webp)$/i.test(f.name))
          ) &&
          (t.multi || files.length === 1)
      )
    : [];

  return (
    <section className="mx-auto max-w-7xl px-5 py-6">
      <div className="relative lg:ml-[16%]">
        <div aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2.5rem] bg-coral" />
        <div
          onDragOver={e => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={e => {
            e.preventDefault();
            setOver(false);
            onFiles([...e.dataTransfer.files]);
          }}
          className={`relative rounded-[2.5rem] border border-fg p-8 transition-colors sm:p-12 ${
            over ? 'bg-pink text-ink' : 'bg-bg'
          }`}
        >
          <input
            ref={ref}
            type="file"
            multiple
            hidden
            onChange={e => {
              if (e.target.files) {
                onFiles([...e.target.files]);
                e.target.value = '';
              }
            }}
          />
          <div className="absolute -top-10 right-8">
            <Mascot mood={over ? 'drag' : files.length ? 'happy' : 'idle'} size={68} />
          </div>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl text-fg">
                Drop a file. We’ll suggest what to do with it.
              </h2>
              <p className="mt-2 text-mute text-sm sm:text-base">
                PDF, JPG, PNG or WebP, up to 50 MB each.
              </p>
            </div>
            <Magnetic
              onClick={() => ref.current?.click()}
              className="flex shrink-0 items-center justify-center gap-2 rounded-full border border-fg px-6 py-3.5 hover:bg-fg hover:text-bg font-medium transition-colors cursor-pointer text-fg"
            >
              <Upload size={18} />
              <span>Browse files</span>
            </Magnetic>
          </div>

          {files.length > 0 && (
            <div className="mt-6 border-t border-line pt-5" aria-live="polite">
              <p className="text-sm text-mute">
                {files.map(f => `${f.name} (${fmt(f.size)})`).join(', ')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {sug.length ? (
                  sug.map(t => (
                    <button
                      key={t.id}
                      onClick={() => onFiles(files, t)}
                      className="rounded-full bg-coral px-5 py-2.5 text-xs sm:text-sm font-medium text-onacc hover:bg-pink hover:text-ink transition-colors cursor-pointer shadow-xs"
                    >
                      {t.name}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-accent">
                    No single tool takes this exact mix of files. Try one format at a time.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Tools({ cat, setCat, open, recent }) {
  const [q, setQ] = useState('');
  const list = TOOLS.filter(
    t =>
      (cat === 'All' || t.cat === cat) &&
      (t.name + t.desc).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section id="tools" className="mx-auto max-w-7xl scroll-mt-16 px-5 py-20">
      <Reveal className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-display text-5xl font-bold tracking-tight text-fg">Tools</h2>
          <label className="mt-6 flex items-center gap-3 border-b border-fg py-2">
            <Search size={18} aria-hidden className="text-mute" />
            <span className="sr-only">Search tools</span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search tools"
              className="w-full bg-transparent outline-none placeholder:text-mute text-sm text-fg"
            />
          </label>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {CATS.map(c => (
              <button
                key={c}
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors cursor-pointer ${
                  cat === c ? 'border-coral bg-coral text-onacc font-medium' : 'border-line text-mute hover:border-fg hover:text-fg'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {recent.length > 0 && (
            <div className="mt-8 pt-6 border-t border-line">
              <p className="text-xs font-semibold text-mute uppercase tracking-wider">Recently used</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {recent
                  .map(id => TOOLS.find(t => t.id === id))
                  .filter(Boolean)
                  .map(t => (
                    <button
                      key={t.id}
                      onClick={() => open(t)}
                      className="rounded-full border border-accent px-3.5 py-1 text-xs text-accent hover:bg-pink hover:text-ink transition-colors cursor-pointer"
                    >
                      {t.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <ul className="lg:col-span-8 divide-y divide-line">
          {list.map(t => (
            <li key={t.id} className="border-t border-line last:border-b">
              <button
                disabled={t.soon}
                onClick={() => open(t)}
                className="group flex w-full items-baseline justify-between gap-4 py-6 text-left disabled:opacity-55 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <div>
                  <span className="font-display text-2xl font-bold text-fg transition-transform group-enabled:group-hover:translate-x-2 sm:text-3xl block">
                    {t.name}
                  </span>
                  <span className="mt-1 block max-w-lg text-sm text-mute leading-relaxed">
                    {t.desc}
                  </span>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    t.soon ? 'border border-line text-mute' : 'bg-pink text-ink'
                  }`}
                >
                  {t.soon ? 'Coming soon' : t.cat}
                </span>
              </button>
            </li>
          ))}
          {!list.length && (
            <li className="border-t border-line py-10 text-mute text-sm">
              Nothing matches “{q}”. Clear the search or pick another category.
            </li>
          )}
        </ul>
      </Reveal>
    </section>
  );
}

function Field({ f, v, set }) {
  const c = 'mt-1 w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-xs text-fg focus:outline-none focus:border-fg';
  return (
    <label className="block text-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-fg">{f.label}</span>
        {f.type === 'range' && <span className="font-mono text-xs font-bold text-accent">{v}%</span>}
      </div>
      {f.type === 'select' ? (
        <select className={c} value={v} onChange={e => set(e.target.value)}>
          {f.options.map(([a, b]) => (
            <option className="text-ink" key={a} value={a}>
              {b}
            </option>
          ))}
        </select>
      ) : f.type === 'range' ? (
        <input
          className="mt-2 w-full accent-coral cursor-pointer"
          type="range"
          min={f.min}
          max={f.max}
          value={v}
          onChange={e => set(e.target.value)}
        />
      ) : (
        <input
          className={c}
          type={f.type}
          min={f.min}
          max={f.max}
          value={v}
          onChange={e => set(e.target.value)}
        />
      )}
    </label>
  );
}

function TextTool({ tool }) {
  const [t, setT] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!t) return;
    navigator.clipboard?.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <label className="sr-only" htmlFor="tx">
        Your text
      </label>
      <textarea
        id="tx"
        value={t}
        onChange={e => setT(e.target.value)}
        rows={8}
        placeholder="Paste or type here"
        className="w-full rounded-2xl border border-line bg-card p-4 text-sm text-fg placeholder:text-mute focus:outline-none focus:border-fg transition-colors resize-none leading-relaxed"
      />
      {tool.text === 'count' ? (
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats(t).map(([k, v]) => (
            <div key={k} className="border-t border-line pt-2">
              <dd className="font-display text-3xl font-bold text-fg">{v}</dd>
              <dt className="text-xs text-mute mt-1">{k}</dt>
            </div>
          ))}
        </dl>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(CASES).map(([k, fn]) => (
              <button
                key={k}
                onClick={() => setT(fn(t))}
                className="rounded-full border border-line px-4 py-2 text-xs font-medium text-fg hover:bg-pink hover:text-ink transition-colors cursor-pointer"
              >
                {k}
              </button>
            ))}
          </div>
          <button
            onClick={handleCopy}
            disabled={!t}
            className="flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-medium text-onacc hover:bg-pink hover:text-ink disabled:opacity-40 transition-colors cursor-pointer self-start"
          >
            {copied ? <Check size={16} /> : null}
            <span>{copied ? 'Copied to clipboard!' : 'Copy text'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Workspace({ tool, pre, close }) {
  const [files, setFiles] = useState(pre || []);
  const [o, setO] = useState(() =>
    Object.fromEntries((tool.opts || []).map(x => [x.k, x.def]))
  );
  const [st, setSt] = useState({ busy: false, p: 0, err: '', res: [] });
  const ref = useRef();

  const urls = useMemo(() => st.res.map(r => URL.createObjectURL(r.blob)), [st.res]);
  useEffect(() => () => urls.forEach(URL.revokeObjectURL), [urls]);

  // Prevent background scrolling while modal is active
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Safe close confirmation to prevent accidental loss of work
  const handleSafeClose = useCallback(() => {
    if (st.busy) {
      if (!window.confirm('A file operation is currently running. Discard and cancel?')) {
        return;
      }
    } else if (files.length > 0 && st.res.length === 0) {
      if (!window.confirm('Discard selected files and close?')) {
        return;
      }
    }
    close();
  }, [st.busy, files.length, st.res.length, close]);

  // Keyboard Escape listener
  useEffect(() => {
    const k = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [handleSafeClose]);

  const add = l => {
    const n = tool.multi ? [...files, ...l] : l.slice(0, 1);
    const err = tool.accept && validate(n, tool);
    if (err) {
      setSt(s => ({ ...s, err }));
    } else {
      setFiles(n);
      setSt({ busy: false, p: 0, err: '', res: [] });
    }
  };

  const removeFile = idx => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setSt({ busy: false, p: 0, err: '', res: [] });
  };

  const run = async () => {
    if (st.busy || !files.length || !tool.run) return;
    setSt({ busy: true, p: 0, err: '', res: [] });
    await new Promise(r => setTimeout(r, 40));

    try {
      const res = await tool.run(files, o, p => setSt(s => ({ ...s, p })));
      setSt({ busy: false, p: 1, err: '', res });
    } catch (e) {
      setSt({
        busy: false,
        p: 0,
        err: e.message || 'Something went wrong. Check the file and try again.',
        res: [],
      });
    }
  };

  const saved = Math.round(
    (1 -
      st.res.reduce((a, r) => a + r.blob.size, 0) /
        (files.reduce((a, f) => a + f.size, 0) || 1)) *
      100
  );

  return (
    <motion.div
      className="fixed inset-0 z-40 flex justify-end bg-ink/50 backdrop-blur-xs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // DO NOT close on accidental outside click!
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={tool.name}
        onClick={e => e.stopPropagation()}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 260 }}
        className="h-full w-full max-w-xl overflow-y-auto bg-bg p-6 sm:p-10 shadow-2xl border-l border-line text-fg"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-fg">
            {tool.name}
          </h2>
          <button
            onClick={handleSafeClose}
            aria-label="Close tool"
            className="grid h-10 w-10 place-items-center rounded-full border border-line hover:bg-pink hover:text-ink text-fg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-2 text-mute text-sm leading-relaxed">{tool.desc}</p>

        <div className="mt-8">
          {tool.text ? (
            <TextTool tool={tool} />
          ) : (
            <>
              <input
                ref={ref}
                type="file"
                hidden
                multiple={tool.multi}
                accept={tool.accept?.join(',')}
                onChange={e => {
                  if (e.target.files) {
                    add([...e.target.files]);
                    e.target.value = '';
                  }
                }}
              />

              <button
                onClick={() => ref.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  add([...e.dataTransfer.files]);
                }}
                className="w-full rounded-2xl border border-dashed border-fg p-8 text-center hover:bg-pink hover:text-ink transition-colors cursor-pointer group"
              >
                <Upload className="mx-auto mb-2 text-mute group-hover:text-ink" size={22} />
                <span className="text-sm font-medium">
                  {files.length ? 'Add or replace files' : `Choose or drop ${tool.kind}`}
                </span>
              </button>

              {files.length > 0 && (
                <ul className="mt-4 divide-y divide-line text-sm border-t border-b border-line">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="truncate max-w-[260px] font-mono text-xs text-fg">
                        {f.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-mute">{fmt(f.size)}</span>
                        <button
                          onClick={() => removeFile(i)}
                          className="text-mute hover:text-rose-500 p-1 text-xs cursor-pointer"
                          title="Remove this file"
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {tool.opts && (
                <div className="mt-6 grid gap-4">
                  {tool.opts.map(f => (
                    <Field key={f.k} f={f} v={o[f.k]} set={v => setO({ ...o, [f.k]: v })} />
                  ))}
                </div>
              )}

              <Magnetic
                disabled={!files.length || st.busy}
                onClick={run}
                className="mt-6 w-full rounded-full bg-coral py-4 font-medium text-onacc disabled:opacity-40 hover:bg-pink hover:text-ink transition-colors cursor-pointer shadow-md text-sm"
              >
                {st.busy ? 'Working…' : 'Run'}
              </Magnetic>

              {st.busy && (
                <div
                  role="progressbar"
                  aria-valuenow={Math.round(st.p * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-4 h-1.5 overflow-hidden rounded bg-line"
                >
                  <div
                    className="h-full bg-coral transition-all duration-150"
                    style={{ width: `${Math.max(8, st.p * 100)}%` }}
                  />
                </div>
              )}

              {st.err && (
                <p role="alert" className="mt-4 flex items-center gap-2 text-accent text-xs">
                  <Mascot mood="oops" size={32} />
                  <span>{st.err}</span>
                </p>
              )}

              {st.res.length > 0 && (
                <div aria-live="polite" className="mt-6 pt-4 border-t border-line">
                  <Burst />
                  <div className="flex items-center gap-3">
                    <Mascot mood="happy" size={40} />
                    <h3 className="font-display text-xl font-bold text-fg">
                      {tool.id === 'compress' && saved > 0
                        ? `Squeezed it down ${saved}%!`
                        : 'Done. Files stay on your device.'}
                    </h3>
                  </div>
                  <ul className="mt-3 divide-y divide-line">
                    {st.res.map((r, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <span className="truncate text-xs font-mono font-medium text-fg">
                          {r.name} <span className="text-mute">({fmt(r.blob.size)})</span>
                        </span>
                        <a
                          href={urls[i]}
                          download={r.name}
                          className="flex items-center gap-1.5 rounded-full bg-coral px-4 py-2 font-medium text-xs text-onacc hover:bg-pink hover:text-ink transition-colors shrink-0"
                        >
                          <Download size={14} />
                          <span>Download</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </motion.aside>
    </motion.div>
  );
}

const Sections = () => (
  <>
    <section className="mx-auto max-w-7xl px-5 py-20 border-t border-line">
      <Reveal>
        <h2 className="max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl text-fg">
          Three steps. No account, no queue, no upload bar.
        </h2>
      </Reveal>
      <ol className="mt-14 grid gap-10 md:grid-cols-3">
        {[
          ['Add', 'Drop files on the page or pick them from your device.'],
          ['Adjust', 'Set quality, width, format or page ranges. Defaults are sensible.'],
          ['Save', 'Download the result. It was made in this tab and never sent anywhere.'],
        ].map(([h, p], i) => (
          <li key={h} style={{ marginTop: `${i * 32}px` }} className="border-t border-fg pt-4">
            <span className="font-display text-accent text-sm font-semibold">Step {i + 1}</span>
            <h3 className="mt-2 font-display text-3xl font-bold text-fg">{h}</h3>
            <p className="mt-2 text-mute text-sm leading-relaxed">{p}</p>
          </li>
        ))}
      </ol>
    </section>

    <section id="privacy" className="scroll-mt-16 bg-card py-20 text-fg transition-colors">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2">
        <div>
          <Lock className="text-accent mb-3" size={32} />
          <h2 className="font-display text-4xl font-bold sm:text-5xl text-fg tracking-tight">
            Your files never leave your device.
          </h2>
        </div>
        <div className="space-y-5 text-mute text-sm sm:text-base leading-relaxed">
          <p>
            Every tool runs with your browser’s own code. There is no upload step, so there is no
            server copy to leak, store or sell.
          </p>
          <p className="flex items-start gap-3">
            <Cpu className="shrink-0 text-accent mt-0.5" size={20} />
            <span>
              Large files use your device’s memory, so we cap each file at 50 MB to keep phones and
              browsers responsive.
            </span>
          </p>
          <p className="flex items-start gap-3">
            <Layers className="shrink-0 text-accent mt-0.5" size={20} />
            <span>
              Open your browser's Network tab while you run any tool. You’ll see zero network
              payloads sent.
            </span>
          </p>
        </div>
      </div>
    </section>
  </>
);

export default function App() {
  const path = useRoute();
  const accountRoute = AUTH_PATHS.includes(path);
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return document.documentElement.classList.contains('dark');
    } catch {
      return true;
    }
  });

  const [pulse, setPulse] = useState(0);
  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recent') || '[]');
    } catch {
      return [];
    }
  });

  const [cat, setCat] = useState('All');
  const [files, setFiles] = useState([]);
  const [tool, setTool] = useState(null);

  // Sync dark class on mount and state change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const toggle = () => {
    const d = !dark;
    setDark(d);
    document.documentElement.classList.toggle('dark', d);
    try {
      localStorage.setItem('theme', d ? 'dark' : 'light');
    } catch {}
    // Trigger smooth color update in Hero3D without canvas recreation
    window.dispatchEvent(new CustomEvent('palettechange'));
  };

  const openTool = t => {
    setTool(t);
    const r = [t.id, ...recent.filter(x => x !== t.id)].slice(0, 4);
    setRecent(r);
    try {
      localStorage.setItem('recent', JSON.stringify(r));
    } catch {}
  };

  const onFiles = (fs, t) => {
    setFiles(fs);
    setPulse(p => p + 1);
    if (t) openTool(t);
  };

  return (
    <div className="min-h-screen bg-bg text-fg font-sans selection:bg-coral selection:text-onacc transition-colors duration-200">
      <Nav
        dark={dark}
        toggle={toggle}
        setCat={setCat}
        onPal={() => {
          window.dispatchEvent(new CustomEvent('palettechange'));
        }}
      />
      <main>
        {accountRoute ? <AuthScreen path={path}/> : <>
        {/* DO NOT pass key={ver} so Three.js Canvas is NOT needlessly unmounted */}
        <Hero pulse={pulse} />
        <Drop files={files} onFiles={onFiles} />
        <Tools
          cat={cat}
          setCat={setCat}
          recent={recent}
          open={t => {
            setFiles([]);
            openTool(t);
          }}
        />
        <Sections />
        </>}
      </main>

      <footer className="border-t border-line px-5 py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-mute">
          <Mark />
          <p>Free and open source. Made to run on your device.</p>
        </div>
      </footer>

      <AnimatePresence>
        {tool && (
          <Workspace
            key={tool.id}
            tool={tool}
            pre={files}
            close={() => setTool(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
