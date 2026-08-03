import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Walnut wood: procedural FBM ring grain with domain warping, per-plank joints
// and hue variation, 0–2 knots, aged edges and an emboss normal map — all
// baked into a cached color/normal texture pair. No external dependencies:
// value noise on the existing mulberry32 PRNG keeps it deterministic.
// ---------------------------------------------------------------------------

const WALNUT_WIDTH = 1024;
const WALNUT_HEIGHT = 512;
const WALNUT_BOARDS = 4;

// Slightly darkened palette so the wood matches the dim library scene while
// the grain keeps strong contrast (dark → mid → base across the wave).
const WALNUT_DARK = { r: 0x2b, g: 0x16, b: 0x0b };
const WALNUT_MID = { r: 0x5c, g: 0x45, b: 0x38 };
const WALNUT_BASE = { r: 0x7a, g: 0x4e, b: 0x24 };

interface WalnutTextureSet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
}

let cachedWalnutTextures: WalnutTextureSet | null = null;

/** Deterministic PRNG (mulberry32) — produces the same sequence every run */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seamless-ish 2D value noise over a fixed lattice (wraps by modulo). */
function makeValueNoise2D(rand: () => number): (x: number, y: number) => number {
  const size = 128;
  const lattice = new Float32Array(size * size);
  for (let i = 0; i < lattice.length; i += 1) lattice[i] = rand();

  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const x0 = ((xi % size) + size) % size;
    const y0 = ((yi % size) + size) % size;
    const x1 = (x0 + 1) % size;
    const y1 = (y0 + 1) % size;
    const u = xf * xf * (3 - 2 * xf); // smoothstep fade
    const v = yf * yf * (3 - 2 * yf);
    const a = lattice[y0 * size + x0];
    const b = lattice[y0 * size + x1];
    const c = lattice[y1 * size + x0];
    const d = lattice[y1 * size + x1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

/** Fractal Brownian motion: normalized sum of octaves, roughly [0, 1]. */
function fbmValue(
  noise: (x: number, y: number) => number,
  x: number,
  y: number,
  octaves: number,
): number {
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += noise(x * frequency, y * frequency) * amplitude;
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return sum / norm;
}

interface Rgb { r: number; g: number; b: number; }

function rgbToHsl(c: Rgb): [number, number, number] {
  const rn = c.r / 255;
  const gn = c.g / 255;
  const bn = c.b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

/** Rotates a color's hue by `deg` degrees, returning a new color. */
function shiftHue(c: Rgb, deg: number): Rgb {
  if (Math.abs(deg) < 0.4) return c;
  const [h, s, l] = rgbToHsl(c);
  const [r, g, b] = hslToRgb((h + deg / 360 + 1) % 1, s, l);
  return { r, g, b };
}

/** Interpolates dark → mid → base across the grain wave (w in [0, 1]). */
function mixWalnutTone(
  dark: Rgb,
  mid: Rgb,
  base: Rgb,
  w: number,
): Rgb {
  const inner = w < 0.5 ? w * 2 : (w - 0.5) * 2;
  const a = w < 0.5 ? dark : mid;
  const b = w < 0.5 ? mid : base;
  return {
    r: a.r + (b.r - a.r) * inner,
    g: a.g + (b.g - a.g) * inner,
    b: a.b + (b.b - a.b) * inner,
  };
}

/**
 * Creates the procedural walnut wood texture pair (color + emboss normal map),
 * cached as a singleton so every shelf shares one GPU upload.
 *
 * Grain recipe (per spec): value-noise FBM rings with domain warping
 * (warped center, ring noise, fine axial grain), 4 planks with joints, hue
 * shift per plank, 0–2 knots away from tile edges, and aged top/bottom edges.
 * The normal map is derived from the same height field at half resolution.
 */
function buildWalnutTextureSet(): WalnutTextureSet {
  const canvas = document.createElement('canvas');
  canvas.width = WALNUT_WIDTH;
  canvas.height = WALNUT_HEIGHT;
  const ctx = canvas.getContext('2d');

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = WALNUT_WIDTH / 2;
  normalCanvas.height = WALNUT_HEIGHT / 2;
  const ctxN = normalCanvas.getContext('2d');

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(WALNUT_BOARDS, 1);
  map.colorSpace = THREE.SRGBColorSpace;
  map.minFilter = THREE.LinearMipmapLinearFilter;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(WALNUT_BOARDS, 1);
  normalMap.minFilter = THREE.LinearMipmapLinearFilter;

  // JSDOM without a canvas implementation (or without image data support):
  // return flat textures — tests assert structure, never pixels.
  if (!ctx || !ctxN || typeof ctx.createImageData !== 'function' || typeof ctxN.createImageData !== 'function') {
    cachedWalnutTextures = { map, normalMap };
    return cachedWalnutTextures;
  }

  const rand = mulberry32(0x57616c6e); // "waln" seed
  const noise = makeValueNoise2D(rand);

  // Per-plank deterministic variation: grain phase, hue shift (±6°), tone.
  const boardPhases: number[] = [];
  const boardHues: number[] = [];
  const boardTones: number[] = [];
  const boardPalettes: { dark: Rgb; mid: Rgb; base: Rgb }[] = [];
  for (let b = 0; b < WALNUT_BOARDS; b += 1) {
    boardPhases.push(rand() * 4);
    boardHues.push((rand() - 0.5) * 12);
    boardTones.push(0.96 + rand() * 0.07);
    boardPalettes.push({
      dark: shiftHue(WALNUT_DARK, boardHues[b]),
      mid: shiftHue(WALNUT_MID, boardHues[b]),
      base: shiftHue(WALNUT_BASE, boardHues[b]),
    });
  }

  // Knots: 0–2 per texture, kept away from tile edges and board joints so the
  // tiling never repeats a severed knot.
  const knotCount = rand() < 0.65 ? 2 : rand() < 0.8 ? 1 : 0;
  const jointXs: number[] = [];
  for (let b = 1; b < WALNUT_BOARDS; b += 1) {
    jointXs.push((b / WALNUT_BOARDS) * WALNUT_WIDTH);
  }
  const knots: { x: number; y: number; rx: number; ry: number }[] = [];
  for (let k = 0; k < knotCount; k += 1) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const kx = WALNUT_WIDTH * (0.1 + rand() * 0.8);
      const ky = WALNUT_HEIGHT * (0.15 + rand() * 0.7);
      const nearJoint = jointXs.some((jx) => Math.abs(kx - jx) < WALNUT_WIDTH * 0.11);
      if (nearJoint) continue;
      knots.push({
        x: kx,
        y: ky,
        rx: WALNUT_WIDTH * (0.03 + rand() * 0.02),
        ry: WALNUT_HEIGHT * (0.035 + rand() * 0.025),
      });
      break;
    }
  }

  // ---- Color map pixel loop -------------------------------------------------
  const img = ctx.createImageData(WALNUT_WIDTH, WALNUT_HEIGHT);
  const data = img.data;
  const height = new Float32Array(WALNUT_WIDTH * WALNUT_HEIGHT);

  for (let y = 0; y < WALNUT_HEIGHT; y += 1) {
    const v = y / WALNUT_HEIGHT;
    for (let x = 0; x < WALNUT_WIDTH; x += 1) {
      const u = x / WALNUT_WIDTH;
      const idx = (y * WALNUT_WIDTH + x) * 4;

      let boardF = u * WALNUT_BOARDS;
      let bx = Math.floor(boardF);
      if (bx >= WALNUT_BOARDS) bx = WALNUT_BOARDS - 1;
      const phase = boardPhases[bx];

      // FBM ring grain with domain warping (~24 rings across the plank).
      const cx = 0.5 + (fbmValue(noise, u * 2 + phase, v * 2, 4) - 0.5) * 0.3;
      const cy = 0.5 + (fbmValue(noise, u * 2 + phase + 7.31, v * 2 + 3.17, 4) - 0.5) * 0.3;
      const dxu = u - cx;
      const dyu = v - cy;
      const dist = Math.sqrt(dxu * dxu + dyu * dyu);
      const ringNoise = (fbmValue(noise, u * 8 + phase, v * 1.5, 3) - 0.5) * 0.16;
      const ring = Math.sin((dist + ringNoise) * 24 * Math.PI * 2);
      // Fine axial grain running along the plank length.
      const grain = (fbmValue(noise, u + phase, v * 40, 4) - 0.5) * 0.3;

      let w = 0.3 + ring * 0.4 + grain;
      if (w < 0) w = 0;
      else if (w > 1) w = 1;

      const palette = boardPalettes[bx];
      const tone = mixWalnutTone(palette.dark, palette.mid, palette.base, w);
      let r = tone.r * boardTones[bx];
      let g = tone.g * boardTones[bx];
      let b = tone.b * boardTones[bx];

      // Knots: dark core with a subtle outer ring, also carving the height.
      let knotFactor = 1;
      for (const knot of knots) {
        const kdx = (x - knot.x) / knot.rx;
        const kdy = (y - knot.y) / knot.ry;
        const dk2 = kdx * kdx + kdy * kdy;
        if (dk2 >= 1) continue;
        const dk = Math.sqrt(dk2);
        knotFactor *= 1 - (1 - dk) * 0.5;
        const ringDist = Math.abs(dk - 0.68);
        if (ringDist < 0.14) knotFactor *= 1 - (1 - ringDist / 0.14) * 0.22;
      }

      // Board joints: a dark 1–2px seam between planks.
      const boardFrac = boardF - bx;
      const jointPx = Math.min(boardFrac, 1 - boardFrac) * WALNUT_WIDTH;
      if (jointPx < 2) {
        const jointT = jointPx / 2;
        const jointShade = 0.8 + 0.2 * jointT;
        r *= jointShade;
        g *= jointShade;
        b *= jointShade;
      }

      // Aged edges: darker top/bottom border of the board (years of handling).
      const edgeV = Math.min(v, 1 - v);
      let ageFactor = 1;
      if (edgeV < 0.05) {
        ageFactor = 0.86 + (edgeV / 0.05) * 0.14;
        r *= ageFactor;
        g *= ageFactor;
        b *= ageFactor;
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
      height[y * WALNUT_WIDTH + x] = w * knotFactor * ageFactor;
    }
  }
  ctx.putImageData(img, 0, 0);

  // ---- Emboss normal map (half resolution, same height field) --------------
  const nW = WALNUT_WIDTH / 2;
  const nH = WALNUT_HEIGHT / 2;
  const nImg = ctxN.createImageData(nW, nH);
  const nData = nImg.data;
  const strength = 8;
  for (let ny = 0; ny < nH; ny += 1) {
    const sy = ny * 2;
    for (let nx = 0; nx < nW; nx += 1) {
      const sx = nx * 2;
      const i = sy * WALNUT_WIDTH + sx;
      const hL = sx >= 2 ? height[i - 2] : height[i];
      const hR = sx < WALNUT_WIDTH - 2 ? height[i + 2] : height[i];
      const hU = sy >= 2 ? height[i - WALNUT_WIDTH] : height[i];
      const hD = sy < WALNUT_HEIGHT - 2 ? height[i + WALNUT_WIDTH] : height[i];
      const j = (ny * nW + nx) * 4;
      nData[j] = 128 + (hL - hR) * strength;
      nData[j + 1] = 128 + (hD - hU) * strength;
      nData[j + 2] = 255;
      nData[j + 3] = 255;
    }
  }
  ctxN.putImageData(nImg, 0, 0);

  cachedWalnutTextures = { map, normalMap };
  return cachedWalnutTextures;
}

function getWalnutWoodTextures(): WalnutTextureSet {
  if (cachedWalnutTextures) return cachedWalnutTextures;
  return buildWalnutTextureSet();
}

export interface ShelfMeshOptions {
  width: number;
  depth: number;
  thickness: number;
  levelCount?: number;
  levelSpacing?: number;
  levels?: { id: string; name: string; position?: number }[];
  nameplateAnisotropy?: number;
}

const cachedNameplateTextures = new Map<string, THREE.CanvasTexture>();
const NAMEPLATE_DEPTH = 0.02;
const NAMEPLATE_FRONT_CLEARANCE = 0.04;

function getNameplateTexture(name: string, anisotropy = 1): THREE.CanvasTexture {
  const key = name.toUpperCase();
  const requestedAnisotropy = Math.max(1, anisotropy);
  const cached = cachedNameplateTextures.get(key);
  if (cached) {
    if (cached.anisotropy < requestedAnisotropy) {
      cached.anisotropy = requestedAnisotropy;
      cached.needsUpdate = true;
    }
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 128);
    bgGrad.addColorStop(0, '#FFFFFF');
    bgGrad.addColorStop(0.5, '#FDFBF7');
    bgGrad.addColorStop(1, '#F3EEE3');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 496, 112);

    ctx.strokeStyle = '#9A7B2C';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, 484, 100);

    ctx.fillStyle = '#D4AF37';
    const rivets = [
      [24, 24],
      [488, 24],
      [24, 104],
      [488, 104],
    ];
    rivets.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#1A1817';
    ctx.font = 'bold 32px "Cinzel", "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(key, 256, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = requestedAnisotropy;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedNameplateTextures.set(key, texture);
  return texture;
}

