/**
 * Component Registry Implementation
 *
 * Provides query and composition APIs for agents to discover
 * and use UI components.
 */

import type {
  ComponentManifest,
  ComponentRegistry,
  RegistryQuery,
  RegistrySearchResult,
  ComponentCategory,
  ComponentPurpose,
} from "./types";
import { allManifests, manifestById, manifestsByCategory } from "./manifests";

/**
 * Default registry implementation using static manifests
 */
class DefaultRegistry implements ComponentRegistry {
  private manifests: ComponentManifest[];
  private byId: Map<string, ComponentManifest>;
  private byCategory: Record<string, ComponentManifest[]>;

  constructor(manifests: ComponentManifest[] = allManifests) {
    this.manifests = manifests;
    this.byId = new Map(manifests.map((m) => [m.id, m]));
    this.byCategory = manifests.reduce(
      (acc, m) => {
        if (!acc[m.category]) acc[m.category] = [];
        acc[m.category].push(m);
        return acc;
      },
      {} as Record<string, ComponentManifest[]>
    );
  }

  /**
   * Get a component by ID
   */
  get(id: string): ComponentManifest | undefined {
    return this.byId.get(id);
  }

  /**
   * List components with optional filtering
   */
  list(query?: RegistryQuery): ComponentManifest[] {
    if (!query) return this.manifests;

    let results = [...this.manifests];

    // Filter by category
    if (query.category) {
      results = results.filter((m) => m.category === query.category);
    }

    // Filter by purpose
    if (query.purpose) {
      const purposes = Array.isArray(query.purpose)
        ? query.purpose
        : [query.purpose];
      results = results.filter((m) =>
        purposes.some((p) => m.purpose.includes(p))
      );
    }

    // Filter by style
    if (query.style) {
      const styles = Array.isArray(query.style) ? query.style : [query.style];
      results = results.filter((m) =>
        styles.some((s) => m.styles.includes(s))
      );
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter((m) =>
        query.tags!.some((t) => m.tags.includes(t))
      );
    }

    // Filter by slots
    if (query.hasSlots !== undefined) {
      results = results.filter(
        (m) => (m.slots && m.slots.length > 0) === query.hasSlots
      );
    }

    // Filter by children support
    if (query.supportsChildren !== undefined) {
      results = results.filter(
        (m) =>
          (m.validChildren && m.validChildren.length > 0) ===
          query.supportsChildren
      );
    }

    // Free-text search
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(
        (m) =>
          m.name.toLowerCase().includes(searchLower) ||
          m.description.toLowerCase().includes(searchLower) ||
          m.tags.some((t) => t.includes(searchLower)) ||
          m.bestFor.some((b) => b.toLowerCase().includes(searchLower))
      );
    }

    // Limit results
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Search with relevance scoring
   */
  search(query: string): RegistrySearchResult[] {
    const queryLower = query.toLowerCase();
    const queryTokens = queryLower.split(/\s+/).filter((t) => t.length > 2);

    const results: RegistrySearchResult[] = this.manifests.map((component) => {
      let score = 0;
      const matchedOn: string[] = [];

      // Name match (highest weight)
      if (component.name.toLowerCase().includes(queryLower)) {
        score += 0.4;
        matchedOn.push("name");
      }

      // ID match
      if (component.id.toLowerCase().includes(queryLower)) {
        score += 0.2;
        matchedOn.push("id");
      }

      // Description match
      const descLower = component.description.toLowerCase();
      if (descLower.includes(queryLower)) {
        score += 0.15;
        matchedOn.push("description");
      }

      // Tag matches
      const matchedTags = component.tags.filter((t) =>
        queryTokens.some((qt) => t.includes(qt))
      );
      if (matchedTags.length > 0) {
        score += 0.1 * Math.min(matchedTags.length, 3);
        matchedOn.push(`tags:${matchedTags.join(",")}`);
      }

      // bestFor matches
      const matchedBestFor = component.bestFor.filter((b) =>
        queryTokens.some((qt) => b.toLowerCase().includes(qt))
      );
      if (matchedBestFor.length > 0) {
        score += 0.1 * Math.min(matchedBestFor.length, 2);
        matchedOn.push("bestFor");
      }

      // Purpose matches
      const matchedPurposes = component.purpose.filter((p) =>
        queryTokens.some((qt) => p.includes(qt))
      );
      if (matchedPurposes.length > 0) {
        score += 0.05 * matchedPurposes.length;
        matchedOn.push(`purpose:${matchedPurposes.join(",")}`);
      }

      return { component, score, matchedOn };
    });

    // Sort by score descending, filter out zero scores
    return results
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Check if a component can be placed inside another
   */
  canCompose(parentId: string, childId: string): boolean {
    const parent = this.get(parentId);
    const child = this.get(childId);

    if (!parent || !child) return false;

    // Check if parent accepts this child
    if (parent.validChildren) {
      if (
        parent.validChildren.includes("*") ||
        parent.validChildren.includes(childId)
      ) {
        return true;
      }
    }

    // Check if child accepts this parent
    if (child.validParents) {
      if (
        child.validParents.includes("*") ||
        child.validParents.includes(parentId)
      ) {
        return true;
      }
    }

    // Check incompatibilities
    if (parent.incompatibleWith?.includes(childId)) return false;
    if (child.incompatibleWith?.includes(parentId)) return false;

    // Default: allow if parent has slots
    return parent.slots !== undefined && parent.slots.length > 0;
  }

  /**
   * Get components that can be children of the given parent
   */
  getValidChildren(parentId: string): ComponentManifest[] {
    const parent = this.get(parentId);
    if (!parent) return [];

    return this.manifests.filter((child) => this.canCompose(parentId, child.id));
  }

  /**
   * Get components that can be parents of the given child
   */
  getValidParents(childId: string): ComponentManifest[] {
    const child = this.get(childId);
    if (!child) return [];

    return this.manifests.filter((parent) => this.canCompose(parent.id, childId));
  }

  /**
   * Get all categories
   */
  categories(): ComponentCategory[] {
    return Object.keys(this.byCategory) as ComponentCategory[];
  }

  /**
   * Get all purposes used across components
   */
  purposes(): ComponentPurpose[] {
    const purposes = new Set<ComponentPurpose>();
    this.manifests.forEach((m) => m.purpose.forEach((p) => purposes.add(p)));
    return Array.from(purposes);
  }

  /**
   * Get all tags used across components
   */
  tags(): string[] {
    const tags = new Set<string>();
    this.manifests.forEach((m) => m.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }

  /**
   * Get total component count
   */
  count(): number {
    return this.manifests.length;
  }
}

/**
 * Singleton registry instance
 */
let registryInstance: ComponentRegistry | null = null;

/**
 * Get the component registry
 */
export function getRegistry(): ComponentRegistry {
  if (!registryInstance) {
    registryInstance = new DefaultRegistry();
  }
  return registryInstance;
}

/**
 * Create a registry with custom manifests
 */
export function createRegistry(
  manifests: ComponentManifest[]
): ComponentRegistry {
  return new DefaultRegistry(manifests);
}

/**
 * Export registry for direct use
 */
export const registry = getRegistry();

// Re-export for convenience
export { manifestById, manifestsByCategory, allManifests };
