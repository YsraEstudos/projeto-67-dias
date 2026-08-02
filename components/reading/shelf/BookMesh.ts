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
 * Generates PBR roughness and metalness map canvases from a foil mask canvas.
 * Uses canvas compositing when available (browsers) and falls back to a
 * pixel-loop for environments that do not implement drawImage (e.g. JSDOM).
 *
 * Foil areas  → low roughness (45/255 ≈ 0.18), high metalness (235/255 ≈ 0.92)
 * Cloth areas → high roughness (190/255 ≈ 0.75), low metalness (12/255 ≈ 0.05)
 */
function buildFoilPBRMaps(
  foilCanvas: HTMLCanvasElement,
  width: number,
  height: number,
): { roughnessMap: THREE.CanvasTexture; metalnessMap: THREE.CanvasTexture } {
  const roughnessCanvas = document.createElement('canvas');
  roughnessCanvas.width = width;
  roughnessCanvas.height = height;
  const ctxR = roughnessCanvas.getContext('2d')!;

  const metalnessCanvas = document.createElement('canvas');
  metalnessCanvas.width = width;
  metalnessCanvas.height = height;
  const ctxM = metalnessCanvas.getContext('2d')!;

  // Try compositing path (fast, browser-native)
  const canUseDrawImage = typeof ctxR.drawImage === 'function';
  if (canUseDrawImage) {
    try {
      ctxR.fillStyle = 'rgb(190,190,190)';
      ctxR.fillRect(0, 0, width, height);
      ctxR.globalCompositeOperation = 'destination-out';
      ctxR.drawImage(foilCanvas, 0, 0);
      ctxR.globalCompositeOperation = 'destination-over';
      ctxR.fillStyle = 'rgb(45,45,45)';
      ctxR.fillRect(0, 0, width, height);
      ctxR.globalCompositeOperation = 'source-over';

      ctxM.fillStyle = 'rgb(12,12,12)';
      ctxM.fillRect(0, 0, width, height);
      ctxM.globalCompositeOperation = 'destination-out';
      ctxM.drawImage(foilCanvas, 0, 0);
      ctxM.globalCompositeOperation = 'destination-over';
      ctxM.fillStyle = 'rgb(235,235,235)';
      ctxM.fillRect(0, 0, width, height);
      ctxM.globalCompositeOperation = 'source-over';

      return {
        roughnessMap: new THREE.CanvasTexture(roughnessCanvas),
        metalnessMap: new THREE.CanvasTexture(metalnessCanvas),
      };
    } catch {
      // fall through to pixel loop below
    }
  }

  // Pixel-loop fallback (JSDOM / environments without drawImage support)
  const foilCtx = foilCanvas.getContext('2d');
  const foilImg = foilCtx?.getImageData(0, 0, width, height);
  const rImg = ctxR.createImageData(width, height);
  const mImg = ctxM.createImageData(width, height);
  const total = width * height * 4;
  for (let i = 0; i < total; i += 4) {
    const isFoil = foilImg ? foilImg.data[i] > 100 : false;
    const rVal = isFoil ? 45 : 190;
    const mVal = isFoil ? 235 : 12;
    rImg.data[i] = rImg.data[i + 1] = rImg.data[i + 2] = rVal;
    rImg.data[i + 3] = 255;
    mImg.data[i] = mImg.data[i + 1] = mImg.data[i + 2] = mVal;
    mImg.data[i + 3] = 255;
  }
  ctxR.putImageData(rImg, 0, 0);
  ctxM.putImageData(mImg, 0, 0);

  return {
    roughnessMap: new THREE.CanvasTexture(roughnessCanvas),
    metalnessMap: new THREE.CanvasTexture(metalnessCanvas),
  };
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

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 8);
  cachedClothNormalMap = texture;

  return texture;
}

/**
 * Creates paper page block texture with horizontal line details
 */
let cachedPaperBlockTexture: THREE.CanvasTexture | null = null;

