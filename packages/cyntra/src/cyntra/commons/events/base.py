"""Base event envelope for cross-service messaging."""

from datetime import datetime
from typing import Any

from cyntra.commons.core.ids import new_id
from cyntra.commons.schema.base import BaseSchema
from cyntra.commons.time.utils import now_utc


class EventEnvelope(BaseSchema):
    """Standard envelope for events emitted across the system.

    All events should be wrapped in this envelope to provide
    consistent metadata for tracing, versioning, and routing.

    Example:
        event = EventEnvelope(
            type="mission.created",
            source="backend",
            payload=MissionCreatedEvent(...).to_dict(),
        )
    """

    id: str
    """Unique event ID (auto-generated if not provided)."""

    type: str
    """Event type string (e.g., 'mission.created', 'block.completed')."""

    created_at: datetime
    """When the event was created (auto-generated if not provided)."""

    source: str
    """Service that emitted the event (e.g., 'backend', 'agents')."""

    payload: dict[str, Any]
    """Event-specific data. Schema depends on event type."""

    version: str = "v1"
    """Event schema version for backwards compatibility."""

    correlation_id: str | None = None
    """Optional correlation ID for request tracing."""

    @classmethod
    def create(
        cls,
        type: str,
        source: str,
        payload: dict[str, Any],
        correlation_id: str | None = None,
        version: str = "v1",
    ) -> "EventEnvelope":
        """Factory method to create an event with auto-generated fields.

        Args:
            type: Event type string.
            source: Service name.
            payload: Event data.
            correlation_id: Optional correlation ID.
            version: Event schema version.

        Returns:
            New EventEnvelope instance.
        """
        return cls(
            id=new_id(),
            type=type,
            created_at=now_utc(),
            source=source,
            payload=payload,
            correlation_id=correlation_id,
            version=version,
        )