export class ShelfNameplateMesh {
  public mesh: THREE.Mesh;
  public texture: THREE.CanvasTexture;
  public material: THREE.MeshStandardMaterial;
  public geometry: THREE.BoxGeometry;
  private brassMaterial: THREE.MeshStandardMaterial;

  constructor(name: string, width = 2.4, height = 0.32, depth = NAMEPLATE_DEPTH, anisotropy = 1) {
    this.texture = getNameplateTexture(name, anisotropy);

    this.geometry = new THREE.BoxGeometry(width, height, depth);

    // Front face material uses enamel canvas texture with metallic side trim
    const frontMat = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.3,
      metalness: 0.2,
    });

    this.brassMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#D4AF37'),
      roughness: 0.25,
      metalness: 0.85,
    });

    this.mesh = new THREE.Mesh(this.geometry, [
      this.brassMaterial,
      this.brassMaterial,
      this.brassMaterial,
      this.brassMaterial,
      frontMat,
      this.brassMaterial,
    ]);
    // Small textured plaques shimmer under the shadow map while the camera moves.
    // They do not need to cast or receive shadows to remain legible.
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    this.material = frontMat;
  }

  public dispose() {
    // texture is cached/shared — do NOT dispose it here
    this.geometry.dispose();
    this.material.dispose();
    this.brassMaterial.dispose();
  }
}

