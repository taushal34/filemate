// Change the whole site's colors by editing these 4-color sets (or use the palette button in the navbar).
export const PRESETS = {
  'Graphite & Lime': { dark: '#16181D', light: '#F7F8F2', acc: '#C6F432', glow: '#E2FA86' },
  'Deep Teal': { dark: '#031716', light: '#F5FAFA', acc: '#0C969C', glow: '#22D3C5' },
  'Ink & Tangerine': { dark: '#0E1116', light: '#FAF7F2', acc: '#FF7A45', glow: '#FFB27A' },
  'Forest & Mint': { dark: '#0B1512', light: '#F4FAF6', acc: '#3DDC97', glow: '#8CF2C4' },
};

// Default preset set to 'Graphite & Lime' for new users
export const DEFAULT = PRESETS['Graphite & Lime'];

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = a => '#' + a.map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => {
  const x = rgb(a), y = rgb(b);
  return hex(x.map((v, i) => v + (y[i] - v) * t));
};

const lum = h => {
  const [r, g, b] = rgb(h).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const cr = (a, b) => {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const readable = (c, bg, to) => {
  for (let i = 0; i < 40 && cr(c, bg) < 4.5; i++) c = mix(c, to, 0.1);
  return c;
};

export function derive({ dark, light, acc, glow }) {
  // If Graphite & Lime preset, apply tailored high-contrast architectural tokens
  const isGraphiteLime = dark === '#16181D' && acc === '#C6F432';
  if (isGraphiteLime) {
    return {
      D: {
        bg: '#16181D',
        card: '#1F2228',
        line: '#32363F',
        fg: '#F7F8F2',
        mute: '#A0A5AF',
        accT: '#C6F432',
      },
      Lt: {
        bg: '#F7F8F2',
        card: '#EDF0E8',
        line: '#D8DDCF',
        fg: '#16181D',
        mute: '#5D6257',
        accT: '#557A02',
      },
      S: {
        acc: '#C6F432',
        glow: '#E2FA86',
        frost: '#EEF9C6',
        onAcc: '#16181D',
        dk: '#16181D',
      },
    };
  }

  // If Deep Teal preset, apply curated teal tokens
  const isDeepTeal = dark === '#031716' && light === '#F5FAFA' && acc === '#0C969C';
  if (isDeepTeal) {
    return {
      D: {
        bg: '#031716',
        card: '#032F30',
        line: '#274D60',
        fg: '#F5FAFA',
        mute: '#B8D3D5',
        accT: '#22D3C5',
      },
      Lt: {
        bg: '#F5FAFA',
        card: '#E6F2F2',
        line: '#B8D3D5',
        fg: '#031716',
        mute: '#274D60',
        accT: '#0A7075',
      },
      S: {
        acc: '#0C969C',
        glow: '#22D3C5',
        frost: '#D8FFFA',
        onAcc: '#ffffff',
        dk: '#031716',
      },
    };
  }

  // General dynamic formula for other presets and custom colors
  return {
    D: {
      bg: dark,
      card: mix(dark, light, 0.08),
      line: mix(dark, light, 0.18),
      fg: light,
      mute: mix(dark, light, 0.72),
      accT: readable(acc, dark, '#ffffff'),
    },
    Lt: {
      bg: light,
      card: mix(light, dark, 0.05),
      line: mix(light, dark, 0.16),
      fg: dark,
      mute: mix(light, dark, 0.72),
      accT: readable(acc, light, dark),
    },
    S: {
      acc,
      glow,
      frost: mix(glow, '#ffffff', 0.7),
      onAcc: cr(acc, dark) >= cr(acc, '#ffffff') ? dark : '#ffffff',
      dk: dark,
    },
  };
}

const css = o => Object.entries(o).map(([k, v]) => `--${k}:${v}`).join(';');

export function applyPalette(p) {
  const { D, Lt, S } = derive(p);
  let s = document.getElementById('pal');
  if (!s) {
    s = document.createElement('style');
    s.id = 'pal';
    document.head.append(s);
  }
  s.textContent = `html:root{${css({ ...Lt, ...S })}}html.dark{${css({ ...D, ...S })}}`;
}

/**
 * Loads the user's stored palette from localStorage,
 * defaulting to 'Graphite & Lime' for new users.
 */
export const loadPalette = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('palette');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.dark && parsed.acc) {
          return { ...DEFAULT, ...parsed };
        }
      }
    }
  } catch {}
  return DEFAULT;
};

/**
 * Persists the chosen palette to localStorage and immediately updates the DOM styles.
 */
export const savePalette = p => {
  applyPalette(p);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('palette', JSON.stringify(p));
    }
  } catch {}
};
