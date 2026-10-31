import React, { useState, useRef, useEffect } from 'react';

const FLOATING_BADGES = [
  { text: 'PDF', bg: 'var(--acc)', left: '6%', top: '8%', z: 90, rotate: -10, delay: 0 },
  { text: 'JPG', bg: 'var(--glow)', left: '46%', top: '30%', z: 30, rotate: 7, delay: -2 },
  { text: 'DOCX', bg: 'var(--frost)', left: '18%', top: '56%', z: -40, rotate: -4, delay: -4 },
];

export const Hero: React.FC = () => {
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setTilt({ x: nx, y: ny });
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const scrollToTools = () => {
    const el = document.getElementById('tools');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="top" className="relative mx-auto grid max-w-7xl gap-6 overflow-hidden px-5 pb-10 pt-12 lg:grid-cols-12 lg:pt-20">
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        className="float absolute -right-24 top-10 h-80 w-80 rounded-full bg-glow opacity-25 blur-3xl pointer-events-none"
      />

      {/* Main Copy */}
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
          <button
            onClick={scrollToTools}
            className="rounded-full bg-coral px-8 py-4 font-medium text-onacc hover:bg-pink hover:text-ink transition-all shadow-md cursor-pointer"
          >
            Choose a tool
          </button>
          <a
            href="#privacy"
            className="border-b border-line pb-1 text-mute hover:text-accent font-medium transition-colors cursor-pointer"
          >
            How it stays private
          </a>
        </div>
      </div>

      {/* Interactive 3D Paper Badges */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        aria-hidden="true"
        className="relative h-[380px] lg:col-span-5 lg:h-[460px] select-none"
        style={{ perspective: 1000 }}
      >
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{
            transform: `rotateX(${-tilt.y * 14}deg) rotateY(${tilt.x * 14}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {FLOATING_BADGES.map((item, idx) => {
            const shiftX = tilt.x * item.z * 0.45;
            const shiftY = tilt.y * item.z * 0.35;

            return (
              <div
                key={item.text}
                className="absolute transition-transform duration-300 ease-out"
                style={{
                  left: item.left,
                  top: item.top,
                  transform: `translate3d(${shiftX}px, ${shiftY}px, ${item.z}px) rotate(${item.rotate}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                <div
                  className="float"
                  style={{ animationDelay: `${item.delay}s` }}
                >
                  <div
                    style={{
                      background: item.bg,
                      clipPath: 'polygon(0 0, 72% 0, 100% 22%, 100% 100%, 0 100%)',
                      boxShadow: '0 30px 40px -20px rgba(0,0,0,0.4)',
                    }}
                    className="grid h-44 w-36 place-items-end p-4 font-display text-3xl font-bold text-ink sm:h-52 sm:w-44"
                  >
                    {item.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