export class ShelfMeshGroup {
  public group: THREE.Group;
  private texturesToDispose: THREE.Texture[] = [];
  private materialsToDispose: THREE.Material[] = [];
  private geometriesToDispose: THREE.BufferGeometry[] = [];

  constructor(options: ShelfMeshOptions) {
    this.group = new THREE.Group();
    this.buildShelf(options);
  }

  private buildShelf(options: ShelfMeshOptions) {
    const {
      width,
      depth,
      thickness,
      levelCount = 1,
      levelSpacing = 3.9,
      levels,
      nameplateAnisotropy = 1,
    } = options;
    const safeLevelCount = Math.max(1, levelCount);
    const woodTextures = getWalnutWoodTextures();
    const woodTexture = woodTextures.map;
    const woodNormalMap = woodTextures.normalMap;
    // Wood textures are a shared singleton — do NOT add to texturesToDispose
    if (woodTexture.anisotropy < nameplateAnisotropy) {
      woodTexture.anisotropy = nameplateAnisotropy;
      woodTexture.needsUpdate = true;
    }
    if (woodNormalMap.anisotropy < nameplateAnisotropy) {
      woodNormalMap.anisotropy = nameplateAnisotropy;
      woodNormalMap.needsUpdate = true;
    }

    // Walnut Wood Material — clearcoated varnish over the baked grain. Wood is
    // a dielectric, so metalness stays 0; the clearcoat gives the shelves the
    // soft polished sheen of a library. The tint is baked into the canvas, so
    // the material color stays neutral white.
    const walnutMat = new THREE.MeshPhysicalMaterial({
      map: woodTexture,
      normalMap: woodNormalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.45,
      metalness: 0.0,
      clearcoat: 0.9,
      clearcoatRoughness: 0.3,
      color: new THREE.Color('#FFFFFF'),
    });
    this.materialsToDispose.push(walnutMat);

    // Beveled Extrude Shape for Main Shelf Board
    const shape = new THREE.Shape();
    const bevelR = 0.04;
    // Draw cross section (Depth along Z, Thickness along Y)
    shape.moveTo(-depth / 2 + bevelR, -thickness);
    shape.lineTo(depth / 2 - bevelR, -thickness);
    shape.quadraticCurveTo(depth / 2, -thickness, depth / 2, -thickness + bevelR);
    shape.lineTo(depth / 2, 0 - bevelR);
    shape.quadraticCurveTo(depth / 2, 0, depth / 2 - bevelR, 0);
    shape.lineTo(-depth / 2 + bevelR, 0);
    shape.quadraticCurveTo(-depth / 2, 0, -depth / 2, 0 - bevelR);
    shape.lineTo(-depth / 2, -thickness + bevelR);
    shape.quadraticCurveTo(-depth / 2, -thickness, -depth / 2 + bevelR, -thickness);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 1,
      depth: width,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
    };

