import * as THREE from 'three';
import { ShelfBookManifestItem, FoilMotifType } from './mintManifest';
import {
  extractRepresentativeColor,
  getContrastingTextColor,
  normalizeHexColor,
  resolveBindingColor,
  ResolvedBindingColor,
} from './bookBindingColor';
import { getBookDimensions } from '../../../utils/bookDimensions';

// Static cloth texture cache to save GPU/Canvas overhead
let cachedClothNormalMap: THREE.CanvasTexture | null = null;

// ---------------------------------------------------------------------------
// Texture anisotropy configuration
// ---------------------------------------------------------------------------

let configuredAnisotropy = 4;

/**
 * Configures the anisotropy level applied to every procedural book texture.
 * Call once after the WebGL renderer exists
 * (`renderer.capabilities.getMaxAnisotropy()`). Cached textures are updated
 * in place so books created before this call still benefit.
 */
export function configureTextureAnisotropy(maxAnisotropy: number) {
  configuredAnisotropy = Math.max(1, Math.floor(maxAnisotropy) || 1);
  [cachedClothNormalMap, cachedPaperBlockTexture].forEach((texture) => {
    if (texture) texture.anisotropy = configuredAnisotropy;
  });
}

function applyAnisotropy<T extends THREE.Texture>(texture: T): T {
  texture.anisotropy = configuredAnisotropy;
  return texture;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixHex(hexA: string, hexB: string, t: number): string {
  const a = parseHexColor(hexA);
  const b = parseHexColor(hexB);
  if (!a || !b) return hexA;
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}

function shadeHex(hex: string, factor: number): string {
  const c = parseHexColor(hex);
  if (!c) return hex;
  return rgbToHex(c.r * factor, c.g * factor, c.b * factor);
}

/** Relative luminance (WCAG-style) used for foil/cloth contrast decisions. */
function colorLuminance(hex: string): number {
  const c = parseHexColor(hex);
  if (!c) return 0.5;
  const linear = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b);
}

/**
 * Guarantees the foil reads against the cloth binding. Foil palette colors
 * are tuned for dark book cloth; on light bindings (e.g. cream) the same hex
 * disappears, so it is pushed toward white or black until the luminance gap
 * clears a safe threshold. This is a design choice: the stamped art keeps its
 * character while never losing legibility.
 */
function getFoilDisplayColor(foilHex: string, bindingColor: string): string {
  const bindingLum = colorLuminance(bindingColor);
  const foilLum = colorLuminance(foilHex);
  if (Math.abs(foilLum - bindingLum) >= 0.28) return foilHex;
  const lighten = foilLum >= bindingLum;
  const target = lighten ? '#FFFFFF' : '#000000';
  let t = 0.2;
  for (let i = 0; i < 6; i++) {
    const mixed = mixHex(foilHex, target, t);
    if (Math.abs(colorLuminance(mixed) - bindingLum) >= 0.28) return mixed;
    t += 0.16;
  }
  return mixHex(foilHex, target, lighten ? 0.92 : 0.8);
}

// ---------------------------------------------------------------------------
// Canvas drawing helpers (JSDOM-safe: gradients are guarded, no drawImage
// dependency for the color work — only the PBR mask pipeline uses it and it
// already has a pixel-loop fallback).
// ---------------------------------------------------------------------------

/**
 * Cloth background: base tone, soft head/tail shading, a lateral sheen and an
 * edge vignette. The base fill keeps `bindingColor` so color pickers and tests
 * see the resolved cloth tone; the overlays only deepen the edges.
 */
function drawClothBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bindingColor: string,
) {
  ctx.fillStyle = bindingColor;
  ctx.fillRect(0, 0, width, height);

  // Head/tail shading: dust-jacket shadow where the cloth meets the boards.
  const vertical = ctx.createLinearGradient(0, 0, 0, height);
  vertical.addColorStop(0, 'rgba(0, 0, 0, 0.18)');
  vertical.addColorStop(0.06, 'rgba(0, 0, 0, 0)');
  vertical.addColorStop(0.94, 'rgba(0, 0, 0, 0)');
  vertical.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, width, height);

  // Lateral sheen: light catching the cloth weave from the shelf lighting.
  const lateral = ctx.createLinearGradient(0, 0, width, 0);
  lateral.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
  lateral.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
  lateral.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
  ctx.fillStyle = lateral;
  ctx.fillRect(0, 0, width, height);

  // Edge vignette (radial when available, diagonal linear otherwise).
  if (typeof ctx.createRadialGradient === 'function') {
    const vignette = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.42,
      width / 2, height / 2, Math.max(width, height) * 0.72,
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.16)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  } else {
    const diagonal = ctx.createLinearGradient(0, 0, width, height);
    diagonal.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    diagonal.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    diagonal.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = diagonal;
    ctx.fillRect(0, 0, width, height);
  }
}

/**
 * Vertical metallic gradient in the foil hue: dark → light → mid → light →
 * dark. Gives stamped foil its characteristic banded sheen instead of a flat
 * fill.
 */
function getFoilGradient(
  ctx: CanvasRenderingContext2D,
  y0: number,
  y1: number,
  foilHex: string,
): CanvasGradient {
  const dark = shadeHex(foilHex, 0.4);
  const light = mixHex(foilHex, '#FFFFFF', 0.55);
  const gradient = ctx.createLinearGradient(0, y0, 0, y1);
  gradient.addColorStop(0, dark);
  gradient.addColorStop(0.35, light);
  gradient.addColorStop(0.6, foilHex);
  gradient.addColorStop(0.8, light);
  gradient.addColorStop(1, dark);
  return gradient;
}

function measureTextWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number): number {
  if (!text) return 0;
  return ctx.measureText(text).width + tracking * Math.max(0, text.length - 1);
}

/**
 * Draws text centered on x with manual letter tracking (canvas letter-spacing
 * is not universally supported). The same routine must be used on the foil
 * mask so the PBR mask stays aligned with the colored artwork.
 */
function fillTextWithTracking(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
) {
  if (!text) return;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cursor = x - measureTextWidth(ctx, text, tracking) / 2;
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + tracking;
  }
}

/**
 * Wraps text into at most `maxLines` lines measured with the given tracking.
 * The final line receives an ellipsis when it overflows; on the last line
 * words are trimmed character-by-character as a safety net.
 */
function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  tracking: number,
  maxWidth: number,
  maxLines: number,
): string[] {
  ctx.font = font;
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measureTextWidth(ctx, candidate, tracking) <= maxWidth) {
      line = candidate;
      continue;
    }

    if (lines.length < maxLines - 1 && line) {
      // Commit the current line and start a fresh one with the overflow word.
      lines.push(line);
      line = word;
      continue;
    }

    // Last allowed line: fit what we can and append an ellipsis.
    let trimmed = line ? `${line} ${word}` : word;
    while (trimmed.length > 0 && measureTextWidth(ctx, `${trimmed}…`, tracking) > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    lines.push(trimmed ? `${trimmed}…` : '…');
    line = '';
    break;
  }

  if (line && lines.length < maxLines) lines.push(line);
  return lines.length > 0 ? lines : [text];
}

/**
 * Foil text on the color canvas: a hard drop-shadow pass (stamped depth)
 * followed by a metallic gradient pass over the same glyphs.
 */
function drawFoilText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  tracking: number,
  displayFoil: string,
) {
  if (!text) return;
  ctx.save();
  ctx.font = font;
  // Depth pass — the offset shadow sells the embossed stamp.
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowOffsetX = 1.5;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 3;
  ctx.fillStyle = displayFoil;
  fillTextWithTracking(ctx, text, x, y, tracking);
  ctx.restore();

  // Metallic sheen pass.
  ctx.font = font;
  ctx.fillStyle = getFoilGradient(ctx, y - 34, y + 34, displayFoil);
  fillTextWithTracking(ctx, text, x, y, tracking);
}

/**
 * Solid-white twin of `drawFoilText` for the PBR mask. Kept in the same file
 * and driven by the same tracking so metalness/roughness match the artwork.
 */
function drawFoilTextMask(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  tracking: number,
) {
  if (!text) return;
  ctx.font = font;
  ctx.fillStyle = '#FFFFFF';
  fillTextWithTracking(ctx, text, x, y, tracking);
}

