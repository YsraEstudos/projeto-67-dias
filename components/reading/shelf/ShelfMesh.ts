import * as THREE from 'three';

let cachedWalnutTexture: THREE.CanvasTexture | null = null;

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

/**
 * Creates a procedural rich walnut wood grain texture (cached singleton)
 * Uses a seeded PRNG so the grain pattern is identical across page refreshes.
 */
function getWalnutWoodTexture(): THREE.CanvasTexture {
  if (cachedWalnutTexture) return cachedWalnutTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  const rand = mulberry32(0x57616c6e); // "waln" seed

  // Keep the procedural grain visible under the scene's warm lights.
  const baseGrad = ctx.createLinearGradient(0, 0, 512, 512);
  baseGrad.addColorStop(0, '#8B5A2B');
  baseGrad.addColorStop(0.5, '#5A321B');
  baseGrad.addColorStop(1, '#9A6534');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Wood grain rings and swirl lines
  ctx.strokeStyle = '#2B160B';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) {
    const y = rand() * 512;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      150, y + (rand() - 0.5) * 40,
      350, y + (rand() - 0.5) * 40,
      512, y + (rand() - 0.5) * 20
    );
    ctx.globalAlpha = 0.15 + rand() * 0.25;
    ctx.stroke();
  }

  // Fine fiber highlights
  ctx.strokeStyle = '#D09A5B';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 30; i++) {
    const y = rand() * 512;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y + (rand() - 0.5) * 15);
    ctx.globalAlpha = 0.1 + rand() * 0.2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedWalnutTexture = texture;
  return texture;
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
    const woodTexture = getWalnutWoodTexture();
    // Wood texture is a shared singleton — do NOT add to texturesToDispose

    // Walnut Wood Material
    const walnutMat = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.45,
      metalness: 0.05,
      color: new THREE.Color('#B7773D'),
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
      const shelfMesh = new THREE.Mesh(shelfGeo, walnutMat);
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
      color: new THREE.Color('#111827'), // Deep blue-black alcove wall
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
