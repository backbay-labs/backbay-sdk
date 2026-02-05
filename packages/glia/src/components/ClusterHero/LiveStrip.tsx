"use client";

import { FileText, Zap, Vote, Trophy, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import type { LiveStripProps, LiveModuleType } from "./types.js";

const DEFAULT_CONTENT: Record<LiveModuleType, string> = {
  market: "3 new blueprints published today",
  live: "24 active workflows running",
  governance: "Proposal #18 — Voting ends in 6h",
  progress: "You minted 4 verified artifacts this week",
};

const MODULE_ICONS: Record<LiveModuleType, typeof FileText> = {
  market: FileText,
  live: Zap,
  governance: Vote,
  progress: Trophy,
};

/**
 * LiveStrip renders a single horizontal activity strip with a contextual
 * icon, message text, and an animated arrow indicator.
 */
export function LiveStrip({
  moduleType,
  content,
  accentColor,
  className,
}: LiveStripProps) {
  const Icon = MODULE_ICONS[moduleType];
  const displayContent = content ?? DEFAULT_CONTENT[moduleType];

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/5 backdrop-blur-sm",
        "transition-colors duration-200 hover:bg-white/10 cursor-pointer",
        className
      )}
    >
      {/* Left icon - tinted with accent color */}
      <Icon
        className="w-4 h-4 shrink-0 transition-colors duration-200"
        style={{ color: accentColor }}
      />

      {/* Message text */}
      <span className="text-sm text-white/80 font-normal flex-1 truncate">
        {displayContent}
      </span>

      {/* Right arrow with hover animation */}
      <ArrowRight
        className={cn(
          "w-4 h-4 shrink-0 text-white/40",
          "transition-all duration-200 ease-out",
          "group-hover:translate-x-1 group-hover:text-white/60"
        )}
      />
    </div>
  );
}

export default LiveStrip;
