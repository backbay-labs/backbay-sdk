"""Telemetry and logging configuration."""

from cyntra.commons.schema.base import BaseSchema


class TelemetryConfig(BaseSchema):
    """Configuration for logging and tracing.

    Used by telemetry/logging.py to configure the logging setup.
    """

    log_level: str = "INFO"
    """Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)."""

    structured_logging: bool = True
    """Whether to output JSON-formatted logs (recommended for production)."""

    service_name: str | None = None
    """Service name for log context and tracing spans."""

    otel_endpoint: str | None = None
    """OpenTelemetry collector endpoint for distributed tracing."""

    otel_enabled: bool = False
    """Whether OpenTelemetry tracing is enabled."""

    log_request_body: bool = False
    """Whether to include request bodies in logs (be careful with PII)."""

    log_response_body: bool = False
    """Whether to include response bodies in logs."""
