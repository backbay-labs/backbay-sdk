"""External signal tools for the Glyph agent.

These tools provide context from external systems:
- Browser activity (via Sideglyph)
- IDE activity (coding time)
- Calendar availability

MVP: All stubbed. Real implementations will integrate with
adapters when those systems are connected.
"""

from datetime import datetime, timedelta
from typing import Any


class ExternalSignalTools:
    """Tools for getting external context signals.

    All methods return empty/default values in MVP.
    Real implementations will use the adapters module.
    """

    def __init__(
        self,
        browser_adapter: Any | None = None,
        ide_adapter: Any | None = None,
        calendar_adapter: Any | None = None,
    ) -> None:
        self._browser = browser_adapter
        self._ide = ide_adapter
        self._calendar = calendar_adapter

    async def get_browser_activity(
        self,
        user_id: str,
        window_minutes: int = 30,
    ) -> dict[str, Any]:
        """Get recent browser activity summary.

        Returns:
            Dict with keys:
            - domains_visited: list of domains
            - time_per_category: dict of category -> minutes
            - is_in_scope: whether recent activity matches mission
            - leaks: list of leak events
        """
        # Stub for MVP
        return {
            "domains_visited": [],
            "time_per_category": {},
            "is_in_scope": True,
            "leaks": [],
            "available": False,
        }

    async def get_ide_activity(
        self,
        user_id: str,
        window_minutes: int = 30,
    ) -> dict[str, Any]:
        """Get recent IDE/coding activity summary.

        Returns:
            Dict with keys:
            - active_project: current project name
            - files_touched: list of file paths
            - lines_written: approximate line count
            - languages: dict of language -> minutes
        """
        # Stub for MVP
        return {
            "active_project": None,
            "files_touched": [],
            "lines_written": 0,
            "languages": {},
            "available": False,
        }

    async def get_calendar_slots(
        self,
        user_id: str,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> dict[str, Any]:
        """Get available calendar slots.

        Returns:
            Dict with keys:
            - busy_slots: list of (start, end) tuples
            - free_slots: list of (start, end) tuples
            - next_event: next upcoming event summary
        """
        # Stub for MVP - assume user is always free
        start = start or datetime.now()
        end = end or start + timedelta(hours=8)

        return {
            "busy_slots": [],
            "free_slots": [(start, end)],
            "next_event": None,
            "available": False,
        }

    async def is_user_active(self, user_id: str) -> bool:
        """Check if user appears to be active (any recent signals)."""
        # Stub - always return True in MVP
        return True

    async def get_current_context_summary(
        self,
        user_id: str,
    ) -> str:
        """Get a text summary of current context for the agent.

        Combines signals from all available sources.
        """
        parts = []

        browser = await self.get_browser_activity(user_id)
        if browser.get("available"):
            if browser.get("is_in_scope"):
                parts.append("Browser activity appears on-task")
            else:
                parts.append("Browser activity may be off-task")

        ide = await self.get_ide_activity(user_id)
        if ide.get("available") and ide.get("active_project"):
            parts.append(f"Active in {ide['active_project']}")

        if not parts:
            return "No external context available (signals not connected)"

        return ". ".join(parts)

