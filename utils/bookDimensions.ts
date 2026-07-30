/**
 * Shared book dimension utilities used by both ReadingView and BookMesh.
 * Single source of truth for page-count-based book sizing rules.
 */

export interface BookDimensions {
  thickness: number;
  height: number;
  width: number;
}

/**
 * Returns 3D book dimensions based on page count.
 * - <= 150 pages : small  (thickness 0.30, height 2.1, width 1.4)
 * - 151–500 pages: medium (thickness 0.50, height 2.6, width 1.7)
 * - > 500 pages  : large  (thickness 0.85, height 3.1, width 2.0)
 */
export function getBookDimensions(pages: number | undefined): BookDimensions {
  if (typeof pages === 'number' && pages > 0) {
    if (pages <= 150) return { thickness: 0.30, height: 2.1, width: 1.4 };
    if (pages <= 500) return { thickness: 0.50, height: 2.6, width: 1.7 };
    return { thickness: 0.85, height: 3.1, width: 2.0 };
  }
  // Default to medium when page count is unknown
  return { thickness: 0.50, height: 2.6, width: 1.7 };
}
