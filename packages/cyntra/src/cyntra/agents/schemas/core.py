"""Core domain schemas for the Glyph agent system."""

from datetime import date, datetime
from enum import Enum
from typing import Any

from pydantic import Field

from cyntra.commons import BaseSchema


class MissionKind(str, Enum):
    EXAM = "exam"
    PROJECT = "project"
    HABIT = "habit"
    LIFE_ADMIN = "life_admin"
    OTHER = "other"


class MissionStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class MissionPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class GraphNodeRef(BaseSchema):
    """Reference into Outora/Segrada graph(s)."""

    graph_id: str = Field(..., description="Name/id of the graph (e.g. 'semester_2025').")
    node_id: str = Field(..., description="Node ID within the graph.")
    weight: float = Field(
        1.0,
        description="How central this node is to the mission (0–1).",
    )


class MissionConstraints(BaseSchema):
    """User / life constraints specific to this mission."""

    max_daily_minutes: int | None = Field(None, description="Soft cap on time per day for this mission.")
    no_nights_after: int | None = Field(
        None,
        description="Hour in 24h time after which Glyph shouldn't schedule (e.g. 23).",
    )
    days_off: list[int] = Field(
        default_factory=list,
        description="Weekday indices (0=Mon) the user prefers not to work on this mission.",
    )
    # extendable: min_block_minutes, max_block_minutes, etc.


class MissionPreferences(BaseSchema):
    """Mission-scoped preferences that override global defaults."""

    preferred_block_lengths: list[int] | None = Field(
        None, description="List of candidate block lengths in minutes (e.g. [25, 40])."
    )
    intensity: str | None = Field(
        None,
        description="Freeform or enum later (e.g. 'chill', 'normal', 'sprint').",
    )
    notes_for_glyph: str | None = Field(None, description="Anything the user wants Glyph to remember for this mission.")


class Mission(BaseSchema):
    """A high-level goal or project the user is working toward."""

    id: str
    user_id: str

    title: str
    description: str | None = None

    kind: MissionKind = MissionKind.OTHER
    status: MissionStatus = MissionStatus.ACTIVE
    priority: MissionPriority = MissionPriority.MEDIUM

    created_at: datetime
    updated_at: datetime

    planned_start_date: date | None = None
    deadline_date: date | None = None

    estimated_total_minutes: int | None = Field(None, description="Rough total effort in minutes.")

    tags: list[str] = Field(default_factory=list)

    graph_links: list[GraphNodeRef] = Field(default_factory=list, description="Concept nodes this mission is tied to.")

    constraints: MissionConstraints = Field(default_factory=MissionConstraints)
    preferences: MissionPreferences = Field(default_factory=MissionPreferences)

    # For quick UX / analytics
    archived: bool = False


class BlockStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    SKIPPED = "skipped"


class Block(BaseSchema):
    """A timeboxed focus session within a mission."""

    id: str
    user_id: str
    mission_id: str

    # For ordered timelines / UX
    sequence_index: int | None = Field(
        None,
        description="Optional increasing index within the mission; useful for ordering.",
    )

    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    planned_duration_minutes: int | None = None

    actual_start: datetime | None = None
    actual_end: datetime | None = None

    status: BlockStatus = BlockStatus.PLANNED

    title: str | None = Field(None, description="Short label, e.g. 'Org Chem Ch. 5 practice problems'.")
    plan_note: str | None = Field(None, description="What Glyph/user agreed to focus on this block.")

    # High-level outcome fields for quick stats
    outcome_note: str | None = None
    completion_ratio: float | None = Field(
        None,
        ge=0.0,
        le=1.0,
        description="0–1 for 'how much of the planned work was completed'.",
    )

    # Optional context
    location_hint: str | None = Field(None, description="'home desk', 'library', etc.")
    device_hint: str | None = Field(None, description="'laptop', 'ipad', etc.")


