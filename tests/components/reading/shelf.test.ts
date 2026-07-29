import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { MINT_BOOK_MANIFEST, CLOTH_PALETTE, FOIL_PALETTE } from '../../../components/reading/shelf/mintManifest';
import { BookMeshGroup } from '../../../components/reading/shelf/BookMesh';
import { ShelfMeshGroup } from '../../../components/reading/shelf/ShelfMesh';
import { InspectionControls } from '../../../components/reading/shelf/InspectionControls';
import {
  calculateShelfCameraDistance,
  getShelfLevelFromPointer,
  resolveBookActivation,
} from '../../../components/reading/shelf/CompleteShelfScene';

// Mock Canvas getContext for JSDOM environment
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId: string) => {
    if (contextId === '2d') {
      return {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textAlign: '',
        textBaseline: '',
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        ellipse: vi.fn(),
        bezierCurveTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 50 }),
        getImageData: vi.fn().mockReturnValue({
          data: new Uint8ClampedArray(256 * 256 * 4),
        }),
        putImageData: vi.fn(),
        createImageData: vi.fn().mockImplementation((w: number, h: number) => ({
          data: new Uint8ClampedArray(w * h * 4),
        })),
        createLinearGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn(),
        }),
      } as unknown as CanvasRenderingContext2D;
    }
    return null;
  });
});

describe('mintManifest', () => {
  it('should define exactly 19 clothbound hardcover books', () => {
    expect(MINT_BOOK_MANIFEST).toHaveLength(19);
  });

  it('should enforce varied dimensions within defined prompt constraints', () => {
    MINT_BOOK_MANIFEST.forEach((item) => {
      expect(item.height).toBeGreaterThanOrEqual(2.2);
      expect(item.height).toBeLessThanOrEqual(3.4);

      expect(item.width).toBeGreaterThanOrEqual(1.4);
      expect(item.width).toBeLessThanOrEqual(2.2);

      expect(item.thickness).toBeGreaterThanOrEqual(0.25);
      expect(item.thickness).toBeLessThanOrEqual(0.75);
    });
  });

  it('should contain valid cloth palette colors and foil motifs', () => {
    const validMotifs = [
      'constellation',
      'abstract geometric',
      'botanical foliage',
      'radial sunburst',
      'minimalist serif initials',
    ];
    MINT_BOOK_MANIFEST.forEach((item) => {
      expect(Object.values(CLOTH_PALETTE)).toContain(item.clothColor);
      expect(validMotifs).toContain(item.foilMotif);
      expect(Object.keys(FOIL_PALETTE)).toContain(item.foilColor);
    });
  });
});

describe('book activation', () => {
  it('opens the cover inspection on the first click of a book', () => {
    expect(resolveBookActivation(0, 0, false)).toEqual({
      selectedIndex: 0,
      shouldOpenInspection: true,
    });
  });

  it('keeps an open inspection focused when another book is clicked', () => {
    expect(resolveBookActivation(2, 0, true)).toEqual({
      selectedIndex: 2,
      shouldOpenInspection: true,
    });
  });
});

describe('shelf camera framing', () => {
  it('moves the camera farther away for narrow viewports so the shelf stays visible', () => {
    const wideViewportDistance = calculateShelfCameraDistance(1920, 1080, 12);
    const narrowViewportDistance = calculateShelfCameraDistance(800, 600, 12);

    expect(narrowViewportDistance).toBeGreaterThan(wideViewportDistance);
    expect(wideViewportDistance).toBeGreaterThanOrEqual(8.5);
  });

  it('maps the captured pointer position to the correct visual shelf level', () => {
    const levels = [
      { id: 'bottom', name: 'Base', position: 0 },
      { id: 'middle', name: 'Meio', position: 1 },
      { id: 'top', name: 'Topo', position: 2 },
    ];

    expect(getShelfLevelFromPointer(50, { top: 0, height: 300 }, levels)?.id).toBe('top');
    expect(getShelfLevelFromPointer(150, { top: 0, height: 300 }, levels)?.id).toBe('middle');
    expect(getShelfLevelFromPointer(299, { top: 0, height: 300 }, levels)?.id).toBe('bottom');
  });
});

