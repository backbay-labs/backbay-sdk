"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";
import { useGlassTokens, useColorTokens } from "../../../theme/UiThemeProvider";

// ============================================================================
// TYPES
// ============================================================================

export interface CodeBlockProps {
  /** The code string to display */
  code: string;
  /** Programming language for syntax highlighting. Default: "text" */
  language?: string;
  /** Title/filename to show in header. If set, shows a header bar. */
  title?: string;
  /** Show line numbers. Default: false */
  showLineNumbers?: boolean;
  /** Show copy-to-clipboard button. Default: true */
  showCopyButton?: boolean;
  /** Highlight specific line numbers (1-indexed) */
  highlightLines?: number[];
  /** Maximum height before scrolling */
  maxHeight?: number | string;
  /** Whether to wrap long lines. Default: false */
  wordWrap?: boolean;
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

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="5" y="5" width="9" height="9" rx="1.5" />
    <path d="M5 11H3.5A1.5 1.5 0 012 9.5V3.5A1.5 1.5 0 013.5 2h6A1.5 1.5 0 0111 3.5V5" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ============================================================================
// SHIKI HOOK
// ============================================================================

function useHighlightedCode(code: string, language: string) {
  const [html, setHtml] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const shiki = await import("shiki");
        const result = await shiki.codeToHtml(code, {
          lang: language,
          theme: "github-dark",
        });
        if (!cancelled) setHtml(result);
      } catch {
        // shiki not available or language not supported
      }
    })();
    return () => { cancelled = true; };
  }, [code, language]);

  return html;
}

// ============================================================================
// LINE ROW (shared between fallback and shiki overlay)
// ============================================================================

type ColorTokens = ReturnType<typeof useColorTokens>;

function LineGutter({ lineNum, colorTokens }: { lineNum: number; colorTokens: ColorTokens }) {
  return (
    <span
      className="inline-block text-right select-none shrink-0 pr-4 pl-4"
      style={{
        width: "3.5rem",
        color: colorTokens.text.soft,
        fontSize: 12,
        fontFamily: "monospace",
        borderRight: `1px solid ${colorTokens.text.soft}22`,
      }}
    >
      {lineNum}
    </span>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  function CodeBlock(
    {
      code,
      language = "text",
      title,
      showLineNumbers = false,
      showCopyButton = true,
      highlightLines,
      maxHeight,
      wordWrap = false,
      className,
      style,
    },
    ref
  ) {
    const glassTokens = useGlassTokens();
    const colorTokens = useColorTokens();
    const [copied, setCopied] = React.useState(false);

    const highlightedHtml = useHighlightedCode(code, language);
    const lines = code.split("\n");
    const highlightSet = React.useMemo(() => new Set(highlightLines), [highlightLines]);

    const handleCopy = React.useCallback(async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* clipboard API unavailable */ }
    }, [code]);

    const showHeader = title || showCopyButton;
    const wrapCls = wordWrap ? "[&_pre]:whitespace-pre-wrap [&_pre]:break-words" : "";
    const maxHPx = maxHeight != null
      ? typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight
      : undefined;

    return (
      <div
        ref={ref}
        className={cn("relative rounded-lg overflow-hidden", className)}
        style={{
          background: glassTokens.cardBg,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: glassTokens.cardBorder,
          ...style,
        }}
      >
        {/* Header */}
        {showHeader && (
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{ background: glassTokens.headerGradient, borderColor: glassTokens.cardBorder }}
          >
            <span
              className="text-xs font-mono truncate"
              style={{ color: title ? colorTokens.text.muted : "transparent" }}
            >
              {title || "\u00A0"}
            </span>
            {showCopyButton && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-mono transition-colors duration-150 ml-4 shrink-0"
                style={{ color: copied ? colorTokens.accent.primary : colorTokens.text.soft }}
                aria-label={copied ? "Copied" : "Copy code"}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>
        )}

        {/* Code area */}
        <div style={{ maxHeight: maxHPx, overflow: "auto" }}>
          {highlightedHtml && !showLineNumbers && highlightSet.size === 0 ? (
            <div
              className={cn("p-4 text-[13px]", wrapCls)}
              style={{ overflowX: wordWrap ? undefined : "auto" }}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          ) : highlightedHtml ? (
            <div className="relative">
              <div
                className={cn("p-4 text-[13px]", showLineNumbers && "pl-[4.5rem]", wrapCls)}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
              <ShikiLineOverlay
                lines={lines}
                showLineNumbers={showLineNumbers}
                highlightSet={highlightSet}
                colorTokens={colorTokens}
              />
            </div>
          ) : (
            <FallbackRenderer
              code={code}
              lines={lines}
              showLineNumbers={showLineNumbers}
              highlightSet={highlightSet}
              wordWrap={wordWrap}
              colorTokens={colorTokens}
            />
          )}
        </div>

        {/* Language badge */}
        {language && language !== "text" && (
          <span
            className="absolute bottom-2 right-3 text-[10px] font-mono uppercase tracking-wider select-none pointer-events-none"
            style={{ color: colorTokens.text.soft }}
          >
            {language}
          </span>
        )}
      </div>
    );
  }
);

CodeBlock.displayName = "CodeBlock";

// ============================================================================
// SHIKI LINE OVERLAY (line numbers + highlights over shiki output)
// ============================================================================

function ShikiLineOverlay({
  lines,
  showLineNumbers,
  highlightSet,
  colorTokens,
}: {
  lines: string[];
  showLineNumbers: boolean;
  highlightSet: Set<number | undefined>;
  colorTokens: ColorTokens;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ paddingTop: 16 }}>
      {lines.map((_, i) => {
        const n = i + 1;
        return (
          <div
            key={i}
            className="flex items-center"
            style={{
              height: 20,
              background: highlightSet.has(n) ? `${colorTokens.accent.primary}14` : undefined,
            }}
          >
            {showLineNumbers && (
              <span
                className="inline-block text-right select-none shrink-0 pr-3 pl-2"
                style={{ width: "3.5rem", color: colorTokens.text.soft, fontSize: 12, fontFamily: "monospace" }}
              >
                {n}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// FALLBACK RENDERER (plain text, no shiki)
// ============================================================================

function FallbackRenderer({
  code, lines, showLineNumbers, highlightSet, wordWrap, colorTokens,
}: {
  code: string;
  lines: string[];
  showLineNumbers: boolean;
  highlightSet: Set<number | undefined>;
  wordWrap: boolean;
  colorTokens: ColorTokens;
}) {
  const preStyle: React.CSSProperties = {
    overflowX: wordWrap ? undefined : "auto",
    whiteSpace: wordWrap ? "pre-wrap" : "pre",
    wordBreak: wordWrap ? "break-all" : undefined,
  };

  if (!showLineNumbers && highlightSet.size === 0) {
    return (
      <pre className="p-4 m-0" style={preStyle}>
        <code className="text-[13px] font-mono" style={{ color: colorTokens.text.primary }}>
          {code}
        </code>
      </pre>
    );
  }

  return (
    <pre className="p-0 m-0" style={preStyle}>
      <code className="text-[13px] font-mono block">
        {lines.map((line, i) => {
          const n = i + 1;
          return (
            <div
              key={i}
              className="flex"
              style={{ background: highlightSet.has(n) ? `${colorTokens.accent.primary}14` : undefined }}
            >
              {showLineNumbers && <LineGutter lineNum={n} colorTokens={colorTokens} />}
              <span className="flex-1 px-4" style={{ color: colorTokens.text.primary }}>
                {line || "\n"}
              </span>
            </div>
          );
        })}
      </code>
    </pre>
  );
}
