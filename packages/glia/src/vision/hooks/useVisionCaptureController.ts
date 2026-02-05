import * as React from "react";

export type VisionCaptureMode = "manual" | "interval" | "topology";

export interface VisionCaptureControllerOptions {
  capture: () => Promise<void>;
  ready?: boolean;
  topology?: unknown;
  initialMode?: VisionCaptureMode;
  initialIntervalMs?: number;
  minIntervalMs?: number;
}

export interface VisionCaptureControllerState {
  mode: VisionCaptureMode;
  setMode: React.Dispatch<React.SetStateAction<VisionCaptureMode>>;
  intervalMs: number;
  setIntervalMs: React.Dispatch<React.SetStateAction<number>>;
  busy: boolean;
  captureNow: () => Promise<void>;
  requestCapture: () => void;
}

export function useVisionCaptureController(
  options: VisionCaptureControllerOptions
): VisionCaptureControllerState {
  const {
    capture,
    ready = true,
    topology,
    initialMode = "manual",
    initialIntervalMs = 2000,
    minIntervalMs = 500,
  } = options;

  const [mode, setMode] = React.useState<VisionCaptureMode>(initialMode);
  const [intervalMs, setIntervalMs] = React.useState(initialIntervalMs);
  const [busy, setBusy] = React.useState(false);
  const busyRef = React.useRef(false);
  const lastCaptureRef = React.useRef(0);

  const captureNow = React.useCallback(async () => {
    if (!ready || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await capture();
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }, [capture, ready]);

  const requestCapture = React.useCallback(() => {
    if (!ready || busyRef.current) return;
    const now = Date.now();
    if (now - lastCaptureRef.current < minIntervalMs) return;
    lastCaptureRef.current = now;
    void captureNow();
  }, [ready, captureNow, minIntervalMs]);

  React.useEffect(() => {
    if (!ready || mode !== "interval") return;
    const intervalId = window.setInterval(() => {
      requestCapture();
    }, Math.max(minIntervalMs, intervalMs));
    return () => window.clearInterval(intervalId);
  }, [mode, intervalMs, ready, requestCapture, minIntervalMs]);

  React.useEffect(() => {
    if (!ready || mode !== "topology") return;
    if (!topology) return;
    requestCapture();
  }, [mode, topology, ready, requestCapture]);

  return {
    mode,
    setMode,
    intervalMs,
    setIntervalMs,
    busy,
    captureNow,
    requestCapture,
  };
}
