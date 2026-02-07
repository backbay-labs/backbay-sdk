"""Browser/Sideglyph adapter stub.

Will integrate with Sideglyph browser extension to track
browsing activity and detect leaks.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class BrowsingEvent:
    """A browsing event from Sideglyph."""

    timestamp: datetime
    domain: str
    url: str
    title: str
    duration_seconds: int
    category: str  # 'in_scope', 'leak', 'neutral'


class BrowserAdapter:
    """Adapter for browser/Sideglyph integration.

    MVP: Stub implementation that returns empty data.
    """

    def __init__(self, config: dict[str, Any] | None = None) -> None:
        self._config = config or {}
        self._connected = False

    async def connect(self) -> bool:
        """Connect to Sideglyph service."""
        # Stub - always returns False (not connected)
        return False

    async def disconnect(self) -> None:
        """Disconnect from Sideglyph service."""
        self._connected = False

    @property
    def is_connected(self) -> bool:
        """Check if connected to Sideglyph."""
        return self._connected

    async def get_recent_events(
        self,
        user_id: str,
        minutes: int = 30,
    ) -> list[BrowsingEvent]:
        """Get recent browsing events."""
        # Stub - returns empty list
        return []

    async def get_current_domain(self, user_id: str) -> str | None:
        """Get the domain the user is currently on."""
        # Stub
        return None

    async def get_time_by_category(
        self,
        user_id: str,
        minutes: int = 60,
    ) -> dict[str, int]:
        """Get time spent by category in the last N minutes."""
        # Stub
        return {
            "in_scope": 0,
            "leak": 0,
            "neutral": 0,
        }

    async def is_in_scope(
        self,
        user_id: str,
        mission_domains: list[str] | None = None,
    ) -> bool:
        """Check if current browsing is in-scope for the mission."""
        # Stub - assume in scope
        return True
