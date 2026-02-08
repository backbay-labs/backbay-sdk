"use client";

import { cn, prefersReducedMotion } from "../../../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import React from "react";

// ============================================================================
// VARIANTS
// ============================================================================

const glassStepsVariants = cva("flex", {
  variants: {
    layout: {
      horizontal: "flex-row items-start",
      vertical: "flex-col items-start",
    },
  },
  defaultVariants: {
    layout: "horizontal",
  },
});

// ============================================================================
// TYPES
// ============================================================================

export interface GlassStep {
  /** Step label */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional custom icon (React node) */
  icon?: React.ReactNode;
}

export interface GlassStepsProps
  extends Omit<
      React.HTMLAttributes<HTMLDivElement>,
      | "children"
      | "onDrag"
      | "onDragEnd"
      | "onDragEnter"
      | "onDragExit"
      | "onDragLeave"
      | "onDragOver"
      | "onDragStart"
      | "onDrop"
      | "onAnimationStart"
      | "onAnimationEnd"
      | "onAnimationIteration"
    >,
    VariantProps<typeof glassStepsVariants> {
  /** Step definitions */
  steps: GlassStep[];
  /** Currently active step (0-indexed) */
  activeStep: number;
  /** Callback when a step is clicked */
  onStepClick?: (index: number) => void;
  /** Disable animations */
  disableAnimations?: boolean;
}

// ============================================================================
// STEP INDICATOR
// ============================================================================

function StepIndicator({
  step,
  index,
  status,
  shouldAnimate,
  onClick,
}: {
  step: GlassStep;
  index: number;
  status: "completed" | "active" | "upcoming";
  shouldAnimate: boolean;
  onClick?: () => void;
}) {
  const isCompleted = status === "completed";
  const isActive = status === "active";

  return (
    <motion.button
      type="button"
      className={cn(
        "flex flex-col items-center gap-2 bg-transparent border-none outline-none",
        onClick ? "cursor-pointer" : "cursor-default"
      )}
      onClick={onClick}
      initial={shouldAnimate ? { opacity: 0, y: 10 } : {}}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      aria-current={isActive ? "step" : undefined}
    >
      {/* Circle */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring for active step */}
        {isActive && shouldAnimate && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cyan-neon/40"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ width: 36, height: 36, top: -2, left: -2 }}
          />
        )}

        <div
          className={cn(
            "relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
            isCompleted &&
              "bg-cyan-neon/20 border-2 border-cyan-neon shadow-[0_0_12px_rgba(34,211,238,0.3)]",
            isActive &&
              "bg-cyan-neon/10 border-2 border-cyan-neon",
            !isCompleted &&
              !isActive &&
              "bg-transparent border-2 border-white/[0.1]"
          )}
        >
          {isCompleted ? (
            step.icon ?? (
              <Check className="h-4 w-4 text-cyan-neon" />
            )
          ) : isActive ? (
            step.icon ?? (
              <span className="text-xs font-bold text-cyan-neon tabular-nums">
                {index + 1}
              </span>
            )
          ) : (
            step.icon ?? (
              <span className="text-xs font-medium text-muted-foreground/50 tabular-nums">
                {index + 1}
              </span>
            )
          )}
        </div>
      </div>

      {/* Label */}
      <span
        className={cn(
          "text-[10px] font-mono uppercase tracking-[0.12em] leading-tight text-center max-w-[80px]",
          isCompleted && "text-cyan-neon/80",
          isActive && "text-foreground font-bold",
          !isCompleted && !isActive && "text-muted-foreground/50"
        )}
      >
        {step.label}
      </span>

      {/* Description */}
      {step.description && (
        <span
          className={cn(
            "text-[9px] text-center max-w-[80px] leading-tight",
            isActive ? "text-muted-foreground" : "text-muted-foreground/40"
          )}
        >
          {step.description}
        </span>
      )}
    </motion.button>
  );
}

// ============================================================================
// VERTICAL STEP INDICATOR
// ============================================================================

