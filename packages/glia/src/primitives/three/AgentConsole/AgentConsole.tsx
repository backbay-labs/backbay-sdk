"use client";

/**
 * AgentConsole - Main conversational agent interface
 *
 * Integrates GlyphAvatar, ConsoleChat, QuickActions, and FocusConstellation
 * into a unified agent interface experience.
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GlyphAvatar } from "./GlyphAvatar";
import { ConsoleChat } from "./ConsoleChat";
import { QuickActions } from "./QuickActions";
import { FocusConstellation } from "./FocusConstellation";
import type { AgentConsoleProps, Message, FocusNode, QuickAction } from "./types";

// -----------------------------------------------------------------------------
// Console Scene (inside Canvas)
// -----------------------------------------------------------------------------

interface ConsoleSceneProps {
  agentState: AgentConsoleProps["agentState"];
  agentMode: AgentConsoleProps["agentMode"];
  trustTier: AgentConsoleProps["trustTier"];
  isTyping: boolean;
  messages: Message[];
  focusNodes: FocusNode[];
  quickActions: QuickAction[];
  focusedNodeId: string | null;
  onPromptSubmit: (text: string) => void;
  onFocusNodeClick?: (id: string) => void;
  onQuickAction?: (actionId: string) => void;
  onEntityClick?: AgentConsoleProps["onEntityClick"];
  onAvatarClick?: () => void;
}

function ConsoleScene({
  agentState,
  agentMode,
  trustTier,
  isTyping,
  messages,
  focusNodes,
  quickActions,
  focusedNodeId,
  onPromptSubmit,
  onFocusNodeClick,
  onQuickAction,
  onEntityClick,
  onAvatarClick,
}: ConsoleSceneProps) {
  return (
    <>
      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={8}
        maxPolarAngle={Math.PI / 2 + 0.3}
        autoRotate={false}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <directionalLight position={[-5, -5, -5]} intensity={0.2} />

      {/* Central agent avatar */}
      <GlyphAvatar
        state={agentState}
        mode={agentMode}
        trustTier={trustTier}
        position={[0, 0, 0]}
        scale={1}
        onClick={onAvatarClick}
      />

      {/* Focus constellation around avatar */}
      {focusNodes.length > 0 && (
        <FocusConstellation
          nodes={focusNodes}
          focusedId={focusedNodeId}
          onNodeClick={onFocusNodeClick}
          radius={1.5}
          position={[0, 0, 0]}
        />
      )}

      {/* Quick actions above avatar */}
      {quickActions.length > 0 && onQuickAction && (
        <QuickActions
          actions={quickActions}
          onAction={onQuickAction}
          direction="horizontal"
          position={[0, 1.2, 0]}
        />
      )}

      {/* Chat interface below avatar */}
      <ConsoleChat
        messages={messages}
        isTyping={isTyping}
        onSubmit={onPromptSubmit}
        onEntityClick={onEntityClick}
        position={[0, -1.5, 0]}
        maxVisibleMessages={8}
      />

      {/* Subtle grid for grounding */}
      <gridHelper args={[10, 20, "#1a1a2e", "#1a1a2e"]} position={[0, -2, 0]} />
    </>
  );
}

// -----------------------------------------------------------------------------
// Agent Console Container
// -----------------------------------------------------------------------------

export function AgentConsole({
  agentState,
  agentMode = "conversational",
  trustTier = "bronze",
  isTyping = false,
  messages = [],
  focusNodes = [],
  quickActions = [],
  focusedNodeId = null,
  onPromptSubmit,
  onFocusNodeClick,
  onQuickAction,
  onEntityClick,
  onAvatarClick,
  className,
  style,
}: AgentConsoleProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "linear-gradient(to bottom, #0a0a15, #050510)",
        ...style,
      }}
    >
      <Canvas
        camera={{
          position: [0, 1, 4],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 2]}
      >
        <ConsoleScene
          agentState={agentState}
          agentMode={agentMode}
          trustTier={trustTier}
          isTyping={isTyping}
          messages={messages}
          focusNodes={focusNodes}
          quickActions={quickActions}
          focusedNodeId={focusedNodeId}
          onPromptSubmit={onPromptSubmit}
          onFocusNodeClick={onFocusNodeClick}
          onQuickAction={onQuickAction}
          onEntityClick={onEntityClick}
          onAvatarClick={onAvatarClick}
        />
      </Canvas>

      {/* State indicator overlay */}
      <div className="absolute top-4 right-4 bg-[rgba(2,4,10,0.85)] backdrop-blur-xl border border-white/[0.06] text-white/60 text-xs font-mono p-2 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                agentState === "idle" ? "#22D3EE" :
                agentState === "listening" ? "#10B981" :
                agentState === "thinking" ? "#eab308" :
                agentState === "responding" ? "#22D3EE" :
                "#F43F5E",
              boxShadow:
                `0 0 6px ${
                  agentState === "idle" ? "#22D3EE" :
                  agentState === "listening" ? "#10B981" :
                  agentState === "thinking" ? "#eab308" :
                  agentState === "responding" ? "#22D3EE" :
                  "#F43F5E"
                }`,
            }}
          />
          <span className="uppercase tracking-wider">{agentState.toUpperCase()}</span>
        </div>
        <div className="text-white/40 mt-1 uppercase tracking-wider">{agentMode}</div>
      </div>
    </div>
  );
}
