import * as THREE from 'three';

/**
 * Creates a procedural rich walnut wood grain texture
 */
function createWalnutWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base deep walnut brown background
  const baseGrad = ctx.createLinearGradient(0, 0, 512, 512);
  baseGrad.addColorStop(0, '#3D261A');
  baseGrad.addColorStop(0.5, '#2C1A10');
  baseGrad.addColorStop(1, '#452B1E');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Wood grain rings and swirl lines
  ctx.strokeStyle = '#1F1109';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      150, y + (Math.random() - 0.5) * 40,
      350, y + (Math.random() - 0.5) * 40,
      512, y + (Math.random() - 0.5) * 20
    );
    ctx.globalAlpha = 0.15 + Math.random() * 0.25;
    ctx.stroke();
  }

  // Fine fiber highlights
  ctx.strokeStyle = '#5A3D2B';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 30; i++) {
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y + (Math.random() - 0.5) * 15);
    ctx.globalAlpha = 0.1 + Math.random() * 0.2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export interface ShelfMeshOptions {
  width: number;
  depth: number;
  thickness: number;
}

export class ShelfMeshGroup {
  public group: THREE.Group;
  private texturesToDispose: THREE.Texture[] = [];
  private materialsToDispose: THREE.Material[] = [];

  constructor(options: ShelfMeshOptions) {
    this.group = new THREE.Group();
    this.buildShelf(options);
  }

  private buildShelf(options: ShelfMeshOptions) {
    const { width, depth, thickness } = options;
    const woodTexture = createWalnutWoodTexture();
    this.texturesToDispose.push(woodTexture);

    // Walnut Wood Material
    const walnutMat = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.45,
      metalness: 0.05,
      color: new THREE.Color('#3A2317'),
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
    // Center the extrusion along X axis
    shelfGeo.translate(0, 0, -width / 2);
    shelfGeo.rotateY(Math.PI / 2);

    const shelfMesh = new THREE.Mesh(shelfGeo, walnutMat);
    shelfMesh.position.set(0, 0, 0);
    shelfMesh.receiveShadow = true;
    shelfMesh.castShadow = true;
    this.group.add(shelfMesh);

    // Brass End Support Brackets
    const bracketMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#D4AF37'), // Warm gold/brass
      roughness: 0.25,
      metalness: 0.85,
    });
    this.materialsToDispose.push(bracketMat);

    const bracketWidth = 0.15;
    const bracketGeo = new THREE.BoxGeometry(bracketWidth, thickness * 1.5, depth * 1.05);

    const leftBracket = new THREE.Mesh(bracketGeo, bracketMat);
    leftBracket.position.set(-width / 2 - bracketWidth / 2, -thickness * 0.25, 0);
    leftBracket.castShadow = true;
    this.group.add(leftBracket);

    const rightBracket = new THREE.Mesh(bracketGeo, bracketMat);
    rightBracket.position.set(width / 2 + bracketWidth / 2, -thickness * 0.25, 0);
    rightBracket.castShadow = true;
    this.group.add(rightBracket);

    // Shadow Catching & Warm Background Back Wall
    const wallGeo = new THREE.PlaneGeometry(width * 1.5, 12);
    const wallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1A1817'), // Deep alcove shadow wall
      roughness: 0.9,
      metalness: 0.0,
    });
    this.materialsToDispose.push(wallMat);

    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(0, 4, -depth / 2 - 0.05);
    wallMesh.receiveShadow = true;
    this.group.add(wallMesh);

    // Subtle contact shadow plane beneath the shelf
    const shadowGeo = new THREE.PlaneGeometry(width * 1.2, depth * 1.4);
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
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
  }
}
