"use client";

import { Slot } from "@radix-ui/react-slot";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import * as React from "react";
import { cn, prefersReducedMotion } from "../../../lib/utils";
import { useElevationTokens, useGlassTokens } from "../../../theme";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../ui/tooltip";

// ============================================================================
// CONTEXT
// ============================================================================

interface SidebarContextValue {
  collapsed: boolean;
  side: "left" | "right";
}

const SidebarContext = React.createContext<SidebarContextValue>({
  collapsed: false,
  side: "left",
});

export function useSidebarState() {
  return React.useContext(SidebarContext);
}

// ============================================================================
// GLASS SIDEBAR (ROOT)
// ============================================================================

export interface GlassSidebarProps {
  children: React.ReactNode;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
  collapsedWidth?: number;
  expandedWidth?: number;
  side?: "left" | "right";
  showToggle?: boolean;
  disableAnimations?: boolean;
  elevation?: "none" | "soft" | "hud";
  showBorder?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

export function GlassSidebar({
  children,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  defaultCollapsed = false,
  collapsedWidth = 56,
  expandedWidth = 240,
  side = "left",
  showToggle = true,
  disableAnimations = false,
  elevation = "soft",
  showBorder = true,
  className,
  style,
}: GlassSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const collapsed = controlledCollapsed ?? internalCollapsed;

  const glassTokens = useGlassTokens();
  const elevationTokens = useElevationTokens();
  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  const shadowMap = {
    none: "none",
    soft: elevationTokens.softDrop,
    hud: elevationTokens.hudPanel,
  };

  const handleToggle = () => {
    const next = !collapsed;
    if (controlledCollapsed === undefined) {
      setInternalCollapsed(next);
    }
    onCollapsedChange?.(next);
  };

  const borderSide = side === "left" ? "borderRight" : "borderLeft";

  return (
    <SidebarContext.Provider value={{ collapsed, side }}>
      <motion.aside
        className={cn(
          "relative flex flex-col h-full overflow-hidden select-none",
          className,
        )}
        style={{
          backdropFilter: `blur(${glassTokens.panelBlur ?? "24px"})`,
          WebkitBackdropFilter: `blur(${glassTokens.panelBlur ?? "24px"})`,
          background: glassTokens.panelBg,
          boxShadow: shadowMap[elevation],
          ...(showBorder
            ? {
                [borderSide]: `1px solid ${glassTokens.panelBorder}`,
              }
            : {}),
          ...style,
        }}
        animate={{ width: collapsed ? collapsedWidth : expandedWidth }}
        transition={shouldAnimate ? SPRING : { duration: 0 }}
      >
        {children}

        {showToggle && (
          <button
            type="button"
            onClick={handleToggle}
            className={cn(
              "absolute top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full",
              "transition-colors",
              side === "left" ? "-right-3" : "-left-3",
            )}
            style={{
              background: glassTokens.panelBg,
              border: `1px solid ${glassTokens.panelBorder}`,
              backdropFilter: `blur(${glassTokens.panelBlur ?? "24px"})`,
              WebkitBackdropFilter: `blur(${glassTokens.panelBlur ?? "24px"})`,
            }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.span
              animate={{
                rotate: collapsed
                  ? side === "left"
                    ? 180
                    : 0
                  : side === "left"
                    ? 0
                    : 180,
              }}
              transition={shouldAnimate ? SPRING : { duration: 0 }}
              className="flex items-center justify-center"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-[var(--glia-color-text-soft,#64748B)]" />
            </motion.span>
          </button>
        )}
      </motion.aside>
    </SidebarContext.Provider>
  );
}

// ============================================================================
// GLASS SIDEBAR HEADER
// ============================================================================

export interface GlassSidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassSidebarHeader({
  children,
  className,
  style,
  ...props
}: GlassSidebarHeaderProps) {
  const glassTokens = useGlassTokens();

  return (
    <div
      className={cn("flex items-center px-3 py-3 border-b min-h-[48px]", className)}
      style={{
        background: glassTokens.headerGradient,
        borderColor: glassTokens.cardBorder,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// GLASS SIDEBAR SECTION
// ============================================================================

export interface GlassSidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
}

export function GlassSidebarSection({
  children,
  title,
  className,
  ...props
}: GlassSidebarSectionProps) {
  const { collapsed } = useSidebarState();
  const glassTokens = useGlassTokens();

  return (
    <div className={cn("px-2 py-2 space-y-0.5", className)} {...props}>
      {title && !collapsed && (
        <h4 className="text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--glia-color-text-soft,#64748B)] px-2 pb-1">
          {title}
        </h4>
      )}
      {title && collapsed && (
        <div
          className="mx-2 mb-1"
          style={{
            borderBottom: `1px solid ${glassTokens.cardBorder}`,
          }}
        />
      )}
      {children}
    </div>
  );
}

// ============================================================================
// GLASS SIDEBAR ITEM
// ============================================================================

export interface GlassSidebarItemProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  isActive?: boolean;
  badge?: React.ReactNode;
  tooltip?: string;
  asChild?: boolean;
  className?: string;
  onClick?: () => void;
}

export function GlassSidebarItem({
  children,
  icon,
  isActive = false,
  badge,
  tooltip,
  asChild = false,
  className,
  onClick,
}: GlassSidebarItemProps) {
  const { collapsed, side } = useSidebarState();
  const glassTokens = useGlassTokens();

  const Comp = asChild ? Slot : "button";

  const activeBorderSide = side === "left" ? "borderLeft" : "borderRight";

  const itemContent = (
    <Comp
      type={asChild ? undefined : "button"}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors",
        "text-[var(--glia-color-text-primary,#CBD5E1)]",
        collapsed && "justify-center px-0",
        className,
      )}
      style={{
        background: isActive ? glassTokens.hoverBg : undefined,
        [activeBorderSide]: isActive ? `2px solid ${glassTokens.activeBorder}` : "2px solid transparent",
      }}
      data-active={isActive || undefined}
    >
      {icon && (
        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5">
          {icon}
        </span>
      )}
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 truncate text-left"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
      {!collapsed && badge && (
        <span className="flex-shrink-0 ml-auto">{badge}</span>
      )}
    </Comp>
  );

  if (collapsed && tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
        <TooltipContent side={side === "left" ? "right" : "left"}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return itemContent;
}

// ============================================================================
// GLASS SIDEBAR FOOTER
// ============================================================================

export interface GlassSidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassSidebarFooter({
  children,
  className,
  style,
  ...props
}: GlassSidebarFooterProps) {
  const glassTokens = useGlassTokens();

  return (
    <div
      className={cn("mt-auto flex items-center px-3 py-3 border-t min-h-[48px]", className)}
      style={{
        borderColor: glassTokens.cardBorder,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
