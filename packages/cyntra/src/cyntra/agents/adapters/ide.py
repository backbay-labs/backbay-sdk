"""IDE/coding activity adapter stub.

Will integrate with VS Code extension or similar to track
coding activity.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class CodingEvent:
    """A coding activity event."""

    timestamp: datetime
    project: str
    file_path: str
    language: str
    lines_added: int
    lines_removed: int
    duration_seconds: int


class IDEAdapter:
    """Adapter for IDE/coding activity integration.

    MVP: Stub implementation that returns empty data.
    """

    def __init__(self, config: dict[str, Any] | None = None) -> None:
        self._config = config or {}
        self._connected = False

    async def connect(self) -> bool:
        """Connect to IDE tracking service."""
        # Stub
        return False

    async def disconnect(self) -> None:
        """Disconnect from IDE tracking."""
        self._connected = False

    @property
    def is_connected(self) -> bool:
        """Check if connected."""
        return self._connected

    async def get_recent_events(
        self,
        user_id: str,
        minutes: int = 30,
    ) -> list[CodingEvent]:
        """Get recent coding events."""
        # Stub
        return []

    async def get_current_project(self, user_id: str) -> str | None:
        """Get the project the user is currently working on."""
        # Stub
        return None

    async def get_current_file(self, user_id: str) -> str | None:
        """Get the file the user is currently editing."""
        # Stub
        return None

    async def get_time_by_language(
        self,
        user_id: str,
        minutes: int = 60,
    ) -> dict[str, int]:
        """Get coding time by language."""
        # Stub
        return {}

    async def get_lines_written(
        self,
        user_id: str,
        minutes: int = 60,
    ) -> int:
        """Get total lines written in the period."""
        # Stub
        return 0

