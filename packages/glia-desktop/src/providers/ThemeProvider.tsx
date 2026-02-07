/**
 * @backbay/glia Desktop OS - ThemeProvider
 *
 * Injects theme CSS variables into the DOM.
 * Can be used standalone or wrapped by DesktopOSProvider.
 */

'use client';

import React, { createContext, useContext, useRef, useMemo, useLayoutEffect, useEffect } from 'react';

// SSR-safe useLayoutEffect - avoids React warnings during server rendering
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
import {
  type DesktopOSTheme,
  type PartialDesktopOSTheme,
  themeToCssVariables,
  mergeTheme,
} from '../themes/types';
import { defaultTheme } from '../themes/default';

// ═══════════════════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════════════════

interface ThemeContextValue {
  theme: DesktopOSTheme;
  cssVariables: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ═══════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Access the current theme.
 *
 * @example
 * ```tsx
 * const { theme } = useDesktopTheme();
 * console.log(theme.colors.accent);
 * ```
 */
export function useDesktopTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default theme if not in provider (standalone mode)
    return {
      theme: defaultTheme,
      cssVariables: themeToCssVariables(defaultTheme),
    };
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// Provider
// ═══════════════════════════════════════════════════════════════════════════

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Custom theme or partial theme to merge with default */
  theme?: PartialDesktopOSTheme;
  /** Target element to inject CSS variables (defaults to :root) */
  target?: 'root' | 'local';
  /** Class name for the wrapper div (only used when target='local') */
  className?: string;
}

/**
 * Provides theme context and injects CSS variables.
 *
 * @example Global injection (recommended)
 * ```tsx
 * <ThemeProvider theme={{ colors: { accent: '#00ff88' } }}>
 *   <App />
 * </ThemeProvider>
 * ```
 *
 * @example Local injection (for isolated instances)
 * ```tsx
 * <ThemeProvider target="local" className="my-desktop">
 *   <Desktop />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  theme: partialTheme,
  target = 'root',
  className,
}: ThemeProviderProps) {
  const deprecationWarned = useRef(false);
  if (!deprecationWarned.current) {
    deprecationWarned.current = true;
    console.warn("[Glia] DesktopOS ThemeProvider is deprecated. Use GliaThemeProvider instead.");
  }

  // Merge custom theme with default
  const theme = useMemo(
    () => (partialTheme ? mergeTheme(defaultTheme, partialTheme) : defaultTheme),
    [partialTheme]
  );

  // Convert to CSS variables
  const cssVariables = useMemo(() => themeToCssVariables(theme), [theme]);

  // Inject CSS variables into :root
  useIsomorphicLayoutEffect(() => {
    if (target !== 'root') return;

    const root = document.documentElement;
    const previousValues: Record<string, string> = {};

    // Store previous values and set new ones
    for (const [key, value] of Object.entries(cssVariables)) {
      previousValues[key] = root.style.getPropertyValue(key);
      root.style.setProperty(key, value);
    }

    // Cleanup: restore previous values
    return () => {
      for (const [key, value] of Object.entries(previousValues)) {
        if (value) {
          root.style.setProperty(key, value);
        } else {
          root.style.removeProperty(key);
        }
      }
    };
  }, [cssVariables, target]);

  const contextValue = useMemo(
    () => ({ theme, cssVariables }),
    [theme, cssVariables]
  );

  // Local injection wraps children in a div with inline CSS variables
  if (target === 'local') {
    const style: React.CSSProperties = {};
    for (const [key, value] of Object.entries(cssVariables)) {
      (style as Record<string, string>)[key] = value;
    }

    return (
      <ThemeContext.Provider value={contextValue}>
        <div className={className} style={style}>
          {children}
        </div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
