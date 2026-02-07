"use client";

import * as React from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type PanelGroupProps,
  type PanelProps,
  type PanelResizeHandleProps,
} from "react-resizable-panels";
import { cn } from "../../../lib/utils";
import { useColorTokens, useGlassTokens } from "../../../theme";

// ============================================================================
// CONTEXT
// ============================================================================

type HandleVariant = "default" | "subtle" | "prominent";

const GlassResizableContext = React.createContext<{
  handleVariant: HandleVariant;
}>({ handleVariant: "default" });

// ============================================================================
// GLASS RESIZABLE GROUP
// ============================================================================

export interface GlassResizableGroupProps extends PanelGroupProps {
  handleVariant?: HandleVariant;
}

export const GlassResizableGroup = React.forwardRef<
  React.ComponentRef<typeof PanelGroup>,
  GlassResizableGroupProps
>(function GlassResizableGroup({ handleVariant = "default", children, ...props }, ref) {
  const ctx = React.useMemo(() => ({ handleVariant }), [handleVariant]);

  return (
    <GlassResizableContext.Provider value={ctx}>
      <PanelGroup ref={ref} {...props}>
        {children}
      </PanelGroup>
    </GlassResizableContext.Provider>
  );
});

// ============================================================================
// GLASS RESIZABLE PANEL
// ============================================================================

export interface GlassResizablePanelProps extends PanelProps {
  glass?: boolean;
}

export const GlassResizablePanel = React.forwardRef<
  React.ComponentRef<typeof Panel>,
  GlassResizablePanelProps
>(function GlassResizablePanel({ glass = false, className, style, children, ...props }, ref) {
  const glassTokens = useGlassTokens();

  return (
    <Panel
      ref={ref}
      className={cn(glass && "rounded-lg overflow-hidden", className)}
      style={
        glass
          ? {
              background: glassTokens.cardBg,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: glassTokens.cardBorder,
              ...style,
            }
          : style
      }
      {...props}
    >
      {children}
    </Panel>
  );
});

// ============================================================================
// GLASS RESIZE HANDLE
// ============================================================================

export interface GlassResizeHandleProps
  extends Omit<PanelResizeHandleProps, "children"> {
  showGrip?: boolean;
  orientation?: "horizontal" | "vertical";
  variant?: HandleVariant;
}

export function GlassResizeHandle({
  showGrip,
  orientation: orientationProp,
  variant: variantProp,
  className,
  style,
  ...props
}: GlassResizeHandleProps) {
  const { handleVariant: ctxVariant } = React.useContext(GlassResizableContext);
  const variant = variantProp ?? ctxVariant;
  const colorTokens = useColorTokens();
  const accentColor = colorTokens.accent.primary;

  // Infer orientation from parent PanelGroup direction via the DOM data attribute.
  // The `orientation` prop lets users override when needed.
  const isVertical = orientationProp === "vertical";

  const sizeMap: Record<HandleVariant, number> = {
    subtle: 1,
    default: 4,
    prominent: 6,
  };
  const size = sizeMap[variant];

  const gripVisible = showGrip ?? variant !== "subtle";

  return (
    <PanelResizeHandle
      className={cn(
        "group/handle relative flex items-center justify-center",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        isVertical ? "w-full py-0.5" : "h-full px-0.5",
        className,
      )}
      style={style}
      {...props}
    >
      {/* Track line */}
      <div
        className={cn(
          "rounded-full transition-colors duration-150",
          isVertical ? "w-full" : "h-full",
          // Default: muted background
          "bg-border/40",
          // Hover: accent glow
          "group-hover/handle:bg-[var(--glass-handle-accent)]",
          // Active drag via data attribute
          "group-[[data-resize-handle-active]]/handle:bg-[var(--glass-handle-accent)]",
        )}
        style={{
          ...({ "--glass-handle-accent": accentColor } as React.CSSProperties),
          ...(isVertical
            ? { height: `${size}px` }
            : { width: `${size}px` }),
        }}
      />

      {/* Grip dots */}
      {gripVisible && (
        <div
          className={cn(
            "absolute flex gap-0.5 opacity-0 transition-opacity duration-150",
            "group-hover/handle:opacity-100",
            "group-[[data-resize-handle-active]]/handle:opacity-100",
            isVertical ? "flex-row" : "flex-col",
          )}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: variant === "prominent" ? 4 : 3,
                height: variant === "prominent" ? 4 : 3,
                background: accentColor,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      )}
    </PanelResizeHandle>
  );
}
