"use client";

import { useEffect } from "react";
import { useWindowManagerStore, type WindowManagerStoreApi } from "./window/useWindowManager";

/**
 * Global keyboard navigation hook for the desktop shell.
 *
 * Listens for:
 * - Ctrl+Tab: Cycle focus to the next open window
 * - Escape: Close the current overlay / exit fullscreen
 *
 * Call this once from the desktop shell root component.
 *
 * @param storeApi - Optional store API; defaults to the legacy singleton.
 */
export function useKeyboardNavigation(storeApi?: WindowManagerStoreApi) {
  useEffect(() => {
    const api = storeApi ?? useWindowManagerStore;

    function handleKeyDown(e: KeyboardEvent) {
      const store = api.getState();

      // Ctrl+Tab — cycle to next window
      if (e.key === "Tab" && e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        store._cycleFocusNext();
        return;
      }

      // Escape — exit fullscreen if active
      if (e.key === "Escape" && store.fullscreenId) {
        store._exitFullscreen();
        return;
      }
    }

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [storeApi]);
}
