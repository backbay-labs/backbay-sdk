"use client";

import * as React from "react";
import { cn, prefersReducedMotion } from "../../../lib/utils";
import { useColorTokens } from "../../../theme/UiThemeProvider";

// ============================================================================
// TYPES
// ============================================================================

export interface StreamingTextProps {
  /** The text content to stream/display */
  text: string;
  /** Streaming mode. Default: "character" */
  mode?: "character" | "word" | "instant";
  /** Speed in ms per token (character or word). Default: 30 */
  speed?: number;
  /** Show blinking cursor at end of text. Default: true while streaming */
  showCursor?: boolean;
  /** Cursor character. Default: "\u258B" (block cursor) */
  cursorChar?: string;
  /** Whether streaming is complete (hides cursor, shows full text). Default: false */
  isComplete?: boolean;
  /** Called when all text has been revealed */
  onComplete?: () => void;
  /** Disable animation (show all text instantly). Respects prefers-reduced-motion. */
  disableAnimations?: boolean;
  /** Additional className */
  className?: string;
  /** Render function for custom text wrapping (e.g., markdown rendering) */
  renderText?: (visibleText: string) => React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const StreamingText = React.forwardRef<HTMLSpanElement, StreamingTextProps>(
  function StreamingText(
    {
      text,
      mode = "character",
      speed = 30,
      showCursor: showCursorProp,
      cursorChar = "\u258B",
      isComplete = false,
      onComplete,
      disableAnimations = false,
      className,
      renderText,
    },
    ref
  ) {
    const colors = useColorTokens();

    const reducedMotion = prefersReducedMotion();
    const shouldAnimate = !disableAnimations && !reducedMotion && !isComplete;

    const [visibleLength, setVisibleLength] = React.useState(0);
    const prevTextRef = React.useRef(text);
    const hasCompletedRef = React.useRef(false);

    // Tokenize text based on mode
    const totalTokens = React.useMemo(() => {
      if (mode === "word") {
        return text.split(/(\s+)/).length;
      }
      return text.length;
    }, [text, mode]);

    // Reset if text completely changes (new message), but not if it just grew (streaming)
    React.useEffect(() => {
      if (text !== prevTextRef.current) {
        if (!text.startsWith(prevTextRef.current)) {
          // New text entirely -- reset
          setVisibleLength(0);
          hasCompletedRef.current = false;
        }
        prevTextRef.current = text;
      }
    }, [text]);

    // Animation interval
    React.useEffect(() => {
      if (!shouldAnimate || visibleLength >= totalTokens) return;

      const interval = setInterval(() => {
        setVisibleLength((prev) => {
          const next = prev + 1;
          if (next >= totalTokens) {
            clearInterval(interval);
          }
          return Math.min(next, totalTokens);
        });
      }, speed);

      return () => clearInterval(interval);
    }, [shouldAnimate, speed, totalTokens, visibleLength]);

    // Skip animation when it should not animate
    React.useEffect(() => {
      if (!shouldAnimate) {
        setVisibleLength(totalTokens);
      }
    }, [shouldAnimate, totalTokens]);

    // Completion callback
    React.useEffect(() => {
      if (visibleLength >= totalTokens && !hasCompletedRef.current && totalTokens > 0) {
        hasCompletedRef.current = true;
        onComplete?.();
      }
    }, [visibleLength, totalTokens, onComplete]);

    // Compute visible text
    const visibleText = React.useMemo(() => {
      if (mode === "word") {
        const tokens = text.split(/(\s+)/);
        return tokens.slice(0, visibleLength).join("");
      }
      return text.slice(0, visibleLength);
    }, [mode, visibleLength, text]);

    const isStreaming = visibleLength < totalTokens && shouldAnimate;
    const cursorVisible = showCursorProp ?? isStreaming;

    const content = renderText ? renderText(visibleText) : visibleText;

    return (
      <span ref={ref} className={cn("inline", className)}>
        {content}
        {cursorVisible && (
          <span
            className="animate-pulse"
            aria-hidden="true"
            style={{
              display: "inline-block",
              marginLeft: "1px",
              color: colors.accent.primary,
            }}
          >
            {cursorChar}
          </span>
        )}
      </span>
    );
  }
);

StreamingText.displayName = "StreamingText";
