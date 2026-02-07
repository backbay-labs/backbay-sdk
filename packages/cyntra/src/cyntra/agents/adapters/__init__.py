"""Adapters for external system integration.

These are stubs for MVP - real implementations will be added
when integrating with browser, IDE, and calendar systems.
"""

from .browser import BrowserAdapter
from .calendar import CalendarAdapter
from .ide import IDEAdapter
from .telemetry import TelemetryAdapter

__all__ = [
    "BrowserAdapter",
    "CalendarAdapter",
    "IDEAdapter",
    "TelemetryAdapter",
]
