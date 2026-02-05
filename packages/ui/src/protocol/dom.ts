/**
 * DOM utilities for bb-protocol annotations
 *
 * Query and interact with elements annotated with data-bb-* attributes.
 */

import type { BBState, EntitySchema, BBAttributes } from './types.js';

// =============================================================================
// Element Queries
// =============================================================================

/**
 * Find an element by its bb-action attribute
 */
export function findAction(actionId: string, root: ParentNode = document): Element | null {
  return root.querySelector(`[data-bb-action="${actionId}"]`);
}

/**
 * Find all elements with a specific bb-action
 */
export function findAllActions(actionId: string, root: ParentNode = document): Element[] {
  return Array.from(root.querySelectorAll(`[data-bb-action="${actionId}"]`));
}

/**
 * Find all action elements on the page
 */
export function findAllActionElements(root: ParentNode = document): Element[] {
  return Array.from(root.querySelectorAll('[data-bb-action]'));
}

/**
 * Find an entity by type and ID
 */
export function findEntity(
  entityType: string,
  entityId: string,
  root: ParentNode = document
): Element | null {
  return root.querySelector(`[data-bb-entity="${entityType}"][data-bb-entity-id="${entityId}"]`);
}

/**
 * Find all entities of a specific type
 */
export function findAllEntities(entityType: string, root: ParentNode = document): Element[] {
  return Array.from(root.querySelectorAll(`[data-bb-entity="${entityType}"]`));
}

/**
 * Find a field within an entity or root
 */
export function findField(fieldName: string, root: ParentNode = document): Element | null {
  return root.querySelector(`[data-bb-field="${fieldName}"]`);
}

/**
 * Find an input by name
 */
export function findInput(inputName: string, root: ParentNode = document): Element | null {
  return root.querySelector(`[data-bb-input="${inputName}"]`);
}

/**
 * Find output area by name
 */
export function findOutput(outputName: string, root: ParentNode = document): Element | null {
  return root.querySelector(`[data-bb-output="${outputName}"]`);
}

/**
 * Check if user is authenticated based on auth indicator
 */
export function isAuthenticated(indicator: string, root: ParentNode = document): boolean {
  return root.querySelector(indicator) !== null;
}

// =============================================================================
// Attribute Reading
// =============================================================================

/**
 * Get the bb-action ID from an element
 */
export function getActionId(element: Element): string | null {
  return element.getAttribute('data-bb-action');
}

/**
 * Get the entity type from an element
 */
export function getEntityType(element: Element): string | null {
  return element.getAttribute('data-bb-entity');
}

/**
 * Get the entity ID from an element
 */
export function getEntityId(element: Element): string | null {
  return element.getAttribute('data-bb-entity-id');
}

/**
 * Get the field name from an element
 */
export function getFieldName(element: Element): string | null {
  return element.getAttribute('data-bb-field');
}

/**
 * Get the current state of an element
 */
export function getState(element: Element): BBState | null {
  return element.getAttribute('data-bb-state') as BBState | null;
}

/**
 * Check if an element requires confirmation
 */
export function requiresConfirmation(element: Element): boolean {
  return element.getAttribute('data-bb-confirm') === 'true';
}

/**
 * Get the hidden description for an element
 */
export function getDescription(element: Element): string | null {
  // First check for data-bb-description attribute
  const desc = element.getAttribute('data-bb-description');
  if (desc) return desc;

  // Then check for child with data-bb-description
  const descElement = element.querySelector('[data-bb-description]');
  return descElement?.textContent?.trim() ?? null;
}

/**
 * Get JSON-encoded inputs from an element
 */
export function getInputs(element: Element): Record<string, unknown> | null {
  const inputs = element.getAttribute('data-bb-inputs');
  if (!inputs) return null;
  try {
    return JSON.parse(inputs);
  } catch {
    return null;
  }
}

/**
 * Get JSON-encoded cost from an element
 */
export function getCost(element: Element): { usd?: number; risk?: string } | null {
  const cost = element.getAttribute('data-bb-cost');
  if (!cost) return null;
  try {
    return JSON.parse(cost);
  } catch {
    return null;
  }
}

// =============================================================================
// Entity Extraction
// =============================================================================

/**
 * Extract entity data based on schema field mappings
 */
