"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import {
  Permission,
  PermissionGroup,
  PermissionMatrixProps,
  ACTION_COLORS,
} from "./types";

/**
 * PermissionCell - Individual permission cell in the matrix
 */
function PermissionCell({
  permission,
  group,
  position,
  cellSize,
  isSelected,
  onPermissionClick,
  showLabels,
  animated = true,
}: {
  permission: Permission;
  group: PermissionGroup;
  position: [number, number, number];
  cellSize: number;
  isSelected: boolean;
  onPermissionClick?: (p: Permission, g: PermissionGroup) => void;
  showLabels: boolean;
  animated?: boolean;
}) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  const color = ACTION_COLORS[permission.action];
  const baseHeight = permission.granted ? cellSize * 1.5 : cellSize * 0.3;

  // Animation state
  const scaleRef = React.useRef({ x: 1, y: 1, z: 1 });
  const pulsePhaseRef = React.useRef(Math.random() * Math.PI * 2);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Pulse animation for granted permissions
    if (animated && permission.granted) {
      const pulse = Math.sin(t * 2 + pulsePhaseRef.current) * 0.08 + 1;
      scaleRef.current.y = pulse;
    } else {
      scaleRef.current.y = 1;
    }

    // Hover/selection scale with smooth lerp
    const targetScaleXZ = hovered || isSelected ? 1.15 : 1;
    scaleRef.current.x = THREE.MathUtils.lerp(
      scaleRef.current.x,
      targetScaleXZ,
      0.12
    );
    scaleRef.current.z = THREE.MathUtils.lerp(
      scaleRef.current.z,
      targetScaleXZ,
      0.12
    );

    // Apply scales
    meshRef.current.scale.set(
      scaleRef.current.x,
      scaleRef.current.y,
      scaleRef.current.z
    );
  });

  return (
    <group position={position}>
      {/* Main cell box */}
      <RoundedBox
        ref={meshRef}
        args={[cellSize * 0.85, baseHeight, cellSize * 0.85]}
        radius={0.03}
        smoothness={4}
        position={[0, baseHeight / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onPermissionClick?.(permission, group);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <meshStandardMaterial
          color={permission.granted ? color : "#1a1a1a"}
          transparent
          opacity={permission.granted ? 0.92 : 0.45}
          emissive={permission.granted ? color : "#000000"}
          emissiveIntensity={permission.granted ? (hovered ? 0.5 : 0.25) : 0}
          roughness={0.4}
          metalness={0.3}
        />
      </RoundedBox>

      {/* Inherited indicator - floating sphere above */}
      {permission.inherited && (
        <mesh position={[0, baseHeight + 0.15, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial
            color="#00aaff"
            emissive="#00aaff"
            emissiveIntensity={0.6}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Selection ring at base */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[cellSize * 0.48, cellSize * 0.55, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Hover glow ring */}
      {hovered && !isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[cellSize * 0.45, cellSize * 0.52, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
        </mesh>
      )}

      {/* Label tooltip on hover or when showLabels is true */}
      {(hovered || showLabels) && (
        <Html position={[0, baseHeight + 0.4, 0]} center distanceFactor={8}>
          <div
            className="text-xs font-mono px-3 py-2 rounded-md border whitespace-nowrap shadow-lg"
            style={{
              background: "rgba(2, 4, 10, 0.85)",
              backdropFilter: "blur(24px)",
              borderColor: "rgba(255,255,255,0.06)",
              boxShadow: `0 0 12px ${color}40, inset 0 1px 0 rgba(255,255,255,0.02)`,
            }}
          >
            <div style={{ color }} className="font-bold text-[11px] mb-1">
              {permission.action.toUpperCase()}
            </div>
            <div className="text-white/90 text-[10px] mb-1">
              {permission.resource}
            </div>
            <div
              className={`text-[10px] font-semibold ${
                permission.granted ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {permission.granted ? "GRANTED" : "DENIED"}
            </div>
            {permission.inherited && (
              <div className="text-blue-400 text-[9px] mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                inherited
              </div>
            )}
            {permission.reason && (
              <div className="text-white/50 text-[9px] mt-1 max-w-32 truncate">
                {permission.reason}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * GroupDivider - Visual separator between permission groups
 */
function GroupDivider({
  position,
  width,
  color = "#333",
}: {
  position: [number, number, number];
  width: number;
  color?: string;
}) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, 0.02]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  );
}

/**
 * PermissionMatrix - 3D visualization of permission groups and access levels
 *
 * Displays permissions in a 3D grid where:
 * - X-axis: Resources (columns)
 * - Z-axis: Permission groups (rows)
 * - Y-axis: Granted state (tall = granted, flat = denied)
 */
export function PermissionMatrix({
  groups,
  selected,
  position = [0, 0, 0],
  cellSize = 0.5,
  spacing = 0.1,
  onPermissionClick,
  showLabels = false,
  animated = true,
}: PermissionMatrixProps) {
  const totalSpacing = cellSize + spacing;
  const groupSpacing = totalSpacing * 1.8;

  // Extract unique resources across all groups for column layout
  const allResources = React.useMemo(() => {
    const resources = new Set<string>();
    groups.forEach((g) => g.permissions.forEach((p) => resources.add(p.resource)));
    return Array.from(resources);
  }, [groups]);

  const gridWidth = allResources.length * totalSpacing;
  const gridDepth = groups.length * groupSpacing;

  return (
    <group position={position}>
      {/* Base grid plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[gridWidth / 2 - totalSpacing / 2, -0.01, gridDepth / 2 - groupSpacing / 2]}>
        <planeGeometry args={[gridWidth + totalSpacing, gridDepth + totalSpacing]} />
        <meshStandardMaterial
          color="#0a0a0a"
          transparent
          opacity={0.8}
          roughness={0.9}
        />
      </mesh>

      {/* Grid lines helper */}
      <gridHelper
        args={[
          Math.max(gridWidth, gridDepth) + totalSpacing,
          Math.max(allResources.length, groups.length) + 2,
          "#1a1a1a",
          "#111111",
        ]}
        position={[
          gridWidth / 2 - totalSpacing / 2,
          0,
          gridDepth / 2 - groupSpacing / 2,
        ]}
      />

      {/* Group labels (Z-axis) */}
      {groups.map((group, groupIndex) => (
        <Html
          key={`label-${group.id}`}
          position={[-totalSpacing * 1.5, 0.4, groupIndex * groupSpacing]}
          center
          distanceFactor={10}
        >
          <div className="bg-[rgba(2,4,10,0.85)] backdrop-blur-xl text-white text-[11px] font-mono px-3 py-1.5 rounded border border-white/[0.06] whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            {group.name}
          </div>
        </Html>
      ))}

      {/* Resource labels (X-axis) */}
      {allResources.map((resource, i) => (
        <Html
          key={`resource-${resource}`}
          position={[i * totalSpacing, 0.3, -totalSpacing]}
          center
          distanceFactor={10}
        >
          <div
            className="bg-[rgba(2,4,10,0.85)] backdrop-blur-xl border border-white/[0.06] text-white/70 text-[9px] font-mono px-2 py-1 rounded whitespace-nowrap"
            style={{ transform: "rotate(-35deg)", transformOrigin: "center" }}
          >
            {resource}
          </div>
        </Html>
      ))}

      {/* Permission cells by group */}
      {groups.map((group, groupIndex) => (
        <React.Fragment key={group.id}>
          {/* Group container */}
          <group position={[0, 0, groupIndex * groupSpacing]}>
            {group.permissions.map((permission) => {
              const resourceIndex = allResources.indexOf(permission.resource);
              return (
                <PermissionCell
                  key={permission.id}
                  permission={permission}
                  group={group}
                  position={[resourceIndex * totalSpacing, 0, 0]}
                  cellSize={cellSize}
                  isSelected={selected === permission.id}
                  onPermissionClick={onPermissionClick}
                  showLabels={showLabels}
                  animated={animated}
                />
              );
            })}
          </group>

          {/* Divider after group (except last) */}
          {groupIndex < groups.length - 1 && (
            <GroupDivider
              position={[
                gridWidth / 2 - totalSpacing / 2,
                0.005,
                groupIndex * groupSpacing + groupSpacing / 2,
              ]}
              width={gridWidth + totalSpacing * 0.5}
              color="#2a2a2a"
            />
          )}
        </React.Fragment>
      ))}

      {/* Legend */}
      <Html
        position={[gridWidth / 2 - totalSpacing / 2, 2.5, -totalSpacing * 1.5]}
        center
        distanceFactor={12}
      >
        <div className="bg-[rgba(2,4,10,0.85)] backdrop-blur-xl text-[10px] font-mono p-3 rounded-lg border border-white/[0.06] flex gap-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          {Object.entries(ACTION_COLORS).map(([action, actionColor]) => (
            <div key={action} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded"
                style={{
                  backgroundColor: actionColor,
                  boxShadow: `0 0 6px ${actionColor}60`,
                }}
              />
              <span className="text-white/70">{action}</span>
            </div>
          ))}
        </div>
      </Html>

      {/* Status indicator legend */}
      <Html
        position={[gridWidth / 2 - totalSpacing / 2, 2, -totalSpacing * 1.5]}
        center
        distanceFactor={12}
      >
        <div className="bg-[rgba(2,4,10,0.85)] backdrop-blur-xl text-[9px] font-mono p-2 rounded border border-white/[0.06] flex gap-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400" />
            <span className="text-white/50">granted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 rounded-sm bg-neutral-700" />
            <span className="text-white/50">denied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_4px_#00aaff]" />
            <span className="text-white/50">inherited</span>
          </div>
        </div>
      </Html>
    </group>
  );
}

PermissionMatrix.displayName = "PermissionMatrix";
