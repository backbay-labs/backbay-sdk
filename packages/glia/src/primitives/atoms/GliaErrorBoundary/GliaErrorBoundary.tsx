"use client";

import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { ErrorThrower } from "./useErrorBoundary";

// ============================================================================
// TYPES
// ============================================================================

export interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export interface GliaErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI. Receives error + reset function. */
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode);
  /** Called when an error is caught. Use for telemetry/logging. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Auto-retry after this many ms (0 = no auto-retry) */
  autoRetryMs?: number;
  /** Glass-themed fallback styling */
  variant?: "inline" | "card" | "fullscreen";
}

interface GliaErrorBoundaryState {
  error: Error | null;
}

// ============================================================================
// DEFAULT FALLBACK (glass-themed)
// ============================================================================

function DefaultFallback({
  error,
  reset,
  variant = "card",
}: ErrorFallbackProps & { variant?: "inline" | "card" | "fullscreen" }) {
  const isFullscreen = variant === "fullscreen";
  const isInline = variant === "inline";

  const containerStyle: React.CSSProperties = isFullscreen
    ? {
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }
    : isInline
      ? {
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 8px",
          borderRadius: 6,
          background: "rgba(255, 60, 60, 0.08)",
          border: "1px solid rgba(255, 60, 60, 0.2)",
        }
      : {};

  const cardStyle: React.CSSProperties = {
    background: "rgba(20, 20, 30, 0.85)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: isInline ? undefined : "24px 28px",
    maxWidth: isFullscreen ? 480 : "100%",
    width: isFullscreen ? "90%" : undefined,
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  if (isInline) {
    return (
      <span style={containerStyle}>
        <span style={{ color: "rgba(255, 100, 100, 0.9)", fontSize: 12 }}>
          Error: {error.message}
        </span>
        <button
          onClick={reset}
          style={{
            background: "none",
            border: "none",
            color: "rgba(100, 180, 255, 0.9)",
            cursor: "pointer",
            fontSize: 12,
            textDecoration: "underline",
            padding: 0,
          }}
        >
          Retry
        </button>
      </span>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 100, 100, 0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Something went wrong</span>
        </div>
        <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 13, lineHeight: 1.5, margin: "0 0 16px", wordBreak: "break-word" }}>
          {error.message}
        </p>
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
            (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.14)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.08)";
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR BOUNDARY (class component)
// ============================================================================

export class GliaErrorBoundary extends Component<GliaErrorBoundaryProps, GliaErrorBoundaryState> {
  static displayName = "GliaErrorBoundary";
  private autoRetryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: GliaErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): GliaErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);

    if (this.props.autoRetryMs && this.props.autoRetryMs > 0) {
      this.autoRetryTimer = setTimeout(() => {
        this.reset();
      }, this.props.autoRetryMs);
    }
  }

  componentWillUnmount(): void {
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
    }
  }

  reset = () => {
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
      this.autoRetryTimer = null;
    }
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback, variant = "card" } = this.props;

    if (error) {
      if (typeof fallback === "function") {
        return fallback({ error, reset: this.reset });
      }
      if (fallback !== undefined) {
        return fallback;
      }
      return <DefaultFallback error={error} reset={this.reset} variant={variant} />;
    }

    return <ErrorThrower>{children}</ErrorThrower>;
  }
}