export function extractEntity(
  element: Element,
  schema: EntitySchema
): Record<string, string | null> {
  const result: Record<string, string | null> = {};

  for (const [fieldName, selectorOrAttr] of Object.entries(schema.fields)) {
    result[fieldName] = extractFieldValue(element, selectorOrAttr);
  }

  return result;
}

/**
 * Extract a single field value using selector syntax
 *
 * Supports:
 * - "data-bb-entity-id" - read data attribute from root
 * - "[data-bb-field='name']" - text content of child element
 * - "[data-bb-field='image'] @src" - attribute of child element
 * - "[data-bb-field='status'] @data-bb-state" - data attribute of child
 */
export function extractFieldValue(root: Element, selectorOrAttr: string): string | null {
  // Check if it's a direct data attribute reference (no brackets)
  if (selectorOrAttr.startsWith('data-')) {
    return root.getAttribute(selectorOrAttr);
  }

  // Check for attribute extraction syntax: "selector @attr"
  const attrMatch = selectorOrAttr.match(/^(.+?)\s+@(.+)$/);
  if (attrMatch) {
    const [, selector, attr] = attrMatch;
    const child = root.querySelector(selector);
    return child?.getAttribute(attr) ?? null;
  }

  // Standard selector - get text content
  const child = root.querySelector(selectorOrAttr);
  return child?.textContent?.trim() ?? null;
}

/**
 * Extract all entities of a type from a page
 */
export function extractAllEntities(
  entityType: string,
  schema: EntitySchema,
  root: ParentNode = document
): Array<Record<string, string | null>> {
  const elements = findAllEntities(entityType, root);
  return elements.map((el) => extractEntity(el, schema));
}

// =============================================================================
// State Management
// =============================================================================

/**
 * Set the state of an element
 */
export function setState(element: Element, state: BBState): void {
  element.setAttribute('data-bb-state', state);
}

/**
 * Wait for an element to reach a specific state
 */
export function waitForState(
  element: Element,
  targetState: BBState,
  options: { timeout?: number; pollInterval?: number } = {}
): Promise<void> {
  const { timeout = 30000, pollInterval = 100 } = options;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const currentState = getState(element);
      if (currentState === targetState) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for state "${targetState}". Current: "${currentState}"`));
        return;
      }

      setTimeout(check, pollInterval);
    };

    check();
  });
}

/**
 * Observe state changes on an element
 */
export function observeState(
  element: Element,
  callback: (state: BBState | null, previousState: BBState | null) => void
): () => void {
  let previousState = getState(element);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-bb-state') {
        const newState = getState(element);
        if (newState !== previousState) {
          callback(newState, previousState);
          previousState = newState;
        }
      }
    }
  });

  observer.observe(element, { attributes: true, attributeFilter: ['data-bb-state'] });

  return () => observer.disconnect();
}

// =============================================================================
// Action Helpers
// =============================================================================

/**
 * Get all available actions with their metadata
 */
export function getAvailableActions(root: ParentNode = document): Array<{
  id: string;
  element: Element;
  state: BBState | null;
  requiresConfirmation: boolean;
  description: string | null;
  inputs: Record<string, unknown> | null;
  cost: { usd?: number; risk?: string } | null;
}> {
  const elements = findAllActionElements(root);
  return elements.map((element) => ({
    id: getActionId(element)!,
    element,
    state: getState(element),
    requiresConfirmation: requiresConfirmation(element),
    description: getDescription(element),
    inputs: getInputs(element),
    cost: getCost(element),
  }));
}

/**
 * Check if an action is currently available (not disabled/loading/hidden)
 */
export function isActionAvailable(element: Element): boolean {
  const state = getState(element);
  if (!state || state === 'idle' || state === 'success') return true;
  return false;
}

// =============================================================================
// Manifest Discovery
// =============================================================================

/**
 * Find the bb-manifest link in the document
 */
export function findManifestUrl(doc: Document = document): string | null {
  const link = doc.querySelector('link[rel="bb-manifest"]');
  if (link) {
    return link.getAttribute('href');
  }
  // Default location
  return '/bb-manifest.json';
}

/**
 * Fetch and parse the bb-manifest for the current page
 */
export async function fetchManifest(
  url?: string
): Promise<{ success: true; data: unknown } | { success: false; error: string }> {
  const manifestUrl = url ?? findManifestUrl();
  if (!manifestUrl) {
    return { success: false, error: 'No manifest URL found' };
  }

  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
