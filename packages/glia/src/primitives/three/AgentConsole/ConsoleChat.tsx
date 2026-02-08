"use client";

/**
 * ConsoleChat - 3D-positioned chat interface
 *
 * HTML overlay for message display and input, positioned in 3D space
 * using @react-three/drei's Html component.
 */

import * as React from "react";
import { Html } from "@react-three/drei";
import type { ConsoleChatProps, Message, EntityRef } from "./types";

// -----------------------------------------------------------------------------
// Message Bubble
// -----------------------------------------------------------------------------

interface MessageBubbleProps {
  message: Message;
  onEntityClick?: (ref: EntityRef) => void;
}

function MessageBubble({ message, onEntityClick }: MessageBubbleProps) {
  const isAgent = message.role === "agent";
  const isSystem = message.role === "system";

  return (
    <div
      className={`
        max-w-[85%] px-3 py-2 rounded-lg text-sm font-mono
        ${isAgent
          ? "bg-cyan-500/10 text-cyan-50 self-start border border-cyan-500/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
          : isSystem
            ? "bg-amber-500/10 text-amber-100 self-center border border-amber-500/[0.12] text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
            : "bg-white/[0.06] text-white/90 self-end border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
        }
      `}
    >
      {/* Role indicator */}
      <div className={`text-xs mb-1 uppercase tracking-wider ${isAgent ? "text-cyan-400" : isSystem ? "text-amber-400" : "text-white/50"}`}>
        {message.role.toUpperCase()}
      </div>

      {/* Content */}
      <div className="whitespace-pre-wrap break-words">
        {message.content}
      </div>

      {/* Entity references */}
      {message.entityRefs && message.entityRefs.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {message.entityRefs.map((ref) => (
            <button
              key={`${ref.type}-${ref.id}`}
              onClick={() => onEntityClick?.(ref)}
              className={`
                px-2 py-0.5 rounded text-xs font-mono transition-colors
                ${ref.type === "job"
                  ? "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                  : ref.type === "node"
                    ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                    : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                }
              `}
            >
              {ref.type}:{ref.id.slice(0, 6)}
            </button>
          ))}
        </div>
      )}

      {/* Tool calls */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="mt-2 space-y-1">
          {message.toolCalls.map((tool) => (
            <div
              key={tool.id}
              className={`
                px-2 py-1 rounded text-xs font-mono
                ${tool.status === "completed"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : tool.status === "failed"
                    ? "bg-red-500/20 text-red-300"
                    : tool.status === "running"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-white/10 text-white/50"
                }
              `}
            >
              <span className="opacity-60">→</span> {tool.name}
              <span className="ml-2 opacity-60">
                [{tool.status}]
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Typing Indicator
// -----------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-cyan-500/10 rounded-lg self-start border border-cyan-500/[0.12]">
      <div className="text-xs text-cyan-400 mr-2 uppercase tracking-wider">AGENT</div>
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Chat Input
// -----------------------------------------------------------------------------

interface ChatInputProps {
  placeholder: string;
  onSubmit: (text: string) => void;
}

function ChatInput({ placeholder, onSubmit }: ChatInputProps) {
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setValue("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="
          flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg
          text-white text-sm font-mono placeholder:text-white/30
          focus:outline-none focus:border-cyan-500/40 focus:shadow-[0_0_12px_rgba(34,211,238,0.15)]
          transition-colors
        "
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="
          px-4 py-2 bg-cyan-500/15 border border-cyan-500/20 rounded-lg
          text-cyan-200 text-sm font-mono uppercase tracking-wider
          hover:bg-cyan-500/25 hover:shadow-[0_0_12px_rgba(34,211,238,0.2)]
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-all
        "
      >
        Send
      </button>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Console Chat Container
// -----------------------------------------------------------------------------

export function ConsoleChat({
  messages,
  isTyping = false,
  placeholder = "Type a message...",
  onSubmit,
  onEntityClick,
  maxVisibleMessages = 10,
  position = [0, -1.5, 0],
}: ConsoleChatProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const visibleMessages = messages.slice(-maxVisibleMessages);

  return (
    <Html
      position={position}
      center
      transform
      occlude={false}
      style={{
        pointerEvents: "auto",
        width: "320px",
      }}
    >
      <div className="bg-[rgba(2,4,10,0.85)] backdrop-blur-xl rounded-lg border border-white/[0.06] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        {/* Messages container */}
        <div
          ref={scrollRef}
          className="flex flex-col gap-2 p-3 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20"
        >
          {visibleMessages.length === 0 && (
            <div className="text-white/30 text-xs font-mono text-center py-4">
              No messages yet
            </div>
          )}

          {visibleMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onEntityClick={onEntityClick}
            />
          ))}

          {isTyping && <TypingIndicator />}
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.06] p-3">
          <ChatInput placeholder={placeholder} onSubmit={onSubmit} />
        </div>
      </div>
    </Html>
  );
}