    const shelfGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    this.geometriesToDispose.push(shelfGeo);
    // Center the extrusion along X axis
    shelfGeo.translate(0, 0, -width / 2);
    shelfGeo.rotateY(Math.PI / 2);

    for (let levelIndex = 0; levelIndex < safeLevelCount; levelIndex += 1) {
      const levelY = levelIndex * levelSpacing;
      let boardMat = walnutMat;
      if (levelIndex > 0) {
        // Per-shelf variation: shifted grain phase + ±3% brightness. The
        // geometry stays shared (tests rely on shelfBoards[i].geometry
        // identity), so only the material/texture clone varies.
        const shelfTex = woodTexture.clone();
        shelfTex.offset.x = 0.12 + ((levelIndex - 1) % WALNUT_BOARDS) * 0.12;
        shelfTex.needsUpdate = true;
        boardMat = walnutMat.clone();
        boardMat.map = shelfTex;
        const brightness = 0.97 + ((levelIndex - 1) % 3) * 0.03;
        boardMat.color.setRGB(brightness, brightness * 0.99, brightness * 0.97);
        this.texturesToDispose.push(shelfTex);
        this.materialsToDispose.push(boardMat);
      }
      const shelfMesh = new THREE.Mesh(shelfGeo, boardMat);
      shelfMesh.position.set(0, levelY, 0);
      shelfMesh.receiveShadow = true;
      shelfMesh.castShadow = true;
      this.group.add(shelfMesh);

      // Wooden Shelf Plaque (ShelfNameplateMesh) mounted on the front wooden beam
      const levelName = levels?.[levelIndex]?.name || `Andar ${levelIndex + 1}`;
      const nameplate = new ShelfNameplateMesh(
        levelName,
        Math.min(2.8, width * 0.4),
        Math.min(0.32, thickness * 0.9),
        NAMEPLATE_DEPTH,
        nameplateAnisotropy,
      );
      // Keep the entire plaque in front of the beveled wooden face. A tiny
      // overlap here makes the depth buffer alternate between both surfaces
      // while the camera orbits, which makes the plaque appear to flicker in
      // and out of the shelf.
      nameplate.mesh.position.set(
        0,
        levelY - thickness / 2,
        depth / 2 + NAMEPLATE_DEPTH / 2 + NAMEPLATE_FRONT_CLEARANCE,
      );
      this.group.add(nameplate.mesh);
      // nameplate texture is cached — do NOT add to texturesToDispose
      this.materialsToDispose.push(nameplate.material);
      this.geometriesToDispose.push(nameplate.geometry);
    }

