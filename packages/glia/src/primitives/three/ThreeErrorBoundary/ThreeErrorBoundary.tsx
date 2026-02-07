"use client";

import React, { Component, type ReactNode, type ErrorInfo } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface ThreeErrorFallbackProps {
  error: Error;
  reset: () => void;
  isContextLost: boolean;
}

export interface ThreeErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI. Receives error + reset + context-loss info. */
  fallback?: ReactNode | ((props: ThreeErrorFallbackProps) => ReactNode);
  /** Called when a React error is caught. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Called when WebGL context is lost. */
  onContextLost?: () => void;
}

interface ThreeErrorBoundaryState {
  error: Error | null;
  isContextLost: boolean;
}

// ============================================================================
// DEFAULT FALLBACK (glass-themed, 2D)
// ============================================================================

function DefaultThreeFallback({
  error,
  reset,
  isContextLost,
}: ThreeErrorFallbackProps) {
  const title = isContextLost ? "WebGL context lost" : "3D rendering failed";
  const message = isContextLost
    ? "The GPU context was lost. This can happen when the system is under heavy load."
    : error.message;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: 200,
        padding: 24,
        gap: 16,
        background: "rgba(20, 20, 30, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 12,
        color: "rgba(255, 255, 255, 0.9)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 3D cube icon */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255, 100, 100, 0.9)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          {title}
        </div>
        <div
          style={{
            color: "rgba(255, 255, 255, 0.45)",
            fontSize: 12,
            lineHeight: 1.4,
            maxWidth: 280,
            wordBreak: "break-word",
          }}
        >
          {message}
        </div>
      </div>
      <button
        onClick={reset}
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 8,
          padding: "8px 16px",
          color: "rgba(255, 255, 255, 0.9)",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(255, 255, 255, 0.14)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(255, 255, 255, 0.08)";
        }}
      >
        Try again
      </button>
    </div>
  );
}

// ============================================================================
// THREE ERROR BOUNDARY (class component)
// ============================================================================

export class ThreeErrorBoundary extends Component<
  ThreeErrorBoundaryProps,
  ThreeErrorBoundaryState
> {
  static displayName = "ThreeErrorBoundary";
  private observer: MutationObserver | null = null;
  private containerRef: HTMLDivElement | null = null;

  constructor(props: ThreeErrorBoundaryProps) {
    super(props);
    this.state = { error: null, isContextLost: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ThreeErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  componentDidMount(): void {
    this.attachContextLostListener();
  }

  componentDidUpdate(): void {
    // Re-attach if a new canvas appears after a reset
    if (!this.state.error && !this.state.isContextLost) {
      this.attachContextLostListener();
    }
  }

  componentWillUnmount(): void {
    this.detachContextLostListener();
  }

  private handleContextLost = (event: Event) => {
    event.preventDefault();
    this.props.onContextLost?.();
    this.setState({
      error: new Error("WebGL context lost"),
      isContextLost: true,
    });
  };

  private attachContextLostListener() {
    this.detachContextLostListener();
    if (!this.containerRef) return;
    const canvas = this.containerRef.querySelector("canvas");
    if (canvas) {
      canvas.addEventListener("webglcontextlost", this.handleContextLost);
    }
    // Watch for canvas being added dynamically (R3F creates it async)
    this.observer = new MutationObserver(() => {
      const c = this.containerRef?.querySelector("canvas");
      if (c) {
        c.addEventListener("webglcontextlost", this.handleContextLost);
        this.observer?.disconnect();
        this.observer = null;
      }
    });
    this.observer.observe(this.containerRef, { childList: true, subtree: true });
  }

  private detachContextLostListener() {
    this.observer?.disconnect();
    this.observer = null;
    if (this.containerRef) {
      const canvas = this.containerRef.querySelector("canvas");
      canvas?.removeEventListener("webglcontextlost", this.handleContextLost);
    }
  }

  reset = () => {
    this.setState({ error: null, isContextLost: false });
  };

  render() {
    const { error, isContextLost } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (typeof fallback === "function") {
        return fallback({ error, reset: this.reset, isContextLost });
      }
      if (fallback !== undefined) {
        return fallback;
      }
      return (
        <DefaultThreeFallback
          error={error}
          reset={this.reset}
          isContextLost={isContextLost}
        />
      );
    }

    return (
      <div
        ref={(el) => {
          this.containerRef = el;
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {children}
      </div>
    );
  }
}
