"use client";

/**
 * ChatBubble — Renders a single chat message with role-based styling.
 *
 * Supports text, code blocks, and tool calls within a single message.
 * Uses StreamingText for messages that are currently streaming.
 *
 * @example
 * <ChatBubble
 *   message={{
 *     id: '1',
 *     role: 'assistant',
 *     content: [{ type: 'text', text: 'Hello!' }],
 *   }}
 * />
 */

import * as React from "react";
import { cn } from "../../../lib/utils";
import {
  useGlassTokens,
  useColorTokens,
} from "../../../theme/UiThemeProvider";
import { StreamingText } from "../../atoms/StreamingText";
import { CodeBlock } from "../../atoms/CodeBlock";
import { ToolCallCard } from "../../molecules/ToolCallCard";
import type { ChatMessage, MessageContentPart } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface ChatBubbleProps {
  /** The message to render */
  message: ChatMessage;
  /** Whether to show the avatar. Default: true */
  showAvatar?: boolean;
  /** Whether to show the timestamp. Default: false */
  showTimestamp?: boolean;
  /** Whether to show the sender name. Default: true for non-user messages */
  showSenderName?: boolean;
  /** Custom render for text content (e.g., markdown renderer) */
  renderText?: (text: string) => React.ReactNode;
  /** Disable animations */
  disableAnimations?: boolean;
  /** Additional className */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

// ============================================================================
// ICONS (inline SVG, 16x16)
// ============================================================================

function SendIcon({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M8 12V4M8 4L4 8M8 4l4 4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

const DEFAULT_AVATARS: Record<string, string> = {
  user: "\u{1F464}",
  assistant: "\u{1F916}",
  system: "\u2699\uFE0F",
  tool: "\u26A1",
};

function formatTimestamp(timestamp: string | Date): string {
  const date =
    typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  // Fallback to HH:MM
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// AVATAR
// ============================================================================

function Avatar({
  avatar,
  role,
  bgColor,
  textColor,
}: {
  avatar?: string;
  role: string;
  bgColor: string;
  textColor: string;
}) {
  const isUrl = avatar?.startsWith("http");
  const display = avatar ?? DEFAULT_AVATARS[role] ?? DEFAULT_AVATARS.assistant;

  if (isUrl) {
    return (
      <img
        src={avatar}
        alt={`${role} avatar`}
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: display.length <= 2 ? 14 : 12,
        color: textColor,
        fontFamily: "monospace",
        userSelect: "none",
      }}
    >
      {display}
    </div>
  );
}

// ============================================================================
// CONTENT PART RENDERER
// ============================================================================

function ContentPart({
  part,
  isStreaming,
  isLastTextPart,
  renderText,
  disableAnimations,
}: {
  part: MessageContentPart;
  isStreaming: boolean;
  isLastTextPart: boolean;
  renderText?: (text: string) => React.ReactNode;
  disableAnimations: boolean;
}) {
  switch (part.type) {
    case "text": {
      // If this message is streaming and this is the last text part, animate
      if (isStreaming && isLastTextPart) {
        return (
          <StreamingText
            text={part.text}
            mode="character"
            speed={20}
            disableAnimations={disableAnimations}
            renderText={renderText}
          />
        );
      }

      if (renderText) {
        return <>{renderText(part.text)}</>;
      }

      return (
        <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {part.text}
        </span>
      );
    }

    case "code": {
      return (
        <CodeBlock
          language={part.code.language}
          code={part.code.code}
          title={part.code.title}
          showCopyButton
        />
      );
    }

    case "tool_call": {
      const tc = part.toolCall;
      return (
        <ToolCallCard
          id={tc.id}
          name={tc.name}
          args={tc.args}
          status={tc.status}
          result={tc.result}
          error={tc.error}
          duration={tc.duration}
          disableAnimations={disableAnimations}
        />
      );
    }
  }
}

// ============================================================================
// SYSTEM MESSAGE
// ============================================================================

function SystemMessage({
  message,
  textColor,
  borderColor,
  renderText,
}: {
  message: ChatMessage;
  textColor: string;
  borderColor: string;
  renderText?: (text: string) => React.ReactNode;
}) {
  const textParts = message.content.filter((p) => p.type === "text");
  const text = textParts.map((p) => (p as { type: "text"; text: string }).text).join(" ");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "8px 0",
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          background: borderColor,
        }}
      />
      <span
        style={{
          color: textColor,
          fontSize: 12,
          fontFamily: "monospace",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}
      >
        {message.senderName ?? "System"}: {renderText ? renderText(text) : text}
      </span>
      <div
        style={{
          flex: 1,
          height: 1,
          background: borderColor,
        }}
      />
    </div>
  );
}

// ============================================================================
// CHAT BUBBLE
// ============================================================================

export const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  function ChatBubble(
    {
      message,
      showAvatar = true,
      showTimestamp = false,
      showSenderName: showSenderNameProp,
      renderText,
      disableAnimations = false,
      className,
      style,
    },
    ref
  ) {
    const glass = useGlassTokens();
    const colors = useColorTokens();

    const { role, content, isStreaming, avatar, senderName, timestamp } =
      message;

    // Default: show sender name for non-user messages
    const showSenderName = showSenderNameProp ?? role !== "user";

    // ---- System messages render differently ----
    if (role === "system") {
      return (
        <div ref={ref} className={className} style={style}>
          <SystemMessage
            message={message}
            textColor={colors.text.soft}
            borderColor={glass.cardBorder}
            renderText={renderText}
          />
        </div>
      );
    }

    // ---- Determine alignment and styling ----
    const isUser = role === "user";

    const bubbleBg = isUser
      ? `${colors.accent.primary}14` // rgba(accent, ~8%)
      : glass.cardBg;

    const bubbleBorder = isUser
      ? `${colors.accent.primary}33` // rgba(accent, ~20%)
      : glass.cardBorder;

    // Find last text part index for streaming cursor placement
    let lastTextPartIndex = -1;
    for (let i = content.length - 1; i >= 0; i--) {
      if (content[i].type === "text") {
        lastTextPartIndex = i;
        break;
      }
    }

    // ---- Default display name ----
    const displayName =
      senderName ??
      (role === "assistant"
        ? "Assistant"
        : role === "tool"
          ? "Tool"
          : undefined);

    return (
      <div
        ref={ref}
        className={cn("flex gap-2.5", className)}
        style={{
          flexDirection: isUser ? "row-reverse" : "row",
          alignItems: "flex-start",
          ...style,
        }}
      >
        {/* Avatar */}
        {showAvatar && !isUser && (
          <Avatar
            avatar={avatar}
            role={role}
            bgColor={glass.cardBg}
            textColor={colors.text.muted}
          />
        )}

        {/* Bubble container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            maxWidth: "85%",
            minWidth: 0,
            alignItems: isUser ? "flex-end" : "flex-start",
          }}
        >
          {/* Sender name */}
          {showSenderName && displayName && (
            <span
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                color: colors.text.soft,
                paddingLeft: isUser ? 0 : 2,
                paddingRight: isUser ? 2 : 0,
              }}
            >
              {displayName}
            </span>
          )}

          {/* Message bubble */}
          <div
            style={{
              background: bubbleBg,
              border: `1px solid ${bubbleBorder}`,
              borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 0,
            }}
          >
            {content.map((part, i) => (
              <ContentPart
                key={i}
                part={part}
                isStreaming={!!isStreaming}
                isLastTextPart={i === lastTextPartIndex}
                renderText={renderText}
                disableAnimations={disableAnimations}
              />
            ))}
          </div>

          {/* Timestamp */}
          {showTimestamp && timestamp && (
            <span
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                color: colors.text.soft,
                paddingLeft: isUser ? 0 : 2,
                paddingRight: isUser ? 2 : 0,
              }}
            >
              {formatTimestamp(timestamp)}
            </span>
          )}
        </div>
      </div>
    );
  }
);

ChatBubble.displayName = "ChatBubble";
