/**
 * Breadcrumb
 *
 * Navigation UI for sprawl stack.
 */

import { Html } from "@react-three/drei";
import { motion } from "framer-motion";

import type { BreadcrumbProps } from "./types";

export function Breadcrumb({ stack, labels, onNavigate }: BreadcrumbProps) {
  if (stack.length === 0) return null;

  const items = ["NEXUS", ...stack.map((id) => labels[id] || id)];

  return (
    <Html
      position={[-4, 3, 0]}
      style={{ pointerEvents: "auto" }}
      zIndexRange={[200, 0]}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1 bg-black/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10"
      >
        {items.map((item, i) => (
          <div key={i} className="flex items-center">
            {i > 0 && (
              <span className="text-white/30 mx-1 text-xs">&gt;</span>
            )}
            <button
              onClick={() => onNavigate(i - 1)} // -1 for NEXUS (clears stack)
              className={`
                text-xs font-mono uppercase tracking-wider
                transition-colors duration-150
                ${i === items.length - 1
                  ? "text-cyan-400 cursor-default"
                  : "text-white/60 hover:text-white cursor-pointer"
                }
              `}
              disabled={i === items.length - 1}
            >
              {item}
            </button>
          </div>
        ))}

        {/* Collapse button */}
        <button
          onClick={() => onNavigate(-1)}
          className="ml-2 text-white/40 hover:text-white text-xs"
          title="Collapse all"
        >
          ×
        </button>
      </motion.div>
    </Html>
  );
}