describe('mint-assets.json', () => {
  it('should exist and map asset keys for 19 clothbound hardcover items', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const assetsPath = path.join(process.cwd(), 'mint-assets.json');
    expect(fs.existsSync(assetsPath)).toBe(true);

    const jsonContent = JSON.parse(fs.readFileSync(assetsPath, 'utf-8'));
    expect(jsonContent.name).toBe('The Complete Shelf Asset Pack');
    expect(jsonContent.assets).toHaveLength(19);

    jsonContent.assets.forEach((asset: any, idx: number) => {
      expect(asset.assetKey).toBe(`clothbound-hardcover-${String(idx + 1).padStart(2, '0')}`);
      expect(asset.title).toBeTruthy();
      expect(asset.author).toBeTruthy();
      expect(asset.proportions).toBeDefined();
    });
  });
});

describe('BookMesh', () => {
  it('should construct a procedural BookMeshGroup instance', () => {
    const bookItem = MINT_BOOK_MANIFEST[0];
    const initialPos = new THREE.Vector3(1.0, 0, 0);
    const bookMesh = new BookMeshGroup(bookItem, initialPos);

    expect(bookMesh.group).toBeInstanceOf(THREE.Group);
    expect(bookMesh.group.position.x).toBe(1.0);
    expect(bookMesh.isHovered).toBe(false);

    const frontCoverMesh = bookMesh.group.children[1] as THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial[]>;
    expect(frontCoverMesh.material[0].map).not.toBeNull();
    expect(frontCoverMesh.material[4].map).toBeNull();

    bookMesh.setHovered(true);
    expect(bookMesh.isHovered).toBe(true);

    bookMesh.setSelected(true);
    expect(bookMesh.isSelected).toBe(true);

    bookMesh.dispose();
  });

  it('should pull the selected book forward and turn its broad cover toward the camera', () => {
    const bookMesh = new BookMeshGroup(MINT_BOOK_MANIFEST[0], new THREE.Vector3(1.0, 0.17, 0));

    bookMesh.setFocusPose(new THREE.Vector3(1.0, 0.17, 1.8), new THREE.Euler(0, -Math.PI / 2, 0), 1.14);
    bookMesh.setSelected(true);
    bookMesh.update(1);

    expect(bookMesh.group.position.z).toBeCloseTo(1.8);
    expect(bookMesh.group.rotation.y).toBeCloseTo(-Math.PI / 2);
    expect(bookMesh.group.scale.x).toBeCloseTo(1.14);
    expect(bookMesh.getFocusPosition().z).toBeCloseTo(1.8);

    bookMesh.dispose();
  });
});

describe('ShelfMesh', () => {
  it('should create a walnut shelf group with support brackets and shadow plane', () => {
    const shelf = new ShelfMeshGroup({
      width: 15,
      depth: 3,
      thickness: 0.3,
    });

    expect(shelf.group).toBeInstanceOf(THREE.Group);
    expect(shelf.group.children.length).toBeGreaterThan(0);

    shelf.dispose();
  });

  it('reuses shelf geometry while creating every named level', () => {
    const shelf = new ShelfMeshGroup({
      width: 15,
      depth: 3,
      thickness: 0.3,
      levelCount: 4,
    });

    const shelfBoards = shelf.group.children.filter((child) => child instanceof THREE.Mesh);
    expect(shelfBoards.length).toBeGreaterThanOrEqual(4);
    expect((shelfBoards[0] as THREE.Mesh).geometry).toBe((shelfBoards[1] as THREE.Mesh).geometry);

    shelf.dispose();
  });
});

describe('InspectionControls', () => {
  it('should handle camera lerping and mode switching', () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const domElement = document.createElement('div');

    const controls = new InspectionControls({
      camera,
      domElement,
      minX: 0,
      maxX: 10,
    });

    expect(controls.mode).toBe('shelf');

    controls.scrollToX(5.0);
    expect(controls.getTargetShelfX()).toBe(5.0);

    const bookItem = MINT_BOOK_MANIFEST[0];
    const bookMesh = new BookMeshGroup(bookItem, new THREE.Vector3(2.0, 0, 0));

    controls.selectBook(bookMesh);
    expect(controls.mode).toBe('inspecting');
    expect(controls.selectedBook).toBe(bookMesh);

    controls.deselectBook();
    expect(controls.mode).toBe('shelf');
    expect(controls.selectedBook).toBeNull();

    bookMesh.dispose();
    controls.dispose();
  });
});
