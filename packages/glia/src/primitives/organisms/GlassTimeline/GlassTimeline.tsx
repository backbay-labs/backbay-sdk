"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn, prefersReducedMotion } from "../../../lib/utils";
import { useGlassTokens } from "../../../theme";

// ============================================================================
// TYPES
// ============================================================================

export interface TimelineEvent {
  id: string;
  timestamp: Date | string;
  title: string;
  description?: string;
  type?: "info" | "success" | "warning" | "error" | "system";
  icon?: React.ReactNode;
  metadata?: Record<string, string>;
}

export interface GlassTimelineProps {
  events: TimelineEvent[];
  layout?: "alternating" | "left" | "right";
  showTimestamps?: boolean;
  animate?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TYPE_COLORS: Record<NonNullable<TimelineEvent["type"]>, string> = {
  info: "var(--glia-color-accent,#22D3EE)",
  success: "hsl(160 60% 45%)",
  warning: "hsl(45 93% 47%)",
  error: "hsl(0 72% 51%)",
  system: "hsl(270 60% 60%)",
};

// ============================================================================
// TIMELINE EVENT CARD
// ============================================================================

interface TimelineEventCardProps {
  event: TimelineEvent;
  index: number;
  side: "left" | "right";
  showTimestamp: boolean;
  shouldAnimate: boolean;
  glassTokens: ReturnType<typeof useGlassTokens>;
}

function TimelineEventCard({
  event,
  index,
  side,
  showTimestamp,
  shouldAnimate,
  glassTokens,
}: TimelineEventCardProps) {
  const dotColor = TYPE_COLORS[event.type ?? "info"];
  const formattedTime =
    typeof event.timestamp === "string"
      ? event.timestamp
      : event.timestamp.toLocaleString();

  return (
    <motion.div
      className={cn(
        "relative flex items-start gap-4",
        side === "right" && "flex-row-reverse",
      )}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldAnimate
          ? { delay: index * 0.08, duration: 0.35, ease: "easeOut" }
          : { duration: 0 }
      }
    >
      {/* Dot */}
      <div className="relative flex-shrink-0 flex items-center justify-center w-3 h-3 mt-1.5 z-10">
        {event.icon ?? (
          <span
            className="block w-3 h-3 rounded-full"
            style={{
              background: dotColor,
              boxShadow: `0 0 6px ${dotColor}, 0 0 12px ${dotColor}`,
            }}
          />
        )}
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-lg p-3 min-w-0"
        style={{
          background: glassTokens.cardBg,
          border: `1px solid ${glassTokens.cardBorder}`,
        }}
      >
        {showTimestamp && (
          <time className="block text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--glia-color-text-soft,#64748B)] mb-1">
            {formattedTime}
          </time>
        )}
        <h4 className="text-sm font-semibold text-[var(--glia-color-text-primary,#E2E8F0)] leading-snug">
          {event.title}
        </h4>
        {event.description && (
          <p className="mt-1 text-xs text-[var(--glia-color-text-soft,#64748B)] leading-relaxed">
            {event.description}
          </p>
        )}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {Object.entries(event.metadata).map(([key, value]) => (
              <span
                key={key}
                className="text-[10px] font-mono text-[var(--glia-color-text-soft,#64748B)]"
              >
                <span className="uppercase tracking-[0.08em] opacity-60">{key}:</span>{" "}
                {value}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// GLASS TIMELINE
// ============================================================================

export function GlassTimeline({
  events,
  layout = "left",
  showTimestamps = true,
  animate = true,
  onLoadMore,
  loading = false,
  className,
}: GlassTimelineProps) {
  const glassTokens = useGlassTokens();
  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = animate && !reducedMotion;

  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!onLoadMore || loading) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, loading]);

  return (
    <div
      className={cn("relative", className)}
      role="list"
      aria-label="Timeline"
    >
      {/* Vertical line */}
      <div
        className={cn(
          "absolute top-0 bottom-0 w-px",
          layout === "left" && "left-[5px]",
          layout === "right" && "right-[5px]",
          layout === "alternating" && "left-1/2 -translate-x-px",
        )}
        style={{
          background: `linear-gradient(to bottom, transparent, ${glassTokens.activeBorder ?? "var(--glia-color-accent,#22D3EE)"} 10%, ${glassTokens.activeBorder ?? "var(--glia-color-accent,#22D3EE)"} 90%, transparent)`,
          opacity: 0.3,
        }}
      />

      {/* Events */}
      <div className="relative flex flex-col gap-4">
        {events.map((event, index) => {
          let side: "left" | "right" = "left";
          if (layout === "right") side = "right";
          if (layout === "alternating") side = index % 2 === 0 ? "left" : "right";

          if (layout === "alternating") {
            return (
              <div
                key={event.id}
                role="listitem"
                className="grid items-start"
                style={{ gridTemplateColumns: "1fr auto 1fr" }}
              >
                {side === "left" ? (
                  <>
                    <div className="pr-4">
                      <TimelineEventCard
                        event={event}
                        index={index}
                        side="left"
                        showTimestamp={showTimestamps}
                        shouldAnimate={shouldAnimate}
                        glassTokens={glassTokens}
                      />
                    </div>
                    <div className="relative flex items-start justify-center w-3 mt-1.5">
                      <span
                        className="block w-3 h-3 rounded-full z-10"
                        style={{
                          background: TYPE_COLORS[event.type ?? "info"],
                          boxShadow: `0 0 6px ${TYPE_COLORS[event.type ?? "info"]}`,
                        }}
                      />
                    </div>
                    <div />
                  </>
                ) : (
                  <>
                    <div />
                    <div className="relative flex items-start justify-center w-3 mt-1.5">
                      <span
                        className="block w-3 h-3 rounded-full z-10"
                        style={{
                          background: TYPE_COLORS[event.type ?? "info"],
                          boxShadow: `0 0 6px ${TYPE_COLORS[event.type ?? "info"]}`,
                        }}
                      />
                    </div>
                    <div className="pl-4">
                      <TimelineEventCard
                        event={event}
                        index={index}
                        side="right"
                        showTimestamp={showTimestamps}
                        shouldAnimate={shouldAnimate}
                        glassTokens={glassTokens}
                      />
                    </div>
                  </>
                )}
              </div>
            );
          }

          return (
            <div
              key={event.id}
              role="listitem"
              className={cn(
                layout === "right" && "flex flex-row-reverse",
              )}
            >
              <TimelineEventCard
                event={event}
                index={index}
                side={side}
                showTimestamp={showTimestamps}
                shouldAnimate={shouldAnimate}
                glassTokens={glassTokens}
              />
            </div>
          );
        })}
      </div>

      {/* Load more / loading */}
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {loading && (
          <Loader2
            className="h-5 w-5 animate-spin text-[var(--glia-color-text-soft,#64748B)]"
            aria-label="Loading more events"
          />
        )}
      </div>
    </div>
  );
}
