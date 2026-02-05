"use client";

/**
 * FieldProvider - React context for BackbayFieldBus
 */

import * as React from "react";
import { createBackbayFieldBus, getGlobalFieldBus } from "./BackbayFieldBus";
import type { BackbayFieldBus, FieldConfig } from "./types";

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

const FieldBusContext = React.createContext<BackbayFieldBus | null>(null);

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

export interface FieldProviderProps {
  children: React.ReactNode;
  /** Custom bus instance (if not provided, creates a new one) */
  bus?: BackbayFieldBus;
  /** Initial config for auto-created bus */
  config?: Partial<FieldConfig>;
  /** Use global singleton bus instead of creating new one */
  useGlobal?: boolean;
}

export function FieldProvider({
  children,
  bus: propBus,
  config,
  useGlobal = false,
}: FieldProviderProps) {
  const busRef = React.useRef<BackbayFieldBus | null>(null);

  // Initialize bus
  if (!busRef.current) {
    if (propBus) {
      busRef.current = propBus;
    } else if (useGlobal) {
      busRef.current = getGlobalFieldBus();
    } else {
      busRef.current = createBackbayFieldBus(config);
    }
  }

  return (
    <FieldBusContext.Provider value={busRef.current}>
      {children}
    </FieldBusContext.Provider>
  );
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useFieldBus(): BackbayFieldBus {
  const bus = React.useContext(FieldBusContext);

  if (!bus) {
    throw new Error("useFieldBus must be used within a FieldProvider");
  }

  return bus;
}

/**
 * Hook to subscribe to field state changes
 */
export function useFieldState() {
  const bus = useFieldBus();
  const [state, setState] = React.useState(bus.getSnapshot());

  React.useEffect(() => {
    return bus.subscribe(setState);
  }, [bus]);

  return state;
}
