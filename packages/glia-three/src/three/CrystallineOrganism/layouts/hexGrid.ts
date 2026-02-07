/**
 * Hex Grid Layout
 *
 * Positions organisms on hex grid intersections radiating from center.
 */

import type { HexGridPosition, LayoutResult } from "../types";
import { HEX_GRID_CONFIG } from "../constants";

/**
 * Convert axial coordinates (q, r) to world position (x, z)
 */
export function axialToWorld(q: number, r: number): [number, number] {
  const { size } = HEX_GRID_CONFIG;
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const z = size * (3 / 2) * r;
  return [x, z];
}

/**
 * Get hex positions in a spiral pattern from center
 */
export function getHexSpiral(count: number): HexGridPosition[] {
  const positions: HexGridPosition[] = [];

  // Center position
  positions.push({ q: 0, r: 0, x: 0, z: 0 });

  if (count <= 1) return positions;

  // Spiral outward
  let q = 0;
  let r = 0;
  let ring = 1;

  // Direction vectors for hex movement
  const directions = [
    [1, 0],   // E
    [0, 1],   // SE
    [-1, 1],  // SW
    [-1, 0],  // W
    [0, -1],  // NW
    [1, -1],  // NE
  ];

  while (positions.length < count) {
    // Start each ring at (ring, 0)
    q = ring;
    r = 0;

    for (let dir = 0; dir < 6; dir++) {
      for (let step = 0; step < ring; step++) {
        if (positions.length >= count) break;

        const [wx, wz] = axialToWorld(q, r);
        positions.push({ q, r, x: wx, z: wz });

        q += directions[dir][0];
        r += directions[dir][1];
      }
    }

    ring++;
    if (ring > HEX_GRID_CONFIG.maxRadius) break;
  }

  return positions.slice(0, count);
}

/**
 * Layout organisms on hex grid
 */
export function hexGridLayout(organismIds: string[]): LayoutResult {
  const hexPositions = getHexSpiral(organismIds.length);
  const positions = new Map<string, [number, number, number]>();

  organismIds.forEach((id, i) => {
    const hex = hexPositions[i];
    if (hex) {
      positions.set(id, [hex.x, HEX_GRID_CONFIG.height, hex.z]);
    }
  });

  return { positions };
}
