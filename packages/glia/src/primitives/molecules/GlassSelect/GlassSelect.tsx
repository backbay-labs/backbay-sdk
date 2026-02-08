"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { AlertCircle, Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn, prefersReducedMotion } from "../../../lib/utils";

// ============================================================================
// VARIANTS
// ============================================================================

const triggerVariants = cva(
  [
    "flex w-full items-center justify-between rounded-md border px-3 py-2",
    "bg-[rgba(2,4,10,0.85)] backdrop-blur-xl",
    "text-sm font-mono text-foreground",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
    "ring-offset-background transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "placeholder:text-muted-foreground/60",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-white/[0.06] focus:border-cyan-neon focus:ring-cyan-neon/30 focus:shadow-[0_0_20px_hsl(var(--cyan-neon)/0.15)]",
        error:
          "border-destructive/60 focus:border-destructive focus:ring-destructive/30",
      },
      size: {
        default: "h-10",
        sm: "h-9 text-xs",
        lg: "h-11 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// ============================================================================
// TYPES
// ============================================================================

export interface GlassSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface GlassSelectGroup {
  label: string;
  options: GlassSelectOption[];
}

export interface GlassSelectProps extends VariantProps<typeof triggerVariants> {
  /** Select label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Helper description text */
  description?: string;
  /** Error message */
  error?: string;
  /** Flat options list */
  options?: GlassSelectOption[];
  /** Grouped options */
  groups?: GlassSelectGroup[];
  /** Controlled value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Disable glow animations */
  disableAnimations?: boolean;
  /** Container class name */
  containerClassName?: string;
  /** Trigger class name */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GlassSelect({
  className,
  containerClassName,
  variant,
  size,
  label,
  placeholder = "Select...",
  description,
  error,
  options,
  groups,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  disableAnimations = false,
}: GlassSelectProps) {
  const internalId = React.useId();
  const descriptionId = `${internalId}-description`;
  const errorId = `${internalId}-error`;

  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  const finalVariant = error ? "error" : variant;

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {/* Label */}
      {label && (
        <motion.label
          className="text-xs font-medium uppercase tracking-widest text-muted-foreground font-mono"
          initial={shouldAnimate ? { opacity: 0, y: -5 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>
      )}

      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          className={cn(triggerVariants({ variant: finalVariant, size }), className)}
          aria-describedby={
            description || error
              ? `${description ? descriptionId : ""} ${error ? errorId : ""}`.trim()
              : undefined
          }
          aria-invalid={error ? "true" : undefined}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              "relative z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-md border",
              "border-white/[0.06] bg-[rgba(2,4,10,0.95)] backdrop-blur-xl",
              "shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.02)]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
            )}
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.ScrollUpButton className="flex h-6 cursor-default items-center justify-center">
              <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport className="p-1">
              {/* Flat options */}
              {options?.map((option) => (
                <GlassSelectItem key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </GlassSelectItem>
              ))}

              {/* Grouped options */}
              {groups?.map((group, i) => (
                <SelectPrimitive.Group key={group.label}>
                  {i > 0 && (
                    <SelectPrimitive.Separator className="mx-1 my-1 h-px bg-white/[0.06]" />
                  )}
                  <SelectPrimitive.Label className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 font-mono">
                    {group.label}
                  </SelectPrimitive.Label>
                  {group.options.map((option) => (
                    <GlassSelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </GlassSelectItem>
                  ))}
                </SelectPrimitive.Group>
              ))}
            </SelectPrimitive.Viewport>

            <SelectPrimitive.ScrollDownButton className="flex h-6 cursor-default items-center justify-center">
              <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {/* Description */}
      {description && !error && (
        <motion.p
          id={descriptionId}
          className="text-xs text-muted-foreground"
          initial={shouldAnimate ? { opacity: 0, y: 5 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          {description}
        </motion.p>
      )}

      {/* Error message */}
      {error && (
        <motion.p
          id={errorId}
          className="text-xs text-destructive flex items-center gap-1"
          initial={shouldAnimate ? { opacity: 0, y: 5 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ============================================================================
// SELECT ITEM
// ============================================================================

function GlassSelectItem({
  children,
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2",
        "text-sm font-mono text-foreground/90 outline-none",
        "focus:bg-cyan-neon/10 focus:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        "transition-colors duration-100",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-3.5 w-3.5 text-cyan-neon" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
