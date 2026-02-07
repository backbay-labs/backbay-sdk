/**
 * BackbayFieldBus - Event bus for Ambient Field
 *
 * Manages state for the reactive field, translating Backbay domain events
 * into visual impulses, anchors, and hover effects.
 */

import type { FieldEvent, FieldEventSource, FieldEventType, FieldColor } from "@backbay/contract";
import type {
  Anchor,
  BackbayFieldBus,
  FieldBusListener,
  FieldConfig,
  FieldRuntimeState,
  Impulse,
  UVPosition,
} from "./types";
import { DEFAULT_FIELD_CONFIG } from "./types";

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

function createInitialState(): FieldRuntimeState {
  return {
    impulses: [],
    anchors: new Map(),
    hover: {
      active: false,
      uv: { x: 0.5, y: 0.5 },
      intent: "probe",
      velocity: { x: 0, y: 0 },
      lastTs: 0,
      sourceId: null,
    },
    frame: 0,
    pendingEvents: [],
  };
}

// -----------------------------------------------------------------------------
// Bus Factory
// -----------------------------------------------------------------------------

let idCounter = 0;
function generateId(): string {
  return `field-${Date.now()}-${idCounter++}`;
}

export function createBackbayFieldBus(
  initialConfig: Partial<FieldConfig> = {}
): BackbayFieldBus {
  let state: FieldRuntimeState = createInitialState();
  let config: FieldConfig = { ...DEFAULT_FIELD_CONFIG, ...initialConfig };
  const listeners = new Set<FieldBusListener>();

  // Notify all listeners
  const notify = () => {
    listeners.forEach((listener) => listener(state));
  };

  // Generate random UV position
  const randomUv = (): UVPosition => ({
    x: 0.1 + Math.random() * 0.8,
    y: 0.1 + Math.random() * 0.8,
  });

  // Handle impulse event
  const handleImpulse = (event: FieldEvent) => {
    const impulse: Impulse = {
      id: event.id,
      uv: event.position || randomUv(),
      startTs: Date.now(),
      amplitude: event.intensity,
      radius: 0.1,
      color: event.color || "cyan",
      source: event.source,
    };

    // Add impulse, capping at max
    const newImpulses = [...state.impulses, impulse].slice(-config.maxImpulses);

    state = {
      ...state,
      impulses: newImpulses,
    };
  };

  // Handle anchor create
  const handleAnchorCreate = (event: FieldEvent) => {
    const newAnchors = new Map(state.anchors);

    const anchor: Anchor = {
      id: event.id,
      entityId: event.entityId,
      source: event.source,
      uv: event.position || randomUv(),
      strength: event.intensity,
      color: event.color || "cyan",
      createdTs: Date.now(),
    };

    newAnchors.set(event.entityId, anchor);

    // Cap anchors
    if (newAnchors.size > config.maxAnchors) {
      const entries = Array.from(newAnchors.entries());
      const trimmed = entries.slice(-config.maxAnchors);
      newAnchors.clear();
      trimmed.forEach(([k, v]) => newAnchors.set(k, v));
    }

    state = {
      ...state,
      anchors: newAnchors,
    };
  };

  // Handle anchor update
  const handleAnchorUpdate = (event: FieldEvent) => {
    const existing = state.anchors.get(event.entityId);
    if (!existing) {
      // Create if doesn't exist
      handleAnchorCreate(event);
      return;
    }

    const newAnchors = new Map(state.anchors);
    newAnchors.set(event.entityId, {
      ...existing,
      strength: event.intensity,
      color: event.color || existing.color,
    });

    state = {
      ...state,
      anchors: newAnchors,
    };
  };

  // Handle anchor remove
  const handleAnchorRemove = (event: FieldEvent) => {
    const newAnchors = new Map(state.anchors);
    newAnchors.delete(event.entityId);
    state = {
      ...state,
      anchors: newAnchors,
    };
  };

  // Handle ripple (creates multiple impulses)
  const handleRipple = (event: FieldEvent) => {
    const center = event.position || randomUv();
    // event.duration available for future animation timing
    const now = Date.now();

    // Create 3 expanding impulses
    const impulses: Impulse[] = [
      {
        id: `${event.id}-1`,
        uv: center,
        startTs: now,
        amplitude: event.intensity,
        radius: 0.08,
        color: event.color || "rose",
        source: event.source,
      },
      {
        id: `${event.id}-2`,
        uv: center,
        startTs: now + 200,
        amplitude: event.intensity * 0.7,
        radius: 0.12,
        color: event.color || "rose",
        source: event.source,
      },
      {
        id: `${event.id}-3`,
        uv: center,
        startTs: now + 400,
        amplitude: event.intensity * 0.5,
        radius: 0.16,
        color: event.color || "rose",
        source: event.source,
      },
    ];

    const newImpulses = [...state.impulses, ...impulses].slice(-config.maxImpulses);

    state = {
      ...state,
      impulses: newImpulses,
    };
  };

  // Handle tether (creates anchor pair + visual connection)
  const handleTether = (event: FieldEvent) => {
    // For now, just create an impulse along the tether path
    handleImpulse(event);
  };

  return {
    emit(event: FieldEvent) {
      switch (event.type) {
        case "impulse":
          handleImpulse(event);
          break;
        case "anchor_create":
          handleAnchorCreate(event);
          break;
        case "anchor_update":
          handleAnchorUpdate(event);
          break;
        case "anchor_remove":
          handleAnchorRemove(event);
          break;
        case "ripple":
          handleRipple(event);
          break;
        case "tether":
          handleTether(event);
          break;
      }
      notify();
    },

    emitBackbayEvent(params: {
      type: FieldEventType;
      source: FieldEventSource;
      entityId: string;
      color?: FieldColor;
      intensity?: number;
      duration?: number;
    }) {
      const event: FieldEvent = {
        id: generateId(),
        type: params.type,
        source: params.source,
        entityId: params.entityId,
        intensity: params.intensity ?? 0.8,
        color: params.color ?? "cyan",
        duration: params.duration,
      };
      this.emit(event);
    },

    subscribe(listener: FieldBusListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getSnapshot() {
      return state;
    },

    getServerSnapshot() {
      return createInitialState();
    },

    setConfig(newConfig: Partial<FieldConfig>) {
      config = { ...config, ...newConfig };
    },

    getConfig() {
      return config;
    },

    tick(_deltaMs: number, currentTs: number) {
      // Decay impulses
      const decayThreshold = config.impulseDecayMs;
      const activeImpulses = state.impulses.filter(
        (imp) => currentTs - imp.startTs < decayThreshold
      );

      // Only update if something changed
      if (activeImpulses.length !== state.impulses.length) {
        state = {
          ...state,
          impulses: activeImpulses,
          frame: state.frame + 1,
        };
        notify();
      } else {
        state = {
          ...state,
          frame: state.frame + 1,
        };
      }
    },

    clear() {
      state = createInitialState();
      notify();
    },

    processPendingWithUv(
      _computeUv: (clientX: number, clientY: number) => UVPosition | null
    ) {
      const pending = state.pendingEvents;
      if (pending.length === 0) return;

      // Process and clear pending events
      state = {
        ...state,
        pendingEvents: [],
      };

      notify();
    },
  };
}

// -----------------------------------------------------------------------------
// Singleton Instance
// -----------------------------------------------------------------------------

let globalBus: BackbayFieldBus | null = null;

export function getGlobalFieldBus(): BackbayFieldBus {
  if (!globalBus) {
    globalBus = createBackbayFieldBus();
  }
  return globalBus;
}
