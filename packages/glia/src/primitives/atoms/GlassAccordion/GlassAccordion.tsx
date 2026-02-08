"use client";

import { cn, prefersReducedMotion } from "../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import React from "react";
import { useGlassTokens, useColorTokens, useMotionTokens } from "../../../theme/UiThemeProvider";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GlassAccordionProps {
  children: React.ReactNode;
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  variant?: "default" | "card" | "flush";
  disableAnimations?: boolean;
  className?: string;
}

export interface GlassAccordionItemProps {
  value: string;
  trigger: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Internal: AnimatedContent
// ---------------------------------------------------------------------------

function AnimatedContent({
  children,
  shouldAnimate,
  motionDuration,
}: {
  children: React.ReactNode;
  shouldAnimate: boolean;
  motionDuration: number;
}) {
  if (!shouldAnimate) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: motionDuration, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// GlassAccordionItem
// ---------------------------------------------------------------------------

const GlassAccordionItemContext = React.createContext<{
  variant: "default" | "card" | "flush";
  disableAnimations: boolean;
}>({ variant: "default", disableAnimations: false });

export function GlassAccordionItem({
  value,
  trigger,
  icon,
  children,
  disabled = false,
  className,
}: GlassAccordionItemProps) {
  const { variant, disableAnimations } = React.useContext(GlassAccordionItemContext);
  const glass = useGlassTokens();
  const colors = useColorTokens();
  const motionTokens = useMotionTokens();
  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  const itemStyle: React.CSSProperties =
    variant === "card"
      ? {
          borderBottom: `1px solid ${glass.cardBorder}`,
        }
      : variant === "flush"
        ? {
            borderBottom: `1px solid ${glass.cardBorder}`,
          }
        : {
            background: glass.cardBg,
            border: `1px solid ${glass.cardBorder}`,
            borderRadius: 8,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
          };

  return (
    <AccordionPrimitive.Item
      value={value}
      disabled={disabled}
      className={cn(
        "overflow-hidden transition-colors",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      style={itemStyle}
    >
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          className={cn(
            "flex flex-1 items-center gap-3 py-3 px-4 text-sm font-medium transition-colors cursor-pointer",
            "rounded-[inherit]",
            "group"
          )}
          style={{ color: colors.text.primary }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          {icon && (
            <span
              className="flex-shrink-0"
              style={{ color: colors.text.muted }}
            >
              {icon}
            </span>
          )}
          <span className="flex-1 text-left text-[var(--glia-color-text-primary,#CBD5E1)]">{trigger}</span>
          {shouldAnimate ? (
            <motion.span
              className="flex-shrink-0 transition-colors duration-200 group-data-[state=open]:text-cyan-400"
              style={{ color: colors.text.soft }}
            >
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </motion.span>
          ) : (
            <span
              className="transition-colors duration-200 group-data-[state=open]:text-cyan-400"
              style={{ color: colors.text.soft }}
            >
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </span>
          )}
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>

      <AccordionPrimitive.Content
        className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      >
        <div
          className="px-4 pb-3 text-sm text-[var(--glia-color-text-soft,#64748B)]"
          style={{ color: colors.text.muted }}
        >
          {children}
        </div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}

// ---------------------------------------------------------------------------
// GlassAccordion
// ---------------------------------------------------------------------------

export function GlassAccordion({
  children,
  type = "single",
  defaultValue,
  value,
  onValueChange,
  collapsible = true,
  variant = "default",
  disableAnimations = false,
  className,
}: GlassAccordionProps) {
  const glass = useGlassTokens();

  const wrapperStyle: React.CSSProperties =
    variant === "card"
      ? {
          background: glass.cardBg,
          border: `1px solid ${glass.cardBorder}`,
          borderRadius: 12,
          overflow: "hidden",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
        }
      : {};

  // Build Radix props based on type
  const rootProps =
    type === "multiple"
      ? {
          type: "multiple" as const,
          defaultValue: (defaultValue as string[] | undefined) ?? [],
          value: value as string[] | undefined,
          onValueChange: onValueChange as ((value: string[]) => void) | undefined,
        }
      : {
          type: "single" as const,
          collapsible,
          defaultValue: (defaultValue as string | undefined) ?? "",
          value: value as string | undefined,
          onValueChange: onValueChange as ((value: string) => void) | undefined,
        };

  return (
    <GlassAccordionItemContext.Provider value={{ variant, disableAnimations }}>
      <div style={wrapperStyle}>
        <AccordionPrimitive.Root
          className={cn(
            variant === "default" && "flex flex-col gap-2",
            variant === "flush" && "w-full",
            className
          )}
          {...rootProps}
        >
          {children}
        </AccordionPrimitive.Root>
      </div>
    </GlassAccordionItemContext.Provider>
  );
}
