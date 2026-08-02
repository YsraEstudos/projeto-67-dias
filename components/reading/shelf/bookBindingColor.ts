export type BindingColorSource =
  | 'custom'
  | 'persisted-cover'
  | 'extracted-cover'
  | 'manifest'
  | 'fallback';

export interface ResolvedBindingColor {
  hex: string;
  source: BindingColorSource;
}

export interface BindingColorInputs {
  customColor?: unknown;
  persistedCoverColor?: unknown;
  extractedColor?: unknown;
  manifestColor?: unknown;
  fallbackColor?: unknown;
}

export interface PixelImageData {
  data: ArrayLike<number>;
  width: number;
  height: number;
}

const SAFE_FALLBACK_BINDING_COLOR = '#4B5563';

/** Normalizes only complete RGB hex colors so every surface receives one format. */
export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  const shortMatch = normalized.match(/^#([\da-f]{3})$/i);
  if (shortMatch) {
    const [red, green, blue] = shortMatch[1].split('');
    return `#${red}${red}${green}${green}${blue}${blue}`.toUpperCase();
  }

  if (/^#[\da-f]{6}$/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  return null;
}

/** Resolves the binding color once; individual texture generators must not reimplement this order. */
export function resolveBindingColor(input: BindingColorInputs): ResolvedBindingColor {
  const candidates: Array<{ source: BindingColorSource; value: unknown }> = [
    { source: 'custom', value: input.customColor },
    { source: 'persisted-cover', value: input.persistedCoverColor },
    { source: 'extracted-cover', value: input.extractedColor },
    { source: 'manifest', value: input.manifestColor },
    { source: 'fallback', value: input.fallbackColor ?? SAFE_FALLBACK_BINDING_COLOR },
  ];

  for (const candidate of candidates) {
    const hex = normalizeHexColor(candidate.value);
    if (hex) return { hex, source: candidate.source };
  }

  return { hex: SAFE_FALLBACK_BINDING_COLOR, source: 'fallback' };
}

/** Picks a deterministic high-contrast text color for text drawn on a binding background. */
export function getContrastingTextColor(bindingColor: string): string {
  const normalized = normalizeHexColor(bindingColor) ?? SAFE_FALLBACK_BINDING_COLOR;
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 255000;

  return luminance > 0.58 ? '#111827' : '#F8FAFC';
}

interface ColorCluster {
  weight: number;
  red: number;
  green: number;
  blue: number;
}

interface ColorSample {
  red: number;
  green: number;
  blue: number;
  weight: number;
  isExtreme: boolean;
}

/**
 * Finds a representative cover color without depending on DOM, canvas, network, or randomness.
 * Edge pixels receive slightly more weight because they are the areas echoed by the binding.
 */
export function extractRepresentativeColor(imageData: PixelImageData): string | null {
  const width = Math.floor(imageData.width);
  const height = Math.floor(imageData.height);
  const data = imageData.data;
  const expectedLength = width * height * 4;

  if (width <= 0 || height <= 0 || data.length < expectedLength) return null;

  const samples: ColorSample[] = [];
  let totalWeight = 0;
  let nonExtremeWeight = 0;
  const centerDistance = Math.max(1, Math.min(width, height) / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      if (alpha < 32) continue;

      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const brightness = (red + green + blue) / 3;
      const isExtreme = brightness >= 248 || brightness <= 8;
      const edgeDistance = Math.min(x, y, width - 1 - x, height - 1 - y);
      const edgeWeight = 1 + 0.8 * (1 - Math.min(1, edgeDistance / centerDistance));
      const weight = edgeWeight * (alpha / 255);

      samples.push({ red, green, blue, weight, isExtreme });
      totalWeight += weight;
      if (!isExtreme) nonExtremeWeight += weight;
    }
  }

  if (samples.length === 0) return null;

  // Ignore extreme title/background noise only when enough non-extreme artwork exists.
  const ignoreMinorExtremes = nonExtremeWeight > totalWeight * 0.35;
  const clusters = new Map<string, ColorCluster>();

  for (const sample of samples) {
    if (ignoreMinorExtremes && sample.isExtreme) continue;

    const redBin = sample.red >> 5;
    const greenBin = sample.green >> 5;
    const blueBin = sample.blue >> 5;
    const key = `${redBin}:${greenBin}:${blueBin}`;
    const cluster = clusters.get(key) ?? { weight: 0, red: 0, green: 0, blue: 0 };

    cluster.weight += sample.weight;
    cluster.red += sample.red * sample.weight;
    cluster.green += sample.green * sample.weight;
    cluster.blue += sample.blue * sample.weight;
    clusters.set(key, cluster);
  }

  if (clusters.size === 0) return null;

  let dominant: ColorCluster | null = null;
  for (const cluster of clusters.values()) {
    if (!dominant || cluster.weight > dominant.weight) dominant = cluster;
  }

  if (!dominant || dominant.weight <= 0) return null;

  const toHex = (channel: number) => Math.round(channel).toString(16).padStart(2, '0');
  return `#${toHex(dominant.red / dominant.weight)}${toHex(dominant.green / dominant.weight)}${toHex(dominant.blue / dominant.weight)}`.toUpperCase();
}