/** Motif with a stamped drop shadow on the color canvas (mask gets the plain motif). */
function drawFoilMotifOnMap(
  ctx: CanvasRenderingContext2D,
  motif: FoilMotifType,
  cx: number,
  cy: number,
  size: number,
  displayFoil: string,
) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowOffsetX = 1.5;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 3;
  const gradient = getFoilGradient(ctx, cy - size, cy + size, displayFoil);
  drawFoilMotif(ctx, motif, cx, cy, size, gradient);
  ctx.restore();
}

/**
 * Builds an emboss normal map from the foil mask: foil glyphs push the normal
 * outward (central difference of the mask) while cloth areas keep a subtle
 * woven grain. Half resolution keeps the cost low; mipmaps smooth the result
 * on the mesh. No color space — normal maps stay linear.
 */
function buildFoilNormalMap(
  foilCanvas: HTMLCanvasElement,
  width: number,
  height: number,
): THREE.CanvasTexture {
  const outWidth = Math.max(2, Math.floor(width / 2));
  const outHeight = Math.max(2, Math.floor(height / 2));

  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext('2d')!;

  // Pre-compute the boolean mask (JSDOM getImageData returns zeros — the map
  // then simply falls back to cloth grain, which is harmless for tests).
  const foilCtx = foilCanvas.getContext('2d');
  const foilImg = foilCtx?.getImageData(0, 0, width, height);
  const mask = foilImg ? new Uint8Array(width * height) : null;
  if (mask && foilImg) {
    for (let i = 0; i < width * height; i++) {
      mask[i] = foilImg.data[i * 4] > 100 ? 1 : 0;
    }
  }

  const out = ctx.createImageData(outWidth, outHeight);
  const data = out.data;

  const foilStrength = 110;
  const grainStrength = 7;

  const maskAt = (px: number, py: number): number => {
    if (!mask || px < 0 || py < 0 || px >= width || py >= height) return 0;
    return mask[py * width + px];
  };

  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++) {
      const sx = x * 2;
      const sy = y * 2;
      const idx = (y * outWidth + x) * 4;

      // Central difference of the mask at step 2 (one output pixel).
      const hx =
        (maskAt(sx + 2, sy) - maskAt(sx - 2, sy)) * 0.5
        + (maskAt(sx + 2, sy + 2) - maskAt(sx - 2, sy - 2)) * 0.25
        + (maskAt(sx + 2, sy - 2) - maskAt(sx - 2, sy + 2)) * 0.25;
      const hy =
        (maskAt(sx, sy + 2) - maskAt(sx, sy - 2)) * 0.5
        + (maskAt(sx + 2, sy + 2) - maskAt(sx - 2, sy - 2)) * 0.25
        + (maskAt(sx - 2, sy + 2) - maskAt(sx + 2, sy - 2)) * 0.25;

      let gx = 0;
      let gy = 0;
      if (!(mask ? mask[sy * width + sx] : 0)) {
        // Soft woven grain on the cloth areas only — foil stays smooth.
        gx = Math.sin(sx * 0.8) * grainStrength + Math.sin(sy * 0.35) * grainStrength * 0.5;
        gy = Math.sin(sy * 0.8) * grainStrength + Math.sin(sx * 0.35) * grainStrength * 0.5;
      }

      data[idx] = 128 + hx * foilStrength + gx;
      data[idx + 1] = 128 + hy * foilStrength + gy;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(out, 0, 0);

  const texture = applyAnisotropy(new THREE.CanvasTexture(canvas));
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

// Three.js BoxGeometry groups are ordered as +X, -X, +Y, -Y, +Z, -Z.
// Keeping that order in one helper prevents a later material edit from
// accidentally putting the cover texture on a page or structural face.
function createBoxFaceMaterials<T>(
  positiveX: T,
  negativeX: T,
  positiveY: T,
  negativeY: T,
  positiveZ: T,
  negativeZ: T,
): T[] {
  return [positiveX, negativeX, positiveY, negativeY, positiveZ, negativeZ];
}

/**
 * Generates ONE packed PBR map from a foil mask canvas (memory: 1 texture
 * instead of 2 per surface). MeshStandardMaterial reads:
 *   - roughnessMap  → channel G
 *   - metalnessMap  → channel B
 * so the same canvas can back both maps. Encoding:
 *   G channel: roughness — foil 45/255 ≈ 0.18, cloth 190/255 ≈ 0.75
 *   B channel: metalness — foil 235/255 ≈ 0.92, cloth 12/255 ≈ 0.05
 * Uses canvas compositing when available (browsers) and falls back to a
 * pixel-loop for environments that do not implement drawImage (e.g. JSDOM).
 */
function buildFoilPBRMaps(
  foilCanvas: HTMLCanvasElement,
  width: number,
  height: number,
): { pbrMap: THREE.CanvasTexture } {
  const pbrCanvas = document.createElement('canvas');
  pbrCanvas.width = width;
  pbrCanvas.height = height;
  const ctxP = pbrCanvas.getContext('2d')!;

  // Try compositing path (fast, browser-native)
  const canUseDrawImage = typeof ctxP.drawImage === 'function';
  if (canUseDrawImage) {
    try {
      // Cloth: G=190 (roughness), B=12 (metalness)
      ctxP.fillStyle = 'rgb(190,190,12)';
      ctxP.fillRect(0, 0, width, height);
      ctxP.globalCompositeOperation = 'destination-out';
      ctxP.drawImage(foilCanvas, 0, 0);
      ctxP.globalCompositeOperation = 'destination-over';
      // Foil: G=45 (roughness), B=235 (metalness)
      ctxP.fillStyle = 'rgb(45,45,235)';
      ctxP.fillRect(0, 0, width, height);
      ctxP.globalCompositeOperation = 'source-over';

      return { pbrMap: new THREE.CanvasTexture(pbrCanvas) };
    } catch {
      // fall through to pixel loop below
    }
  }

  // Pixel-loop fallback (JSDOM / environments without drawImage support)
  const foilCtx = foilCanvas.getContext('2d');
  const foilImg = foilCtx?.getImageData(0, 0, width, height);
  const pImg = ctxP.createImageData(width, height);
  const total = width * height * 4;
  for (let i = 0; i < total; i += 4) {
    const isFoil = foilImg ? foilImg.data[i] > 100 : false;
    const rVal = isFoil ? 45 : 190;
    const mVal = isFoil ? 235 : 12;
    pImg.data[i] = rVal;         // R unused
    pImg.data[i + 1] = rVal;     // G = roughness
    pImg.data[i + 2] = mVal;     // B = metalness
    pImg.data[i + 3] = 255;
  }
  ctxP.putImageData(pImg, 0, 0);

  return { pbrMap: new THREE.CanvasTexture(pbrCanvas) };
}


/**
 * Creates a seamless procedural crosshatch cloth normal map texture
 */
function getClothNormalMap(): THREE.CanvasTexture {
  if (cachedClothNormalMap) return cachedClothNormalMap;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Fill default flat normal blue (128, 128, 255)
  ctx.fillStyle = '#8080FF';
  ctx.fillRect(0, 0, 256, 256);

  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;

  // Generate crosshatch bump map saved into normal vectors
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const idx = (y * 256 + x) * 4;
      const grain1 = Math.sin(x * 0.8) * 20;
      const grain2 = Math.sin(y * 0.8) * 20;
      const nx = 128 + grain1;
      const ny = 128 + grain2;

      data[idx] = Math.min(255, Math.max(0, nx));
      data[idx + 1] = Math.min(255, Math.max(0, ny));
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = applyAnisotropy(new THREE.CanvasTexture(canvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 8);
  cachedClothNormalMap = texture;

  return texture;
}

/**
 * Creates paper page block texture with horizontal line details.
 * Warm cream stock (instead of pure white) reads as aged paper under warm
 * scene lighting; power-of-two dimensions keep mipmaps healthy. The shared
 * map is intentionally neutral — each book tints it through its own page-edge
 * material, so one book cannot change another book's pages.
 */
let cachedPaperBlockTexture: THREE.CanvasTexture | null = null;

function getPaperBlockTexture(): THREE.CanvasTexture {
  if (cachedPaperBlockTexture) return cachedPaperBlockTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Warm cream paper base.
  ctx.fillStyle = '#EDE5D4';
  ctx.fillRect(0, 0, 256, 1024);

  // Subtle page edge lines — ink-kissed paper, not hard black.
  ctx.fillStyle = 'rgba(120, 96, 62, 0.1)';
  for (let y = 0; y < 1024; y += 3) {
    if (y % 15 !== 0) {
      ctx.fillRect(0, y, 256, 1);
    }
  }

  // Neutral edge shading keeps the page cuts readable after tinting.
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, 'rgba(120, 96, 62, 0.16)');
  grad.addColorStop(0.05, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.95, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(120, 96, 62, 0.2)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 1024);

  const texture = applyAnisotropy(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  cachedPaperBlockTexture = texture;
  return texture;
}

/**
 * Helper to draw procedural foil motifs on HTML Canvas
 */
function drawFoilMotif(
  ctx: CanvasRenderingContext2D,
  motif: FoilMotifType,
  cx: number,
  cy: number,
  size: number,
  foilColor: string | CanvasGradient
) {
  ctx.save();
  ctx.strokeStyle = foilColor;
  ctx.fillStyle = foilColor;
  ctx.lineWidth = 2.5;

  if (motif === 'constellation') {
    // Stars and connected constellation lines
    const points: [number, number][] = [
      [cx, cy - size * 0.7],
      [cx + size * 0.5, cy - size * 0.3],
      [cx + size * 0.7, cy + size * 0.2],
      [cx + size * 0.2, cy + size * 0.7],
      [cx - size * 0.4, cy + size * 0.5],
      [cx - size * 0.6, cy - size * 0.1],
      [cx - size * 0.2, cy - size * 0.5],
    ];

    // Draw connecting lines
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Draw star nodes
    points.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Crescent moon center
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + size * 0.1, cy - size * 0.05, size * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.fillStyle = foilColor;

  } else if (motif === 'radial sunburst') {
    // Central sun with 16 radiating rays
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    const rays = 16;
    for (let i = 0; i < rays; i++) {
      const angle = (i * Math.PI * 2) / rays;
      const r1 = size * 0.32;
      const r2 = i % 2 === 0 ? size * 0.8 : size * 0.55;
      const x1 = cx + Math.cos(angle) * r1;
      const y1 = cy + Math.sin(angle) * r1;
      const x2 = cx + Math.cos(angle) * r2;
      const y2 = cy + Math.sin(angle) * r2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

  } else if (motif === 'botanical foliage') {
    // Symmetrical laurel / leaf branches
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.65, Math.PI * 0.35, Math.PI * 1.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.65, Math.PI * 1.35, Math.PI * 2.65);
    ctx.stroke();

    const leaves = 7;
    for (let i = 0; i < leaves; i++) {
      const t = (i / (leaves - 1)) * Math.PI * 1.2 - Math.PI * 0.6;
      const lx1 = cx - Math.cos(t) * size * 0.65;
      const ly1 = cy + Math.sin(t) * size * 0.65;

      ctx.beginPath();
      ctx.ellipse(lx1, ly1, 8, 4, t + 0.5, 0, Math.PI * 2);
      ctx.fill();

      const lx2 = cx + Math.cos(t) * size * 0.65;
      const ly2 = cy + Math.sin(t) * size * 0.65;

      ctx.beginPath();
      ctx.ellipse(lx2, ly2, 8, 4, -t - 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (motif === 'abstract geometric') {
    // Sacred geometry concentric diamonds and circles
    ctx.beginPath();
    ctx.rect(cx - size * 0.5, cy - size * 0.5, size, size);
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.rect(-size * 0.45, -size * 0.45, size * 0.9, size * 0.9);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

  } else if (motif === 'minimalist serif initials') {
    // Ornate diamond frame with inner monogram
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.rect(-size * 0.5, -size * 0.5, size, size);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(-size * 0.42, -size * 0.42, size * 0.84, size * 0.84);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.font = 'bold 36px "Cinzel", "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❖', cx, cy);
  }

  ctx.restore();
}

/**
 * Textures produced for one book surface: color map, the packed PBR map
 * (G=roughness, B=metalness — one texture instead of two) and the emboss
 * normal map derived from the foil mask.
 */
interface BookSurfaceTextures {
  map: THREE.CanvasTexture;
  pbrMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
}

/**
 * Creates Front Cover Texture (Map, Roughness, Metalness, Emboss Normal Map)
 *
 * Design notes:
 * - The cloth background is a shaded gradient with a vignette instead of a
 *   flat fill, so covers have atmosphere without losing the resolved tone.
 * - The foil hue is contrast-corrected against the binding
 *   (`getFoilDisplayColor`) and drawn with a vertical metallic gradient plus a
 *   stamped drop shadow on the color canvas. The PBR mask stays solid white so
 *   roughness/metalness and the emboss normal map derive from the same shapes.
 * - The title is larger, letter-tracked, wrapped to at most 3 lines with an
 *   ellipsis, and laid out in a classic centered composition (title, author,
 *   bottom ornament).
 */
function createFrontCoverTextures(item: ShelfBookManifestItem, bindingColor: string): BookSurfaceTextures {
  // Power-of-two canvas (512×512) so mipmaps stay valid; the layout below is
  // expressed as fractions of the height so the same code serves any size.
  const width = 512;
  const height = 512;
  const S = height / 768; // scale factor vs the original 512×768 layout

  // Diffuse Canvas
  const canvasMap = document.createElement('canvas');
  canvasMap.width = width;
  canvasMap.height = height;
  const ctxMap = canvasMap.getContext('2d')!;

  // Foil Mask Canvas (White = Foil, Black = Cloth)
  const canvasFoil = document.createElement('canvas');
  canvasFoil.width = width;
  canvasFoil.height = height;
  const ctxFoil = canvasFoil.getContext('2d')!;

  // 1. Cloth Background — base tone with shading and vignette
  drawClothBackground(ctxMap, width, height, bindingColor);

  ctxFoil.fillStyle = '#000000';
  ctxFoil.fillRect(0, 0, width, height);

  const foil = getFoilDisplayColor(item.foilHex, bindingColor);
  const pad = Math.round(height * 0.0625);

  // 2. Decorative Border Frame — metallic double rule on the color canvas,
  //    solid white on the mask so PBR stays aligned with the artwork.
  const innerRule = Math.round(height * 0.014);
  ctxMap.save();
  ctxMap.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctxMap.shadowOffsetX = 1;
  ctxMap.shadowOffsetY = 2;
  ctxMap.shadowBlur = 2;
  ctxMap.strokeStyle = getFoilGradient(ctxMap, pad, height - pad, foil);
  ctxMap.lineWidth = 3;
  ctxMap.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
  ctxMap.restore();
  ctxMap.strokeStyle = foil;
  ctxMap.lineWidth = 1;
  ctxMap.strokeRect(pad + innerRule, pad + innerRule, width - (pad + innerRule) * 2, height - (pad + innerRule) * 2);

  ctxFoil.strokeStyle = '#FFFFFF';
  ctxFoil.lineWidth = 3;
  ctxFoil.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
  ctxFoil.lineWidth = 1;
  ctxFoil.strokeRect(pad + innerRule, pad + innerRule, width - (pad + innerRule) * 2, height - (pad + innerRule) * 2);

  // 3. Foil Motif — stamped shadow + metallic gradient on the color canvas.
  drawFoilMotifOnMap(ctxMap, item.foilMotif, width / 2, height * 0.28, Math.round(92 * S), foil);
  drawFoilMotif(ctxFoil, item.foilMotif, width / 2, height * 0.28, Math.round(92 * S), '#FFFFFF');

  // 4. Title — tracked serif caps, wrapped to at most 3 lines.
  const titleFont = `bold ${Math.round(46 * S)}px "Cinzel", "Georgia", serif`;
  const titleTracking = Math.max(1, Math.round(3 * S));
  const titleLines = wrapTextLines(
    ctxMap,
    item.title.toUpperCase(),
    titleFont,
    titleTracking,
    width - Math.round(width * 0.27),
    3,
  );
  const titleLineHeight = Math.round(56 * S);
  const titleTop = Math.round(392 * S);
  titleLines.forEach((line, index) => {
    const y = titleTop + index * titleLineHeight;
    drawFoilText(ctxMap, line, width / 2, y, titleFont, titleTracking, foil);
    drawFoilTextMask(ctxFoil, line, width / 2, y, titleFont, titleTracking);
  });

  // 5. Author — sits below the title block, never colliding with the accent.
  const authorY = titleTop + titleLines.length * titleLineHeight + Math.round(22 * S);
  const authorFont = `${Math.round(20 * S)}px "Georgia", serif`;
  drawFoilText(ctxMap, item.author.toUpperCase(), width / 2, authorY, authorFont, Math.max(1, Math.round(2 * S)), foil);
  drawFoilTextMask(ctxFoil, item.author.toUpperCase(), width / 2, authorY, authorFont, Math.max(1, Math.round(2 * S)));

  // 6. Bottom Accent
  const accentFont = `${Math.round(22 * S)}px serif`;
  drawFoilText(ctxMap, '✦ ⚜ ✦', width / 2, height - Math.round(62 * S), accentFont, Math.max(2, Math.round(8 * S)), foil);
  drawFoilTextMask(ctxFoil, '✦ ⚜ ✦', width / 2, height - Math.round(62 * S), accentFont, Math.max(2, Math.round(8 * S)));

  // Create Textures
  const map = applyAnisotropy(new THREE.CanvasTexture(canvasMap));
  map.colorSpace = THREE.SRGBColorSpace;

  const { pbrMap } = buildFoilPBRMaps(canvasFoil, width, height);
  applyAnisotropy(pbrMap);

  const normalMap = buildFoilNormalMap(canvasFoil, width, height);

  return { map, pbrMap, normalMap };
}

/**
 * Creates Spine Texture (Map, Roughness, Metalness, Emboss Normal Map)
 *
 * Design notes:
 * - The spine is now a FLAT hardcover board (BoxGeometry), so the canvas
 *   aspect matches the physical face: width covers the book thickness
 *   (thickness / height of the book, ×768 canvas height). No curvature
 *   padding — the texture maps 1:1 onto the flat spine face.
 * - Raised bands are positioned proportionally to the height instead of at
 *   absolute pixels, so thin and tall books share the same rhythm.
 * - The vertical title uses a large proportional font with a two-line wrap
 *   and a safety shrink loop so it never overflows the spine width; the
 *   background/gradient/foil treatment matches the front cover.
 */
function createSpineTextures(item: ShelfBookManifestItem, bindingColor: string): BookSurfaceTextures {
  // Power-of-two canvas: height 512, width rounds to the nearest POT that
  // matches the physical face aspect (thickness / height). No curvature
  // padding — the texture maps 1:1 onto the flat spine face.
  const height = 512;
  const targetWidth = 512 * item.thickness / Math.max(item.height, 0.1);
  const width = Math.min(256, Math.max(64, Math.pow(2, Math.round(Math.log2(targetWidth)))));

  const canvasMap = document.createElement('canvas');
  canvasMap.width = width;
  canvasMap.height = height;
  const ctxMap = canvasMap.getContext('2d')!;

  const canvasFoil = document.createElement('canvas');
  canvasFoil.width = width;
  canvasFoil.height = height;
  const ctxFoil = canvasFoil.getContext('2d')!;

  // 1. Cloth Background — base tone with shading and vignette
  drawClothBackground(ctxMap, width, height, bindingColor);

  ctxFoil.fillStyle = '#000000';
  ctxFoil.fillRect(0, 0, width, height);

  const foil = getFoilDisplayColor(item.foilHex, bindingColor);
  const ribLineWidth = Math.max(2, Math.min(5, Math.round(width * 0.02)));

  // 2. Spine Ribs / Raised Bands — proportional to height, metallic on the
  //    color canvas, solid white on the mask.
  const ribYs = [0.07, 0.16, 0.84, 0.93].map((fraction) => fraction * height);
  ctxMap.save();
  ctxMap.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctxMap.shadowOffsetX = 1;
  ctxMap.shadowOffsetY = 1.5;
  ctxMap.shadowBlur = 2;
  ctxMap.strokeStyle = getFoilGradient(ctxMap, 0, height, foil);
  ctxMap.lineWidth = ribLineWidth;
  ctxFoil.strokeStyle = '#FFFFFF';
  ctxFoil.lineWidth = ribLineWidth;
  ribYs.forEach((y) => {
    ctxMap.beginPath();
    ctxMap.moveTo(width * 0.16, y);
    ctxMap.lineTo(width * 0.84, y);
    ctxMap.stroke();

    ctxFoil.beginPath();
    ctxFoil.moveTo(width * 0.16, y);
    ctxFoil.lineTo(width * 0.84, y);
    ctxFoil.stroke();
  });
  ctxMap.restore();

  // 3. Top Motif Accent — below the first band pair, scaled to the spine width.
  const motifSize = Math.max(10, Math.min(22, Math.round(width * 0.14)));
  drawFoilMotifOnMap(ctxMap, item.foilMotif, width / 2, height * 0.135, motifSize, foil);
  drawFoilMotif(ctxFoil, item.foilMotif, width / 2, height * 0.135, motifSize, '#FFFFFF');

  // 4. Vertical Title Text — wrapped to two lines between the band groups.
  //    Lines stack right-to-left as the eye travels down. The font keeps the
  //    same canvas-height ratio as the previous 768px layout (≈6% of height),
  //    so on-screen legibility is unchanged; the safety loop shrinks it if
  //    the glyphs would overflow the flat spine width.
  const usableLength = height * 0.6;
  let titleFontSize = Math.max(24, Math.min(40, Math.round(height * 0.06)));
  while (titleFontSize > 20 && titleFontSize * 0.68 > width * 0.92) {
    titleFontSize -= 2;
  }
  const titleFont = `bold ${titleFontSize}px "Cinzel", "Georgia", serif`;
  const titleTracking = Math.max(1, Math.round(titleFontSize * 0.08));
  const titleLines = wrapTextLines(
    ctxMap,
    item.title.toUpperCase(),
    titleFont,
    titleTracking,
    usableLength,
    2,
  );
  const titleLineHeight = titleFontSize * 1.5;

  ctxMap.save();
  ctxFoil.save();
  ctxMap.translate(width / 2, height * 0.52);
  ctxMap.rotate(Math.PI / 2);
  ctxFoil.translate(width / 2, height * 0.52);
  ctxFoil.rotate(Math.PI / 2);

  const blockHeight = titleLines.length * titleLineHeight;
  titleLines.forEach((line, index) => {
    const y = -blockHeight / 2 + index * titleLineHeight;
    drawFoilText(ctxMap, line, 0, y, titleFont, titleTracking, foil);
    drawFoilTextMask(ctxFoil, line, 0, y, titleFont, titleTracking);
  });

  ctxMap.restore();
  ctxFoil.restore();

  // 5. Author near the bottom bands, shrunk to fit the spine width.
  let authorFontSize = Math.max(12, Math.min(20, Math.round(width * 0.12)));
  let authorFont = `${authorFontSize}px "Georgia", serif`;
  const authorText = item.author.toUpperCase();
  while (authorFontSize > 9 && measureTextWidth(ctxMap, authorText, 1) > width * 0.86) {
    authorFontSize -= 1;
    authorFont = `${authorFontSize}px "Georgia", serif`;
    ctxMap.font = authorFont;
  }
  drawFoilText(ctxMap, authorText, width / 2, height * 0.885, authorFont, 1, foil);
  drawFoilTextMask(ctxFoil, authorText, width / 2, height * 0.885, authorFont, 1);

  const map = applyAnisotropy(new THREE.CanvasTexture(canvasMap));
  map.colorSpace = THREE.SRGBColorSpace;

  const { pbrMap } = buildFoilPBRMaps(canvasFoil, width, height);
  applyAnisotropy(pbrMap);

  const normalMap = buildFoilNormalMap(canvasFoil, width, height);

  return { map, pbrMap, normalMap };
}

/**
 * Dynamic book dimension scaling by page count.
 * Delegates to the shared `getBookDimensions` utility.
 * Kept for backwards compatibility with any external callers.
 */
export function getBookDimensionsByPageCount(pages?: number, item?: Partial<ShelfBookManifestItem>): {
  thickness: number;
  height: number;
  width: number;
} {
  if (typeof pages === 'number' && pages > 0) {
    return getBookDimensions(pages);
  }
  return {
    thickness: item?.thickness ?? 0.50,
    height: item?.height ?? 2.6,
    width: item?.width ?? 1.7,
  };
}

/**
 * Deterministic color fallback hash based on string key (e.g. title or coverUrl)
 */
export function getDeterministicColorHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const saturation = 45 + (Math.abs(hash >> 8) % 30);
  const lightness = 25 + (Math.abs(hash >> 16) % 25);

  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    r = hue2rgb(h + 1 / 3);
    g = hue2rgb(h);
    b = hue2rgb(h - 1 / 3);
  }

  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * DuckDuckGo's image wrapper often omits CORS headers even when the embedded
 * image origin supports them. Use the original HTTPS image for WebGL textures.
 */
export function resolveCoverTextureUrl(rawUrl: string): string {
  const trimmedUrl = rawUrl.trim();
  try {
    const parsedUrl = new URL(trimmedUrl, 'http://localhost');
    if (
      parsedUrl.protocol === 'https:'
      && parsedUrl.hostname === 'external-content.duckduckgo.com'
      && parsedUrl.pathname === '/iu/'
    ) {
      const embeddedUrl = parsedUrl.searchParams.get('u');
      if (embeddedUrl) {
        const directUrl = new URL(embeddedUrl);
        if (directUrl.protocol === 'https:') return directUrl.toString();
      }
    }
  } catch {
    // TextureLoader will report the normal loading error for malformed URLs.
  }

  return trimmedUrl;
}

/**
 * Extracts dominant color from cover image canvas or HTMLImageElement with CORS resilience
 */
export function extractDominantColor(img: HTMLImageElement | HTMLCanvasElement, _fallbackKey = 'book'): string | null {
  // Note: crossOrigin must be set BEFORE the image HTTP request is made (by TextureLoader).
  // Setting it here after the image is loaded has no effect and is intentionally omitted.
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, 32, 32);
    const imageData = ctx.getImageData(0, 0, 32, 32);
    return extractRepresentativeColor({
      data: imageData.data,
      width: imageData.width || 32,
      height: imageData.height || 32,
    });
  } catch {
    // A texture can be usable while canvas pixel reads fail because of CORS.
    // The caller keeps the manifest/custom fallback instead of inventing a color.
    return null;
  }
}

/**
 * Creates Back Cover Textures (Map, Roughness, Metalness, Emboss Normal Map)
 * with Written Notes & Reflections.
 *
 * Design notes:
 * - The border, header, rule and footer seal now share the front cover's foil
 *   treatment: contrast-corrected hue, metallic gradient, stamped shadow on
 *   the color canvas and a solid-white PBR mask so they glint like real foil.
 * - The notes stay as contrasting ink on cloth — deliberately not foil, which
 *   keeps the back cover readable instead of showy.
 * - Background gradient/vignette matches the front cover.
 */
function createBackCoverTextures(item: ShelfBookManifestItem, notesText: string, bindingColor: string): BookSurfaceTextures {
  // Power-of-two canvas (512×512) with the same fractional layout as the
  // front cover, so mipmaps stay valid and the composition matches.
  const width = 512;
  const height = 512;
  const S = height / 768;

  const canvasMap = document.createElement('canvas');
  canvasMap.width = width;
  canvasMap.height = height;
  const ctx = canvasMap.getContext('2d')!;

  const canvasFoil = document.createElement('canvas');
  canvasFoil.width = width;
  canvasFoil.height = height;
  const ctxFoil = canvasFoil.getContext('2d')!;

  // 1. Cloth Background — base tone with shading and vignette
  drawClothBackground(ctx, width, height, bindingColor);

  ctxFoil.fillStyle = '#000000';
  ctxFoil.fillRect(0, 0, width, height);

  const foil = getFoilDisplayColor(item.foilHex, bindingColor);
  const pad = Math.round(height * 0.0625);
  const innerRule = Math.round(height * 0.014);

  // 2. Decorative Border Frame — metallic double rule + mask.
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 2;
  ctx.strokeStyle = getFoilGradient(ctx, pad, height - pad, foil);
  ctx.lineWidth = 3;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
  ctx.restore();
  ctx.strokeStyle = foil;
  ctx.lineWidth = 1;
  ctx.strokeRect(pad + innerRule, pad + innerRule, width - (pad + innerRule) * 2, height - (pad + innerRule) * 2);

  ctxFoil.strokeStyle = '#FFFFFF';
  ctxFoil.lineWidth = 3;
  ctxFoil.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
  ctxFoil.lineWidth = 1;
  ctxFoil.strokeRect(pad + innerRule, pad + innerRule, width - (pad + innerRule) * 2, height - (pad + innerRule) * 2);

  // 3. Back Cover Header + rule — foil on both canvases.
  const headerFont = `bold ${Math.round(24 * S)}px "Cinzel", "Georgia", serif`;
  drawFoilText(ctx, 'NOTAS & REFLEXÕES', width / 2, pad + Math.round(48 * S), headerFont, Math.max(1, Math.round(2 * S)), foil);
  drawFoilTextMask(ctxFoil, 'NOTAS & REFLEXÕES', width / 2, pad + Math.round(48 * S), headerFont, Math.max(1, Math.round(2 * S)));

  const ruleY = pad + Math.round(72 * S);
  ctx.strokeStyle = getFoilGradient(ctx, ruleY - 4, ruleY + 4, foil);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad + Math.round(40 * S), ruleY);
  ctx.lineTo(width - pad - Math.round(40 * S), ruleY);
  ctx.stroke();

  ctxFoil.strokeStyle = '#FFFFFF';
  ctxFoil.lineWidth = 1.5;
  ctxFoil.beginPath();
  ctxFoil.moveTo(pad + Math.round(40 * S), ruleY);
  ctxFoil.lineTo(width - pad - Math.round(40 * S), ruleY);
  ctxFoil.stroke();

  // 4. Notes & Reflections Written Content — ink, not foil.
  ctx.fillStyle = getContrastingTextColor(bindingColor);
  ctx.textAlign = 'left';
  ctx.font = `${Math.round(16 * S)}px "Georgia", serif`;

  const text = notesText && notesText.trim() ? notesText : 'Nenhuma nota registrada para este volume.';
  const words = text.split(/\s+/);
  const maxTextWidth = width - pad * 2 - Math.round(36 * S);
  const startX = pad + Math.round(18 * S);
  let startY = pad + Math.round(95 * S);
  const lineHeight = Math.round(25 * S);
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxTextWidth) {
      ctx.fillText(currentLine, startX, startY);
      currentLine = words[i];
      startY += lineHeight;
      if (startY > height - pad - Math.round(55 * S)) {
        ctx.fillStyle = foil;
        ctx.fillText('... (continua na ficha do livro)', startX, startY);
        break;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine && startY <= height - pad - Math.round(55 * S)) {
    ctx.fillText(currentLine, startX, startY);
  }

  // 5. Publisher Seal Footer — foil on both canvases.
  const footerFont = `${Math.round(13 * S)}px "Georgia", serif`;
  drawFoilText(ctx, '✦ BIBLIOTECA EDITORIAL ✦', width / 2, height - pad - Math.round(16 * S), footerFont, Math.max(1, Math.round(3 * S)), foil);
  drawFoilTextMask(ctxFoil, '✦ BIBLIOTECA EDITORIAL ✦', width / 2, height - pad - Math.round(16 * S), footerFont, Math.max(1, Math.round(3 * S)));

  const map = applyAnisotropy(new THREE.CanvasTexture(canvasMap));
  map.colorSpace = THREE.SRGBColorSpace;

  const { pbrMap } = buildFoilPBRMaps(canvasFoil, width, height);
  applyAnisotropy(pbrMap);

  const normalMap = buildFoilNormalMap(canvasFoil, width, height);

  return { map, pbrMap, normalMap };
}

