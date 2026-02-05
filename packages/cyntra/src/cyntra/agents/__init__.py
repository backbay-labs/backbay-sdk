"""Segrada Agents - AI agent system for Out-of-Scope.

This package contains all pure agent/LLM logic for the Glyph focus companion:
- Persona + prompts
- LangGraph workflows (Planner/Coach/Archivist)
- Tool definitions
- Memory abstractions

It is framework-agnostic: no FastAPI, no HTTP wiring.
apps/backend is responsible for exposing these agents over HTTP.
"""

__version__ = "0.1.0"

# Configuration
from cyntra.agents.config import (
    DEFAULT_SETTINGS,
    AgentBehaviorConfig,
    AgentFeatureFlags,
    AgentSettings,
    CheckpointStoreConfig,
    CheckpointStoreType,
    get_coach_deployment,
    get_glyph_deployment,
    get_planner_deployment,
)

# Graphs
from cyntra.agents.graphs import (
    GlyphEntrypoint,
    GlyphMode,
    GraphRouter,
)

# Memory interfaces and implementations
from cyntra.agents.memory import (
    # Interfaces
    BlocksRepository,
    EpisodesRepository,
    GraphRepository,
    # In-memory implementations
    InMemoryBlocksRepository,
    InMemoryEpisodesRepository,
    InMemoryGraphRepository,
    InMemoryMissionsRepository,
    InMemorySemanticMemory,
    InMemoryUserProfileRepository,
    MissionsRepository,
    RepositoryBundle,
    SemanticMemory,
    UserProfileRepository,
    create_in_memory_repos,
)

# Schemas (re-export commonly used ones)
from cyntra.agents.schemas import (
    # API models
    AgentMessage,
    AgentResponse,
    # Core models
    Block,
    BlockStatus,
    ChatRequest,
    ChatResponse,
    Episode,
    EpisodeKind,
    Mission,
    MissionKind,
    MissionStatus,
    PlanMissionRequest,
    PlanMissionResponse,
    ReflectPeriodKind,
    ReflectPeriodRequest,
    ReflectPeriodResponse,
    RunSessionRequest,
    RunSessionResponse,
    SurfaceType,
    UserProfile,
)
from cyntra.agents.service import GlyphAgentService, KernelOrchestratorService, Telemetry

__all__ = [
    # Version
    "__version__",
    # Service
    "GlyphAgentService",
    "KernelOrchestratorService",
    "Telemetry",
    # Config
    "AgentBehaviorConfig",
    "AgentFeatureFlags",
    "AgentSettings",
    "CheckpointStoreConfig",
    "CheckpointStoreType",
    "DEFAULT_SETTINGS",
    "get_coach_deployment",
    "get_glyph_deployment",
    "get_planner_deployment",
    # Memory interfaces
    "BlocksRepository",
    "EpisodesRepository",
    "GraphRepository",
    "MissionsRepository",
    "RepositoryBundle",
    "SemanticMemory",
    "UserProfileRepository",
    # In-memory implementations
    "InMemoryBlocksRepository",
    "InMemoryEpisodesRepository",
    "InMemoryGraphRepository",
    "InMemoryMissionsRepository",
    "InMemorySemanticMemory",
    "InMemoryUserProfileRepository",
    "create_in_memory_repos",
    # Core schemas
    "Block",
    "BlockStatus",
    "Episode",
    "EpisodeKind",
    "Mission",
    "MissionKind",
    "MissionStatus",
    "UserProfile",
    # API schemas
    "AgentMessage",
    "AgentResponse",
    "ChatRequest",
    "ChatResponse",
    "PlanMissionRequest",
    "PlanMissionResponse",
    "ReflectPeriodKind",
    "ReflectPeriodRequest",
    "ReflectPeriodResponse",
    "RunSessionRequest",
    "RunSessionResponse",
    "SurfaceType",
    # Graphs
    "GlyphEntrypoint",
    "GlyphMode",
    "GraphRouter",
]
