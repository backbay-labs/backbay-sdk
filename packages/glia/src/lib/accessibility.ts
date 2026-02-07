"use client";

import { useSyncExternalStore } from "react";

// ============================================================================
// MEDIA QUERY SUBSCRIPTION HELPER
// ============================================================================

/**
 * Creates a concurrent-safe subscription to a CSS media query
 * for use with React.useSyncExternalStore.
 */
function createMediaQueryStore(query: string) {
  function subscribe(callback: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    const mql = window.matchMedia(query);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  }

  function getSnapshot(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  }

  function getServerSnapshot(): boolean {
    return false;
  }

  return { subscribe, getSnapshot, getServerSnapshot };
}

// ============================================================================
// REDUCED TRANSPARENCY
// ============================================================================

const reducedTransparencyStore = createMediaQueryStore(
  "(prefers-reduced-transparency: reduce)"
);

/**
 * Check if user prefers reduced transparency.
 *
 * Uses the CSS media query `prefers-reduced-transparency: reduce`.
 * SSR-safe: returns false on the server.
 *
 * NOTE: Browser support is limited (Safari 16.4+, Firefox 113+).
 * Falls back to false when not supported.
 */
export function prefersReducedTransparency(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
}

/**
 * React hook that reactively tracks the user's reduced-transparency preference.
 *
 * Unlike the bare `prefersReducedTransparency()` function, this hook
 * subscribes to media-query change events and triggers a re-render
 * when the preference changes (e.g. user toggles the OS setting).
 *
 * @returns boolean -- true when the user prefers reduced transparency
 */
export function usePrefersReducedTransparency(): boolean {
  return useSyncExternalStore(
    reducedTransparencyStore.subscribe,
    reducedTransparencyStore.getSnapshot,
    reducedTransparencyStore.getServerSnapshot
  );
}

// ============================================================================
// REDUCED MOTION
// ============================================================================

const reducedMotionStore = createMediaQueryStore(
  "(prefers-reduced-motion: reduce)"
);

/**
 * React hook that reactively tracks the user's reduced-motion preference.
 *
 * Subscribes to media-query change events and triggers a re-render
 * when the preference changes (e.g. user toggles the OS setting).
 *
 * @returns boolean -- true when the user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    reducedMotionStore.subscribe,
    reducedMotionStore.getSnapshot,
    reducedMotionStore.getServerSnapshot
  );
}

// ============================================================================
// COLOR SCHEME
// ============================================================================

const colorSchemeStore = createMediaQueryStore(
  "(prefers-color-scheme: dark)"
);

/**
 * React hook that reactively tracks the user's preferred color scheme.
 *
 * @returns "dark" | "light" based on the OS/browser preference
 */
export function usePrefersColorScheme(): "dark" | "light" {
  const isDark = useSyncExternalStore(
    colorSchemeStore.subscribe,
    colorSchemeStore.getSnapshot,
    colorSchemeStore.getServerSnapshot
  );
  return isDark ? "dark" : "light";
}

// ============================================================================
// HIGH CONTRAST
// ============================================================================

const highContrastStore = createMediaQueryStore(
  "(prefers-contrast: more)"
);

/**
 * React hook that reactively tracks the user's high-contrast preference.
 *
 * @returns boolean -- true when the user prefers higher contrast
 */
export function usePrefersHighContrast(): boolean {
  return useSyncExternalStore(
    highContrastStore.subscribe,
    highContrastStore.getSnapshot,
    highContrastStore.getServerSnapshot
  );
}
