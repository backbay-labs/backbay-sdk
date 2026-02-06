"""API request/response schemas for the Glyph agent service."""

from datetime import date, datetime
from enum import Enum
from typing import Any

from pydantic import Field

from cyntra.commons import BaseSchema, SurfaceType

from .core import (
    Block,
    Episode,
    Mission,
    MissionConstraints,
    MissionKind,
    MissionPreferences,
    UserProfile,
)

# ============================================================================
# Enums
# ============================================================================


class AgentMessageRole(str, Enum):
    """Role in an agent conversation."""

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


# ============================================================================
# Base message types
# ============================================================================


class AgentMessage(BaseSchema):
    """A single message in an agent conversation."""

    role: AgentMessageRole
    content: str
    name: str | None = None  # For tool messages
    tool_call_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AgentResponse(BaseSchema):
    """Response from the agent for a chat interaction."""

    message: AgentMessage
    conversation_id: str
    session_id: str | None = None

    # Structured data the agent decided to return
    mission: Mission | None = None
    blocks: list[Block] = Field(default_factory=list)
    episode: Episode | None = None

    # UI hints
    suggested_actions: list[str] = Field(default_factory=list)
    show_mission_card: bool = False
    show_block_timer: bool = False

    # Debug/telemetry
    tokens_used: int | None = None
    latency_ms: int | None = None


# ============================================================================
# Plan Mission
# ============================================================================


class PlanMissionRequest(BaseSchema):
    """Request to plan a new mission."""

    # Natural language input from user
    raw_input: str = Field(
        ...,
        description="User's messy description of what they want to accomplish.",
    )

    # Optional structured hints
    kind: MissionKind | None = None
    deadline: date | None = None
    estimated_hours: float | None = None

    # Constraints and preferences
    constraints: MissionConstraints | None = None
    preferences: MissionPreferences | None = None

    # Context - use OTHER for direct API calls
    surface: SurfaceType = SurfaceType.OTHER
    graph_context: list[str] = Field(
        default_factory=list,
        description="Node IDs from Outora graph to anchor this mission to.",
    )


class ProposedBlock(BaseSchema):
    """A block proposed by the planner (not yet committed)."""

    title: str
    plan_note: str | None = None
    suggested_date: date | None = None
    suggested_duration_minutes: int = 25
    sequence_index: int = 0


class PlanMissionResponse(BaseSchema):
    """Response from mission planning."""

    mission: Mission
    proposed_blocks: list[ProposedBlock] = Field(default_factory=list)

    # Glyph's explanation of the plan
    summary: str
    rationale: str | None = None

    # Insights from history
    similar_missions_note: str | None = Field(
        None,
        description="If Glyph found similar past missions, a note about what worked/didn't.",
    )

    # Warnings or suggestions
    warnings: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


# ============================================================================
# Run Session (Coach mode)
# ============================================================================


class EnergyLevel(str, Enum):
    """User's self-reported energy level."""

    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class RunSessionRequest(BaseSchema):
    """Request to start or continue a focus session."""

    mission_id: str | None = Field(
        None,
        description="If provided, session is for this specific mission.",
    )
    block_id: str | None = Field(
        None,
        description="If provided, resuming an existing block.",
    )

    # User state
    available_minutes: int | None = Field(
        None,
        description="How much time the user has available.",
    )
    energy_level: EnergyLevel | None = None
    mood_note: str | None = Field(
        None,
        description="Free-form note about how user is feeling.",
    )

    # Context
    surface: SurfaceType = SurfaceType.FOCUS_DOCK

    # For mid-session adjustments
    is_continuation: bool = False
    adjustment_request: str | None = Field(
        None,
        description="If mid-session, what does the user want to adjust?",
    )


class SessionAction(BaseSchema):
    """A concrete action for the user to take during a session."""

    description: str
    estimated_minutes: int | None = None
    is_stretch_goal: bool = False


