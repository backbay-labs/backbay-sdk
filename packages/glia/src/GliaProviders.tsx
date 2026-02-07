/**
 * GliaProviders - Convenience wrapper that nests all Glia context providers.
 *
 * Reduces provider nesting boilerplate for consumers who use multiple subsystems.
 */

'use client';

import type { ReactNode } from 'react';
import { GliaThemeProvider, type GliaThemeProviderProps } from './theme/GliaThemeProvider';
import { BBProvider, type BBProviderProps } from './components/BBProvider';
import {
  DesktopOSProvider,
  type DesktopOSProviderProps,
} from './desktop/providers/DesktopOSProvider';
import { SpeakeasyProvider, type SpeakeasyProviderProps } from './speakeasy/SpeakeasyProvider';

export interface GliaProvidersProps {
  children: ReactNode;
  /** Theme ID for GliaThemeProvider */
  theme?: GliaThemeProviderProps['themeId'];
  /** BBProvider config (required if using BBProvider features) */
  config: BBProviderProps['config'];
  /** BBProvider agents */
  agents?: BBProviderProps['agents'];
  /** Desktop OS provider props (omit children). Omit to skip. */
  desktop?: Omit<DesktopOSProviderProps, 'children'>;
  /** Speakeasy provider props (omit children). Omit to skip. */
  speakeasy?: Omit<SpeakeasyProviderProps, 'children'>;
}

/**
 * Convenience wrapper that composes GliaThemeProvider, BBProvider,
 * DesktopOSProvider, and SpeakeasyProvider into a single tree.
 *
 * @example
 * ```tsx
 * <GliaProviders
 *   theme="glass-dark"
 *   config={{ appName: 'MyApp' }}
 *   desktop={{ processes: myApps }}
 *   speakeasy={{ domain: 'example.com' }}
 * >
 *   <App />
 * </GliaProviders>
 * ```
 */
export function GliaProviders({
  children,
  theme,
  config,
  agents,
  desktop,
  speakeasy,
}: GliaProvidersProps) {
  let tree = children;

  if (speakeasy) {
    tree = <SpeakeasyProvider {...speakeasy}>{tree}</SpeakeasyProvider>;
  }

  if (desktop) {
    tree = <DesktopOSProvider {...desktop}>{tree}</DesktopOSProvider>;
  }

  return (
    <GliaThemeProvider themeId={theme}>
      <BBProvider config={config} agents={agents}>
        {tree}
      </BBProvider>
    </GliaThemeProvider>
  );
}
