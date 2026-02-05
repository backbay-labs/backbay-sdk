"""Telemetry adapter for logging and tracing.

Provides structured logging and metrics collection.
"""

import logging
from datetime import datetime
from typing import Any

logger = logging.getLogger("cyntra.agents")


class TelemetryAdapter:
    """Adapter for telemetry, logging, and tracing.

    MVP: Simple logging implementation.
    Can be extended to integrate with Prometheus, OpenTelemetry, etc.
    """

    def __init__(
        self,
        service_name: str = "glyph",
        config: dict[str, Any] | None = None,
    ) -> None:
        self._service_name = service_name
        self._config = config or {}
        self._enabled = self._config.get("enabled", True)

    def log_event(
        self,
        event_name: str,
        data: dict[str, Any] | None = None,
        level: str = "info",
    ) -> None:
        """Log a structured event."""
        if not self._enabled:
            return

        log_data = {
            "service": self._service_name,
            "event": event_name,
            "timestamp": datetime.now().isoformat(),
            **(data or {}),
        }

        log_func = getattr(logger, level, logger.info)
        log_func(f"{event_name}: {log_data}")

    def log_error(
        self,
        error: Exception,
        context: dict[str, Any] | None = None,
    ) -> None:
        """Log an error with context."""
        if not self._enabled:
            return

        log_data = {
            "service": self._service_name,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "timestamp": datetime.now().isoformat(),
            **(context or {}),
        }

        logger.error(f"Error: {log_data}", exc_info=True)

    def start_span(self, name: str) -> "TelemetrySpan":
        """Start a telemetry span for tracing."""
        return TelemetrySpan(self, name)

    def record_metric(
        self,
        name: str,
        value: float,
        tags: dict[str, str] | None = None,
    ) -> None:
        """Record a metric value."""
        if not self._enabled:
            return

        # MVP: Just log the metric
        logger.debug(f"Metric {name}={value} tags={tags}")


class TelemetrySpan:
    """A telemetry span for tracing operations."""

    def __init__(self, adapter: TelemetryAdapter, name: str) -> None:
        self._adapter = adapter
        self._name = name
        self._start_time = datetime.now()
        self._attributes: dict[str, Any] = {}

    def set_attribute(self, key: str, value: Any) -> None:
        """Set an attribute on the span."""
        self._attributes[key] = value

    def end(self) -> None:
        """End the span."""
        duration_ms = (datetime.now() - self._start_time).total_seconds() * 1000
        self._adapter.log_event(
            f"span.{self._name}",
            {
                "duration_ms": duration_ms,
                **self._attributes,
            },
            level="debug",
        )

    def __enter__(self) -> "TelemetrySpan":
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if exc_val:
            self.set_attribute("error", str(exc_val))
        self.end()