function getPaperBlockTexture(): THREE.CanvasTexture {
  if (cachedPaperBlockTexture) return cachedPaperBlockTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // The shared map is intentionally neutral. Each book tints it through its own
  // page-edge material, so one book cannot change another book's pages.
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 128, 512);

  // Subtle page edge lines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  for (let y = 0; y < 512; y += 3) {
    if (y % 15 !== 0) {
      ctx.fillRect(0, y, 128, 1);
    }
  }

  // Neutral edge shading keeps the page cuts readable after tinting.
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.12)');
  grad.addColorStop(0.05, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.95, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
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
  foilColor: string
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
 * Creates Front Cover Texture (Map, Roughness, Metalness)
 */
function createFrontCoverTextures(item: ShelfBookManifestItem, bindingColor: string): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
} {
  const width = 512;
  const height = 768;

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

  // 1. Cloth Background
  ctxMap.fillStyle = bindingColor;
  ctxMap.fillRect(0, 0, width, height);

  ctxFoil.fillStyle = '#000000';
  ctxFoil.fillRect(0, 0, width, height);

  // 2. Draw Decorative Border Frame
  const pad = 36;
  ctxMap.strokeStyle = item.foilHex;
  ctxMap.lineWidth = 3;
  ctxMap.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
  ctxMap.lineWidth = 1;
  ctxMap.strokeRect(pad + 6, pad + 6, width - (pad + 6) * 2, height - (pad + 6) * 2);

  ctxFoil.strokeStyle = '#FFFFFF';
  ctxFoil.lineWidth = 3;
  ctxFoil.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
  ctxFoil.lineWidth = 1;
  ctxFoil.strokeRect(pad + 6, pad + 6, width - (pad + 6) * 2, height - (pad + 6) * 2);

  // 3. Draw Foil Motif
  drawFoilMotif(ctxMap, item.foilMotif, width / 2, 230, 85, item.foilHex);
  drawFoilMotif(ctxFoil, item.foilMotif, width / 2, 230, 85, '#FFFFFF');

  // 4. Draw Title
  ctxMap.fillStyle = item.foilHex;
  ctxMap.textAlign = 'center';
  ctxMap.textBaseline = 'middle';
  ctxMap.font = 'bold 34px "Cinzel", "Georgia", serif';

  ctxFoil.fillStyle = '#FFFFFF';
  ctxFoil.textAlign = 'center';
  ctxFoil.textBaseline = 'middle';
  ctxFoil.font = 'bold 34px "Cinzel", "Georgia", serif';

  // Word wrap title
  const words = item.title.toUpperCase().split(' ');
  let line = '';
  const lines: string[] = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctxMap.measureText(testLine);
    if (metrics.width > width - 120 && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  let startY = 410;
  lines.forEach((l) => {
    ctxMap.fillText(l, width / 2, startY);
    ctxFoil.fillText(l, width / 2, startY);
    startY += 44;
  });

  // 5. Draw Author
  ctxMap.font = '18px "Georgia", serif';
  ctxMap.fillText(item.author.toUpperCase(), width / 2, startY + 30);

  ctxFoil.font = '18px "Georgia", serif';
  ctxFoil.fillText(item.author.toUpperCase(), width / 2, startY + 30);

  // 6. Draw Bottom Accent
  ctxMap.font = '20px serif';
  ctxMap.fillText('✦ ⚜ ✦', width / 2, height - 70);

  ctxFoil.font = '20px serif';
  ctxFoil.fillText('✦ ⚜ ✦', width / 2, height - 70);

  // Create Textures
  const map = new THREE.CanvasTexture(canvasMap);
  map.colorSpace = THREE.SRGBColorSpace;

  const { roughnessMap, metalnessMap } = buildFoilPBRMaps(canvasFoil, width, height);

  return { map, roughnessMap, metalnessMap };
}

/**
 * Creates Spine Texture (Map, Roughness, Metalness)
 */
function createSpineTextures(item: ShelfBookManifestItem, bindingColor: string): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
} {
  const width = 256;
  const height = 768;

  const canvasMap = document.createElement('canvas');
  canvasMap.width = width;
  canvasMap.height = height;
  const ctxMap = canvasMap.getContext('2d')!;

  const canvasFoil = document.createElement('canvas');
  canvasFoil.width = width;
  canvasFoil.height = height;
  const ctxFoil = canvasFoil.getContext('2d')!;

  // 1. Cloth Background
  ctxMap.fillStyle = bindingColor;
  ctxMap.fillRect(0, 0, width, height);

  ctxFoil.fillStyle = '#000000';
  ctxFoil.fillRect(0, 0, width, height);

  // 2. Spine Ribs / Raised Bands
  ctxMap.strokeStyle = item.foilHex;
  ctxMap.lineWidth = 4;
  ctxFoil.strokeStyle = '#FFFFFF';
  ctxFoil.lineWidth = 4;

  const ribYs = [60, 140, height - 140, height - 60];
  ribYs.forEach((y) => {
    ctxMap.beginPath();
    ctxMap.moveTo(25, y);
    ctxMap.lineTo(width - 25, y);
    ctxMap.stroke();

    ctxFoil.beginPath();
    ctxFoil.moveTo(25, y);
    ctxFoil.lineTo(width - 25, y);
    ctxFoil.stroke();
  });

  // Top/Bottom Motif Accent
  drawFoilMotif(ctxMap, item.foilMotif, width / 2, 100, 22, item.foilHex);
  drawFoilMotif(ctxFoil, item.foilMotif, width / 2, 100, 22, '#FFFFFF');

  // Vertical Title Text
  ctxMap.save();
  ctxFoil.save();

  ctxMap.translate(width / 2, height / 2 - 20);
  ctxMap.rotate(Math.PI / 2);
  ctxMap.font = 'bold 26px "Cinzel", "Georgia", serif';
  ctxMap.textAlign = 'center';
  ctxMap.textBaseline = 'middle';
  ctxMap.fillStyle = item.foilHex;
  ctxMap.fillText(item.title.toUpperCase(), 0, 0);

  ctxFoil.translate(width / 2, height / 2 - 20);
  ctxFoil.rotate(Math.PI / 2);
  ctxFoil.font = 'bold 26px "Cinzel", "Georgia", serif';
  ctxFoil.textAlign = 'center';
  ctxFoil.textBaseline = 'middle';
  ctxFoil.fillStyle = '#FFFFFF';
  ctxFoil.fillText(item.title.toUpperCase(), 0, 0);

  ctxMap.restore();
  ctxFoil.restore();

  // Author near bottom
  ctxMap.font = '16px "Georgia", serif';
  ctxMap.textAlign = 'center';
  ctxMap.fillStyle = item.foilHex;
  ctxMap.fillText(item.author.toUpperCase(), width / 2, height - 100);

  ctxFoil.font = '16px "Georgia", serif';
  ctxFoil.textAlign = 'center';
  ctxFoil.fillStyle = '#FFFFFF';
  ctxFoil.fillText(item.author.toUpperCase(), width / 2, height - 100);

  const map = new THREE.CanvasTexture(canvasMap);
  map.colorSpace = THREE.SRGBColorSpace;

  const { roughnessMap, metalnessMap } = buildFoilPBRMaps(canvasFoil, width, height);

  return { map, roughnessMap, metalnessMap };
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
 * Creates Back Cover Textures (Map, Roughness, Metalness) with Written Notes & Reflections
 */
function createBackCoverTextures(item: ShelfBookManifestItem, notesText: string, bindingColor: string): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
} {
  const width = 512;
  const height = 768;

  const canvasMap = document.createElement('canvas');
  canvasMap.width = width;
  canvasMap.height = height;
  const ctx = canvasMap.getContext('2d')!;

  ctx.fillStyle = bindingColor;
  ctx.fillRect(0, 0, width, height);

  // 1. Decorative Border Frame
  const pad = 36;
  ctx.strokeStyle = item.foilHex;
  ctx.lineWidth = 3;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
  ctx.lineWidth = 1;
  ctx.strokeRect(pad + 6, pad + 6, width - (pad + 6) * 2, height - (pad + 6) * 2);

  // 2. Back Cover Header
  ctx.fillStyle = item.foilHex;
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px "Cinzel", "Georgia", serif';
  ctx.fillText('NOTAS & REFLEXÕES', width / 2, pad + 45);

  ctx.beginPath();
  ctx.moveTo(pad + 40, pad + 60);
  ctx.lineTo(width - pad - 40, pad + 60);
  ctx.stroke();

  // 3. Notes & Reflections Written Content
  ctx.fillStyle = getContrastingTextColor(bindingColor);
  ctx.textAlign = 'left';
  ctx.font = '16px "Georgia", serif';

  const text = notesText && notesText.trim() ? notesText : 'Nenhuma nota registrada para este volume.';
  const words = text.split(/\s+/);
  const maxTextWidth = width - pad * 2 - 36;
  const startX = pad + 18;
  let startY = pad + 95;
  const lineHeight = 25;
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxTextWidth) {
      ctx.fillText(currentLine, startX, startY);
      currentLine = words[i];
      startY += lineHeight;
      if (startY > height - pad - 55) {
        ctx.fillStyle = item.foilHex;
        ctx.fillText('... (continua na ficha do livro)', startX, startY);
        break;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine && startY <= height - pad - 55) {
    ctx.fillText(currentLine, startX, startY);
  }

  // 4. Publisher Seal Footer
  ctx.fillStyle = item.foilHex;
  ctx.textAlign = 'center';
  ctx.font = '12px "Georgia", serif';
  ctx.fillText('✦ BIBLIOTECA EDITORIAL ✦', width / 2, height - pad - 20);

  const map = new THREE.CanvasTexture(canvasMap);
  map.colorSpace = THREE.SRGBColorSpace;

  const roughnessCanvas = document.createElement('canvas');
  roughnessCanvas.width = width;
  roughnessCanvas.height = height;
  const ctxR = roughnessCanvas.getContext('2d')!;
  ctxR.fillStyle = '#C0C0C0';
  ctxR.fillRect(0, 0, width, height);

  const metalnessCanvas = document.createElement('canvas');
  metalnessCanvas.width = width;
  metalnessCanvas.height = height;
  const ctxM = metalnessCanvas.getContext('2d')!;
  ctxM.fillStyle = '#0C0C0C';
  ctxM.fillRect(0, 0, width, height);

  const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);
  const metalnessMap = new THREE.CanvasTexture(metalnessCanvas);

  return { map, roughnessMap, metalnessMap };
}