function VerticalStepIndicator({
  step,
  index,
  status,
  shouldAnimate,
  isLast,
  onClick,
}: {
  step: GlassStep;
  index: number;
  status: "completed" | "active" | "upcoming";
  shouldAnimate: boolean;
  isLast: boolean;
  onClick?: () => void;
}) {
  const isCompleted = status === "completed";
  const isActive = status === "active";

  return (
    <motion.div
      className="flex flex-row items-start gap-3"
      initial={shouldAnimate ? { opacity: 0, x: -10 } : {}}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      {/* Circle + connector column */}
      <div className="flex flex-col items-center">
        {/* Circle */}
        <motion.button
          type="button"
          className={cn(
            "relative flex items-center justify-center bg-transparent border-none outline-none",
            onClick ? "cursor-pointer" : "cursor-default"
          )}
          onClick={onClick}
          aria-current={isActive ? "step" : undefined}
        >
          {isActive && shouldAnimate && (
            <motion.div
              className="absolute rounded-full border-2 border-cyan-neon/40"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ width: 36, height: 36, top: -2, left: -2 }}
            />
          )}
          <div
            className={cn(
              "relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
              isCompleted &&
                "bg-cyan-neon/20 border-2 border-cyan-neon shadow-[0_0_12px_rgba(34,211,238,0.3)]",
              isActive && "bg-cyan-neon/10 border-2 border-cyan-neon",
              !isCompleted &&
                !isActive &&
                "bg-transparent border-2 border-white/[0.1]"
            )}
          >
            {isCompleted ? (
              step.icon ?? <Check className="h-4 w-4 text-cyan-neon" />
            ) : isActive ? (
              step.icon ?? (
                <span className="text-xs font-bold text-cyan-neon tabular-nums">
                  {index + 1}
                </span>
              )
            ) : (
              step.icon ?? (
                <span className="text-xs font-medium text-muted-foreground/50 tabular-nums">
                  {index + 1}
                </span>
              )
            )}
          </div>
        </motion.button>

        {/* Vertical connector */}
        {!isLast && (
          <div
            className={cn(
              "w-[2px] h-8 my-1 rounded-full",
              isCompleted
                ? "bg-gradient-to-b from-cyan-neon/60 to-cyan-neon/30"
                : "bg-white/[0.06]"
            )}
          />
        )}
      </div>

      {/* Label + description */}
      <div className="flex flex-col gap-0.5 pt-1">
        <span
          className={cn(
            "text-[10px] font-mono uppercase tracking-[0.12em] leading-tight",
            isCompleted && "text-cyan-neon/80",
            isActive && "text-foreground font-bold",
            !isCompleted && !isActive && "text-muted-foreground/50"
          )}
        >
          {step.label}
        </span>
        {step.description && (
          <span
            className={cn(
              "text-[9px] leading-tight",
              isActive ? "text-muted-foreground" : "text-muted-foreground/40"
            )}
          >
            {step.description}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// CONNECTING LINE (horizontal)
// ============================================================================

function ConnectingLine({
  completed,
  shouldAnimate,
  index,
}: {
  completed: boolean;
  shouldAnimate: boolean;
  index: number;
}) {
  return (
    <motion.div
      className="flex-1 flex items-center mx-1 mt-4"
      initial={shouldAnimate ? { opacity: 0, scaleX: 0 } : {}}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 + 0.05 }}
    >
      <div
        className={cn(
          "h-[2px] w-full rounded-full",
          completed
            ? "bg-gradient-to-r from-cyan-neon/60 to-cyan-neon/30"
            : "bg-white/[0.06]"
        )}
      />
    </motion.div>
  );
}

// ============================================================================
// GLASS STEPS
// ============================================================================

export function GlassSteps({
  className,
  layout,
  steps,
  activeStep,
  onStepClick,
  disableAnimations = false,
  ...props
}: GlassStepsProps) {
  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;
  const isVertical = layout === "vertical";

  const getStatus = (index: number): "completed" | "active" | "upcoming" => {
    if (index < activeStep) return "completed";
    if (index === activeStep) return "active";
    return "upcoming";
  };

  if (isVertical) {
    return (
      <div
        className={cn(glassStepsVariants({ layout }), className)}
        role="list"
        aria-label="Progress steps"
        {...props}
      >
        {steps.map((step, i) => (
          <VerticalStepIndicator
            key={i}
            step={step}
            index={i}
            status={getStatus(i)}
            shouldAnimate={shouldAnimate}
            isLast={i === steps.length - 1}
            onClick={onStepClick ? () => onStepClick(i) : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(glassStepsVariants({ layout }), className)}
      role="list"
      aria-label="Progress steps"
      {...props}
    >
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <StepIndicator
            step={step}
            index={i}
            status={getStatus(i)}
            shouldAnimate={shouldAnimate}
            onClick={onStepClick ? () => onStepClick(i) : undefined}
          />
          {i < steps.length - 1 && (
            <ConnectingLine
              completed={i < activeStep}
              shouldAnimate={shouldAnimate}
              index={i}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
