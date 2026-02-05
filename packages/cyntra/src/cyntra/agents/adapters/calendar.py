"""Calendar adapter stub.

Will integrate with Google/Microsoft calendar to understand
user availability.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class CalendarEvent:
    """A calendar event."""

    id: str
    title: str
    start: datetime
    end: datetime
    is_all_day: bool
    location: str | None
    is_busy: bool  # vs. free/tentative


@dataclass
class TimeSlot:
    """A time slot (free or busy)."""

    start: datetime
    end: datetime
    is_free: bool


class CalendarAdapter:
    """Adapter for calendar integration.

    MVP: Stub implementation that returns empty data.
    """

    def __init__(self, config: dict[str, Any] | None = None) -> None:
        self._config = config or {}
        self._connected = False

    async def connect(self) -> bool:
        """Connect to calendar service."""
        # Stub
        return False

    async def disconnect(self) -> None:
        """Disconnect from calendar."""
        self._connected = False

    @property
    def is_connected(self) -> bool:
        """Check if connected."""
        return self._connected

    async def get_events(
        self,
        user_id: str,
        start: datetime,
        end: datetime,
    ) -> list[CalendarEvent]:
        """Get calendar events in a time range."""
        # Stub
        return []

    async def get_free_slots(
        self,
        user_id: str,
        start: datetime,
        end: datetime,
        min_duration_minutes: int = 25,
    ) -> list[TimeSlot]:
        """Get free time slots."""
        # Stub - assume all time is free
        return [
            TimeSlot(
                start=start,
                end=end,
                is_free=True,
            )
        ]

    async def get_next_event(self, user_id: str) -> CalendarEvent | None:
        """Get the next upcoming event."""
        # Stub
        return None

    async def is_user_free(
        self,
        user_id: str,
        at_time: datetime | None = None,
    ) -> bool:
        """Check if user is free at a specific time."""
        # Stub - assume free
        return True

    async def get_available_minutes(
        self,
        user_id: str,
        from_time: datetime | None = None,
    ) -> int | None:
        """Get minutes available until next event."""
        # Stub - assume plenty of time
        return 120