/**
 * Re-samples a loaded cover image to at most `maxDim` pixels on its longest
 * side (GPU memory: a 4K mipmapped cover costs ~20–30MB). Returns the
 * original texture when it already fits or when canvas re-sampling is
 * unavailable (JSDOM). The original texture is disposed here — callers must
 * treat the returned texture as the new owner.
 */
function downsampleCoverTexture<T extends THREE.Texture>(texture: T, maxDim: number): T {
  const image = texture.image as HTMLImageElement | HTMLCanvasElement | undefined;
  if (!image || typeof image.width !== 'number' || typeof image.height !== 'number') {
    return texture;
  }
  const longest = Math.max(image.width, image.height);
  if (longest <= maxDim) return texture;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * (maxDim / longest)));
  canvas.height = Math.max(1, Math.round(image.height * (maxDim / longest)));
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof ctx.drawImage !== 'function') {
    return texture;
  }

  try {
    ctx.drawImage(image as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    const resized = new THREE.CanvasTexture(canvas);
    resized.colorSpace = THREE.SRGBColorSpace;
    resized.wrapS = THREE.ClampToEdgeWrapping;
    resized.wrapT = THREE.ClampToEdgeWrapping;
    resized.minFilter = THREE.LinearMipmapLinearFilter;
    texture.dispose();
    // The caller only relies on Texture behavior; the downsampled canvas
    // replaces the original image object wholesale.
    return resized as unknown as T;
  } catch {
    return texture;
  }
}

