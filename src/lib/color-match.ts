export type Rgb = { r: number; g: number; b: number };

export type PaintColor = {
  id: string;
  name: string;
  hex: string;
  r: number;
  g: number;
  b: number;
  collection: string | null;
};

export type Match = {
  color: PaintColor;
  deltaE: number;
  confidence: number;
};

export function clamp255(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function normalizeHex(input: string): string | null {
  let value = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;
  return "#" + value.toUpperCase();
}

export function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => clamp255(v).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

type Lab = { L: number; a: number; b: number };

function rgbToLab({ r, g, b }: Rgb): Lab {
  const toLinear = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  // sRGB -> XYZ (D65)
  const x = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) / 0.95047;
  const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175;
  const z = (lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041) / 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

/** CIE94 (graphic arts) perceptual distance. */
export function deltaE94(c1: Rgb, c2: Rgb): number {
  const lab1 = rgbToLab(c1);
  const lab2 = rgbToLab(c2);

  const dL = lab1.L - lab2.L;
  const C1 = Math.sqrt(lab1.a ** 2 + lab1.b ** 2);
  const C2 = Math.sqrt(lab2.a ** 2 + lab2.b ** 2);
  const dC = C1 - C2;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  const dH2 = Math.max(0, da ** 2 + db ** 2 - dC ** 2);

  const sL = 1;
  const sC = 1 + 0.045 * C1;
  const sH = 1 + 0.015 * C1;

  return Math.sqrt((dL / sL) ** 2 + (dC / sC) ** 2 + dH2 / sH ** 2);
}

/** 0-100 similarity label derived from Delta-E. */
export function confidenceFromDeltaE(deltaE: number): number {
  const pct = 100 * Math.exp(-deltaE / 28);
  return Math.max(1, Math.min(100, Math.round(pct)));
}

export function findMatches(input: Rgb, colors: PaintColor[], count = 4): Match[] {
  return colors
    .map((color) => {
      const deltaE = deltaE94(input, { r: color.r, g: color.g, b: color.b });
      return { color, deltaE, confidence: confidenceFromDeltaE(deltaE) };
    })
    .sort((a, b) => a.deltaE - b.deltaE)
    .slice(0, count);
}

/** Dominant colour via coarse RGB histogram, ignoring near-white/near-black noise. */
export function dominantColor(data: Uint8ClampedArray): Rgb {
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] ?? 255;
    if (alpha < 200) continue;
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const isNeutralExtreme = max > 244 || max < 18;
    if (isNeutralExtreme && max - min < 12) continue;

    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  let best: { count: number; r: number; g: number; b: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket;
  }

  if (!best) {
    // Fall back to a plain average of all pixels.
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i] ?? 0;
      g += data[i + 1] ?? 0;
      b += data[i + 2] ?? 0;
      n += 1;
    }
    return { r: clamp255(r / n), g: clamp255(g / n), b: clamp255(b / n) };
  }

  return {
    r: clamp255(best.r / best.count),
    g: clamp255(best.g / best.count),
    b: clamp255(best.b / best.count),
  };
}

export function isLightColor({ r, g, b }: Rgb): boolean {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}
