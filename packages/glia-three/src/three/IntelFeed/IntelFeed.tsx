"use client";

import * as React from "react";
import { Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  INTEL_SEVERITY_COLORS,
  INTEL_TYPE_LABELS,
  type IntelFeedProps,
  type IntelItem,
} from "./types";

const SEVERITY_ORDER: Record<IntelItem["severity"], number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const CARD_SIZE: [number, number, number] = [2.1, 0.85, 0.08];
const CARD_WIDTH = CARD_SIZE[0];
const CARD_HEIGHT = CARD_SIZE[1];

interface IntelCardProps {
  item: IntelItem;
  position: [number, number, number];
  onClick?: (item: IntelItem) => void;
  autoScroll: boolean;
  scrollSpan: number;
  scrollSpeed: number;
  layout: NonNullable<IntelFeedProps["layout"]>;
  index: number;
}

function IntelCard({
  item,
  position,
  onClick,
  autoScroll,
  scrollSpan,
  scrollSpeed,
  layout,
  index,
}: IntelCardProps) {
  const groupRef = React.useRef<THREE.Group>(null);
  const [hovered, setHovered] = React.useState(false);
  const showSummary = hovered || item.actionRequired;

  const baseColor = INTEL_SEVERITY_COLORS[item.severity];

  useFrame(({ clock }) => {
    if (!groupRef.current || !autoScroll || layout !== "waterfall") return;
    const t = clock.elapsedTime * scrollSpeed + index * 0.3;
    const offset = t % scrollSpan;
    let nextY = position[1] - offset;
    if (nextY < -scrollSpan / 2) {
      nextY += scrollSpan;
    }
    groupRef.current.position.set(position[0], nextY, position[2]);
  });

  return (
    <group ref={groupRef} position={position}>
      <RoundedBox
        args={CARD_SIZE}
        radius={0.08}
        smoothness={4}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(item);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <meshStandardMaterial
          color="#0b1220"
          emissive={baseColor}
          emissiveIntensity={hovered ? 0.45 : 0.22}
          transparent
          opacity={0.82}
          roughness={0.4}
          metalness={0.3}
        />
      </RoundedBox>

      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[2.05, 0.78]} />
        <meshBasicMaterial color={baseColor} transparent opacity={0.12} />
      </mesh>

      <Html distanceFactor={10} position={[-0.95, 0.22, 0.1]}>
        <div
          className="w-[150px] text-[9px] text-white/80"
          style={{
            fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
            lineHeight: 1.5,
            letterSpacing: "0.02em",
          }}
        >
          <div className="flex items-center justify-between gap-2 uppercase">
            <span className="rounded bg-slate-900/80 px-1 py-0.5 text-[7px] font-semibold text-white/70">
              {INTEL_TYPE_LABELS[item.type]}
            </span>
            <span className="text-[7px] opacity-60">{item.source}</span>
          </div>
          <div className="mt-1 text-[10px] font-semibold">{item.title}</div>
          {item.summary && showSummary && (
            <div className="mt-0.5 text-[8px] opacity-60">{item.summary}</div>
          )}
        </div>
      </Html>

      {item.actionRequired && (
        <Html distanceFactor={12} position={[0.92, 0.28, 0.12]}>
          <div className="rounded bg-red-500/75 px-1.5 py-0.5 text-[7px] font-semibold text-white/90 uppercase tracking-[0.08em]">
            ACTION
          </div>
        </Html>
      )}
    </group>
  );
}

function filterItems(
  items: IntelItem[],
  filterSeverity?: string[],
  filterSources?: string[],
  maxItems?: number
) {
  let filtered = items.slice();

  if (filterSeverity && filterSeverity.length > 0) {
    filtered = filtered.filter((item) => filterSeverity.includes(item.severity));
  }

  if (filterSources && filterSources.length > 0) {
    filtered = filtered.filter((item) => filterSources.includes(item.source));
  }

  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (maxItems) {
    filtered = filtered.slice(0, maxItems);
  }

  return filtered;
}

