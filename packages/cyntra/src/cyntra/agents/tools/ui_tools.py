"""UI interaction tools for the Glyph agent.

These tools allow Glyph to send notifications and control UI state.
In MVP, they just record intentions - actual UI control happens
at the surface layer (Focus Dock, Sideglyph, etc.).
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any


class NotificationPriority(str, Enum):
    """Priority level for notifications."""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationType(str, Enum):
    """Type of notification."""

    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    NUDGE = "nudge"
    CELEBRATION = "celebration"


@dataclass
class PendingNotification:
    """A notification queued to be shown to the user."""

    id: str
    title: str
    message: str
    notification_type: NotificationType
    priority: NotificationPriority
    created_at: datetime
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class UIState:
    """Current UI state tracked by tools."""

    focus_mode_active: bool = False
    timer_running: bool = False
    timer_remaining_seconds: int | None = None
    current_block_id: str | None = None
    pending_notifications: list[PendingNotification] = field(default_factory=list)


class UITools:
    """Tools for UI interactions.

    These methods queue up UI actions that get consumed by the
    surface layer (Focus Dock, etc.).
    """

    def __init__(self) -> None:
        self._state = UIState()
        self._notification_counter = 0

    @property
    def state(self) -> UIState:
        """Get current UI state."""
        return self._state

    def show_notification(
        self,
        title: str,
        message: str,
        *,
        notification_type: NotificationType = NotificationType.INFO,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        metadata: dict[str, Any] | None = None,
    ) -> str:
        """Queue a notification to show the user.

        Returns the notification ID.
        """
        self._notification_counter += 1
        notification_id = f"notif_{self._notification_counter}"

        notification = PendingNotification(
            id=notification_id,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            created_at=datetime.now(),
            metadata=metadata or {},
        )
        self._state.pending_notifications.append(notification)
        return notification_id

    def focus_mode_on(
        self,
        block_id: str | None = None,
        duration_minutes: int | None = None,
    ) -> None:
        """Activate focus mode."""
        self._state.focus_mode_active = True
        self._state.current_block_id = block_id
        if duration_minutes:
            self._state.timer_running = True
            self._state.timer_remaining_seconds = duration_minutes * 60

    def focus_mode_off(self) -> None:
        """Deactivate focus mode."""
        self._state.focus_mode_active = False
        self._state.timer_running = False
        self._state.timer_remaining_seconds = None
        self._state.current_block_id = None

    def start_timer(self, duration_minutes: int) -> None:
        """Start a focus timer."""
        self._state.timer_running = True
        self._state.timer_remaining_seconds = duration_minutes * 60

    def stop_timer(self) -> None:
        """Stop the focus timer."""
        self._state.timer_running = False
        self._state.timer_remaining_seconds = None

    def pause_timer(self) -> None:
        """Pause the focus timer (keeps remaining time)."""
        self._state.timer_running = False

    def resume_timer(self) -> None:
        """Resume a paused timer."""
        if self._state.timer_remaining_seconds is not None:
            self._state.timer_running = True

    def pop_notifications(self) -> list[PendingNotification]:
        """Get and clear pending notifications."""
        notifications = self._state.pending_notifications
        self._state.pending_notifications = []
        return notifications

    def send_nudge(
        self,
        message: str,
        *,
        gentle: bool = True,
    ) -> str:
        """Send a nudge notification.

        Nudges are special notifications for redirecting focus.
        """
        priority = NotificationPriority.NORMAL if gentle else NotificationPriority.HIGH
        return self.show_notification(
            title="Nudge from Glyph",
            message=message,
            notification_type=NotificationType.NUDGE,
            priority=priority,
        )

    def celebrate(self, message: str) -> str:
        """Send a celebration notification."""
        return self.show_notification(
            title="🎉 Nice!",
            message=message,
            notification_type=NotificationType.CELEBRATION,
            priority=NotificationPriority.NORMAL,
        )