export class BookMeshGroup {
  public group: THREE.Group;
  public item: ShelfBookManifestItem;
  public isHovered: boolean = false;
  public isSelected: boolean = false;

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
      frontTex.map, frontTex.roughnessMap, frontTex.metalnessMap,
      spineTex.map, spineTex.roughnessMap, spineTex.metalnessMap,
      backTex.map, backTex.roughnessMap, backTex.metalnessMap,
    );

    // Common cloth material
    const baseClothMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bindingColor),
      roughness: 0.7,
      metalness: 0.05,
      normalMap: clothNormalMap,
      normalScale: new THREE.Vector2(0.2, 0.2),
    });

    const frontCoverMat = new THREE.MeshStandardMaterial({
      map: frontTex.map,
      roughnessMap: frontTex.roughnessMap,
      metalnessMap: frontTex.metalnessMap,
      normalMap: clothNormalMap,
      normalScale: new THREE.Vector2(0.2, 0.2),
    });

    const backCoverMat = new THREE.MeshStandardMaterial({
      map: backTex.map,
      roughnessMap: backTex.roughnessMap,
      metalnessMap: backTex.metalnessMap,
      normalMap: clothNormalMap,
      normalScale: new THREE.Vector2(0.2, 0.2),
    });

    const spineMat = new THREE.MeshStandardMaterial({
      map: spineTex.map,
      roughnessMap: spineTex.roughnessMap,
      metalnessMap: spineTex.metalnessMap,
      normalMap: clothNormalMap,
      normalScale: new THREE.Vector2(0.2, 0.2),
    });

    const paperMat = new THREE.MeshStandardMaterial({
      map: paperTex,
      roughness: 0.9,
      metalness: 0.0,
      color: new THREE.Color('#E5E7EB'),
    });

    const pageEdgeMat = new THREE.MeshStandardMaterial({
      map: paperTex,
      roughness: 0.94,
      metalness: 0.0,
      color: new THREE.Color(bindingColor),
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

    // Spine Curved Back (+Z face when standing)
    const spineRadius = thickness / 2;
    const spineGeo = new THREE.CylinderGeometry(spineRadius, spineRadius, height, 16, 1, false, Math.PI * 0.5, Math.PI);
    const spineMesh = new THREE.Mesh(spineGeo, spineMat);
    spineMesh.name = 'spine';
    spineMesh.userData.surfaceRole = 'spine';
    spineMesh.rotation.y = Math.PI / 2;
    spineMesh.position.set(0, height / 2, width / 2);
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
    textures: {
      map: THREE.CanvasTexture;
      roughnessMap: THREE.CanvasTexture;
      metalnessMap: THREE.CanvasTexture;
    },
  ) {
    if (!material) {
      textures.map.dispose();
      textures.roughnessMap.dispose();
      textures.metalnessMap.dispose();
      return;
    }

    const previousTextures = [material.map, material.roughnessMap, material.metalnessMap]
      .filter((texture): texture is THREE.Texture => texture !== null);

    material.map = textures.map;
    material.roughnessMap = textures.roughnessMap;
    material.metalnessMap = textures.metalnessMap;
    material.color.set('#FFFFFF');
    material.needsUpdate = true;

    previousTextures.forEach((texture) => {
      const trackedIndex = this.texturesToDispose.indexOf(texture);
      if (trackedIndex !== -1) this.texturesToDispose.splice(trackedIndex, 1);
      texture.dispose();
    });

    this.texturesToDispose.push(textures.map, textures.roughnessMap, textures.metalnessMap);
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

        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        const previousTextures = [
          this.frontCoverMaterial.map,
          this.frontCoverMaterial.roughnessMap,
          this.frontCoverMaterial.metalnessMap,
        ].filter((candidate): candidate is THREE.Texture => candidate !== null);
        this.frontCoverMaterial.map = texture;
        this.frontCoverMaterial.roughnessMap = null;
        this.frontCoverMaterial.metalnessMap = null;
        this.frontCoverMaterial.roughness = 0.72;
        this.frontCoverMaterial.metalness = 0.05;
        this.frontCoverMaterial.color.set('#FFFFFF');
        this.frontCoverMaterial.needsUpdate = true;
        previousTextures.forEach((previousTexture) => {
          const trackedIndex = this.texturesToDispose.indexOf(previousTexture);
          if (trackedIndex !== -1) this.texturesToDispose.splice(trackedIndex, 1);
          previousTexture.dispose();
        });
        this.texturesToDispose.push(texture);
        this.frontUsesCoverTexture = true;

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