export class BookMeshGroup {
  public group: THREE.Group;
  public item: ShelfBookManifestItem;
  public isHovered: boolean = false;
  public isSelected: boolean = false;
  /**
   * Called whenever a surface texture is applied asynchronously (e.g. a
   * remote cover finishes loading) so the scene can wake its render loop.
   * Assigned by CompleteShelfScene.
   */
  public onSurfaceUpdate: (() => void) | null = null;

  private basePosition: THREE.Vector3;
  private baseRotation: THREE.Euler;
  private focusPosition: THREE.Vector3;
  private focusRotation: THREE.Euler;
  private focusScale: number = 1.14;
  private targetPosition: THREE.Vector3;
  private targetRotation: THREE.Euler;
  private targetScale: THREE.Vector3;

  private clothMaterials: THREE.MeshStandardMaterial[] = [];
  private frontCoverMaterial: THREE.MeshStandardMaterial | null = null;
  private backCoverMaterial: THREE.MeshStandardMaterial | null = null;
  private spineMaterial: THREE.MeshStandardMaterial | null = null;
  private baseClothMaterial: THREE.MeshStandardMaterial | null = null;
  private pageEdgeMaterial: THREE.MeshStandardMaterial | null = null;
  private glowMesh: THREE.Mesh | null = null;
  private texturesToDispose: THREE.Texture[] = [];
  private resolvedBindingColor: ResolvedBindingColor;
  private frontUsesCoverTexture = false;
  private coverLoadGeneration = 0;
  private isDisposed: boolean = false;

