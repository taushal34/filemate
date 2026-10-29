import React from 'react';

export type MascotMood = 'idle' | 'drag' | 'happy' | 'oops' | 'work';

interface MascotFaceProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

export const MascotFace: React.FC<MascotFaceProps> = ({
  mood = 'idle',
  size = 64,
  className = '',
}) => {
  const mouthPaths: Record<MascotMood, string> = {
    idle: 'M21 44q5 4 10 0',
    drag: 'M22 43a4 4 0 1 0 8 0z',
    happy: 'M19 42q7 9 14 0',
    oops: 'M21 47q5-4 10 0',
    work: 'M22 45h8',
  };

  const isBlink = mood !== 'drag' && mood !== 'work';

  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 52 60"
      aria-hidden="true"
      className={`${mood === 'drag' ? 'float' : ''} ${className}`}
    >
      {/* Folded paper body */}
      <path d="M4 2h30l14 14v42H4z" className="fill-coral" />
      {/* Folded corner */}
      <path d="M34 2v14h14z" className="fill-pink" />

      {/* Eyes */}
      <g className={isBlink ? 'blink fill-ink' : 'fill-ink'}>
        <ellipse cx="19" cy="34" rx="3" ry={mood === 'happy' ? 1.2 : 3.5} />
        <ellipse cx="33" cy="34" rx="3" ry={mood === 'happy' ? 1.2 : 3.5} />
      </g>

      {/* Mouth */}
      <path
        d={mouthPaths[mood]}
        strokeWidth="2"
        strokeLinecap="round"
        className={mood === 'drag' ? 'stroke-ink fill-ink' : 'stroke-ink fill-none'}
      />
    </svg>
  );
};

export const ParticleBurst: React.FC = () => {
  return (
    <div aria-hidden="true" className="pointer-events-none relative h-0">
      {Array.from({ length: 14 }).map((_, idx) => {
        const angle = (idx / 14) * 2 * Math.PI;
        const xDist = Math.cos(angle) * 85;
        const yDist = Math.sin(angle) * 55;

        return (
          <span
            key={idx}
            className="absolute left-1/2 top-4 h-2 w-2 rounded-full bg-glow animate-ping"
            style={{
              transform: `translate(${xDist}px, ${yDist}px)`,
              animationDuration: '0.8s',
              animationIterationCount: '1',
            }}
          />
        );
      })}
    </div>
  );
};
