import { useRef, useMemo, useEffect, useState, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const getVar = n => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(n).trim();
};

const getColors = () => ({
  acc: getVar('--acc') || '#C6F432',
  glow: getVar('--glow') || '#E2FA86',
  frost: getVar('--frost') || '#EEF9C6',
  dk: getVar('--dk') || '#16181D',
  on: getVar('--onAcc') || '#16181D',
});

const W = 2.1;
const H = 2.8;
const N = 5;
const BW = 0.95;
const BH = 0.4;

// Rounded rectangle geometry generator for paper sheets and chips
function createRoundedRectGeometry(w, h, r, d) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);

  const g = new THREE.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    bevelSegments: 2,
    curveSegments: 8,
  });
  g.translate(0, 0, -d / 2);
  return g;
}

const fitTexture = (t, w, h) => {
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(1 / w, 1 / h);
  t.offset.set(0.5, 0.5);
  return t;
};

// Generates the illustrated canvas texture for the top page of the stack
function generatePageTexture(C) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = Math.round((512 * H) / W);
  const g = c.getContext('2d');
  if (!g) return new THREE.Texture();
  const w = c.width;

  g.fillStyle = C.frost;
  g.fillRect(0, 0, w, c.height);

  g.fillStyle = C.acc;
  g.fillRect(40, 48, 160, 20);

  g.fillStyle = C.dk;
  g.globalAlpha = 0.85;
  g.fillRect(40, 92, 300, 18);

  g.globalAlpha = 0.2;
  [432, 400, 432, 300].forEach((l, i) => g.fillRect(40, 140 + i * 30, l, 12));

  g.globalAlpha = 0.5;
  g.fillStyle = C.glow;
  g.fillRect(40, 290, 432, 190);

  g.globalAlpha = 0.95;
  g.fillStyle = C.acc;
  g.beginPath();
  g.moveTo(40, 480);
  g.lineTo(180, 360);
  g.lineTo(260, 430);
  g.lineTo(340, 340);
  g.lineTo(472, 480);
  g.fill();

  g.fillStyle = C.frost;
  g.beginPath();
  g.arc(400, 335, 22, 0, 6.3);
  g.fill();

  g.globalAlpha = 0.2;
  g.fillStyle = C.dk;
  [432, 400, 432, 260].forEach((l, i) => g.fillRect(40, 510 + i * 30, l, 12));

  return fitTexture(new THREE.CanvasTexture(c), W, H);
}

// Generates badge chip textures (PDF, DOCX)
function generateBadgeTexture(text, bg, fg) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 108;
  const g = c.getContext('2d');
  if (!g) return new THREE.Texture();

  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 108);

  g.fillStyle = fg;
  g.font = '700 52px "Space Grotesk", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 56);

  return fitTexture(new THREE.CanvasTexture(c), BW, BH);
}

// Generates soft radial shadow texture under the stack
function generateShadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  if (!g) return new THREE.Texture();

  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(0,0,0,0.45)');
  r.addColorStop(1, 'rgba(0,0,0,0)');

  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// Glinting dust constellation around the stack (reduced count on mobile)
