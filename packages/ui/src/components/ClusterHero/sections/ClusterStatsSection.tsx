"use client";

import { useRef, useEffect } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { cn } from "../../../lib/utils";
import type { ClusterId } from "../types";

interface StatData {
  value: number;
  suffix: string;
  label: string;
}

interface ClusterStats {
  activeUsers: StatData;
  uptime: StatData;
  computeHours: StatData;
  projects: StatData;
}

const CLUSTER_STATS: Record<ClusterId, ClusterStats> = {
  alexandria: {
    activeUsers: { value: 12847, suffix: "", label: "Active Users" },
    uptime: { value: 99.97, suffix: "%", label: "Uptime" },
    computeHours: { value: 2.4, suffix: "M", label: "Compute Hours" },
    projects: { value: 8234, suffix: "", label: "Projects" },
  },
  alpha: {
    activeUsers: { value: 8421, suffix: "", label: "Active Users" },
    uptime: { value: 99.92, suffix: "%", label: "Uptime" },
    computeHours: { value: 1.8, suffix: "M", label: "Compute Hours" },
    projects: { value: 5672, suffix: "", label: "Projects" },
  },
  opus: {
    activeUsers: { value: 24156, suffix: "", label: "Active Providers" },
    uptime: { value: 99.99, suffix: "%", label: "Uptime" },
    computeHours: { value: 2.4, suffix: "M", label: "Diagnostics/Day" },
    projects: { value: 847, suffix: "", label: "Care Protocols" },
  },
  baia: {
    activeUsers: { value: 156842, suffix: "", label: "Active Artists" },
    uptime: { value: 99.97, suffix: "%", label: "Uptime" },
    computeHours: { value: 4.2, suffix: "M", label: "Works Generated" },
    projects: { value: 847, suffix: "K", label: "Daily Renders" },
  },
  kdot: {
    activeUsers: { value: 18542, suffix: "", label: "Active Nodes" },
    uptime: { value: 99.99, suffix: "%", label: "Uptime" },
    computeHours: { value: 4.7, suffix: "M", label: "Connections/Day" },
    projects: { value: 9821, suffix: "", label: "Networks" },
  },
  aegis: {
    activeUsers: { value: 31284, suffix: "", label: "Protected Assets" },
    uptime: { value: 99.97, suffix: "%", label: "Uptime" },
    computeHours: { value: 2.1, suffix: "B", label: "Threats Blocked" },
    projects: { value: 4523, suffix: "", label: "Security Policies" },
  },
  providence: {
    activeUsers: { value: 18742, suffix: "", label: "Monitored Endpoints" },
    uptime: { value: 99.99, suffix: "%", label: "Uptime" },
    computeHours: { value: 847, suffix: "K", label: "Threats Analyzed" },
    projects: { value: 2891, suffix: "", label: "Active Policies" },
  },
};

const ACCENT_COLORS: Record<ClusterId, string> = {
  alexandria: "#D4AF37",
  alpha: "#00D4FF",
  opus: "#FF6B6B",
  baia: "#7B68EE",
  kdot: "#00D4AA",
  aegis: "#4A7BF7",
  providence: "#00D4AA",
};

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  isDecimal?: boolean;
}

function AnimatedCounter({ value, suffix = "", isDecimal = false }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const spring = useSpring(0, {
    duration: 2000,
    bounce: 0,
  });

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  const display = useTransform(spring, (current: number) => {
    if (isDecimal) {
      return current.toFixed(2) + suffix;
    }
    return Math.floor(current).toLocaleString() + suffix;
  });

  return (
    <motion.span ref={ref} className="tabular-nums">
      {display}
    </motion.span>
  );
}

interface StatItemProps {
  stat: StatData;
  accentColor: string;
  index: number;
  isLast: boolean;
}

function StatItem({ stat, accentColor, index, isLast }: StatItemProps) {
  const isDecimal = stat.suffix === "%" || stat.suffix === "M";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{
          duration: 0.6,
          delay: index * 0.1,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="flex flex-col items-center text-center px-8 py-4"
      >
        <span
          className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold mb-3 tracking-tight"
          style={{ color: accentColor }}
        >
          <AnimatedCounter
            value={stat.value}
            suffix={stat.suffix}
            isDecimal={isDecimal}
          />
        </span>
        <span className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-white/50 font-medium">
          {stat.label}
        </span>
      </motion.div>

      {!isLast && (
        <div
          className="w-px h-16 self-center opacity-20"
          style={{
            background: `linear-gradient(to bottom, transparent, ${accentColor}, transparent)`,
          }}
        />
      )}
    </>
  );
}

export interface ClusterStatsSectionProps {
  clusterId: ClusterId;
  className?: string;
}

/**
 * ClusterStatsSection displays animated statistics for a cluster.
 * Features scroll-triggered counter animations and cluster-specific data.
 */
export function ClusterStatsSection({ clusterId, className }: ClusterStatsSectionProps) {
  const stats = CLUSTER_STATS[clusterId];
  const accentColor = ACCENT_COLORS[clusterId];
  const statsArray = [
    stats.activeUsers,
    stats.uptime,
    stats.computeHours,
    stats.projects,
  ];

  return (
    <section
      className={cn(
        "relative w-full py-16 md:py-20",
        className
      )}
      style={{
        background: `
          linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.95) 0%,
            rgba(12, 12, 18, 0.98) 50%,
            rgba(0, 0, 0, 0.95) 100%
          )
        `,
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            radial-gradient(${accentColor} 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top border glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${accentColor}40, transparent)`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap justify-center md:justify-between items-center">
          {statsArray.map((stat, index) => (
            <StatItem
              key={stat.label}
              stat={stat}
              accentColor={accentColor}
              index={index}
              isLast={index === statsArray.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Bottom border glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${accentColor}40, transparent)`,
        }}
      />
    </section>
  );
}