  constructor(item: ShelfBookManifestItem, position: THREE.Vector3) {
    const dynamicDims = getBookDimensionsByPageCount(item.pages, item);
    this.item = {
      ...item,
      thickness: dynamicDims.thickness,
      height: dynamicDims.height,
      width: dynamicDims.width,
    };
    this.resolvedBindingColor = resolveBindingColor({
      customColor: this.item.customColor,
      manifestColor: this.item.clothColor,
    });
    this.group = new THREE.Group();
    this.basePosition = position.clone();
    this.baseRotation = new THREE.Euler(0, 0, 0);
    this.focusPosition = position.clone();
    this.focusRotation = new THREE.Euler(0, 0, 0);
    this.targetPosition = position.clone();
    this.targetRotation = new THREE.Euler(0, 0, 0);
    this.targetScale = new THREE.Vector3(1, 1, 1);

    this.group.position.copy(position);
    this.buildGeometryAndMaterials();
  }

  private buildGeometryAndMaterials() {
    const { width, height, thickness } = this.item;
    const clothNormalMap = getClothNormalMap();
    const bindingColor = this.resolvedBindingColor.hex;

    // 1. Textures
    const frontTex = createFrontCoverTextures(this.item, bindingColor);
    const spineTex = createSpineTextures(this.item, bindingColor);
    const backTex = createBackCoverTextures(this.item, this.item.notes || '', bindingColor);
    const paperTex = getPaperBlockTexture();

    this.texturesToDispose.push(
      frontTex.map, frontTex.pbrMap, frontTex.normalMap,
      spineTex.map, spineTex.pbrMap, spineTex.normalMap,
      backTex.map, backTex.pbrMap, backTex.normalMap,
    );

    // Common cloth material
    const baseClothMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bindingColor),
      roughness: 0.7,
      metalness: 0.05,
      normalMap: clothNormalMap,
      normalScale: new THREE.Vector2(0.2, 0.2),
      envMapIntensity: 0.85,
    });

    // Cover surfaces combine the packed foil PBR map (G=roughness, B=metalness
    // — one texture backs both material slots) with an emboss normal map
    // derived from the foil mask. The env map (scene.environment) is inherited
    // automatically; the intensity is tuned so foil glints without blowing out
    // the matte cloth (which stays dark thanks to its high roughness).
    const frontCoverMat = new THREE.MeshStandardMaterial({
      map: frontTex.map,
      roughnessMap: frontTex.pbrMap,
      metalnessMap: frontTex.pbrMap,
      normalMap: frontTex.normalMap,
      normalScale: new THREE.Vector2(0.22, 0.22),
      envMapIntensity: 1.25,
    });

    const backCoverMat = new THREE.MeshStandardMaterial({
      map: backTex.map,
      roughnessMap: backTex.pbrMap,
      metalnessMap: backTex.pbrMap,
      normalMap: backTex.normalMap,
      normalScale: new THREE.Vector2(0.22, 0.22),
      envMapIntensity: 1.25,
    });

    const spineMat = new THREE.MeshStandardMaterial({
      map: spineTex.map,
      roughnessMap: spineTex.pbrMap,
      metalnessMap: spineTex.pbrMap,
      normalMap: spineTex.normalMap,
      normalScale: new THREE.Vector2(0.28, 0.28),
      envMapIntensity: 1.25,
    });

    // Warm cream page stock; the shared map is tinted per surface via color.
    const paperMat = new THREE.MeshStandardMaterial({
      map: paperTex,
      roughness: 0.85,
      metalness: 0.0,
      color: new THREE.Color('#FFFFFF'),
      envMapIntensity: 0.8,
    });

    const pageEdgeMat = new THREE.MeshStandardMaterial({
      map: paperTex,
      roughness: 0.94,
      metalness: 0.0,
      color: new THREE.Color(bindingColor),
      envMapIntensity: 0.9,
    });

    this.clothMaterials.push(baseClothMat, frontCoverMat, spineMat, backCoverMat, paperMat, pageEdgeMat);
    this.frontCoverMaterial = frontCoverMat;
    this.backCoverMaterial = backCoverMat;
    this.spineMaterial = spineMat;
    this.baseClothMaterial = baseClothMat;
    this.pageEdgeMaterial = pageEdgeMat;

    // 2. Closed Book Geometry Assembly
    const boardThickness = 0.04;
    const overhang = 0.04;

    // Enclosed Paper Block
    const paperW = thickness - boardThickness * 2 - 0.01;
    const paperH = height - overhang * 2;
    const paperD = width - 0.08;
    const paperGeo = new THREE.BoxGeometry(paperW, paperH, paperD);
    // BoxGeometry groups are +X, -X, +Y, -Y, +Z, -Z. The +Z side is the
    // structural spine, while the visible page cuts are top, bottom, and -Z.
    const paperMesh = new THREE.Mesh(paperGeo, createBoxFaceMaterials(
      paperMat,
      paperMat,
      pageEdgeMat,
      pageEdgeMat,
      baseClothMat,
      pageEdgeMat,
    ));
    paperMesh.name = 'page-block';
    paperMesh.userData.surfaceRole = 'page-block';
    paperMesh.position.set(0, height / 2, -0.04);
    paperMesh.castShadow = true;
    paperMesh.receiveShadow = true;
    this.group.add(paperMesh);

    // Front Cover (+X side)
    const coverGeo = new THREE.BoxGeometry(boardThickness, height, width);
    const frontCoverMesh = new THREE.Mesh(coverGeo, createBoxFaceMaterials(
      frontCoverMat, // +X front cover canvas
      baseClothMat,  // -X
      baseClothMat,  // +Y top
      baseClothMat,  // -Y bottom
      baseClothMat,  // +Z edge
      baseClothMat,  // -Z edge
    ));
    frontCoverMesh.name = 'front-cover';
    frontCoverMesh.userData.surfaceRole = 'front-cover';
    frontCoverMesh.position.set(thickness / 2 - boardThickness / 2, height / 2, 0);
    frontCoverMesh.castShadow = true;
    frontCoverMesh.receiveShadow = true;
    this.group.add(frontCoverMesh);

    if (this.item.coverUrl) {
      this.loadCoverTexture(this.item.coverUrl);
    }

    // Back Cover (-X side) with Notes & Reflections Canvas
    const backCoverMesh = new THREE.Mesh(coverGeo, createBoxFaceMaterials(
      baseClothMat,  // +X
      backCoverMat,  // -X back cover canvas with notes
      baseClothMat,  // +Y top
      baseClothMat,  // -Y bottom
      baseClothMat,  // +Z edge
      baseClothMat,  // -Z edge
    ));
    backCoverMesh.name = 'back-cover';
    backCoverMesh.userData.surfaceRole = 'back-cover';
    backCoverMesh.position.set(-thickness / 2 + boardThickness / 2, height / 2, 0);
    backCoverMesh.castShadow = true;
    backCoverMesh.receiveShadow = true;
    this.group.add(backCoverMesh);

    // Spine — flat hardcover board closing the back edge (z = +width/2).
    // The cover boards run the full depth, so the board sits flush *inside*
    // them (z from width/2 - boardThickness to width/2) with no gap and no
    // protrusion; the page block is inset at z = -0.04 and never touches it,
    // so there is no z-fighting. Only the +Z face carries the spine texture
    // (vertical title, raised bands, author); the edges stay cloth.
    const spineGeo = new THREE.BoxGeometry(thickness, height, boardThickness);
    const spineMesh = new THREE.Mesh(spineGeo, createBoxFaceMaterials(
      baseClothMat,  // +X side edge
      baseClothMat,  // -X side edge
      baseClothMat,  // +Y top
      baseClothMat,  // -Y bottom
      spineMat,      // +Z visible spine face
      baseClothMat,  // -Z inner face
    ));
    spineMesh.name = 'spine';
    spineMesh.userData.surfaceRole = 'spine';
    spineMesh.position.set(0, height / 2, width / 2 - boardThickness / 2);
    spineMesh.castShadow = true;
    spineMesh.receiveShadow = true;
    this.group.add(spineMesh);

    // The cover boards already provide the binding on their top, bottom, and
    // fore-edge groups. Separate full-size trim caps used to cover the page
    // cuts, so they are intentionally omitted to keep the three page edges visible.

    // Subtle Hover Glow Wireframe/Bounding Mesh
    const glowGeo = new THREE.BoxGeometry(thickness + 0.08, height + 0.08, width + 0.08);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.item.foilHex),
      transparent: true,
      opacity: 0,
      wireframe: true,
    });
    this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.glowMesh.name = 'selection-glow';
    this.glowMesh.position.set(0, height / 2, 0);
    this.group.add(this.glowMesh);

    // User Data for Raycasting identification
    this.group.userData = { bookId: this.item.id, instance: this };
    this.group.traverse((child) => {
      child.userData = { ...child.userData, bookId: this.item.id, instance: this };
    });
  }

  private replaceTextureSet(
    material: THREE.MeshStandardMaterial | null,
    textures: BookSurfaceTextures,
  ) {
    if (!material) {
      textures.map.dispose();
      textures.pbrMap.dispose();
      textures.normalMap.dispose();
      return;
    }

    const previousTextures = [
      material.map,
      material.roughnessMap,
      material.metalnessMap,
      material.normalMap,
    ].filter((texture): texture is THREE.Texture => texture !== null);

    material.map = textures.map;
    material.roughnessMap = textures.pbrMap;
    material.metalnessMap = textures.pbrMap;
    material.normalMap = textures.normalMap;
    material.normalScale.set(0.22, 0.22);
    material.color.set('#FFFFFF');
    material.needsUpdate = true;

    previousTextures.forEach((texture) => {
      const trackedIndex = this.texturesToDispose.indexOf(texture);
      if (trackedIndex !== -1) this.texturesToDispose.splice(trackedIndex, 1);
      texture.dispose();
    });

    this.texturesToDispose.push(
      textures.map,
      textures.pbrMap,
      textures.normalMap,
    );
  }

  private refreshColorBoundTextures(hexColor: string) {
    if (!this.frontUsesCoverTexture) {
      this.replaceTextureSet(
        this.frontCoverMaterial,
        createFrontCoverTextures(this.item, hexColor),
      );
    }
    this.replaceTextureSet(
      this.spineMaterial,
      createSpineTextures(this.item, hexColor),
    );
    this.replaceTextureSet(
      this.backCoverMaterial,
      createBackCoverTextures(this.item, this.item.notes || '', hexColor),
    );
  }

  private applyBindingColor(resolved: ResolvedBindingColor) {
    if (this.isDisposed) return;
    const colorChanged = this.resolvedBindingColor.hex !== resolved.hex;
    this.resolvedBindingColor = resolved;
    if (!colorChanged) return;

    const color = new THREE.Color(resolved.hex);

    // baseClothMaterial has no map — direct color assignment is correct
    if (this.baseClothMaterial) {
      this.baseClothMaterial.color.copy(color);
      this.baseClothMaterial.needsUpdate = true;
    }

    if (this.pageEdgeMaterial) {
      this.pageEdgeMaterial.color.copy(color);
      this.pageEdgeMaterial.needsUpdate = true;
    }

    // Rebuild only the color-baked surfaces. A loaded cover image remains
    // untouched, while procedural covers follow the same resolved color.
    this.refreshColorBoundTextures(resolved.hex);
  }

  public updateBindingColor(hexColor: string) {
    const normalized = normalizeHexColor(hexColor);
    if (!normalized) return;
    this.applyBindingColor({ hex: normalized, source: 'custom' });
  }

  /**
   * Incremental content update used by scene reconciliation (filtering,
   * metadata edits). When nothing relevant changed it is a cheap no-op, so
   * re-filtering the shelf does not rebuild any textures. Dimension changes
   * update the stored item but keep the current geometry — full dimension
   * edits are out of scope for the incremental path.
   */
  public updateItem(next: ShelfBookManifestItem) {
    const prev = this.item;
    const contentChanged =
      prev.title !== next.title
      || prev.author !== next.author
      || prev.notes !== next.notes
      || prev.foilHex !== next.foilHex
      || prev.foilMotif !== next.foilMotif
      || prev.clothColor !== next.clothColor
      || prev.customColor !== next.customColor
      || prev.pages !== next.pages
      || prev.height !== next.height
      || prev.width !== next.width
      || prev.thickness !== next.thickness;

    const dims = getBookDimensionsByPageCount(next.pages, next);
    this.item = {
      ...next,
      thickness: dims.thickness,
      height: dims.height,
      width: dims.width,
    };

    if (!contentChanged && next.coverUrl === prev.coverUrl) return;

    // Cover swapped: reload the image (procedural surfaces stay until it
    // arrives); cover removed: fall back to the procedural cover.
    if (next.coverUrl !== prev.coverUrl) {
      this.frontUsesCoverTexture = false;
      if (next.coverUrl) {
        this.loadCoverTexture(next.coverUrl);
      } else {
        this.coverLoadGeneration += 1;
        if (this.frontCoverMaterial) {
          this.replaceTextureSet(
            this.frontCoverMaterial,
            createFrontCoverTextures(this.item, this.resolvedBindingColor.hex),
          );
        }
      }
    }

    // Rebind cloth tone + regenerate color-baked surfaces only when needed.
    const resolved = resolveBindingColor({
      customColor: next.customColor,
      manifestColor: next.clothColor,
    });
    if (resolved.hex !== this.resolvedBindingColor.hex) {
      this.applyBindingColor(resolved);
    } else if (contentChanged) {
      this.refreshColorBoundTextures(this.resolvedBindingColor.hex);
    }
    this.onSurfaceUpdate?.();
  }

  public getResolvedBindingColor(): ResolvedBindingColor {
    return { ...this.resolvedBindingColor };
  }

  private loadCoverTexture(coverUrl: string) {
    const loadGeneration = ++this.coverLoadGeneration;
    const textureUrl = resolveCoverTextureUrl(coverUrl);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      textureUrl,
      (texture) => {
        if (
          this.isDisposed
          || loadGeneration !== this.coverLoadGeneration
          || this.item.coverUrl !== coverUrl
          || !this.frontCoverMaterial
        ) {
          texture.dispose();
          return;
        }

        // Downsample oversized remote covers (up to 4K) to ≤1024px before
        // upload — a 4K mipmapped cover costs ~20–30MB of GPU memory per book.
        texture = downsampleCoverTexture(texture, 1024);

        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        applyAnisotropy(texture);

        const previousTextures = [
          this.frontCoverMaterial.map,
          this.frontCoverMaterial.roughnessMap,
          this.frontCoverMaterial.metalnessMap,
          this.frontCoverMaterial.normalMap,
        ].filter((candidate): candidate is THREE.Texture => candidate !== null);
        this.frontCoverMaterial.map = texture;
        this.frontCoverMaterial.roughnessMap = null;
        this.frontCoverMaterial.metalnessMap = null;
        // A real photo cover has no foil emboss — fall back to the woven cloth
        // relief and a subtle environment response.
        this.frontCoverMaterial.normalMap = getClothNormalMap();
        this.frontCoverMaterial.normalScale.set(0.2, 0.2);
        this.frontCoverMaterial.roughness = 0.72;
        this.frontCoverMaterial.metalness = 0.05;
        this.frontCoverMaterial.envMapIntensity = 0.9;
        this.frontCoverMaterial.color.set('#FFFFFF');
        this.frontCoverMaterial.needsUpdate = true;
        previousTextures.forEach((previousTexture) => {
          const trackedIndex = this.texturesToDispose.indexOf(previousTexture);
          if (trackedIndex !== -1) this.texturesToDispose.splice(trackedIndex, 1);
          previousTexture.dispose();
        });
        this.texturesToDispose.push(texture);
        this.frontUsesCoverTexture = true;
        this.onSurfaceUpdate?.();

        // A CORS-blocked canvas read returns null; resolution then stays on the
        // manifest/custom source while the original cover texture remains intact.
        if (!normalizeHexColor(this.item.customColor) && texture.image) {
          const extractedHex = extractDominantColor(
            texture.image as HTMLImageElement | HTMLCanvasElement,
            coverUrl,
          );
          const resolved = resolveBindingColor({
            extractedColor: extractedHex,
            manifestColor: this.item.clothColor,
          });
          this.applyBindingColor(resolved);
        }
      },
      undefined,
      () => {
        if (
          this.isDisposed
          || loadGeneration !== this.coverLoadGeneration
          || this.item.coverUrl !== coverUrl
        ) return;

        if (!normalizeHexColor(this.item.customColor)) {
          this.applyBindingColor(resolveBindingColor({
            manifestColor: this.item.clothColor,
          }));
        }
      },
    );
  }

  public setHovered(hovered: boolean) {
    if (this.isSelected) return;
    this.isHovered = hovered;
    if (hovered) {
      this.targetPosition.set(this.basePosition.x, this.basePosition.y, this.basePosition.z + 0.35);
      this.targetRotation.set(0.08, -0.05, 0.03);
    } else {
      this.targetPosition.copy(this.basePosition);
      this.targetRotation.copy(this.baseRotation);
    }
  }

  public setFocusPose(position: THREE.Vector3, rotation: THREE.Euler, scale: number = 1.14) {
    this.focusPosition.copy(position);
    this.focusRotation.copy(rotation);
    this.focusScale = scale;

    if (this.isSelected) {
      this.targetPosition.copy(this.focusPosition);
      this.targetRotation.copy(this.focusRotation);
      this.targetScale.setScalar(this.focusScale);
    }
  }

  public setBasePosition(position: THREE.Vector3) {
    this.basePosition.copy(position);
    this.focusPosition.set(position.x, position.y, 1.8);

    if (!this.isSelected && !this.isHovered) {
      this.targetPosition.copy(this.basePosition);
    }
  }

  public setDragPreview(position: THREE.Vector3) {
    this.targetPosition.copy(position);
    this.targetRotation.set(0, 0, 0);
    this.targetScale.setScalar(1.03);
  }

  public setOrbitRotation(rotX: number, rotY: number) {
    this.targetRotation.x = rotX;
    this.targetRotation.y = rotY;
    this.targetRotation.z = 0;
  }

  public clearDragPreview() {
    if (this.isSelected) {
      this.targetPosition.copy(this.focusPosition);
      this.targetRotation.copy(this.focusRotation);
      this.targetScale.setScalar(this.focusScale);
      return;
    }

    this.targetPosition.copy(this.basePosition);
    this.targetRotation.copy(this.baseRotation);
    this.targetScale.setScalar(1);
  }

  public setSelected(selected: boolean) {
    // The scene reasserts selection every frame; avoid resetting the user's
    // orbit pose while the selected state itself has not changed.
    if (this.isSelected === selected) return;

    this.isSelected = selected;
    if (selected) {
      this.isHovered = false;
      this.targetPosition.copy(this.focusPosition);
      this.targetRotation.copy(this.focusRotation);
      this.targetScale.setScalar(this.focusScale);
    } else {
      this.isHovered = false;
      this.targetPosition.copy(this.basePosition);
      this.targetRotation.copy(this.baseRotation);
      this.targetScale.setScalar(1);
    }
  }

  public update(delta: number) {
    // Lerp position, rotation and scale so focus visibly pulls the book out
    // of the shelf before the details panel is used.
    const lerpSpeed = Math.min(1, delta * 10);
    this.group.position.lerp(this.targetPosition, lerpSpeed);
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, this.targetRotation.x, lerpSpeed);
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, this.targetRotation.y, lerpSpeed);
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, this.targetRotation.z, lerpSpeed);
    this.group.scale.lerp(this.targetScale, lerpSpeed);

    // Glow pulse animation
    if (this.glowMesh) {
      const mat = this.glowMesh.material as THREE.MeshBasicMaterial;
      const targetOpacity = this.isHovered ? 0.35 : 0.0;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, delta * 8);
    }
  }

  /**
   * True while the book is still lerping toward its targets. Used by the
   * render loop to keep rendering during hover/focus/drag animations and
   * skip rendering when everything is idle.
   */
  public isAnimating(epsilon = 0.002): boolean {
    if (this.group.position.distanceToSquared(this.targetPosition) > epsilon * epsilon) return true;
    if (Math.abs(this.group.rotation.x - this.targetRotation.x) > epsilon) return true;
    if (Math.abs(this.group.rotation.y - this.targetRotation.y) > epsilon) return true;
    if (Math.abs(this.group.rotation.z - this.targetRotation.z) > epsilon) return true;
    if (Math.abs(this.group.scale.x - this.targetScale.x) > epsilon) return true;
    if (Math.abs(this.group.scale.y - this.targetScale.y) > epsilon) return true;
    if (Math.abs(this.group.scale.z - this.targetScale.z) > epsilon) return true;
    if (this.glowMesh) {
      const mat = this.glowMesh.material as THREE.MeshBasicMaterial;
      const targetOpacity = this.isHovered ? 0.35 : 0.0;
      if (Math.abs(mat.opacity - targetOpacity) > 0.02) return true;
    }
    return false;
  }

  public getBasePosition(): THREE.Vector3 {
    return this.basePosition.clone();
  }

  public getFocusPosition(): THREE.Vector3 {
    return this.focusPosition.clone();
  }

  public dispose() {
    this.isDisposed = true;
    this.coverLoadGeneration += 1;
    this.clothMaterials.forEach((m) => m.dispose());
    // The page texture is shared/cached — materials can be disposed per book,
    // but the shared map must remain valid for every other book.
    this.texturesToDispose
      .forEach((t) => t.dispose());
    if (this.glowMesh) {
      (this.glowMesh.material as THREE.MeshBasicMaterial).dispose();
    }
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
  }
}