function Dust({ color, isMobile }) {
  const count = isMobile ? 32 : 75;
  const points = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = i * 2.399963;
      const rad = 1.6 + (((i * 37) % 41) / 41) * 1.9;
      a[i * 3] = Math.cos(t) * rad + (isMobile ? 0 : 0.4);
      a[i * 3 + 1] = Math.sin(t) * rad * 0.78;
      a[i * 3 + 2] = -1.5 + (((i * 17) % 29) / 29) * 2.6;
    }
    return a;
  }, [count, isMobile]);

  const mesh = useRef();
  useFrame(({ clock }) => {
    if (mesh.current) {
      mesh.current.rotation.z = Math.sin(clock.elapsedTime * 0.12) * 0.045;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={isMobile ? 0.03 : 0.035}
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// Thin decorative curved accent strokes
function AccentStrokes({ color, boost, isMobile }) {
  const refs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.z = Math.sin(t * 0.45 + i) * 0.09;
      m.scale.setScalar(1 + Math.sin(t * 1.2 + i) * 0.025 + boost.current * 0.075);
    });
  });

  return (
    <group position={[isMobile ? 0 : 0.5, 0.05, -0.7]}>
      {[0, 1, 2].map(i => (
        <mesh
          key={i}
          ref={e => (refs.current[i] = e)}
          position={[i === 1 ? 1.4 : -1.2, i === 2 ? -1.1 : 0.95, -0.3 - i * 0.15]}
          rotation={[0, 0, i * 0.8]}
        >
          <torusGeometry args={[0.42 + i * 0.12, 0.008, 4, isMobile ? 48 : 80, Math.PI * (0.85 + i * 0.13)]} />
          <meshBasicMaterial color={color} transparent opacity={0.25 - i * 0.05} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// Subtle aqua glints
function Sparkles({ color, boost, isMobile }) {
  const ref = useRef();
  const count = isMobile ? 8 : 12;
  const coords = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = i * 2.39996;
        const r = 1.2 + (i % 4) * 0.45;
        return [Math.cos(a) * r + (isMobile ? 0 : 0.5), Math.sin(a) * r * 0.8, 0.7 + (i % 3) * 0.25];
      }),
    [count, isMobile]
  );

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.children.forEach((m, i) => {
      const q = 0.65 + 0.35 * Math.sin(clock.elapsedTime * 1.8 + i * 1.7);
      m.scale.setScalar((0.6 + q * 0.6) * (1 + boost.current * 1.6));
    });
  });

  return (
    <group ref={ref}>
      {coords.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[i % 3 === 0 ? 0.05 : 0.025, i % 3 === 0 ? 0.05 : 0.025]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={i % 3 === 0 ? 0.85 : 0.45}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// Main 3D Document Stack Scene
function Scene({ pulse, isMobile, isSmallMobile }) {
  const [colors, setColors] = useState(getColors);

  // Update colors when theme CSS variables change without remounting canvas
  useEffect(() => {
    const update = () => setColors(getColors());
    update();
    window.addEventListener('palettechange', update);
    return () => window.removeEventListener('palettechange', update);
  }, []);

  const geo = useMemo(() => createRoundedRectGeometry(W, H, 0.16, 0.07), []);
  const bgeo = useMemo(() => createRoundedRectGeometry(BW, BH, 0.2, 0.08), []);
  const front = useMemo(() => generatePageTexture(colors), [colors]);
  const shadow = useMemo(generateShadowTexture, []);

  const backColors = [colors.acc, colors.glow, colors.frost, colors.acc];

  // Badges offset responsive positioning
  const chips = useMemo(() => {
    const pdfPos = isMobile ? [-1.15, 1.35, 1.3] : [-1.5, 1.55, 1.4];
    const docxPos = isMobile ? [-0.95, -1.4, 1.4] : [-1.2, -1.6, 1.5];
    return [
      { t: 'PDF', p: pdfPos, map: generateBadgeTexture('PDF', colors.acc, colors.on) },
      { t: 'DOCX', p: docxPos, map: generateBadgeTexture('DOCX', colors.frost, colors.dk) },
    ];
  }, [colors, isMobile]);

  const root = useRef();
  const sh = useRef([]);
  const ch = useRef([]);
  const sp = useRef(1.8);
  const boost = useRef(0);
  const last = useRef(pulse);

  useFrame(({ pointer, clock }, dt) => {
    if (last.current !== pulse) {
      last.current = pulse;
      boost.current = 1;
    }
    boost.current = Math.max(0, boost.current - dt * 0.55);
    const t = clock.elapsedTime;
    sp.current += (1 + boost.current * 0.9 - sp.current) * Math.min(1, dt * 3);
    const s = sp.current;
    const r = root.current;
    if (!r) return;

    r.rotation.y += (pointer.x * 0.38 + Math.sin(t * 0.4) * 0.07 - r.rotation.y) * Math.min(1, dt * 4);
    r.rotation.x += (-pointer.y * 0.2 - r.rotation.x) * Math.min(1, dt * 4);
    r.position.y = Math.sin(t * 0.55) * 0.06;

    sh.current.forEach((m, i) => {
      if (!m) return;
      const d = N - 1 - i;
      m.position.set(-d * 0.4 * s, d * 0.09 * s + Math.sin(t * 0.9 + i) * 0.038, i * 0.27);
      m.rotation.z = d * 0.068 * s;
      m.rotation.y = Math.sin(t * 0.5 + i * 0.8) * 0.026 + boost.current * 0.035;
    });

    ch.current.forEach((m, i) => {
      if (!m || !chips[i]) return;
      m.position.y = chips[i].p[1] + Math.sin(t * 0.8 + i * 2) * 0.09;
      m.rotation.z = Math.sin(t * 0.6 + i) * 0.048;
    });
  });

  // Calculate stack group scale and position based on mobile vs desktop
  const stackScale = isSmallMobile ? 0.65 : isMobile ? 0.76 : 1;
  const stackPosition = isMobile ? [0, 0.05, 0] : [0.75, 0, 0];

  return (
    <group ref={root}>
      <Dust color={colors.glow} isMobile={isMobile} />
      <AccentStrokes color={colors.glow} boost={boost} isMobile={isMobile} />
      <Sparkles color={colors.frost} boost={boost} isMobile={isMobile} />

      <group position={stackPosition} scale={[stackScale, stackScale, stackScale]}>
        {Array.from({ length: N }, (_, i) => (
          <mesh key={i} ref={e => (sh.current[i] = e)} geometry={geo}>
            {i === N - 1 ? (
              <meshStandardMaterial map={front} roughness={0.5} />
            ) : (
              <meshStandardMaterial color={backColors[i]} roughness={0.45} />
            )}
          </mesh>
        ))}

        {chips.map((c, i) => (
          <mesh key={c.t} ref={e => (ch.current[i] = e)} geometry={bgeo} position={c.p}>
            <meshStandardMaterial map={c.map} roughness={0.4} />
          </mesh>
        ))}

        <mesh position={[0, -2.1, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5.8, 3.4]} />
          <meshBasicMaterial map={shadow} transparent depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

function Hero3DComponent({ pulse }) {
  const [colors, setColors] = useState(getColors);
  const [onScreen, setOnScreen] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [contextLost, setContextLost] = useState(false);
  const elRef = useRef(null);

  // Resize and orientation listener
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Reduced motion preference
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(q.matches);
    sync();
    q.addEventListener?.('change', sync);
    return () => q.removeEventListener?.('change', sync);
  }, []);

  // Intersection observer to freeze animation when scrolled out of view
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setOnScreen(entry.isIntersecting);
    });
    if (elRef.current) observer.observe(elRef.current);
    return () => observer.disconnect();
  }, []);

  // WebGL context loss recovery handler
  const handleCreated = ({ gl }) => {
    const canvas = gl.domElement;
    const onLost = e => {
      e.preventDefault();
      setContextLost(true);
    };
    const onRestored = () => {
      setContextLost(false);
    };
    canvas.addEventListener('webglcontextlost', onLost, false);
    canvas.addEventListener('webglcontextrestored', onRestored, false);
  };

  const isMobile = viewportWidth < 768;
  const isSmallMobile = viewportWidth < 380;
  const cameraZ = isSmallMobile ? 10.8 : isMobile ? 9.6 : 8.5;

  if (contextLost) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-xs text-mute font-mono">
        3D rendering temporarily suspended. Resuming...
      </div>
    );
  }

  return (
    <div ref={elRef} className="absolute inset-0 w-full h-full select-none">
      <Canvas
        flat
        dpr={isMobile ? [1, 1.25] : [1, 1.5]}
        frameloop={onScreen && !reduceMotion ? 'always' : 'demand'}
        camera={{ position: [0, 0, cameraZ], fov: 36 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: isMobile ? 'default' : 'high-performance',
        }}
        onCreated={handleCreated}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 4, 5]} intensity={1.3} color={colors.frost} />
        <pointLight position={[-4, -2, 3]} intensity={25} color={colors.glow} />
        <Scene pulse={pulse} isMobile={isMobile} isSmallMobile={isSmallMobile} />
      </Canvas>
    </div>
  );
}

export default memo(Hero3DComponent);
