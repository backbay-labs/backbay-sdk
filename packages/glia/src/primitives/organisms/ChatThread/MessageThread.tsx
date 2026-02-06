"use client";

/**
 * MessageThread — Scrollable container for a list of chat messages.
 *
 * Automatically scrolls to bottom when new messages arrive.
 *
 * @example
 * <MessageThread
 *   messages={messages}
 *   onScrollToTop={() => loadMore()}
 * />
 */

import * as React from "react";
import { cn } from "../../../lib/utils";
import { useColorTokens, useGlassTokens } from "../../../theme/UiThemeProvider";
import { ChatBubble } from "./ChatBubble";
import type { ChatMessage } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface MessageThreadProps {
  /** Array of messages to display */
  messages: ChatMessage[];
  /** Called when user scrolls to top (for loading history) */
  onScrollToTop?: () => void;
  /** Whether more messages are being loaded */
  isLoadingMore?: boolean;
  /** Auto-scroll to bottom on new messages. Default: true */
  autoScroll?: boolean;
  /** Custom render for text content (passed to ChatBubble) */
  renderText?: (text: string) => React.ReactNode;
  /** Show avatars. Default: true */
  showAvatars?: boolean;
  /** Show timestamps. Default: false */
  showTimestamps?: boolean;
  /** Disable animations */
  disableAnimations?: boolean;
  /** Additional className for the scroll container */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

// ============================================================================
// LOADING SPINNER
// ============================================================================

function LoadingSpinner({ color }: { color: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "12px 0",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="animate-spin"
      >
        <circle
          cx="10"
          cy="10"
          r="8"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="40"
          strokeDashoffset="10"
          opacity={0.6}
        />
      </svg>
    </div>
  );
}

// ============================================================================
// SCROLL-TO-TOP DETECTION THRESHOLD (px)
// ============================================================================

const SCROLL_TOP_THRESHOLD = 32;

// ============================================================================
// COMPONENT
// ============================================================================

export const MessageThread = React.forwardRef<HTMLDivElement, MessageThreadProps>(
  function MessageThread(
    {
      messages,
      onScrollToTop,
      isLoadingMore = false,
      autoScroll = true,
      renderText,
      showAvatars = true,
      showTimestamps = false,
      disableAnimations = false,
      className,
      style,
    },
    ref
  ) {
    const colors = useColorTokens();
    const glass = useGlassTokens();
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const bottomRef = React.useRef<HTMLDivElement>(null);
    const userHasScrolledUp = React.useRef(false);

    // Expose the scroll container via forwarded ref
    React.useImperativeHandle(ref, () => scrollRef.current!);

    // Auto-scroll to bottom when messages change
    React.useEffect(() => {
      if (!autoScroll || userHasScrolledUp.current) return;

      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }, [messages.length, autoScroll]);

    // Handle scroll events
    const handleScroll = React.useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;

      // Detect if user scrolled to top
      if (el.scrollTop <= SCROLL_TOP_THRESHOLD && onScrollToTop) {
        onScrollToTop();
      }

      // Track if user has scrolled away from bottom
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      userHasScrolledUp.current = distanceFromBottom > 80;
    }, [onScrollToTop]);

    return (
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn("flex-1 min-h-0", className)}
        style={{
          overflowY: "auto",
          padding: "16px 16px 8px",
          // Styled scrollbar
          scrollbarWidth: "thin",
          scrollbarColor: `${glass.cardBorder} transparent`,
          ...style,
        }}
      >
        {/* Loading spinner at top */}
        {isLoadingMore && <LoadingSpinner color={colors.text.soft} />}

        {/* Messages */}
        {messages.map((message, i) => {
          const prevMessage = i > 0 ? messages[i - 1] : null;
          const sameRole = prevMessage?.role === message.role;

          return (
            <div
              key={message.id}
              style={{
                marginTop: i === 0 ? 0 : sameRole ? 12 : 20,
              }}
            >
              <ChatBubble
                message={message}
                showAvatar={showAvatars && !sameRole}
                showTimestamp={showTimestamps}
                renderText={renderText}
                disableAnimations={disableAnimations}
              />
            </div>
          );
        })}

        {/* Scroll anchor */}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>
    );
  }
);

MessageThread.displayName = "MessageThread";