    // Brass End Support Brackets
    const bracketMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#D4AF37'), // Warm gold/brass
      roughness: 0.25,
      metalness: 0.85,
    });
    this.materialsToDispose.push(bracketMat);

    const bracketWidth = 0.15;
    const bracketGeo = new THREE.BoxGeometry(bracketWidth, thickness * 1.5, depth * 1.05);
    this.geometriesToDispose.push(bracketGeo);

    for (let levelIndex = 0; levelIndex < safeLevelCount; levelIndex += 1) {
      const levelY = levelIndex * levelSpacing;
      const leftBracket = new THREE.Mesh(bracketGeo, bracketMat);
      leftBracket.position.set(-width / 2 - bracketWidth / 2, levelY - thickness * 0.25, 0);
      leftBracket.castShadow = true;
      this.group.add(leftBracket);

      const rightBracket = new THREE.Mesh(bracketGeo, bracketMat);
      rightBracket.position.set(width / 2 + bracketWidth / 2, levelY - thickness * 0.25, 0);
      rightBracket.castShadow = true;
      this.group.add(rightBracket);
    }

    // Shadow Catching & Warm Background Back Wall
    const wallHeight = Math.max(12, (safeLevelCount - 1) * levelSpacing + 7);
    const wallGeo = new THREE.PlaneGeometry(width * 1.5, wallHeight);
    this.geometriesToDispose.push(wallGeo);
    const wallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0B1220'), // Deep blue-black alcove wall
      roughness: 0.9,
      metalness: 0.0,
    });
    this.materialsToDispose.push(wallMat);

    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(0, wallHeight / 2 - thickness, -depth / 2 - 0.05);
    wallMesh.receiveShadow = true;
    this.group.add(wallMesh);

    // Subtle contact shadow plane beneath the shelf
    const shadowGeo = new THREE.PlaneGeometry(width * 1.2, depth * 1.4);
    this.geometriesToDispose.push(shadowGeo);
    const shadowMat = new THREE.ShadowMaterial({
      opacity: 0.4,
    });
    this.materialsToDispose.push(shadowMat);

    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, -thickness - 0.01, 0);
    shadowPlane.receiveShadow = true;
    this.group.add(shadowPlane);
  }

  public dispose() {
    this.texturesToDispose.forEach((t) => t.dispose());
    this.materialsToDispose.forEach((m) => m.dispose());
    this.geometriesToDispose.forEach((geometry) => geometry.dispose());
  }
}
