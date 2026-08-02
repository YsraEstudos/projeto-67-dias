import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  getBookDimensionsByPageCount,
  getDeterministicColorHash,
  extractDominantColor,
  resolveCoverTextureUrl,
} from '../../../components/reading/shelf/BookMesh';
import { ShelfNameplateMesh, ShelfMeshGroup } from '../../../components/reading/shelf/ShelfMesh';

describe('Shelf Enhancements & Dynamic Book Scaling', () => {
  it('Requirement 2: ShelfNameplateMesh renders enamel plaque texture and geometry correctly', () => {
    const plaque = new ShelfNameplateMesh('Primeiro Andar', 2.4, 0.32, 0.02);
    expect(plaque.mesh).toBeDefined();
    expect(plaque.texture).toBeInstanceOf(THREE.CanvasTexture);
    expect(plaque.geometry).toBeInstanceOf(THREE.BoxGeometry);
    expect(plaque.mesh.castShadow).toBe(false);
    expect(plaque.mesh.receiveShadow).toBe(false);
    expect(plaque.texture.anisotropy).toBeGreaterThanOrEqual(1);
    plaque.dispose();
  });

  it('Requirement 2: ShelfMeshGroup attaches ShelfNameplateMesh for each level', () => {
    const shelfGroup = new ShelfMeshGroup({
      width: 14,
      depth: 3.2,
      thickness: 0.35,
      levelCount: 2,
      levelSpacing: 3.9,
      levels: [
        { id: 'level-1', name: 'Andar Térreo', position: 0 },
        { id: 'level-2', name: 'Primeiro Andar', position: 1 },
      ],
    });

    const nameplate = shelfGroup.group.children[1] as THREE.Mesh;
    const nameplateBounds = new THREE.Box3().setFromObject(nameplate);
    expect(nameplateBounds.min.z).toBeGreaterThan(3.2 / 2);
    expect(shelfGroup.group.children.length).toBeGreaterThan(4);
    shelfGroup.dispose();
  });

  it('Requirement 3: getBookDimensionsByPageCount scales book dimensions by page count tiers', () => {
    // Tier 1: <= 150 pages -> small volume (thickness 0.30, height 2.1, width 1.4)
    const small = getBookDimensionsByPageCount(120);
    expect(small).toEqual({ thickness: 0.30, height: 2.1, width: 1.4 });

    // Tier 2: 151 - 500 pages -> medium volume (thickness 0.50, height 2.6, width 1.7)
    const medium = getBookDimensionsByPageCount(350);
    expect(medium).toEqual({ thickness: 0.50, height: 2.6, width: 1.7 });

    // Tier 3: > 500 pages -> large volume (thickness 0.85, height 3.1, width 2.0)
    const large = getBookDimensionsByPageCount(750);
    expect(large).toEqual({ thickness: 0.85, height: 3.1, width: 2.0 });
  });

  it('Requirement 5: getDeterministicColorHash produces a consistent hex color string', () => {
    const color1 = getDeterministicColorHash('The Odyssey');
    const color2 = getDeterministicColorHash('The Odyssey');
    const color3 = getDeterministicColorHash('Faust');

    expect(color1).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(color1).toBe(color2);
    expect(color1).not.toBe(color3);
  });

  it('Requirement 5: extractDominantColor returns no color when canvas pixels are unavailable', () => {
    const img = document.createElement('img');
    const hex = extractDominantColor(img, 'fallback-title');
    expect(hex).toBeNull();
  });

  it('unwraps DuckDuckGo image URLs so CORS-capable originals can become textures', () => {
    const wrappedUrl = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fimages.thalia.media%2Fbook.jpeg&f=1';
    expect(resolveCoverTextureUrl(wrappedUrl)).toBe('https://images.thalia.media/book.jpeg');
    expect(resolveCoverTextureUrl('https://cdn.example.com/book.jpeg')).toBe('https://cdn.example.com/book.jpeg');
  });
});
