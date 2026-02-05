"""Thin wrappers for distributed tracing.

Provides a minimal interface for tracing that degrades gracefully
when OpenTelemetry is not installed or not configured.
"""

from collections.abc import Generator
from contextlib import contextmanager
from typing import Any

# Try to import OpenTelemetry, but don't fail if not available
try:
    from opentelemetry import trace
    from opentelemetry.trace import Span, Tracer

    _OTEL_AVAILABLE = True
except ImportError:
    _OTEL_AVAILABLE = False
    trace = None  # type: ignore[assignment]
    Span = None  # type: ignore[assignment, misc]
    Tracer = None  # type: ignore[assignment, misc]


_tracer: Any | None = None


def init_tracer(service_name: str) -> None:
    """Initialize the global tracer.

    Should be called at application startup if tracing is enabled.
    No-op if OpenTelemetry is not installed.

    Args:
        service_name: Name of the service for span attribution.
    """
    global _tracer
    if _OTEL_AVAILABLE and trace is not None:
        _tracer = trace.get_tracer(service_name)


def get_tracer() -> Any | None:
    """Get the global tracer instance.

    Returns:
        The tracer, or None if tracing is not configured.
    """
    return _tracer


@contextmanager
def start_span(
    name: str,
    attributes: dict[str, Any] | None = None,
) -> Generator[Any]:
    """Start a new tracing span.

    Context manager that creates a span with the given name and attributes.
    If tracing is not available or not configured, this is a no-op.

    Args:
        name: Name of the span (e.g., "glyph.plan_mission").
        attributes: Optional dict of span attributes.

    Yields:
        The span object, or None if tracing is not available.

    Example:
        with start_span("process_request", {"user_id": "123"}) as span:
            # ... do work ...
            if span:
                span.set_attribute("result", "success")
    """
    if _tracer is None or not _OTEL_AVAILABLE:
        yield None
        return

    with _tracer.start_as_current_span(name, attributes=attributes) as span:
        yield span


def set_span_attribute(key: str, value: Any) -> None:
    """Set an attribute on the current span.

    No-op if tracing is not available or no span is active.

    Args:
        key: Attribute name.
        value: Attribute value.
    """
    if not _OTEL_AVAILABLE or trace is None:
        return

    span = trace.get_current_span()
    if span is not None:
        span.set_attribute(key, value)


def record_exception(exception: BaseException) -> None:
    """Record an exception on the current span.

    No-op if tracing is not available or no span is active.

    Args:
        exception: The exception to record.
    """
    if not _OTEL_AVAILABLE or trace is None:
        return

    span = trace.get_current_span()
    if span is not None:
        span.record_exception(exception)


def is_tracing_available() -> bool:
    """Check if tracing is available.

    Returns:
        True if OpenTelemetry is installed and tracer is configured.
    """
    return _OTEL_AVAILABLE and _tracer is not None