class RunSessionResponse(BaseSchema):
    """Response with session guidance."""

    block: Block
    actions: list[SessionAction] = Field(default_factory=list)

    # Glyph's message
    brief: str = Field(
        ...,
        description="Short motivational/instructional message for starting the block.",
    )

    # Timer settings
    recommended_duration_minutes: int = 25
    break_after_minutes: int | None = None

    # UI hints
    show_timer: bool = True
    enable_leak_tracking: bool = True

    # Warnings
    warnings: list[str] = Field(default_factory=list)


# ============================================================================
# Reflect Period (Archivist mode)
# ============================================================================


class ReflectPeriodKind(str, Enum):
    """What period we're reflecting on."""

    BLOCK = "block"
    DAY = "day"
    WEEK = "week"
    MISSION = "mission"


class ReflectPeriodRequest(BaseSchema):
    """Request to reflect on a period of work."""

    kind: ReflectPeriodKind
    mission_id: str | None = None
    block_id: str | None = None

    # Time range for day/week reflections
    start_date: date | None = None
    end_date: date | None = None

    # User's reflection input
    user_reflection: str | None = Field(
        None,
        description="User's own words about how things went.",
    )
    focus_score: int | None = Field(None, ge=1, le=5)
    energy_score: int | None = Field(None, ge=1, le=5)

    # Context
    surface: SurfaceType = SurfaceType.FOCUS_DOCK


class PatternInsight(BaseSchema):
    """An insight Glyph has derived from patterns."""

    description: str
    confidence: float = Field(ge=0.0, le=1.0)
    supporting_data: str | None = None
    suggested_action: str | None = None


class ReflectPeriodResponse(BaseSchema):
    """Response from period reflection."""

    episode: Episode

    # Glyph's summary
    summary: str
    highlights: list[str] = Field(default_factory=list)
    challenges: list[str] = Field(default_factory=list)

    # Pattern insights
    patterns: list[PatternInsight] = Field(default_factory=list)

    # Stats for the period
    total_focused_minutes: int = 0
    total_leaked_minutes: int = 0
    blocks_completed: int = 0
    completion_rate: float | None = None

    # Updated profile (if stats changed)
    updated_profile: UserProfile | None = None

    # Suggestions for next time
    suggestions: list[str] = Field(default_factory=list)


# ============================================================================
# Chat (free-form conversation with Glyph)
# ============================================================================


class ChatRequest(BaseSchema):
    """Request for free-form chat with Glyph."""

    message: str
    conversation_id: str | None = None
    session_id: str | None = None

    # Context
    surface: SurfaceType = SurfaceType.FOCUS_DOCK
    current_mission_id: str | None = None
    current_block_id: str | None = None

    # History (if not using conversation_id)
    history: list[AgentMessage] = Field(default_factory=list)


class ChatResponse(BaseSchema):
    """Response from free-form chat."""

    response: AgentResponse
    conversation_id: str

    # If chat resulted in structured actions
    created_mission: Mission | None = None
    created_block: Block | None = None
    created_episode: Episode | None = None

    # Follow-up suggestions
    suggested_follow_ups: list[str] = Field(default_factory=list)


# ============================================================================
# Utility types
# ============================================================================


class RepositoryBundle(BaseSchema):
    """Bundle of repository references for dependency injection.

    This is a marker type - actual implementation uses protocol classes.
    Used for type hints in GlyphAgentService constructor.
    """

    model_config = {"arbitrary_types_allowed": True}


class MissionSummary(BaseSchema):
    """Lightweight mission summary for lists."""

    id: str
    title: str
    kind: MissionKind
    status: str
    deadline_date: date | None = None
    progress_percent: float | None = None
    last_activity: datetime | None = None


class BlockSummary(BaseSchema):
    """Lightweight block summary for lists."""

    id: str
    mission_id: str
    title: str | None = None
    status: str
    scheduled_start: datetime | None = None
    planned_duration_minutes: int | None = None
