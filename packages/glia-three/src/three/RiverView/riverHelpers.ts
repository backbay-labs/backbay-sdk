import * as THREE from "three";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

export const RIVER_DEFAULTS = {
  width: 3,
  laneCount: 4,
  flowSpeed: 0.4,
  length: 16,
  particleCount: 300,
} as const;

export const AGENT_COLORS = [
  "#22D3EE", // cyan
  "#F43F5E", // magenta
  "#10B981", // emerald
  "#8B5CF6", // violet
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#EC4899", // pink
  "#14B8A6", // teal
] as const;

// -----------------------------------------------------------------------------
// Curve Builders
// -----------------------------------------------------------------------------

/**
 * Generates a default meandering river path — gentle S-bends along the X axis.
 */
export function createRiverCurve(length = RIVER_DEFAULTS.length): THREE.CatmullRomCurve3 {
  const half = length / 2;
  const segments = 8;
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = -half + t * length;
    // Gentle S-curve meander on Z axis
    const z = Math.sin(t * Math.PI * 2) * (length * 0.06);
    // Very subtle vertical undulation
    const y = Math.sin(t * Math.PI * 3) * 0.15;
    points.push(new THREE.Vector3(x, y, z));
  }

  return new THREE.CatmullRomCurve3(points);
}

// -----------------------------------------------------------------------------
// Positioning Helpers
// -----------------------------------------------------------------------------

const _tangent = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _point = new THREE.Vector3();

/**
 * Get a 3D position at parametric time `t` along the curve with a lateral lane
 * offset perpendicular to the curve tangent (on the XZ plane).
 */
export function getPointOnRiver(
  curve: THREE.CatmullRomCurve3,
  t: number,
  laneOffset: number,
): THREE.Vector3 {
  const clamped = Math.max(0, Math.min(1, t));
  curve.getPointAt(clamped, _point);
  curve.getTangentAt(clamped, _tangent);

  // Perpendicular on the XZ plane (rotate tangent 90 degrees around Y)
  _normal.set(-_tangent.z, 0, _tangent.x).normalize();

  return new THREE.Vector3(
    _point.x + _normal.x * laneOffset,
    _point.y,
    _point.z + _normal.z * laneOffset,
  );
}

/**
 * Compute the lateral offset for a lane index within the river width.
 * Lanes are evenly distributed and centred around 0.
 */
export function laneOffset(
  laneIndex: number,
  totalLanes: number,
  riverWidth: number,
): number {
  if (totalLanes <= 1) return 0;
  const spacing = riverWidth / totalLanes;
  return -riverWidth / 2 + spacing / 2 + laneIndex * spacing;
}
