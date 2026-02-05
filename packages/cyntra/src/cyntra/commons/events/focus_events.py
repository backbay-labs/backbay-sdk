"""Focus-related event payload models.

These are shared event payloads used across services for
focus/productivity tracking features.
"""

from datetime import datetime

from cyntra.commons.schema.base import BaseSchema


class MissionCreatedEvent(BaseSchema):
    """Payload for mission.created events."""

    mission_id: str
    user_id: str
    created_at: datetime
    title: str | None = None


class BlockCompletedEvent(BaseSchema):
    """Payload for block.completed events."""

    block_id: str
    mission_id: str
    user_id: str
    completed_at: datetime
    focused_minutes: int | None = None


class EpisodeWrittenEvent(BaseSchema):
    """Payload for episode.written events."""

    episode_id: str
    user_id: str
    kind: str
    created_at: datetime
    mission_id: str | None = None


class SessionStartedEvent(BaseSchema):
    """Payload for session.started events."""

    session_id: str
    user_id: str
    started_at: datetime
    surface: str | None = None


class SessionEndedEvent(BaseSchema):
    """Payload for session.ended events."""

    session_id: str
    user_id: str
    ended_at: datetime
    duration_seconds: int | None = None

