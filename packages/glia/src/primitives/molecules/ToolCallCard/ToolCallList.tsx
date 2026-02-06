"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";
import { ToolCallCard, type ToolCallProps } from "./ToolCallCard";

export interface ToolCallListProps {
  /** Array of tool calls to display */
  calls: ToolCallProps[];
  /** Gap between cards. Default: 8 */
  gap?: number;
  /** Additional className */
  className?: string;
}

export function ToolCallList({ calls, gap = 8, className }: ToolCallListProps) {
  return (
    <div className={cn("flex flex-col", className)} style={{ gap }}>
      {calls.map((call, i) => (
        <ToolCallCard key={call.id ?? i} {...call} />
      ))}
    </div>
  );
}