export function IntelFeed({
  items,
  sources,
  maxItems = 12,
  filterSeverity,
  filterSources,
  onItemClick,
  layout = "waterfall",
  autoScroll = true,
  bounds,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: IntelFeedProps) {
  const filteredItems = React.useMemo(
    () => filterItems(items, filterSeverity, filterSources, maxItems),
    [items, filterSeverity, filterSources, maxItems]
  );

  const layoutPositions = React.useMemo(() => {
    const safeWidth = Math.max(bounds?.width ?? 9.5, CARD_WIDTH + 0.6);
    const safeHeight = Math.max(bounds?.height ?? 5.5, CARD_HEIGHT + 0.6);

    if (layout === "grid") {
      const maxColumns = Math.max(1, Math.floor(safeWidth / (CARD_WIDTH + 0.4)));
      const columns = Math.max(
        1,
        Math.min(maxColumns, Math.ceil(Math.sqrt(filteredItems.length)))
      );
      const rows = Math.ceil(filteredItems.length / columns);
      const spacingX = safeWidth / columns;
      const spacingY = safeHeight / Math.max(1, rows);
      return filteredItems.map((item, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        return {
          item,
          position: [
            -safeWidth / 2 + spacingX / 2 + col * spacingX,
            safeHeight / 2 - spacingY / 2 - row * spacingY,
            0,
          ] as [number, number, number],
        };
      });
    }

    if (layout === "timeline") {
      const timestamps = filteredItems.map((item) => item.timestamp.getTime());
      const minTime = timestamps.length ? Math.min(...timestamps) : 0;
      const maxTime = timestamps.length ? Math.max(...timestamps) : 1;
      const range = Math.max(1, maxTime - minTime);
      const width = safeWidth * 0.85;
      const laneSpacing = safeHeight / 6;

      return filteredItems.map((item, index) => {
        const x = ((item.timestamp.getTime() - minTime) / range - 0.5) * width;
        const y = (SEVERITY_ORDER[item.severity] - 2) * laneSpacing;
        const z = (index % 3) * 0.3;
        return { item, position: [x, y, z] as [number, number, number] };
      });
    }

    const sourcesByName = Array.from(new Set(filteredItems.map((item) => item.source)));
    const laneCount = Math.max(1, sourcesByName.length);
    const spacingX = safeWidth / laneCount;
    const spacingY =
      filteredItems.length > 1
        ? Math.min(CARD_HEIGHT + 0.2, safeHeight / (filteredItems.length - 1))
        : 0;

    return filteredItems.map((item, index) => {
      const lane = sourcesByName.indexOf(item.source);
      const x = -safeWidth / 2 + spacingX / 2 + lane * spacingX;
      const y = safeHeight / 2 - index * spacingY;
      return { item, position: [x, y, 0] as [number, number, number] };
    });
  }, [filteredItems, layout, bounds]);

  const scrollSpan = Math.max(3, (bounds?.height ?? layoutPositions.length * 1.0) + CARD_HEIGHT);
  const scrollSpeed = 0.35;

  const sourceLabels = React.useMemo(() => {
    const labelItems = sources.map((source) => ({
      ...source,
      count: filteredItems.filter((item) => item.source === source.name).length,
    }));
    return labelItems.filter((source) => source.count > 0);
  }, [sources, filteredItems]);
  const labelSpan = Math.max(bounds?.width ?? 9.5, CARD_WIDTH + 0.6);
  const labelSpacing = labelSpan / Math.max(1, sourceLabels.length);

  return (
    <group position={position} rotation={rotation}>
      {layout === "waterfall" && (
        <group>
          {sourceLabels.map((source, index) => (
            <Html
              key={source.id}
              position={[
                -labelSpan / 2 + labelSpacing / 2 + index * labelSpacing,
                (bounds?.height ?? 5.5) / 2 - 0.2,
                0,
              ]}
            >
              <div className="rounded bg-slate-950/70 px-2 py-1 text-[8px] uppercase tracking-[0.18em] text-white/55">
                {source.name} • {Math.round(source.reliability * 100)}%
              </div>
            </Html>
          ))}
        </group>
      )}

      {layoutPositions.map(({ item, position: itemPosition }, index) => (
        <IntelCard
          key={item.id}
          item={item}
          position={itemPosition}
          onClick={onItemClick}
          autoScroll={autoScroll}
          scrollSpan={scrollSpan}
          scrollSpeed={scrollSpeed}
          layout={layout}
          index={index}
        />
      ))}
    </group>
  );
}
