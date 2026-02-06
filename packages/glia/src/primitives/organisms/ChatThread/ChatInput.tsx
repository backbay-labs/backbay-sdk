"use client";

/**
 * ChatInput — Composable text input for the chat interface.
 *
 * Features auto-resizing textarea, submit on Enter, and optional
 * toolbar for attachments/actions.
 */

import * as React from "react";
import { cn } from "../../../lib/utils";
import {
  useGlassTokens,
  useColorTokens,
} from "../../../theme/UiThemeProvider";

// ============================================================================
// TYPES
// ============================================================================

export interface ChatInputProps {
  /** Called when user submits a message */
  onSubmit: (text: string) => void;
  /** Placeholder text. Default: "Type a message..." */
  placeholder?: string;
  /** Whether input is disabled (e.g., while streaming) */
  disabled?: boolean;
  /** Whether to show the submit button. Default: true */
  showSubmitButton?: boolean;
  /** Maximum rows for auto-resize. Default: 5 */
  maxRows?: number;
  /** Additional className */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

// ============================================================================
// ICONS
// ============================================================================

function ArrowUpIcon({ color }: { color: string }) {
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
// COMPONENT
// ============================================================================

export const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput(
    {
      onSubmit,
      placeholder = "Type a message...",
      disabled = false,
      showSubmitButton = true,
      maxRows = 5,
      className,
      style,
    },
    ref
  ) {
    const glass = useGlassTokens();
    const colors = useColorTokens();
    const [value, setValue] = React.useState("");
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Expose ref
    React.useImperativeHandle(ref, () => textareaRef.current!);

    const isEmpty = value.trim().length === 0;

    // Auto-resize textarea
    const adjustHeight = React.useCallback(() => {
      const el = textareaRef.current;
      if (!el) return;

      el.style.height = "auto";

      // Compute single-row height from lineHeight (approx 20px)
      const lineHeight = 20;
      const maxHeight = lineHeight * maxRows + 16; // +padding
      const newHeight = Math.min(el.scrollHeight, maxHeight);

      el.style.height = `${newHeight}px`;
    }, [maxRows]);

    React.useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    const handleSubmit = React.useCallback(() => {
      const trimmed = value.trim();
      if (!trimmed || disabled) return;

      onSubmit(trimmed);
      setValue("");

      // Reset height after clearing
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.style.height = "auto";
        }
      });
    }, [value, disabled, onSubmit]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      },
      [handleSubmit]
    );

    return (
      <div
        className={cn("flex items-end gap-2", className)}
        style={{
          background: glass.cardBg,
          border: `1px solid ${glass.cardBorder}`,
          borderRadius: 12,
          padding: "8px 12px",
          ...style,
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            color: colors.text.primary,
            fontSize: 14,
            fontFamily: "inherit",
            lineHeight: "20px",
            padding: "4px 0",
            minHeight: 28,
            opacity: disabled ? 0.5 : 1,
          }}
          className="placeholder:text-[var(--theme-text-soft,#64748B)]"
        />

        {showSubmitButton && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isEmpty || disabled}
            aria-label="Send message"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: isEmpty || disabled
                ? "transparent"
                : colors.accent.primary,
              border: `1px solid ${
                isEmpty || disabled ? glass.cardBorder : colors.accent.primary
              }`,
              cursor: isEmpty || disabled ? "default" : "pointer",
              flexShrink: 0,
              transition: "background 150ms ease, border-color 150ms ease",
              opacity: isEmpty || disabled ? 0.4 : 1,
            }}
          >
            <ArrowUpIcon
              color={
                isEmpty || disabled
                  ? colors.text.soft
                  : "#000000"
              }
            />
          </button>
        )}
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";
