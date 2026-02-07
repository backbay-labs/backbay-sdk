"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus within a container element while active.
 * When the user tabs past the last focusable element, focus wraps to the first,
 * and vice versa with Shift+Tab.
 *
 * @param ref - Ref to the container element
 * @param active - Whether the trap is active
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const element = ref.current;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = element.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    element.addEventListener("keydown", handleKeyDown);
    // Focus first focusable element on activation
    const firstFocusable = element.querySelector(FOCUSABLE_SELECTOR) as HTMLElement;
    firstFocusable?.focus();

    return () => element.removeEventListener("keydown", handleKeyDown);
  }, [active, ref]);
}
