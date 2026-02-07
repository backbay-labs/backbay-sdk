/**
 * useIntensity - Hook for tracking agent activity intensity
 *
 * Provides semantic visual feedback based on agent activity levels.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { IntensityValues } from '../protocol/types.js';
import { useBBContext } from '../components/BBProvider.js';

// =============================================================================
// Types
// =============================================================================

export interface UseIntensityOptions {
  /** Smoothing factor for transitions (0-1, lower = smoother) */
  smoothing?: number;

  /** Update interval in ms */
  updateInterval?: number;

  /** Sources to track */
  sources?: Array<'activeRuns' | 'pendingSync' | 'custom'>;

  /** Custom intensity source (0-1) */
  customIntensity?: number;
}

export interface UseIntensityReturn extends IntensityValues {
  /** Set custom intensity value */
  setCustomIntensity: (value: number) => void;

  /** CSS custom properties object for inline styles */
  cssVars: Record<string, string>;

  /** Get CSS custom properties as a string for style attribute */
  cssVarsString: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_SMOOTHING = 0.3;
const DEFAULT_UPDATE_INTERVAL = 50;

// =============================================================================
// Hook Implementation
// =============================================================================

export function useIntensity(options: UseIntensityOptions = {}): UseIntensityReturn {
  const {
    smoothing = DEFAULT_SMOOTHING,
    updateInterval = DEFAULT_UPDATE_INTERVAL,
    sources = ['activeRuns'],
    customIntensity: initialCustom = 0,
  } = options;

  const { activeRuns, syncStatus } = useBBContext();

  const [customIntensity, setCustomIntensity] = useState(initialCustom);
  const [values, setValues] = useState<IntensityValues>({
    intensity: 0,
    presence: 0,
    activity: 0,
    breathing: 0,
  });

  // Refs for smooth animation
  const targetRef = useRef<IntensityValues>({
    intensity: 0,
    presence: 0,
    activity: 0,
    breathing: 0,
  });
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(Date.now());

  // Calculate target intensity from sources
  const calculateTarget = useCallback(() => {
    let runIntensity = 0;
    let syncIntensity = 0;
    let custom = 0;

    if (sources.includes('activeRuns')) {
      runIntensity = Math.min(activeRuns.length / 3, 1); // Max at 3 concurrent runs
    }

    if (sources.includes('pendingSync')) {
      syncIntensity = syncStatus === 'pending' ? 0.5 : syncStatus === 'conflict' ? 0.8 : 0;
    }

    if (sources.includes('custom')) {
      custom = customIntensity;
    }

    // Combine sources
    const combinedIntensity = Math.min(
      Math.max(runIntensity, syncIntensity, custom),
      1
    );

    // Calculate derived values
    const presence = combinedIntensity > 0 ? Math.min(combinedIntensity + 0.3, 1) : 0;
    const activity = combinedIntensity;
    const breathing = combinedIntensity > 0.2 ? Math.min(combinedIntensity * 1.2, 1) : 0;

    targetRef.current = {
      intensity: combinedIntensity,
      presence,
      activity,
      breathing,
    };
  }, [activeRuns.length, syncStatus, customIntensity, sources]);

  // Smooth animation loop
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      // Recalculate target
      calculateTarget();

      // Lerp toward target
      const lerpFactor = 1 - Math.pow(1 - smoothing, delta * 60);

      setValues((prev) => ({
        intensity: prev.intensity + (targetRef.current.intensity - prev.intensity) * lerpFactor,
        presence: prev.presence + (targetRef.current.presence - prev.presence) * lerpFactor,
        activity: prev.activity + (targetRef.current.activity - prev.activity) * lerpFactor,
        breathing: prev.breathing + (targetRef.current.breathing - prev.breathing) * lerpFactor,
      }));

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [calculateTarget, smoothing]);

  // CSS custom properties
  const cssVars = useMemo(
    () => ({
      '--glia-intensity': values.intensity.toFixed(3),
      '--glia-intensity-presence': values.presence.toFixed(3),
      '--glia-intensity-activity': values.activity.toFixed(3),
      '--glia-intensity-breathing': values.breathing.toFixed(3),
    }),
    [values]
  );

  const cssVarsString = useMemo(
    () =>
      Object.entries(cssVars)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; '),
    [cssVars]
  );

  return {
    ...values,
    setCustomIntensity,
    cssVars,
    cssVarsString,
  };
}

// =============================================================================
// Provider Component (optional)
// =============================================================================

import { createContext, useContext, type ReactNode } from 'react';

const IntensityContext = createContext<IntensityValues | null>(null);

export interface IntensityProviderProps {
  children: ReactNode;
  options?: UseIntensityOptions;
}

export function IntensityProvider({ children, options }: IntensityProviderProps) {
  const intensity = useIntensity(options);

  // Apply CSS vars to document root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--glia-intensity', intensity.intensity.toFixed(3));
    root.style.setProperty('--glia-intensity-presence', intensity.presence.toFixed(3));
    root.style.setProperty('--glia-intensity-activity', intensity.activity.toFixed(3));
    root.style.setProperty('--glia-intensity-breathing', intensity.breathing.toFixed(3));
  }, [intensity]);

  return (
    <IntensityContext.Provider value={intensity}>
      {children}
    </IntensityContext.Provider>
  );
}

export function useIntensityContext(): IntensityValues {
  const context = useContext(IntensityContext);
  if (!context) {
    throw new Error('useIntensityContext must be used within an IntensityProvider');
  }
  return context;
}
