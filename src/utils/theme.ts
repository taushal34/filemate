export interface PaletteConfig {
  dark: string;
  light: string;
  acc: string;
  glow: string;
}

export const PALETTES: Record<string, PaletteConfig> = {
  "Ink & Tangerine": {
    dark: "#0E1116",
    light: "#FAF7F2",
    acc: "#FF7A45",
    glow: "#FFB27A"
  },
  "Deep Teal": {
    dark: "#031716",
    light: "#F5FAFA",
    acc: "#0C969C",
    glow: "#22D3C5"
  },
  "Forest & Mint": {
    dark: "#0B1512",
    light: "#F4FAF6",
    acc: "#3DDC97",
    glow: "#8CF2C4"
  },
  "Graphite & Lime": {
    dark: "#16181D",
    light: "#F7F8F2",
    acc: "#C6F432",
    glow: "#E2FA86"
  }
};

const hexToRgbArr = (hex: string): number[] => {
  const clean = hex.replace('#', '');
  return [0, 2, 4].map(idx => parseInt(clean.slice(idx, idx + 2), 16));
};

const rgbArrToHex = (arr: number[]): string =>
  '#' + arr.map(val => Math.round(val).toString(16).padStart(2, '0')).join('');

export const interpolateColor = (c1: string, c2: string, ratio: number): string => {
  const rgb1 = hexToRgbArr(c1);
  const rgb2 = hexToRgbArr(c2);
  return rgbArrToHex(rgb1.map((v, i) => v + (rgb2[i] - v) * ratio));
};

const getLuminance = (hex: string): number => {
  const [r, g, b] = hexToRgbArr(hex).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const getContrast = (hex1: string, hex2: string): number => {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
};

export function computeThemeVars(p: PaletteConfig) {
  const onAcc = getContrast(p.acc, p.dark) >= getContrast(p.acc, '#ffffff') ? p.dark : '#ffffff';
  const frostLight = interpolateColor(p.glow, '#ffffff', 0.7);
  const frostDark = interpolateColor(p.acc, p.dark, 0.75);

  return {
    D: {
      bg: p.dark,
      card: interpolateColor(p.dark, p.light, 0.06),
      line: interpolateColor(p.dark, p.light, 0.18),
      fg: p.light,
      mute: interpolateColor(p.dark, p.light, 0.65),
      accT: interpolateColor(p.acc, '#ffffff', 0.2),
      frost: frostDark,
    },
    Lt: {
      bg: p.light,
      card: interpolateColor(p.light, p.dark, 0.04),
      line: interpolateColor(p.light, p.dark, 0.16),
      fg: p.dark,
      mute: interpolateColor(p.light, p.dark, 0.65),
      accT: interpolateColor(p.acc, p.dark, 0.15),
      frost: frostLight,
    },
    S: {
      acc: p.acc,
      glow: p.glow,
      onAcc,
      dk: p.dark,
    }
  };
}

export function applyPalette(palette: PaletteConfig) {
  const { D, Lt, S } = computeThemeVars(palette);

  let styleEl = document.getElementById('pal');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'pal';
    document.head.appendChild(styleEl);
  }

  const toCss = (obj: Record<string, string>) =>
    Object.entries(obj).map(([k, v]) => `--${k}:${v}`).join(';');

  styleEl.textContent = `
    html:root {
      ${toCss({ ...Lt, ...S })}
    }
    html.dark {
      ${toCss({ ...D, ...S })}
    }
  `;
}

export function getStoredPalette(): PaletteConfig {
  try {
    const raw = localStorage.getItem('palette');
    if (raw) {
      return { ...PALETTES['Ink & Tangerine'], ...JSON.parse(raw) };
    }
  } catch {}
  return PALETTES['Ink & Tangerine'];
}

export function saveStoredPalette(p: PaletteConfig) {
  try {
    localStorage.setItem('palette', JSON.stringify(p));
  } catch {}
  applyPalette(p);
}