class LeakCategory(str, Enum):
    SOCIAL = "social"
    VIDEO = "video"
    CHAT = "chat"
    NEWS = "news"
    SHOPPING = "shopping"
    EMAIL = "email"
    GAMING = "gaming"
    RANDOM_WEB = "random_web"
    OTHER = "other"


class LeakEvent(BaseSchema):
    """A distraction/leak event during a focus session."""

    timestamp: datetime
    category: LeakCategory
    source: str = Field(..., description="Domain or app name, e.g. 'twitter.com', 'discord'.")
    duration_seconds: int | None = None
    note: str | None = None


class EpisodeKind(str, Enum):
    SESSION = "session"
    DAY = "day"
    MISSION = "mission"
    META = "meta"  # e.g. big-picture reflections


class EmotionLabel(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    NEUTRAL = "neutral"
    HIGH = "high"
    VERY_HIGH = "very_high"


class Episode(BaseSchema):
    """A recorded memory unit about a session, day, or period."""

    id: str
    user_id: str

    kind: EpisodeKind
    created_at: datetime

    mission_id: str | None = None
    block_id: str | None = None

    # Text that will be ingested into semantic memory
    title: str | None = None
    summary: str = Field(
        ...,
        description="Concise summary of what happened; written by Glyph, possibly edited by user.",
    )
    reflection: str | None = Field(
        None,
        description="User's own words, if they typed anything.",
    )

    # Simple labelled fields for fast querying
    mood_before: EmotionLabel | None = None
    mood_after: EmotionLabel | None = None

    focus_score: int | None = Field(None, ge=1, le=5, description="User self-rated focus quality (1–5).")
    energy_score: int | None = Field(None, ge=1, le=5, description="Self-rated energy (1–5).")

    time_focused_minutes: int | None = None
    time_leaked_minutes: int | None = None

    leaks: list[LeakEvent] = Field(default_factory=list)

    tags: list[str] = Field(
        default_factory=list,
        description="Freeform labels for later patterns (e.g. 'night_session', 'crunch').",
    )

    meta: dict[str, Any] = Field(
        default_factory=dict,
        description="Escape hatch for experiment flags / algorithm notes.",
    )


class NudgeLevel(str, Enum):
    OFF = "off"
    SOFT = "soft"
    NORMAL = "normal"
    AGGRESSIVE = "aggressive"


class UserPreferences(BaseSchema):
    """User-level preferences for Glyph behavior."""

    timezone: str = "UTC"
    preferred_block_lengths: list[int] = Field(
        default_factory=lambda: [25, 40],
        description="Default candidate block lengths in minutes.",
    )
    typical_wake_hour: int | None = None  # 0–23
    typical_sleep_hour: int | None = None

    nudge_level: NudgeLevel = NudgeLevel.NORMAL
    sideglyph_enabled: bool = True
    browser_tracking_enabled: bool = True

    # Additional UX toggles can go here as booleans or small enums.


class UserStats(BaseSchema):
    """Rolling stats; windowing handled by backend, not stored here."""

    total_missions_created: int = 0
    total_blocks_completed: int = 0
    total_focused_minutes: int = 0

    # Simple pattern hints for Planner/Coach
    avg_block_length_successful: int | None = None
    avg_start_hour_successful: float | None = None  # e.g. 9.5 -> 9:30

    night_sessions_failure_rate: float | None = None  # 0–1
    morning_sessions_success_rate: float | None = None  # 0–1


class UserProfile(BaseSchema):
    """A user's profile including preferences and stats."""

    user_id: str
    created_at: datetime
    updated_at: datetime

    display_name: str | None = None

    preferences: UserPreferences = Field(default_factory=UserPreferences)
    stats: UserStats = Field(default_factory=UserStats)

    # For Glyph-specific experiments / behaviors:
    persona_notes: str | None = Field(
        None,
        description="Glyph's own notes about how to best talk to this user (meta, not shown directly).",
    )
