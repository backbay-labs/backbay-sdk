"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ScrollIndicatorProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * An animated scroll indicator that hints users to scroll down.
 * Features a continuous bobbing animation and fades out as the user scrolls.
 */
export function ScrollIndicator({ className }: ScrollIndicatorProps) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [1, 0]);

  return (
    <motion.div
      className={cn(
        "absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none",
        className
      )}
      style={{ opacity }}
    >
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <ChevronDown
          className="w-8 h-8 text-white/50"
          strokeWidth={1.5}
        />
      </motion.div>
    </motion.div>
  );
}
