/**
 * Component Manifests Index
 * Exports all component manifests for the registry
 */

export * from "./atoms";
export * from "./molecules";
export * from "./organisms";
export * from "./three";
export * from "./layouts";

import { atomManifests } from "./atoms";
import { moleculeManifests } from "./molecules";
import { organismManifests } from "./organisms";
import { threeManifests } from "./three";
import { layoutManifests } from "./layouts";
import type { ComponentManifest } from "../types";

/**
 * All component manifests combined
 */
export const allManifests: ComponentManifest[] = [
  ...atomManifests,
  ...moleculeManifests,
  ...organismManifests,
  ...threeManifests,
  ...layoutManifests,
];

/**
 * Manifest lookup by ID
 */
export const manifestById: Map<string, ComponentManifest> = new Map(
  allManifests.map((m) => [m.id, m])
);

/**
 * Manifests grouped by category
 */
export const manifestsByCategory: Record<string, ComponentManifest[]> = {
  atoms: atomManifests,
  molecules: moleculeManifests,
  organisms: organismManifests,
  three: threeManifests,
  layouts: layoutManifests,
};
