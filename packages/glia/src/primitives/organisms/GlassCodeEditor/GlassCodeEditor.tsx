"use client";

import { cn } from "../../../lib/utils";
import React from "react";
import { Check, Copy, FileCode } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface GlassCodeEditorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Code string to display */
  code: string;
  /** Language label */
  language?: string;
  /** Filename shown in header */
  filename?: string;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Show copy button */
  showCopy?: boolean;
  /** Max height with scroll */
  maxHeight?: string | number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GlassCodeEditor({
  code,
  language,
  filename,
  showLineNumbers = true,
  showCopy = true,
  maxHeight,
  className,
  ...props
}: GlassCodeEditorProps) {
  const [copied, setCopied] = React.useState(false);

  const lines = code.split("\n");

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [code]);

  const showHeader = filename || language || showCopy;

  return (
    <div
      className={cn("overflow-hidden rounded-xl", className)}
      style={{
        background: "rgba(2,4,10,0.85)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
      {...props}
    >
      {/* Header */}
      {showHeader && (
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{
            background: "rgba(2,4,10,0.5)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2">
            <FileCode className="h-3.5 w-3.5 text-[var(--glia-color-text-soft,#64748B)]" />
            {filename && (
              <span className="font-mono text-[11px] text-[var(--glia-color-text-primary,#CBD5E1)]">
                {filename}
              </span>
            )}
            {language && (
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]"
                style={{
                  background: "rgba(139,92,246,0.15)",
                  color: "rgb(167,139,250)",
                  border: "1px solid rgba(139,92,246,0.3)",
                }}
              >
                {language}
              </span>
            )}
          </div>
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-mono uppercase tracking-[0.12em] transition-colors hover:bg-white/5"
              style={{ color: copied ? "rgb(52,211,153)" : "var(--glia-color-text-soft, #64748B)" }}
              aria-label={copied ? "Copied" : "Copy code"}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      )}

      {/* Code area */}
      <div
        className="overflow-auto"
        style={{ maxHeight: maxHeight ?? undefined }}
      >
        <pre className="p-4 text-sm leading-relaxed">
          <code className="font-mono">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                {showLineNumbers && (
                  <span
                    className="mr-4 inline-block w-8 shrink-0 select-none text-right font-mono text-xs"
                    style={{ color: "var(--glia-color-text-soft, #64748B)", opacity: 0.5 }}
                  >
                    {i + 1}
                  </span>
                )}
                <span className="text-[var(--glia-color-text-primary,#CBD5E1)]">
                  {line || "\u00A0"}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
