'use client';

/**
 * SentinelProvider
 *
 * Provides context for Sentinel components, including external dependencies
 * like icon renderers and glyph components.
 */

import React, { createContext, useContext, useMemo, useEffect } from 'react';

import type {
  SentinelProviderProps,
  SentinelContextValue,
  SentinelDependencies,
  DocketItem,
} from './types';
import { useSentinelStore } from './sentinelStore';

// -----------------------------------------------------------------------------
// Default Icon Renderer (Fallback)
// -----------------------------------------------------------------------------

const DefaultIconRenderer: React.FC<{ name: string; size: number; color: string }> = ({
  name,
  size,
  color,
}) => {
  // Simple fallback - renders first letter of icon name in a circle
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.5,
        color,
        fontFamily: 'monospace',
        textTransform: 'uppercase',
      }}
    >
      {name.charAt(0)}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Default Glyph Renderer (Fallback)
// -----------------------------------------------------------------------------

const DefaultGlyphRenderer: React.FC<{
  variant?: string;
  scale?: number;
  position?: [number, number, number];
  state?: 'idle' | 'listening';
}> = ({ scale = 1 }) => {
  // Simple fallback - renders a golden sphere
  return (
    <mesh scale={scale}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        color="#d4a84b"
        emissive="#d4a84b"
        emissiveIntensity={0.3}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
};

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

const defaultDependencies: SentinelDependencies = {
  IconRenderer: DefaultIconRenderer,
  GlyphRenderer: DefaultGlyphRenderer,
  onOpenProcess: undefined,
  processMap: {
    console: 'cathedral',
    lens: 'graphlens',
    vault: 'vault',
  },
};

const SentinelContext = createContext<SentinelContextValue>({
  dependencies: defaultDependencies,
});

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useSentinelDependencies(): SentinelDependencies {
  const context = useContext(SentinelContext);
  return context.dependencies;
}

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

export const SentinelProvider: React.FC<SentinelProviderProps> = ({
  children,
  dependencies,
  initialDocket,
}) => {
  const setDocket = useSentinelStore((s) => s.setDocket);

  // Merge provided dependencies with defaults
  const mergedDependencies = useMemo<SentinelDependencies>(
    () => ({
      ...defaultDependencies,
      ...dependencies,
    }),
    [dependencies]
  );

  // Set initial docket if provided
  useEffect(() => {
    if (initialDocket && initialDocket.length > 0) {
      setDocket(initialDocket);
    }
  }, [initialDocket, setDocket]);

  const value = useMemo<SentinelContextValue>(
    () => ({
      dependencies: mergedDependencies,
    }),
    [mergedDependencies]
  );

  return (
    <SentinelContext.Provider value={value}>
      {children}
    </SentinelContext.Provider>
  );
};

export default SentinelProvider;
